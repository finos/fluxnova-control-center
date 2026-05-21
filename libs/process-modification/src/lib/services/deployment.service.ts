import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { memoize } from '@fxn/common/src/lib/services/memoize';
import { DeploymentResource, DeploymentResponse } from '@fxn/types';
import { BehaviorSubject, concatMap, forkJoin, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { PimTab } from '../detail-pages/item-detail-tab-utils';
import { DeploymentResourceUtilsService } from './deployment-resource-utils.service';

import { PaginatedDataRequest } from './types/paginated-data-request';

@Injectable({
  providedIn: 'root',
})
export class DeploymentService {
  private http = inject(HttpClient);
  private resourceUtilsService = inject(DeploymentResourceUtilsService);

  constructor() {
    this.getDeploymentDetails = memoize(this._getDeploymentDetails, 10000);
  }

  public selectedResource: BehaviorSubject<DeploymentResource> = new BehaviorSubject<DeploymentResource>(
    {} as DeploymentResource,
  );

  public setSelectedResource(resource: DeploymentResource) {
    this.selectedResource.next(resource);
  }

  public deploymentTabs: BehaviorSubject<PimTab[]> = new BehaviorSubject<PimTab[]>([] as PimTab[]);

  private _getDeploymentDetails = (
    deploymentId: string,
  ): Observable<{ deployment: DeploymentResponse; resources: DeploymentResource[] }> =>
    forkJoin([
      this.http.get<DeploymentResponse>(`api/deployment/${deploymentId}`),
      this.http.get<DeploymentResource[]>(`api/deployment/${deploymentId}/resource`),
    ])
      .pipe(
        concatMap(([deploymentResponse, deploymentResources]) =>
          forkJoin([
            of(deploymentResponse),
            forkJoin(
              deploymentResources.map((resource) =>
                this.resourceUtilsService.isDiagram(resource) ||
                !!this.resourceUtilsService.getViewableFileLanguage(resource)
                  ? this.resourceUtilsService.getResourceData(resource).pipe(
                      map((response: any) => ({
                        ...resource,
                        data: response.data,
                      })),
                    )
                  : of(resource),
              ),
            ),
          ]),
        ),
      )
      .pipe(
        map(([deployment, resources]) => ({
          deployment,
          resources,
        })),
      );

  public getDeploymentDetails: (
    deploymentId: string,
  ) => Observable<{ deployment: DeploymentResponse; resources: DeploymentResource[] }>;

  public getDeployments(request: PaginatedDataRequest) {
    return forkJoin([
      this.http.get<DeploymentResponse[]>(`api/deployment`, { params: request.asQueryParams() }),
      this.http.get<{ count: number }>('api/deployment/count', { params: request.asQueryParams() }),
    ]).pipe(
      map(([items, countResponse]) => ({
        count: countResponse.count,
        items,
      })),
    );
  }

  public deleteDeployment(
    deploymentId: string,
    cascade: boolean = false,
    skipCustomListeners: boolean = true,
    skipIoMappings: boolean = true,
  ) {
    return this.http.delete(`api/deployment/${deploymentId}`, {
      params: {
        cascade,
        skipCustomListeners,
        skipIoMappings,
      },
    });
  }
}
