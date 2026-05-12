import { HistoricalProcessInstanceFilter, IncidentsFilter, JobFilter, ProcessDefinitionFilter } from './fluxnova';

export interface ListFilters {
  [key: string]: any;
}

export interface ListSortParams {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface ListOptions {
  firstResult?: number;
  maxResults?: number;
  filters?: ListFilters;
  sorting?: ListSortParams[];
}

export interface LoadProcessDefinitionListOptions extends ListOptions {
  filters?: ProcessDefinitionFilter;
}

export interface LoadJobListOptions extends ListOptions {
  filters?: JobFilter;
}

export interface LoadProcessInstanceListOptions extends ListOptions {
  filters?: HistoricalProcessInstanceFilter;
}

export interface LoadIncidentListOptions extends ListOptions {
  filters?: IncidentsFilter;
}
