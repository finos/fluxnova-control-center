import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Batch, BatchResponse } from '@fxn/types';
import { forkJoin, from, Observable, of, switchMap } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';

import { PaginatedDataRequest } from '../types/paginated-data-request';

@Injectable({
  providedIn: 'root',
})
export class BatchService {
  private http = inject(HttpClient);

  getBatchStatistics(batchId: string): Observable<Batch[]> {
    return this.http.get<Batch[]>(`api/batch/statistics?batchId=${batchId}`);
  }

  getBatch(batchId: string) {
    return this.http.get<Batch>(`api/history/batch/${batchId}`).pipe(
      switchMap((history) => {
        if (!history.endTime) {
          return this.getBatchStatistics(batchId).pipe(
            map((statistics) => ({
              ...history,
              ...statistics[0], // Should always be 1 result when given a batchId
            })),
          );
        }
        return of(history);
      }),
    );
  }

  getCompletedBatches(request: PaginatedDataRequest) {
    return forkJoin([
      this.http.get<BatchResponse[]>('api/history/batch', { params: request.asQueryParams() }),
      this.http.get<{ count: number }>('api/history/batch/count', { params: request.asQueryParams() }),
    ]).pipe(
      map(([items, countResponse]) => ({
        count: countResponse.count,
        items,
      })),
    );
  }

  getActiveBatches(request: PaginatedDataRequest) {
    return forkJoin([
      this.http.get<BatchResponse[]>(`api/batch`, { params: request.asQueryParams() }),
      this.http.get<{ count: number }>(`api/batch/count`, { params: request.asQueryParams() }),
    ]).pipe(
      map(([items, countResponse]) => ({
        count: countResponse.count,
        items,
      })),
    );
  }

  deleteHistoric(id: string) {
    return this.http.delete(`api/history/batch/${id}`);
  }

  deleteMultipleHistoric(ids: string[]) {
    return from(ids).pipe(mergeMap((id) => this.deleteHistoric(id)));
  }

  delete(id: string, cascade: boolean) {
    return this.http.delete(`api/batch/${id}`, {
      params: {
        cascade,
      },
    });
  }

  deleteMultiple(ids: string[], cascade: boolean) {
    return from(ids).pipe(mergeMap((id) => this.delete(id, cascade)));
  }

  suspend(id: string, suspended: boolean) {
    return this.http.put(`api/batch/${id}/suspended`, { suspended });
  }

  suspendMultiple(ids: string[], suspended: boolean) {
    return from(ids).pipe(mergeMap((id) => this.suspend(id, suspended), 2));
  }
}
