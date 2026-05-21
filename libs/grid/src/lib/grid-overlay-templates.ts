export const loadingTemplate = `<div class="app-loading">
    <div class="logo"></div>
    <svg class="spinner" viewBox="25 25 50 50">
      <circle class="path" cx="50" cy="50" r="20" fill="none" stroke-width="2" stroke-miterlimit="10" />
    </svg>
  </div>`;

export const noRowsTemplate = function (itemTypeLabel?: string) {
  return `<span class="no-search-results">
    <div class="no-search-results-icon" alt="no results icon"></div>
    No ${itemTypeLabel || 'results'} were found
  </span>`;
};

export const noSearchResultsTemplate = `<span class="no-search-results">
    <div class="no-search-results-icon" alt="no search results icon"></div>
    No results were found to match your search
  </span>`;
