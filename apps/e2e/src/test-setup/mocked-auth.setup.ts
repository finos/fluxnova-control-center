import { test as setup } from '@playwright/test';
import { FXN_SUPPORT_STORAGE_STATE } from '../../playwright.config';

setup('Create Mock User Auth', async ({ context }) => {
  await context.storageState({ path: FXN_SUPPORT_STORAGE_STATE });
});
