import { test } from '@playwright/test';
import { clickIdLinkVerifyPageAndData } from '../../shared/id-link';
import { BasePage } from '../../page-objects/base-page.po';

test.beforeEach(async ({ page }) => {
  await page.goto(
    `./${BasePage.TENANT}/incidents?filters=%7B"status":%7B"filterType":"select","filter":"open","type":"equals"%7D%7D&sorting=%5B%7B"colId":"createTime","sort":"desc"%7D%5D`,
  );
});

test('should have valid incidents list incident ID link', async ({ page }) => {
  await clickIdLinkVerifyPageAndData(true, 1, 'PROCESS INSTANCE', 'Incidents', 'incidentId', page);
});

test('should have valid incidents list process instance ID link', async ({ page }) => {
  await clickIdLinkVerifyPageAndData(true, 2, 'PROCESS INSTANCE', 'Variables', 'process-instances', page);
});

test('should have valid incidents list process definition ID link', async ({ page }) => {
  await clickIdLinkVerifyPageAndData(false, 7, 'PROCESS DEFINITION', 'Instances', 'process-definitions', page);
});

test('should have valid incidents list cause incident ID link', async ({ page }) => {
  await clickIdLinkVerifyPageAndData(false, 9, 'PROCESS INSTANCE', 'Incidents', 'incidentId', page);
});

test('should have valid incidents list root cause incident ID link', async ({ page }) => {
  await clickIdLinkVerifyPageAndData(false, 10, 'PROCESS INSTANCE', 'Incidents', 'incidentId', page);
});

test('should have valid incidents list job definition ID link', async ({ page }) => {
  await clickIdLinkVerifyPageAndData(false, 11, 'PROCESS DEFINITION', 'Job Definitions', 'jobDefinitionId', page);
});
