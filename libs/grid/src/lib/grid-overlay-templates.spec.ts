import { describe, expect, it } from 'vitest';
import { noRowsTemplate, noSearchResultsTemplate } from './grid-overlay-templates';

describe('Grid Overlay Templates', () => {
  it('should return noRowsTemplate with itemTypeLabel', () => {
    const noRowsResult = noRowsTemplate('rows');
    expect(noRowsResult).toContain('No rows were found');
  });

  it('should return noRowsTemplate with default label', () => {
    const noRowsResult = noRowsTemplate();
    expect(noRowsResult).toContain('No results were found');
  });

  it('should export noSearchResultsTemplate', () => {
    expect(noSearchResultsTemplate).toContain('No results were found to match your search');
  });
});
