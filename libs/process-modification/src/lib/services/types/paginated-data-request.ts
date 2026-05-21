import { HttpParams } from '@angular/common/http';
import { DEFAULT_RESULT_COUNT, IPaginatedDataRequest } from '@fxn/types';

export class PaginatedDataRequest<T = Record<string, any>> implements IPaginatedDataRequest<T> {
  /**
   *
   * @param filter
   * @param maxResults
   * @param firstResult
   */
  constructor(
    readonly filter: T,
    readonly maxResults: number = DEFAULT_RESULT_COUNT,
    readonly firstResult: number = 0,
  ) {}

  public asQueryParams() {
    return new HttpParams({
      fromObject: { ...this.filter, maxResults: this.maxResults, firstResult: this.firstResult },
    });
  }
}
