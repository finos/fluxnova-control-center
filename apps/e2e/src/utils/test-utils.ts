/* eslint-disable max-lines */
import { join } from 'path';
import { readdir, readFile } from 'fs/promises';
import { Page } from '@playwright/test';
import { ALLOWED_EXTENSIONS, TENANT_HEADER_KEY } from '@fxn/types';
import { BasePage } from '../page-objects/base-page.po';

const processDefinitionIdCache: Record<string, string> = {};
const decisionDefinitionIdCache: Record<string, string> = {};
const deploymentIdCache: Record<string, string> = {};
const batchToCreatedProcesses: Record<string, string[]> = {};

/**
 * Extracts a number from a string,
 * useful to get the current tab count displayed to the user.
 *
 * @param text string to extract number from
 */
export function extractNumber(text: string): number | null {
  const regex = /\d+/;
  const match = regex.exec(text);
  return match ? parseInt(match[0], 10) : null;
}

/**
 * Represents the six parameters of a 2D SVG/CSS transform matrix:
 *   [ a  c  e ]
 *   [ b  d  f ]
 *   [ 0  0  1 ]
 */
export interface TransformMatrix {
  /** Horizontal scaling factor (a) */
  scaleX: number;
  /** Vertical skewing factor (b) */
  skewY: number;
  /** Horizontal skewing factor (c) */
  skewX: number;
  /** Vertical scaling factor (d) */
  scaleY: number;
  /** Horizontal translation distance (e) */
  translateX: number;
  /** Vertical translation distance (f) */
  translateY: number;
}

/**
 * Parses a `transform="matrix(a, b, c, d, e, f)"` string and returns
 * a structured object with explicit names for each component.
 *
 * @param transformAttr - the contents of a transform attribute, e.g.
 *   "matrix(1, 0, 0, 1, 100, 50)"
 * @returns a {@link TransformMatrix} object
 * @throws Error if the string is null, empty, or not a well-formed matrix()
 */
export function parseTransformMatrix(transformAttr: string | null): TransformMatrix {
  if (!transformAttr) {
    throw new Error(`Invalid transform value: ${transformAttr}`);
  }

  // Extract all numeric components (integers, decimals, exponent notation)
  const nums = transformAttr.match(/[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/g)?.map(Number);

  if (!nums || nums.length !== 6) {
    throw new Error(
      `Could not parse matrix transform, expected 6 numbers but got ${nums?.length ?? 0}: "${transformAttr}"`,
    );
  }

  // Destructure the six captured groups
  const [a, b, c, d, e, f] = nums;

  return {
    scaleX: a,
    skewY: b,
    skewX: c,
    scaleY: d,
    translateX: e,
    translateY: f,
  };
}

/**
 * Find the style attribute of the specified column, and then return the width identified in the style.
 *
 * @param columnHeaderName string - Name of the column header from which to find the width
 * @param page Page - The page used in the e2e or regression test case
 *
 * @returns the width as a number
 */
export async function findColumnWidth(columnHeaderName: string, page: Page): Promise<number> {
  const columnStyle = await page.getByRole('columnheader', { name: columnHeaderName }).first().getAttribute('style');
  return Number(
    columnStyle
      .substring(columnStyle.search(/width: /))
      .substring(7)
      .split('px;')[0],
  );
}

export async function getXsrfToken(page: Page): Promise<string> {
  const cookies = await page.context().cookies();
  const xsrf = cookies.find((c) => c.name === 'XSRF-TOKEN')?.value;
  if (!xsrf) throw new Error('CSRF cookie not found');
  return xsrf;
}

export async function startProcessInstance(
  processDefinitionId: string,
  page: Page,
  variables?: Record<string, unknown>,
) {
  const xsrf = await getXsrfToken(page);

  const response = await page.request.post(`./api/process-definitions/${processDefinitionId}/start`, {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-XSRF-TOKEN': xsrf,
      [TENANT_HEADER_KEY]: BasePage.TENANT,
    },
    data: variables ? { variables } : undefined,
  });

  if (!response.ok()) {
    throw new Error(`Failed to start process instance: ${response.status()} ${response.statusText()}`);
  }
  const data = await response.json();
  if (!data || typeof data.id === 'undefined') {
    throw new Error(`Process instance response missing 'id' field: ${JSON.stringify(data)}`);
  }
  return data.id;
}

export async function startProcessInstances(processDefinitionKey: string, count: number, page: Page) {
  const processDefinitionId = await getProcessDefinitionId(processDefinitionKey, page);
  const promises: Promise<string>[] = [];
  for (let i = 0; i < count; i++) {
    promises.push(startProcessInstance(processDefinitionId, page));
  }
  return await Promise.all(promises);
}

export async function activateProcessDefinition(processDefinitionKey: string, page: Page) {
  const xsrf = await getXsrfToken(page);
  const processDefinitionId = await getProcessDefinitionId(processDefinitionKey, page);

  const response = await page.request.put(`./api/process-definitions/${processDefinitionId}/suspended`, {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-XSRF-TOKEN': xsrf,
      [TENANT_HEADER_KEY]: BasePage.TENANT,
    },
    data: {
      suspended: false,
    },
  });

  if (!response.ok()) {
    throw new Error(`Failed to activate process definition: ${response.status()} ${response.statusText()}`);
  }
}

export async function terminateProcessInstance(processInstanceId: string, page: Page) {
  const xsrf = await getXsrfToken(page);

  const response = await page.request.delete(`./api/process-instances/${processInstanceId}/terminate`, {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-XSRF-TOKEN': xsrf,
      [TENANT_HEADER_KEY]: BasePage.TENANT,
    },
  });

  if (!response.ok()) {
    throw new Error(`Failed to terminate process instance: ${response.status()} ${response.statusText()}`);
  }
}

export async function terminateProcessInstances(processInstanceIds: string[], page: Page) {
  const xsrf = await getXsrfToken(page);

  const response = await page.request.post(`./api/process-instances/delete`, {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-XSRF-TOKEN': xsrf,
      [TENANT_HEADER_KEY]: BasePage.TENANT,
    },
    data: {
      processInstanceIds,
      skipIoMappings: true,
    },
  });

  if (!response.ok()) {
    throw new Error(
      `Failed to start terminate batch job for process instances: ${response.status()} ${response.statusText()}`,
    );
  }
}

export async function getProcessDefinitionId(key: string, page: Page) {
  if (processDefinitionIdCache[key]) {
    return processDefinitionIdCache[key];
  }

  const xsrf = await getXsrfToken(page);

  const response = await page.request.post(`./api/process-definitions`, {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-XSRF-TOKEN': xsrf,
      [TENANT_HEADER_KEY]: BasePage.TENANT,
    },
    data: {
      filter: {
        key: key,
        firstResult: 0,
        maxResults: 1,
        latestVersion: true,
      },
    },
  });

  if (!response.ok()) {
    throw new Error(`Failed to get process definition id: ${response.status()} ${response.statusText()}`);
  }
  const definitions = await response.json();
  if (!Array.isArray(definitions) || definitions.length === 0) {
    throw new Error(`Process definition not found for key: ${key}`);
  }
  const id = definitions[0].id;
  processDefinitionIdCache[key] = id;
  return id;
}

export async function getDeploymentId(name: string, page: Page) {
  if (deploymentIdCache[name]) {
    return deploymentIdCache[name];
  }

  const xsrf = await getXsrfToken(page);

  const response = await page.request.get(`./api/deployment`, {
    headers: {
      Accept: 'application/json',
      'X-XSRF-TOKEN': xsrf,
      [TENANT_HEADER_KEY]: BasePage.TENANT,
    },
    params: {
      name: name,
      sortBy: 'deploymentTime',
      sortOrder: 'desc',
      maxResults: 1,
    },
  });

  if (!response.ok()) {
    throw new Error(`Failed to get deployment id: ${response.status()} ${response.statusText()}`);
  }
  const deployments = await response.json();
  if (!Array.isArray(deployments) || deployments.length === 0) {
    throw new Error(`Deployment not found for name: ${name}`);
  }
  const id = deployments[0].id;
  deploymentIdCache[name] = id;
  return id;
}

export async function suspendProcessInstance(processInstanceId: string, page: Page) {
  const xsrf = await getXsrfToken(page);

  const response = await page.request.put(`./api/process-instances/${processInstanceId}/suspended`, {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-XSRF-TOKEN': xsrf,
      [TENANT_HEADER_KEY]: BasePage.TENANT,
    },
    data: {
      suspended: true,
    },
  });

  if (!response.ok()) {
    throw new Error(`Failed to suspend process instance: ${response.status()} ${response.statusText()}`);
  }
}

export async function suspendProcessInstances(processInstanceIds: string[], page: Page) {
  const promises: Promise<void>[] = [];
  for (const id of processInstanceIds) {
    promises.push(suspendProcessInstance(id, page));
  }
  await Promise.all(promises);
}

export async function createBatchJob(page: Page) {
  const processes = await startProcessInstances('automation_failed_batch', 2, page);

  // This delete will fail, resulting in a batch job we can use to test against
  const xsrf = await getXsrfToken(page);
  const response = await page.request.post(`./api/process-instances/delete`, {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-XSRF-TOKEN': xsrf,
      [TENANT_HEADER_KEY]: BasePage.TENANT,
    },
    data: {
      processInstanceIds: processes,
    },
  });

  if (!response.ok()) {
    throw new Error(
      `Failed to start terminate batch job for process instances: ${response.status()} ${response.statusText()}`,
    );
  }
  const data = await response.json();
  if (!data || typeof data.id === 'undefined') {
    throw new Error(`Process instance response missing 'id' field: ${JSON.stringify(data)}`);
  }
  batchToCreatedProcesses[data.id] = processes;
  return data.id;
}

export async function deleteBatchJob(batchId: string, page: Page) {
  const xsrf = await getXsrfToken(page);

  const response = await page.request.delete(`./api/batch/${batchId}`, {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-XSRF-TOKEN': xsrf,
      [TENANT_HEADER_KEY]: BasePage.TENANT,
    },
  });

  if (!response.ok()) {
    throw new Error(`Failed to delete batch job: ${response.status()} ${response.statusText()}`);
  }

  await terminateProcessInstancesInBatch(batchId, page);
}

export async function terminateProcessInstancesInBatch(batchId: string, page: Page) {
  const ids: string[] = batchToCreatedProcesses[batchId];
  if (!ids || ids.length === 0) {
    return;
  }
  await terminateProcessInstances(ids, page);

  batchToCreatedProcesses[batchId] = [];
}

export async function getDecisionDefinitionId(key: string, page: Page) {
  if (decisionDefinitionIdCache[key]) {
    return decisionDefinitionIdCache[key];
  }

  const xsrf = await getXsrfToken(page);

  const response = await page.request.get(`./api/decision-definition`, {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-XSRF-TOKEN': xsrf,
      [TENANT_HEADER_KEY]: BasePage.TENANT,
    },
    params: {
      key: key,
      firstResult: 0,
      maxResults: 1,
      latestVersion: true,
    },
  });

  if (!response.ok()) {
    throw new Error(`Failed to get decision definition id: ${response.status()} ${response.statusText()}`);
  }
  const definitions = await response.json();
  if (!Array.isArray(definitions) || definitions.length === 0) {
    throw new Error(`Decision definition not found for key: ${key}`);
  }
  const id = definitions[0].id;
  decisionDefinitionIdCache[key] = id;
  return id;
}

export async function getProcessDefinitionVersionCount(key: string, page: Page) {
  const xsrf = await getXsrfToken(page);

  const response = await page.request.post(`./api/process-definitions/count`, {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-XSRF-TOKEN': xsrf,
      [TENANT_HEADER_KEY]: BasePage.TENANT,
    },
    data: {
      key: key,
    },
  });

  if (!response.ok()) {
    throw new Error(`Failed to get process definition version count: ${response.status()} ${response.statusText()}`);
  }
  return await response.json();
}

/**
 * Deploys a specific automation model file by name.
 *
 * @param fileName - The name of the model file to deploy (e.g., 'automation_versioned_process.bpmn')
 * @param page - The Playwright page instance
 * @param deployChangedOnly - Whether to only deploy if changed (default: true)
 * @returns The deployment response data
 */
export async function deployAutomationModel(fileName: string, page: Page, deployChangedOnly: boolean = true) {
  const xsrf = await getXsrfToken(page);

  const modelsDir = join(__dirname, '../automation-models');
  const filePath = join(modelsDir, fileName);

  let buffer: Buffer;
  try {
    buffer = await readFile(filePath);
  } catch {
    throw new Error(`Model file not found: ${fileName} at ${filePath}`);
  }

  const deploymentName = `Fluxnova Automation - ${fileName}`;

  const multipart: Record<string, any> = {
    deploymentName,
    deploymentSource: 'Fluxnova CC Automation',
    deployChangedOnly,
  };

  multipart['data'] = {
    name: fileName,
    mimeType: 'application/xml',
    buffer,
  };

  const response = await page.request.post(`./api/deployment/create`, {
    headers: {
      Accept: 'application/json',
      'X-XSRF-TOKEN': xsrf,
      [TENANT_HEADER_KEY]: BasePage.TENANT,
    },
    multipart,
  });

  if (!response.ok()) {
    throw new Error(`Failed to deploy model ${fileName}: ${response.status()} ${response.statusText()}`);
  }

  return await response.json();
}

/**
 * Deploys all automation model files found in the automation-models folder.
 *
 * @param page - The Playwright page instance
 * @param deployChangedOnly - Whether to only deploy if changed (default: true)
 * @returns The deployment response data
 */
export async function deployAutomationModels(page: Page, deployChangedOnly: boolean = true) {
  const mimeType = (fn: string) => {
    switch (true) {
      case fn.endsWith('.js'):
        return 'application/javascript';
      case fn.endsWith('.jpeg'):
        return 'image/jpeg';
      case fn.endsWith('.groovy'):
        return 'text/x-groovy';
      default:
        return 'application/xml';
    }
  };
  const xsrf = await getXsrfToken(page);

  const modelsDir = join(__dirname, '../automation-models');
  const entries = await readdir(modelsDir);
  const files = entries
    .filter((f) => ALLOWED_EXTENSIONS.some((ext) => f.endsWith(ext)))
    .sort((a, b) => a.localeCompare(b))
    .map((f) => ({
      name: f,
      mimeType: mimeType(f),
    }));
  if (files.length === 0) {
    throw new Error(`No deployable models found in: ${modelsDir}`);
  }

  const fileReads = await Promise.all(
    files.map(async (file) => {
      const p = join(modelsDir, file.name);
      const buffer = await readFile(p);
      return { ...file, buffer };
    }),
  );

  const multipart: Record<string, any> = {
    deploymentName: 'Fluxnova Automation - All',
    deploymentSource: 'Fluxnova CC Automation',
    deployChangedOnly,
    enableDuplicateFiltering: true, // Only do the deployment if this isn't a duplicate
  };

  fileReads.forEach((fileObj, idx) => {
    multipart[fileObj.name.split('.')[0] ?? `data${idx}`] = fileObj;
  });

  const response = await page.request.post(`./api/deployment/create`, {
    headers: {
      Accept: 'application/json',
      'X-XSRF-TOKEN': xsrf,
      [TENANT_HEADER_KEY]: BasePage.TENANT,
    },
    multipart,
  });

  if (!response.ok()) {
    throw new Error(`Failed to create deployment: ${response.status()} ${response.statusText()}`);
  }

  return await response.json();
}

/**
 * Loads test fixture data from a JSON file located in the fixtures folder.
 *
 * @param fixtureName string indicating the fixture name, including directory under fixtures folder (e.g. "auth/default")
 */
export async function getTestFixtureData(fixtureName: string) {
  const pathToFixtures = join(__dirname, '../fixtures');
  const fixtureFilename = join(pathToFixtures, `${fixtureName}.json`);

  let data;
  try {
    const fileContents = await readFile(fixtureFilename, 'utf-8');
    data = JSON.parse(fileContents);
  } catch (err) {
    console.error('Failed to load fixture data from', fixtureFilename, err);
    throw err;
  }

  return data;
}
