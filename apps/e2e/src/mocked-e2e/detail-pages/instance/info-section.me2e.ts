import { expect, test } from '@playwright/test';
import { FXN_SUPPORT_STORAGE_STATE } from '../../../../playwright.config';
import { ProcessInstancePage } from '../../../page-objects/process-instance-page.po';

const PROCESS_INSTANCE_ID = '2f0f49b6-ef70-11ed-b7c8-0a8ebe9048cf';
let processInstancePage: ProcessInstancePage;

test.beforeEach(async ({ page, context }) => {
  processInstancePage = new ProcessInstancePage(page, PROCESS_INSTANCE_ID, 'incidents');

  await processInstancePage.initialize(context);
  await processInstancePage.goto();
});

test.describe('Process Instance Info Section', () => {
  test.use({ storageState: FXN_SUPPORT_STORAGE_STATE });

  test('navigates to the definition from the definition ID', async ({ page }) => {
    const link = page.getByRole('link', { name: '465cf569-eeb2-11ed-9b96-0a81d7d98f19' });

    await expect(link).toBeVisible();

    await link.click();

    await expect(page).toHaveURL(/process-definitions/);
  });
});
