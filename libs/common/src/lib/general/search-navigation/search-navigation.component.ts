import {
  Component,
  EventEmitter,
  inject,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { finalize, forkJoin, Subject } from 'rxjs';
import {
  BatchResponse,
  DecisionDefinition,
  DeploymentResponse,
  Incident,
  ItemDetailQueryParams,
  Job,
  ProcessDefinition,
  ProcessInstance,
} from '@fxn/types';
import { HttpClient } from '@angular/common/http';
import { isEmpty } from 'lodash-es';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { NgSelectComponent } from '@ng-select/ng-select';
import { Router } from '@angular/router';
import { SubSink } from 'subsink';
import { getUrlSegments } from '../../utils';

@Component({
  selector: 'fluxnova-search-navigation',
  templateUrl: './search-navigation.component.html',
  styleUrls: ['./search-navigation.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: false,
})
export class SearchNavigationComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private router = inject(Router);

  @ViewChild('searchInput') searchInput?: NgSelectComponent;
  @Output() searchChosen = new EventEmitter();

  definitionResults?: ProcessDefinition[];
  instanceResults?: ProcessInstance[];
  incidentResults?: Incident[];
  jobResults?: Job[];
  batchResults?: BatchResponse[];
  deploymentResults?: DeploymentResponse[];
  decisionDefinitionResults?: DecisionDefinition[];

  value = '';
  isLoading = false;
  results?: any[] = [];
  update$ = new Subject<string>();
  subs = new SubSink();
  queryParams?: ItemDetailQueryParams;

  ngOnInit() {
    this.subs.add(
      this.update$.pipe(debounceTime(250), distinctUntilChanged()).subscribe((value) => value && this.search(value)),
    );
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  search(searchValue: string) {
    this.isLoading = true;
    return forkJoin([
      this.http.post<ProcessDefinition[]>('api/process-definitions', {
        filter: { processDefinitionId: searchValue },
        firstResult: 0,
        maxResults: 1,
      }),
      this.http.post<ProcessInstance[]>(`api/process-instances`, {
        filter: { processInstanceId: searchValue?.trim() },
        firstResult: 0,
        maxResults: 1,
      }),
      this.http.post<Job[]>(`api/jobs`, {
        filter: { jobId: searchValue },
        firstResult: 0,
        maxResults: 1,
      }),
      this.http.post<Incident[]>(`api/incidents`, {
        filter: { incidentId: searchValue },
        firstResult: 0,
        maxResults: 1,
      }),
      this.http.get<BatchResponse[]>(`api/batch`, {
        params: {
          batchId: searchValue,
          firstResult: 0,
          maxResults: 1,
        },
      }),
      this.http.get<DeploymentResponse[]>(`api/deployment`, {
        params: {
          id: searchValue,
          firstResult: 0,
          maxResults: 1,
        },
      }),
      this.http.get<DecisionDefinition[]>(`api/decision-definition`, {
        params: {
          decisionDefinitionId: searchValue,
          firstResult: 0,
          maxResults: 1,
        },
      }),
    ])
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(([definitions, instances, jobs, incidents, batches, deployments, decisionDefinitions]) => {
        this.definitionResults = definitions;
        this.instanceResults = instances;
        this.incidentResults = incidents;
        this.jobResults = jobs;
        this.batchResults = batches;
        this.deploymentResults = deployments;
        this.decisionDefinitionResults = decisionDefinitions;
        this.results = definitions.concat(
          instances as any,
          jobs as any,
          incidents as any,
          batches as any,
          deployments as any,
          decisionDefinitions as any,
        );
      });
  }

  clear() {
    this.searchInput?.close();
  }

  focusSearch() {
    this.searchInput?.focus();
  }

  change(result: any) {
    // ProcessDefinition doesn't have type processInstanceId
    this.results = [];
    this.searchInput?.handleClearClick();
    if (result) {
      let id = result.id;
      const queryParams: { tab?: string; jobId?: string; incidentId?: string; activityId?: string } = {};
      if (!isEmpty(this.jobResults)) {
        id = result?.processInstanceId;
        queryParams['tab'] = 'jobs';
        queryParams['jobId'] = result.id;
        queryParams['activityId'] = result.failedActivityId;
      } else if (!isEmpty(this.incidentResults)) {
        id = result?.processInstanceId;
        queryParams['tab'] = 'incidents';
        queryParams['incidentId'] = result.id;
        queryParams['activityId'] = result.activityId;
      }

      this.router.navigate([getUrlSegments(this.router.url).tenant, this.getResultPath(), id], { queryParams });
      this.clear();
      this.searchChosen.emit(result);
    }
  }

  getResultPath() {
    if (!isEmpty(this.batchResults)) {
      return `batches`;
    } else if (!isEmpty(this.deploymentResults)) {
      return 'deployments';
    } else if (!isEmpty(this.decisionDefinitionResults)) {
      return 'decision-definitions';
    } else {
      return `process-${this.definitionResults?.length ? 'definitions' : 'instances'}`;
    }
  }
}
