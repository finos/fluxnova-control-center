import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UserTask, UserTaskFilter } from '@fxn/types';
import { Observable } from 'rxjs';
import { memoize } from '@fxn/common/src/lib/services/memoize';
import { PaginatedDataRequest } from './types/paginated-data-request';

@Injectable({
  providedIn: 'root',
})
export class UserTaskService {
  private http = inject(HttpClient);
  private readonly CACHE_TIMEOUT = 2000;

  constructor() {
    this.getUserTaskCountByFilter = memoize(this._getUserTaskCountByFilter, this.CACHE_TIMEOUT);
    this.getUserTasksByFilter = memoize(this._getUserTasksByFilter, this.CACHE_TIMEOUT);
  }

  protected _getUserTaskCountByFilter = (filter: UserTaskFilter) =>
    this.http.post<number>(`api/user-tasks/count`, filter);

  public getUserTaskCountByFilter: (filter: UserTaskFilter) => Observable<number>;

  protected _getUserTasksByFilter = (request: PaginatedDataRequest) =>
    this.http.post<UserTask[]>(`api/user-tasks/`, request);

  public getUserTasksByFilter: (request: PaginatedDataRequest) => Observable<UserTask[]>;
}
