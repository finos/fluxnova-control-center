import { expect, Page, test } from '@playwright/test';

import processInstancesDefault from '../../fixtures/process-instances/default.json';

import mockHistoryList from '../../fixtures/process-instances/mockHistoryList.json';
import { ProcessInstancePage } from '../../page-objects/process-instance-page.po';

const PROCESS_INSTANCE_ID = '2f0f49b6-ef70-11ed-b7c8-0a8ebe9048cf';

let processInstancePage: ProcessInstancePage;

test.beforeEach(async ({ context, page }) => {
  processInstancePage = new ProcessInstancePage(page, PROCESS_INSTANCE_ID, 'variables');

  await processInstancePage.initialize(context);
});

test.describe('The diagram toolbar', () => {
  test.describe('given the user is on the process instance detail page', () => {
    test.beforeEach(async () => {
      await processInstancePage.goto();
    });

    test('should be displayed', async ({ page }) => {
      await expect(page.locator('fluxnova-diagram-toolbar')).toBeVisible();
      //   cy.get('fluxnova-diagram-toolbar').should('be.visible');
    });

    test.describe('given the process instance is ACTIVE', () => {
      test('should enable the Move Tokens button', async ({ page }) => {
        // moveTokensButton().should('be.enabled');
        await expect(getMoveTokensButton(page)).toBeVisible();
      });

      test.describe('when Move Tokens is clicked', () => {
        test.beforeEach(async ({ page }) => {
          await getMoveTokensButton(page).click();

          await processInstancePage.stubModificationEndpoint({
            status: 201,
            json: undefined,
          });
        });

        test('should display and disable the Apply Changes button', async ({ page }) => {
          const applyChangesButton = getApplyChangesButton(page);

          await expect(applyChangesButton).toBeVisible();
          await expect(applyChangesButton).toBeDisabled();
          //   cy.get('[id=save_changes]').should('be.visible').and('be.disabled');
        });

        test('should display and enable the Cancel button', async ({ page }) => {
          const cancelButton = page.locator('[id=cancel]');
          //   cy.get('[id=cancel]').should('be.visible').and('be.enabled');
          await expect(cancelButton).toBeVisible();
          await expect(cancelButton).toBeEnabled();
        });

        test('should hide the Apply Changes and Cancel buttons when Cancel is clicked', async ({ page }) => {
          const applyChangesButton = getApplyChangesButton(page);
          const cancelButton = getCancelChangesButton(page);

          await cancelButton.click();

          await expect(cancelButton).not.toBeVisible();
          await expect(applyChangesButton).not.toBeVisible();
        });

        test('should hide the Apply Changes and Cancel buttons when Apply Changes is clicked', async ({ page }) => {
          // click Add Token

          const dataElement = getDiagramDataElement(page, 'StartEvent_1');

          await dataElement.click({ button: 'right' });

          const addTokenDropdownElement = getAddTokenDropdownElement(page);

          const { x: x1 = 0, y: y1 = 0 } = (await addTokenDropdownElement.boundingBox()) ?? {};

          await page.mouse.move(x1, y1);
          await addTokenDropdownElement.click();

          const applyChangesButton = getApplyChangesButton(page);

          await expect(applyChangesButton).toBeVisible();
          await expect(applyChangesButton).toBeEnabled();
        });

        test('should disable the Apply Changes button when all changes have been "undone"', async ({ page }) => {
          // click Add Token

          const dataElement = getDiagramDataElement(page, 'StartEvent_1');

          await dataElement.click({ button: 'right' });

          const addTokenDropdownElement = getAddTokenDropdownElement(page);

          const { x: x1 = 0, y: y1 = 0 } = (await addTokenDropdownElement.boundingBox()) ?? {};

          await page.mouse.move(x1, y1);
          await addTokenDropdownElement.click();

          const applyChangesButton = getApplyChangesButton(page);
          await expect(applyChangesButton).toBeVisible();
          await expect(applyChangesButton).toBeEnabled();

          // click Undo
          await dataElement.click({ button: 'right' });
          const undoTokenDropdownElement = getUndoTokenDropdownElement(page);
          const { x: x2 = 0, y: y2 = 0 } = (await undoTokenDropdownElement.boundingBox()) ?? {};

          await page.mouse.move(x2, y2);
          await undoTokenDropdownElement.click();

          await expect(applyChangesButton).toBeVisible();
          await expect(applyChangesButton).toBeDisabled();
        });

        test('should enable the Apply Changes button when a change has been "redone"', async ({ page }) => {
          // click Add Token

          const dataElement = getDiagramDataElement(page, 'StartEvent_1');

          await dataElement.click({ button: 'right' });

          const addTokenDropdownElement = getAddTokenDropdownElement(page);

          const { x: x1 = 0, y: y1 = 0 } = (await addTokenDropdownElement.boundingBox()) ?? {};

          await page.mouse.move(x1, y1);
          await addTokenDropdownElement.click();

          const applyChangesButton = getApplyChangesButton(page);

          await expect(applyChangesButton).toBeVisible();
          await expect(applyChangesButton).toBeEnabled();

          // click Undo
          await dataElement.click({ button: 'right' });

          const undoTokenDropdownElement = getUndoTokenDropdownElement(page);
          const { x: x2 = 0, y: y2 = 0 } = (await undoTokenDropdownElement.boundingBox()) ?? {};
          await page.mouse.move(x2, y2);
          await undoTokenDropdownElement.click();

          await expect(applyChangesButton).toBeVisible();
          await expect(applyChangesButton).toBeDisabled();

          // click Redo
          await dataElement.click({ button: 'right' });

          const redoTokenDropdownElement = getRedoTokenDropdownElement(page);
          const { x: x3 = 0, y: y3 = 0 } = (await redoTokenDropdownElement.boundingBox()) ?? {};

          await page.mouse.move(x3, y3);
          await redoTokenDropdownElement.click();

          await expect(applyChangesButton).toBeVisible();
          await expect(applyChangesButton).toBeEnabled();
        });
      });
    });

    test.describe('given the process instance is NOT ACTIVE', () => {
      test('should disable the Move Tokens button', async ({ page }) => {
        await processInstancePage.stubProcessInstances({
          status: 201,
          json: [
            {
              ...processInstancesDefault[0],
              id: PROCESS_INSTANCE_ID,
            },
          ],
        });

        await processInstancePage.stubHistoryEndpoint({
          status: 200,
          json: {
            ...mockHistoryList,
            userOperation: [
              {
                ...mockHistoryList.userOperation[0],
                id: PROCESS_INSTANCE_ID,
              },
            ],
          },
        });

        await processInstancePage.goto();

        const moveTokensButton = getMoveTokensButton(page);

        await expect(moveTokensButton).toBeDisabled();
      });
    });
  });
});

function getMoveTokensButton(page: Page) {
  return page.getByRole('button', { name: 'Move Tokens' });
}

function getApplyChangesButton(page: Page) {
  return page.getByRole('button', { name: 'Apply Changes' });
}

function getCancelChangesButton(page: Page) {
  return page.locator('[id="cancel"]');
}

function getDiagramDataElement(page: Page, id: string) {
  return page.locator(`[data-element-id="${id}"]`);
}

function getAddTokenDropdownElement(page: Page) {
  return page.getByText('Add Token');
}

function getRedoTokenDropdownElement(page: Page) {
  return page.locator('[data-action="redo"]');
}

function getUndoTokenDropdownElement(page: Page) {
  return page.getByText('Undo');
}
