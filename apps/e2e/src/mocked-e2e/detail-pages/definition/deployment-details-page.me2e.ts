import { expect, Page, test } from '@playwright/test';
import { DeploymentDetailsPage } from '../../../page-objects/deployment-details-page.po';

let deploymentDetailsPage: DeploymentDetailsPage;

test.describe('deployment details page', () => {
  test.beforeEach(async ({ context, page }) => {
    deploymentDetailsPage = new DeploymentDetailsPage(page, '0e3d2a95-4839-11ef-85d5-e272d4549d35');

    await deploymentDetailsPage.initialize(context);
    await deploymentDetailsPage.goto();
  });

  test('should have DEPLOYMENT header-label', async ({ page }) => {
    await expect(page.locator('.header-label')).toContainText('DEPLOYMENT');
  });

  test.describe('depending on resource selected', () => {
    test('should display js file when resource is js file', async ({ page }) => {
      await page.locator('.resource').nth(0).click();
      await expect(page.locator('#code-editor')).toBeVisible();
    });

    test('should switch to the bpmn diagram renderer when the resource is a bpmn file', async ({ page }) => {
      await page.locator('.resource').nth(1).click();
      await expect(page.locator('.bjs-powered-by')).toBeVisible();
    });

    test('should display png image when resource is png file', async ({ page }) => {
      await page.locator('.resource').nth(2).click();
      await expect(page.locator('#download')).toBeVisible();
    });

    test.describe('when resource is dmn file', () => {
      test.beforeEach(async ({ page }) => {
        await page.locator('.resource').nth(3).click();
        await page.locator('.resource').nth(3).click();
      });

      test('should display dmn diagram', async ({ page }) => {
        await expect(page.locator('.canvas')).toBeVisible();
        await expect(page.locator('.dmn-drd-container')).toBeVisible();
      });

      test.describe('should display bottom section', () => {
        test('first table label', async ({ page }) => {
          await expect(page.getByText('Decision Requirements Definitions')).toBeVisible();
        });

        test('DRD table headers', async ({ page }) => {
          await page.locator('.tab-list').getByText('Decision Requirements Definitions').click();

          const table = page.locator('fluxnova-decision-requirements-definitions');
          await expect(table.getByText('Name')).toBeVisible();
          await expect(table.getByText('Key')).toBeVisible();
          await expect(table.getByText('Version')).toBeVisible();
        });

        test('DRD first row', async ({ page }) => {
          await page.locator('.tab-list').getByText('Decision Requirements Definitions').click();
          await page.locator('fluxnova-decision-requirements-definitions').getByText('DRD').waitFor({
            state: 'visible',
          });
          await page.locator('fluxnova-decision-requirements-definitions').getByText('Definitions_19lrihq').waitFor({
            state: 'visible',
          });
          await page.locator('fluxnova-decision-requirements-definitions').getByText('1').first().waitFor({
            state: 'visible',
          });
        });

        test('Process Definitions labels', async ({ page }) => {
          await expect(page.getByText('Definitions', { exact: true })).toBeVisible();
        });

        test('Definitions headers', async ({ page }) => {
          await page.locator('.tab-list').getByText('Definitions').first().click();

          const table = page.locator('fluxnova-decision-definition');
          await expect(table.getByText('Name')).toBeVisible();
          await expect(table.getByText('Key')).toBeVisible();
          await expect(table.getByText('Version')).toBeVisible();
        });

        test('Definitions first row', async ({ page }) => {
          await page
            .locator('fluxnova-decision-definition')
            .getByText('Automated Approval')
            .waitFor({ state: 'visible' });
        });

        test('Definitions second row', async ({ page }) => {
          await page.locator('fluxnova-decision-definition').getByText('Below Threshold').waitFor({ state: 'visible' });

          await expect(page.locator('fluxnova-decision-definition').getByText('1').nth(2)).toBeVisible();
        });
      });

      test("should display dmn decision table container when process node's decision button is clicked", async ({
        page,
      }) => {
        const button = page.getByTitle('Open decision table').first();

        await button.click();

        await expect(page.locator('.dmn-decision-table-container')).toBeVisible();
      });

      test("should display dmn diagram when clicking button with text 'View DRD'", async ({ page }) => {
        const button = page.getByTitle('Open decision table').first();

        await button.click();

        const buttonViewDRD = page.getByText('View DRD');

        await buttonViewDRD.click();

        await expect(page.locator('.canvas')).toBeVisible();
        await expect(page.locator('.dmn-drd-container')).toBeVisible();
      });
    });
  });

  test.describe('download resource file button', () => {
    const getDownloadResourceButton = (page: Page) => page.locator('#download_resource').getByRole('button');

    test('should be rendered', async ({ page }) => {
      await expect(getDownloadResourceButton(page)).toBeVisible();
    });

    test('should be enabled', async ({ page }) => {
      await expect(getDownloadResourceButton(page)).toBeEnabled();
    });

    test('should be clickable', async ({ page }) => {
      const button = getDownloadResourceButton(page);

      await button.click();
    });
  });
});
