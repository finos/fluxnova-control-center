export interface IPaginatedDataRequest<T = Record<string, any>> {
  filter: T;
  maxResults: number;
  firstResult: number;
}

export const MAX_RESULT_COUNT = 1000;
export const DEFAULT_RESULT_COUNT = 50;
