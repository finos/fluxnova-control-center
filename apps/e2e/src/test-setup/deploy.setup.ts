import { test as setup } from '@playwright/test';
import { FXN_DESIGNER_STORAGE_STATE } from '../../playwright.config';
import { deployAutomationModel, deployAutomationModels, getProcessDefinitionVersionCount } from '../utils/test-utils';

setup('Deploy Models', async ({ browser }) => {
  const context = await browser.newContext({ storageState: FXN_DESIGNER_STORAGE_STATE });
  const page = await context.newPage();
  await deployAutomationModels(page, false);
  const versionedProcessCount = await getProcessDefinitionVersionCount('fluxnova_automation_versioned_process', page);
  if (versionedProcessCount < 2) {
    await deployAutomationModel('automation_versioned_process.bpmn', page, false);
  }
  await context.close();
});
