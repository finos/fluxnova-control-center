import { test as setup } from '@playwright/test';
import { isEmpty } from 'lodash-es';
import {
  FXN_DESIGNER_STORAGE_STATE,
  FXN_PLAT_READ_STORAGE_STATE,
  FXN_SUPPORT_STORAGE_STATE,
} from '../../playwright.config';
import { LoginPage } from '../page-objects/login.po';

const authDisabled: boolean = /none/.test(process.env.FXN_AUTH_STRATEGY ?? 'none');

setup('Create Designer User Auth', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const usr = `${process.env?.FXN_DESIGNER_USR_EMAIL}`;
  const creds: any = {
    usr,
    psw: process.env.FXN_DESIGNER_PSW,
  };

  if (!authDisabled) await loginPage.loginSSO(creds.usr, creds.psw);
  else await loginPage.goto('/');

  await page.context().storageState({ path: FXN_DESIGNER_STORAGE_STATE });
});

setup('Create Support User Auth', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const usr = `${process.env.FXN_SUPPORT_USR_EMAIL}`;
  const creds: any = {
    usr,
    psw: process.env.FXN_SUPPORT_PSW,
  };

  if (!authDisabled) await loginPage.loginSSO(creds.usr, creds.psw);
  else await loginPage.goto('/');

  await page.context().storageState({ path: FXN_SUPPORT_STORAGE_STATE });
});

setup('Create Plat Read Auth', async ({ page }) => {
  setup.skip(
    !process.env.FXN_PLAT_READ_USR_EMAIL || isEmpty(process.env.FXN_PLAT_READ_USR_EMAIL),
    'Skipping since FXN_PLAT_READ_USR_EMAIL is not set in the environment',
  );

  const loginPage = new LoginPage(page);
  const usr = `${process.env?.FXN_PLAT_READ_USR_EMAIL}`;
  const creds: any = {
    usr,
    psw: process.env.FXN_PLAT_READ_PSW,
  };

  if (!authDisabled) await loginPage.loginSSO(creds.usr, creds.psw);
  else await loginPage.goto('/');

  await page.context().storageState({ path: FXN_PLAT_READ_STORAGE_STATE });
});
