import { BrowserContext, expect, Page, test } from '@playwright/test';
import { ProcessInstancePage } from '../../../page-objects/process-instance-page.po';

const PROCESS_INSTANCE_ID = '2f0f49b6-ef70-11ed-b7c8-0a8ebe9048cf';

let processInstancePage: ProcessInstancePage;

async function popUpAddVariableModal(page: Page) {
  const addVariableButton = page.locator('.add-variable-button');

  await expect(addVariableButton).toBeVisible();

  await addVariableButton.click();

  const modalContent = page.locator('.modal-content');

  await expect(modalContent).toBeVisible();

  return modalContent;
}

async function popUpEditVariableModal(page: Page) {
  const editVariableButton = await displayEditVariableButton(page);

  await editVariableButton.click();

  const modalContent = page.locator('.modal-content');

  await expect(modalContent).toBeVisible();

  return modalContent;
}

async function displayEditVariableButton(page: Page) {
  await page.getByText('NameOfStringVariable').hover();

  return page.getByRole('button', { name: 'Edit Variable' }).first();
}

function getValueInputElement(page: Page) {
  return page.locator('[data-modal-value-input]');
}

function getModalSaveButton(page: Page) {
  return page.locator('.modal-footer .btn-primary');
}

async function filloutVariableInformationForVariablesTab(
  page: Page,
  variableInfo: {
    name: string;
    type: string;
    value: string;
  },
) {
  const typeSelectInput = page.locator('#type');
  const nameInput = page.locator('[name="name"]');
  const valueInput = page.locator('[name="value"]');

  await typeSelectInput.selectOption(variableInfo.type);
  await nameInput.fill(variableInfo.name);

  await valueInput.fill(variableInfo.value);
}

async function activeInstancePage(context: BrowserContext, page: Page) {
  processInstancePage = new ProcessInstancePage(page, PROCESS_INSTANCE_ID, 'variables');

  await processInstancePage.initialize(context);
  await processInstancePage.goto();
}

async function inActiveInstancePage(context: BrowserContext, page: Page) {
  processInstancePage = new ProcessInstancePage(page, PROCESS_INSTANCE_ID, 'variables');

  await processInstancePage.initialize(context);
  await processInstancePage.gotoInActiveInstance();
}

test.describe('The variables tab in the process instance detail page', () => {
  test('given there is an error when updating a variable, should display error toast message on invalid response on save click', async ({
    context,
    page,
  }) => {
    activeInstancePage(context, page);

    await popUpEditVariableModal(page);

    const valueInput = getValueInputElement(page);

    await valueInput.fill('Updated Variable Value');

    const saveButton = getModalSaveButton(page);

    await page.route('api/variables/update-execution', async (route) => {
      await route.fulfill({ status: 503 });
    });

    await saveButton.click();

    await expect(page.getByText('Error', { exact: true })).toBeVisible();
  });

  test.describe('given the process instance is in an ACTIVE state', () => {
    test.beforeEach(({ context, page }) => activeInstancePage(context, page));

    test('should show a grid containing columns related to each variable in this process instance', async ({
      page,
    }) => {
      await expect(page.getByRole('columnheader').getByText('Name')).toBeVisible();
      await expect(page.getByRole('columnheader').getByText('Type')).toBeVisible();
      await expect(page.getByRole('columnheader').getByText('Value', { exact: true })).toBeVisible();
    });

    test('should display enabled edit button if instance is active', async ({ page }) => {
      await displayEditVariableButton(page);

      await expect(page.getByRole('button', { name: 'Edit Variable' })).toBeVisible();
    });

    test('should display variable add modal on add click', async ({ page }) => {
      const modalContent = await popUpAddVariableModal(page);
      const modalHeader = modalContent.locator('.modal-header');

      await expect(modalHeader.getByText('Add Variable')).toBeVisible();
      await expect(page.getByRole('button', { name: 'cancel' })).toBeVisible();
      await expect(page.locator('.modal-footer .btn-primary')).toBeDisabled();

      const closeButton = page.getByRole('button', { name: 'Close' });

      await expect(closeButton).toBeVisible();

      await closeButton.click();
    });

    test('should display variable edit modal on edit click', async ({ page }) => {
      const modalContent = await popUpEditVariableModal(page);

      await expect(modalContent.getByText(/Edit/)).toBeVisible();

      const saveButton = getModalSaveButton(page);
      const cancelButton = page.getByRole('button', { name: 'cancel' });

      await expect(saveButton).toBeVisible();
      await expect(saveButton).toBeDisabled();

      await expect(cancelButton).toBeVisible();
      await expect(cancelButton).toBeEnabled();

      await cancelButton.click();
    });

    test('should allow user to add and save new variable', async ({ page }) => {
      const newVariable = {
        name: 'myVariable',
        type: 'String',
        value: 'myVariableValue',
      };

      await popUpAddVariableModal(page);

      await filloutVariableInformationForVariablesTab(page, newVariable);

      const saveButton = getModalSaveButton(page);

      await processInstancePage.stubVariablesEndpoint({ status: 200, json: {} });

      await expect(saveButton).toBeEnabled();

      await saveButton.click();
    });

    test('should allow user to update existing variable and save all changes', async ({ page }) => {
      await popUpEditVariableModal(page);

      const valueInput = getValueInputElement(page);

      await valueInput.fill('Updated Variable Value');

      const saveButton = getModalSaveButton(page);

      await processInstancePage.stubVariablesEndpoint({ status: 400 });

      await saveButton.click();

      await expect(page.getByText('The variables have been updated successfully')).toBeVisible();
    });

    test('should not allow user to add an invalid variable', async ({ page }) => {
      const newVariable = {
        name: 'invalidShort',
        value: '2.3',
        type: 'Short',
      };

      await popUpAddVariableModal(page);

      await filloutVariableInformationForVariablesTab(page, newVariable);

      const saveButton = getModalSaveButton(page);

      await expect(saveButton).toBeDisabled();
      await expect(page.getByText('Value must be an integer between -32768 and 32767.')).toBeVisible();
    });

    test('should correctly format your json when you click the format JSON button', async ({ page }) => {
      const newVariable = {
        name: 'myJsonVar',
        value: '{"title":"a title", "array": ["this", "is", "an", "array"], "number": 42}',
        type: 'Json',
      };
      const formattedValue = JSON.stringify(JSON.parse(newVariable.value), null, 2);

      await popUpAddVariableModal(page);
      await filloutVariableInformationForVariablesTab(page, newVariable);

      const saveButton = getModalSaveButton(page);
      const formatButton = page.getByLabel('format');

      await formatButton.click();

      expect(await getValueInputElement(page).inputValue()).toBe(formattedValue);

      await expect(saveButton).toBeEnabled();
    });

    test('should correctly format your XML after clicking the Format XML button', async ({ page }) => {
      const newVariable = {
        name: 'myXML',
        value: '<catalog><book>This is my book</book></catalog>',
        type: 'Xml',
      };
      const formattedValue = `<catalog>
  <book>This is my book</book>
</catalog>`;

      await popUpAddVariableModal(page);
      const saveButton = getModalSaveButton(page);

      await filloutVariableInformationForVariablesTab(page, newVariable);

      const formatButton = page.getByLabel('format');

      await formatButton.click();

      expect(await getValueInputElement(page).inputValue()).toBe(formattedValue);
      await expect(saveButton).toBeEnabled();
    });

    test('should show error message after a delay', async ({ page }) => {
      const newVariable = {
        name: 'myJsonVar',
        value: 'incorrect json',
        type: 'Json',
      };
      await popUpAddVariableModal(page);

      await filloutVariableInformationForVariablesTab(page, newVariable);

      await expect(page.getByText('Value must be a valid JSON object.')).toBeVisible();
    });
  });

  test('given the process instance is NOT ACTIVE, should display a grid with 5 columns', async ({ page, context }) => {
    await inActiveInstancePage(context, page);

    await expect(page.getByRole('columnheader').getByText('Name')).toBeVisible();
    await expect(page.getByRole('columnheader').getByText('Type')).toBeVisible();
    await expect(page.getByRole('columnheader').getByText('Value', { exact: true })).toBeVisible();
    await expect(page.getByRole('columnheader').getByText('Scope', { exact: true })).toBeVisible();
    await expect(page.getByRole('columnheader').getByText('Create Time', { exact: true })).toBeVisible();
  });
});

test.describe('when there are no variables', () => {
  test('should show no variables were found', async ({ page, context }) => {
    processInstancePage = new ProcessInstancePage(page, PROCESS_INSTANCE_ID, 'variables');

    await processInstancePage.initialize(context);

    await processInstancePage.stubVariablesEndpoint({
      status: 201,
      json: [],
    });

    await processInstancePage.goto();

    await expect(page.getByText('No variables were found')).toBeVisible();
  });
});
