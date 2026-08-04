import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { memoize } from './memoize';

interface VersionResponse {
  version: string;
}

@Injectable({
  providedIn: 'root',
})
export class VersionService {
  private http = inject(HttpClient);

  private static readonly CACHE_TIMEOUT = 2000;

  constructor() {
    this.getRestAPIVersion = memoize(this._getRestAPIVersion.bind(this), VersionService.CACHE_TIMEOUT);
  }

  public getRestAPIVersion: () => Observable<VersionResponse>;

  protected _getRestAPIVersion(): Observable<VersionResponse> {
    return this.http.get<VersionResponse>(`api/version`);
  }
}
