import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Job, JobDefinition, JobDefinitionFilter, JobFilter } from '@fxn/types';
import { from, Observable, of, toArray } from 'rxjs';
import { catchError, map, mergeMap, tap } from 'rxjs/operators';
import { ToastService } from '@fxn/common';
import { PaginatedDataRequest } from './types/paginated-data-request';

@Injectable({
  providedIn: 'root',
})
export class JobService {
  private http = inject(HttpClient);
  private toastService = inject(ToastService);

  getJobCountByFilter(filters: JobFilter): Observable<number> {
    return this.http.post<number>(`api/jobs/count`, filters);
  }

  getJobLogCountByFilter(filters: any): Observable<number> {
    return this.http
      .get<{ count: number }>('api/history/job-log/count', { params: filters })
      .pipe(map((result) => result.count));
  }

  getJobLogsByFilter(request: PaginatedDataRequest) {
    return this.http.get<Job[]>(`api/history/job-log`, { params: request.asQueryParams() });
  }

  getJobsByFilter(request: PaginatedDataRequest): Observable<Job[]> {
    return this.http.post<Job[]>(`api/jobs`, request);
  }

  getJobDefinitionsByFilter(request: PaginatedDataRequest): Observable<JobDefinition[]> {
    return this.http.post<Job[]>(`api/jobs/job-definitions`, request);
  }

  getJobDefinitionsCountByFilter(filters: JobDefinitionFilter): Observable<number> {
    return this.http.post<number>(`api/jobs/job-definitions/count`, filters);
  }

  updateSuspendStatus(id: string, options: { suspended: boolean }) {
    return this.http.put(`api/jobs/${id}/suspended`, options);
  }

  updateDefinitionSuspendStatus(
    id: string,
    options: { suspended: boolean; includeJobs?: boolean; executionDate?: string },
  ) {
    return this.http.put(`api/job-definition/${id}/suspended`, options);
  }

  deleteJob(id: string) {
    return this.http.delete(`api/jobs/${id}`);
  }

  deleteJobs(ids: string[]) {
    return from(
      ids.map((id) => ({
        id: id,
        request: this.deleteJob(id),
      })),
    ).pipe(mergeMap((idRequest) => idRequest.request.pipe(map(() => idRequest.id)), 2));
  }

  retryJobsByDefinition(id: string) {
    return this.http.put(`api/job-definition/${id}/retries`, {
      retries: 1,
    });
  }

  retryJobsByDefinitions(ids: string[]): Observable<{ success: string[]; failure: string[] }> {
    return from(ids).pipe(
      mergeMap(
        (id) =>
          this.retryJobsByDefinition(id).pipe(
            map(() => ({ id, status: 'success' })), // Mark as success
            catchError(() => of({ id, status: 'failure' })), // Mark as failure if there's an error
          ),
        2, // Concurrency Limit
      ),
      toArray(), // Collect all results into a single array
      map((results) => {
        const success = results.filter((result) => result.status === 'success').map((result) => result.id);
        const failure = results.filter((result) => result.status === 'failure').map((result) => result.id);
        return { success, failure };
      }),
    );
  }

  retryJobs(ids: string[]) {
    return from(
      ids.map((id) => ({
        id: id,
        request: this.http.put(`api/jobs/${id}/retries`, { retries: 1 }),
      })),
    ).pipe(mergeMap((idRequest) => idRequest.request.pipe(map(() => idRequest.id)), 2));
  }

  updateJobRetries(tenantId: string, jobIds: string[], retries: number, dueDate?: string) {
    if (jobIds.length === 1) {
      return this.http.put(`api/jobs/${jobIds[0]}/retries`, { dueDate, retries }).pipe(
        catchError((error) => {
          this.toastService.error(`Could not set retry count for job ${jobIds[0]}`);
          return error;
        }),
        tap(() => {
          this.toastService.success(`Retry count was set for job ${jobIds[0]}`);
        }),
      );
    } else {
      return this.http
        .post('api/jobs/retries', {
          jobIds,
          dueDate,
          retries,
        })
        .pipe(
          catchError((error) => {
            this.toastService.error(`Could not set retry count for ${jobIds.length} jobs`);
            return error;
          }),
          tap((result: any) => {
            this.toastService.success(
              `Request to set retry count for ${jobIds.length} jobs submitted successfully.
                Click <a href="${tenantId}/batches/${result.id}">here</a> to view the status of the request.`,
              { delay: 10000 },
            );
          }),
        );
    }
  }

  recalculateJobDueDate(jobId: string, creationDateBased: boolean) {
    return this.http.post(`api/jobs/${jobId}/duedate/recalculate?creationDateBased=${creationDateBased}`, null);
  }

  setJobDueDate(jobId: string, duedate: string, cascade: boolean) {
    return this.http.put(`api/jobs/${jobId}/duedate`, { duedate: duedate, cascade: cascade });
  }

  setJobDefinitionPriority(id: string, priority: number | null, includeJobs: boolean) {
    return this.http.put(`api/job-definition/${id}/jobPriority`, { priority, includeJobs });
  }
}
