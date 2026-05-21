import { expect, Locator, Page } from '@playwright/test';
import { findColumnWidth } from '../utils/test-utils';

/**
 * Uncheck the specified toggle filter (remove the checkmark), verify Reset View appears,
 * click Reset View, verify Reset View is gone and the toggle filter is checked
 *
 * @param toggleFilterClassName string - The class="" attribute of the input element (type="checkbox")
 *     that represents the toggle filter. Ex: class="latestVersion pointer", so pass in 'latestVersion'.
 * @param page Page - The page used in the e2e or regression test case
 * @param resetViewButton Locator - The Reset View button
 *
 * @returns void
 */
export async function uncheckToggleFilterVerifyAndResetView(
  toggleFilterClassName: string,
  page: Page,
  resetViewButton: Locator,
): Promise<void> {
  // verify toggle filter is checked, uncheck it, verify it is unchecked
  const toggleButton = page.locator('fluxnova-toggle-filters').locator(`.${toggleFilterClassName}`);
  await expect(toggleButton).toBeChecked();
  await toggleButton.uncheck();
  await expect(toggleButton).not.toBeChecked();
  // verify Reset View appears, click it, verify it is gone, verify toggle filter is checked
  await expect(resetViewButton).toBeVisible();
  await resetViewButton.click();
  await expect(resetViewButton).toBeHidden();
  await expect(toggleButton).toBeChecked();
}

/**
 * check the specified toggle filter (set the checkmark), verify Reset View appears,
 * click Reset View, verify Reset View is gone and the toggle filter is unchecked
 *
 * @param toggleFilterClassName string - The class="" attribute of the input element (type="checkbox")
 *     that represents the toggle filter. Ex: class="latestVersion pointer", so pass in 'latestVersion'.
 * @param page Page - The page used in the e2e or regression test case
 * @param resetViewButton Locator - The Reset View button
 *
 * @returns void
 */
export async function checkToggleFilterVerifyAndResetView(
  toggleFilterClassName: string,
  page: Page,
  resetViewButton: Locator,
): Promise<void> {
  // verify toggle filter is not checked, check it, verify it is checked
  const toggleButton = page.locator('fluxnova-toggle-filters').locator(`.${toggleFilterClassName}`);
  await expect(toggleButton).not.toBeChecked();
  await toggleButton.check();
  await expect(toggleButton).toBeChecked();
  // verify Reset View appears, click it, verify it is gone, verify toggle filter is unchecked
  await expect(resetViewButton).toBeVisible();
  await resetViewButton.click();
  await expect(resetViewButton).toBeHidden();
  await expect(toggleButton).not.toBeChecked();
}

/**
 * Change a column's width, verify Reset View appears,
 * click Reset View, verify Reset View is gone and column's width is the original width
 *
 * Change column's width by dragging a sourceSplitter to a targetSplitter.
 * The splitters should be on adjacent columns, so the source and target columns should be adjacent
 * columns with the source column on the left side of the target column.
 *
 * @param sourceColumnHeader string - The display name (in the UI) of the source column header
 * @param targetColumnHeader string - The display name (in the UI) of the target column header
 * @param page Page - The page used in the e2e or regression test case
 * @param resetViewButton Locator - The Reset View button
 *
 * @returns void
 */
export async function changeColumnWidthVerifyAndResetView(
  sourceColumnHeader: string,
  targetColumnHeader: string,
  page: Page,
  resetViewButton: Locator,
): Promise<void> {
  const sourceColumn = page.getByRole('columnheader', { name: sourceColumnHeader, exact: true }).first();
  const targetColumn = page.getByRole('columnheader', { name: targetColumnHeader, exact: true }).first();
  const sourceSplitterIndex = Number(await sourceColumn.getAttribute('aria-colindex')) - 1; // zero based index needed
  const targetSplitterIndex = Number(await targetColumn.getAttribute('aria-colindex')) - 1; // zero based index needed

  const columnWidthBefore = await findColumnWidth(sourceColumnHeader, page);

  // change column width - get column splitter as target, drag adjacent column splitter on left side to the target
  // NOTE: doesn't work to drag to a splitter that is off of the right side of the window
  const sourceSplitter = page.locator('.ag-header-cell-resize').nth(sourceSplitterIndex);
  const targetSplitter = page.locator('.ag-header-cell-resize').nth(targetSplitterIndex);
  await sourceSplitter.dragTo(targetSplitter);

  await page.waitForTimeout(500); // wait for the width adjustment to happen

  const columnWidthAfter = await findColumnWidth(sourceColumnHeader, page);
  expect(columnWidthAfter).toBeGreaterThan(columnWidthBefore);

  // verify Reset View appears, click it, verify it is gone, verify column width
  await expect(resetViewButton).toBeVisible();
  await resetViewButton.click();
  await expect(resetViewButton).toBeHidden();

  const columnWidthAfterReset = await findColumnWidth(sourceColumnHeader, page);
  expect(columnWidthAfterReset).toEqual(columnWidthBefore);
}

/**
 * Change a column's order, verify that Reset View appears,
 * click Reset View, verify Reset View is gone and column's order is the original order
 *
 * Change column's order by dragging a sourceColumn to a targetColumn. The columns should be adjacent.
 *
 * @param sourceColumnHeader string - The display name (in the UI) of the source column header
 * @param targetColumnHeader string - The display name (in the UI) of the target column header
 * @param page Page - The page used in the e2e or regression test case
 * @param resetViewButton Locator - The Reset View button
 *
 * @returns void
 */
export async function changeColumnOrderVerifyAndResetView(
  sourceColumnHeader: string,
  targetColumnHeader: string,
  page: Page,
  resetViewButton: Locator,
): Promise<void> {
  // change column position - get a column as target, drag source column to target column
  // the .dragTo seems to only work when the columns are next to each other
  const sourceColumn = page.getByRole('columnheader', { name: sourceColumnHeader, exact: true }).first();
  const targetColumn = page.getByRole('columnheader', { name: targetColumnHeader, exact: true }).first();
  const sourceAriaColindex = await sourceColumn.getAttribute('aria-colindex');
  const targetAriaColindex = await targetColumn.getAttribute('aria-colindex');
  await expect(sourceColumn).toHaveAttribute('aria-colindex', sourceAriaColindex);
  await expect(targetColumn).toHaveAttribute('aria-colindex', targetAriaColindex);
  await sourceColumn.dragTo(targetColumn);
  // columns have changed locations so the aria-colindex positions have changed places
  await expect(sourceColumn).toHaveAttribute('aria-colindex', targetAriaColindex);
  await expect(targetColumn).toHaveAttribute('aria-colindex', sourceAriaColindex);
  // verify Reset View appears, click it, verify it is gone, verify column is correct
  await expect(resetViewButton).toBeVisible();
  await resetViewButton.click();
  await expect(resetViewButton).toBeHidden();
  await expect(sourceColumn).toHaveAttribute('aria-colindex', sourceAriaColindex);
  await expect(targetColumn).toHaveAttribute('aria-colindex', targetAriaColindex);
}

/**
 * Change filtering on the specified column header's filter, verify that Reset View appears,
 * click Reset View, verify Reset View is gone and filtering is gone
 *
 * @param columnFilterId string - The id="" attribute on the column header's filter input element
 * @param page Page - The page used in the e2e or regression test case
 * @param resetViewButton Locator - The Reset View button
 *
 * @returns void
 */
export async function changeFilterVerifyAndResetView(
  columnFilterId: string,
  page: Page,
  resetViewButton: Locator,
): Promise<void> {
  const filterBox = page.locator(`#${columnFilterId}`); // id attribute of the filter control
  await filterBox.fill('something');
  // verify Reset View appears, click it, verify it is gone, verify filter is gone
  await expect(resetViewButton).toBeVisible();
  await resetViewButton.click();
  await expect(resetViewButton).toBeHidden();
  await expect(filterBox).toBeEmpty();
}

/**
 * Change sorting on the specified column header, verify that Reset View appears,
 * click Reset View, verify Reset View is gone and verify the default sort is set
 *
 * @param columnHeaderToSort string - The display name (in the UI) of the column header to be sorted
 * @param defaultSortColumnHeader string - The display name of the column header with default sorting
 * @param defaultSortAscending boolean - Does the default sort column's default sort order = Ascending
 * @param page Page - The page used in the e2e or regression test case
 * @param resetViewButton Locator - The Reset View button
 *
 * @returns void
 */
export async function changeSortingVerifyAndResetView(
  columnHeaderToSort: string,
  defaultSortColumnHeader: string,
  defaultSortAscending: boolean,
  page: Page,
  resetViewButton: Locator,
): Promise<void> {
  const columnHeader = page.getByRole('columnheader', { name: columnHeaderToSort, exact: true });
  const columnSortIcon = columnHeader.locator('fluxnova-icon.tooltip-arrow');
  await expect(columnSortIcon).toHaveAttribute('title', 'Unsorted Sort');
  // First click: Unsorted to Ascending    Second click: Ascending to Descending
  await columnSortIcon.click();
  // verify Reset View appears
  await expect(resetViewButton).toBeVisible();
  await page.getByTitle('Ascending Sort').click();
  await expect(columnSortIcon).toHaveAttribute('title', 'Descending Sort');
  // click Reset View, verify it is gone, verify default sort
  await resetViewButton.click();
  await expect(resetViewButton).toBeHidden();
  await expect(columnSortIcon).toHaveAttribute('title', 'Unsorted Sort');
  if (defaultSortAscending) {
    await expect(
      page
        .getByRole('columnheader', { name: defaultSortColumnHeader, exact: true })
        .locator('fluxnova-icon.tooltip-arrow'),
    ).toHaveAttribute('title', 'Ascending Sort');
  } else {
    await expect(
      page
        .getByRole('columnheader', { name: defaultSortColumnHeader, exact: true })
        .locator('fluxnova-icon.tooltip-arrow'),
    ).toHaveAttribute('title', 'Descending Sort');
  }
}
