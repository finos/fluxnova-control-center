import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RouteData } from '@fxn/common';
import {
  BatchDetailsComponent,
  BatchListComponent,
  DashboardComponent,
  DecisionDefinitionDetailPageComponent,
  DecisionDefinitionListComponent,
  DecisionInstanceDetailPageComponent,
  DeploymentDetailsPageComponent,
  DeploymentListComponent,
  IncidentListComponent,
  JobListComponent,
  ProcessDefinitionDetailPageComponent,
  ProcessDefinitionListComponent,
  ProcessInstanceDetailPageComponent,
  ProcessInstanceListComponent,
} from '@fxn/pim';
import { TenantGuard } from './tenant.guard';

export const routes: Routes = [
  {
    path: ':tenant',
    canActivate: [TenantGuard],
    component: DashboardComponent,
    data: {},
  },
  {
    path: ':tenant/process-definitions',
    canActivate: [TenantGuard],
    children: [
      {
        path: '',
        component: ProcessDefinitionListComponent,
      },
      {
        path: ':id',
        component: ProcessDefinitionDetailPageComponent,
      },
    ],
    data: {
      itemType: 'ProcessDefinition',
      itemTypeClass: 'process-definition',
      itemTypeListName: 'Process Definitions',
      itemTypeName: 'Process Definition',
    } as RouteData,
  },
  {
    path: ':tenant/process-instances',
    canActivate: [TenantGuard],
    children: [
      {
        path: '',
        component: ProcessInstanceListComponent,
      },
      {
        path: ':id',
        component: ProcessInstanceDetailPageComponent,
      },
    ],
    data: {
      itemType: 'ProcessInstance',
      itemTypeClass: 'process-instance',
      itemTypeListName: 'Process Instances',
      itemTypeName: 'Process Instance',
    } as RouteData,
  },
  {
    path: ':tenant/jobs',
    canActivate: [TenantGuard],
    children: [
      {
        path: '',
        component: JobListComponent,
      },
    ],
    data: {
      itemType: 'Job',
      itemTypeClass: 'job',
      itemTypeListName: 'Jobs',
      itemTypeName: 'Job',
    } as RouteData,
  },
  {
    path: ':tenant/incidents',
    canActivate: [TenantGuard],
    children: [
      {
        path: '',
        component: IncidentListComponent,
      },
    ],
    data: {
      itemType: 'Incident',
      itemTypeClass: 'incident',
      itemTypeListName: 'Incidents',
      itemTypeName: 'Incident',
    } as RouteData,
  },
  {
    path: ':tenant/batches',
    canActivate: [TenantGuard],
    children: [
      {
        path: '',
        component: BatchListComponent,
      },
      {
        path: ':id',
        component: BatchDetailsComponent,
      },
    ],
    data: {
      itemType: 'Batch',
      itemTypeClass: 'batch',
      itemTypeListName: 'Batches',
      itemTypeName: 'Batch',
    },
  },
  {
    path: ':tenant/deployments',
    canActivate: [TenantGuard],
    children: [
      {
        path: '',
        component: DeploymentListComponent,
      },
      {
        path: ':id',
        component: DeploymentDetailsPageComponent,
      },
    ],
    data: {
      itemType: 'Deployment',
      itemTypeClass: 'deployment',
      itemTypeListName: 'Deployments',
      itemTypeName: 'Deployment',
    } as RouteData,
  },
  {
    path: ':tenant/decision-definitions',
    canActivate: [TenantGuard],
    children: [
      {
        path: '',
        component: DecisionDefinitionListComponent,
      },
      {
        path: ':id',
        component: DecisionDefinitionDetailPageComponent,
      },
      {
        path: ':id/instances',
        redirectTo: ':id',
        pathMatch: 'full',
      },
      {
        path: ':id/instances/:instanceId',
        component: DecisionInstanceDetailPageComponent,
        data: {
          itemType: 'DecisionInstance',
          itemTypeClass: 'decision-instance',
          itemTypeListName: 'Decision Definition',
          itemTypeName: 'Decision Instance',
          backNavigation: '../../',
        } as RouteData,
      },
    ],
    data: {
      itemType: 'DecisionDefinition',
      itemTypeClass: 'decision-definition',
      itemTypeListName: 'Decision Definitions',
      itemTypeName: 'Decision Definition',
    } as RouteData,
  },
  {
    path: '**',
    redirectTo: 'process-instances',
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {})],
  exports: [RouterModule],
})
export class AppRoutingModule {}
