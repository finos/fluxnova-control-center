import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import {
  BatchResponse,
  DecisionDefinition,
  DeploymentResponse,
  Incident,
  Job,
  ProcessDefinition,
  ProcessInstance,
} from '@fxn/types';
import { Router } from '@angular/router';
import { SearchNavigationComponent } from './search-navigation.component';

describe('SearchNavigationComponent', () => {
  let component: SearchNavigationComponent;
  let fixture: ComponentFixture<SearchNavigationComponent>;
  let httpTestingController: HttpTestingController;
  let router: Router;

  const testId = 'abc';
  const mockResults = [
    {
      id: testId,
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SearchNavigationComponent],
      imports: [],
      providers: [provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    httpTestingController = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(SearchNavigationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Search', () => {
    it('should get process definitions', () => {
      component.search(testId);

      const req = httpTestingController.expectOne('api/process-definitions');
      expect(req.request.method).toEqual('POST');
      expect(req.request.body).toEqual({
        filter: { processDefinitionId: testId },
        firstResult: 0,
        maxResults: 1,
      });

      httpTestingController
        .match((request) => !request.url.includes('process-definition'))
        .forEach((request) => {
          request.flush([]);
        });

      req.flush(mockResults);

      expect(component.definitionResults).toEqual(mockResults);
    });

    it('should get process instances', () => {
      component.search(testId);

      const req = httpTestingController.expectOne('api/process-instances');
      expect(req.request.method).toEqual('POST');
      expect(req.request.body).toEqual({
        filter: { processInstanceId: testId.trim() },
        firstResult: 0,
        maxResults: 1,
      });

      httpTestingController
        .match((request) => !request.url.includes('process-instance'))
        .forEach((request) => {
          request.flush([]);
        });

      req.flush(mockResults);

      expect(component.instanceResults).toEqual(mockResults);
    });

    it('should get jobs', () => {
      component.search(testId);

      const req = httpTestingController.expectOne('api/jobs');
      expect(req.request.method).toEqual('POST');
      expect(req.request.body).toEqual({
        filter: { jobId: testId },
        firstResult: 0,
        maxResults: 1,
      });

      httpTestingController
        .match((request) => !request.url.includes('job'))
        .forEach((request) => {
          request.flush([]);
        });

      req.flush(mockResults);

      expect(component.jobResults).toEqual(mockResults);
    });

    it('should get incidents', () => {
      component.search(testId);

      const req = httpTestingController.expectOne('api/incidents');
      expect(req.request.method).toEqual('POST');
      expect(req.request.body).toEqual({
        filter: { incidentId: testId },
        firstResult: 0,
        maxResults: 1,
      });

      httpTestingController
        .match((request) => !request.url.includes('incident'))
        .forEach((request) => {
          request.flush([]);
        });

      req.flush(mockResults);

      expect(component.incidentResults).toEqual(mockResults);
    });

    it('should get batches', () => {
      component.search(testId);

      const req = httpTestingController.expectOne(`api/batch?batchId=${testId}&firstResult=0&maxResults=1`);
      expect(req.request.method).toEqual('GET');

      httpTestingController
        .match((request) => !request.url.includes('batch'))
        .forEach((request) => {
          request.flush([]);
        });

      req.flush(mockResults);

      expect(component.batchResults).toEqual(mockResults);
    });

    it('should get deployments', () => {
      component.search(testId);

      const req = httpTestingController.expectOne(`api/deployment?id=${testId}&firstResult=0&maxResults=1`);
      expect(req.request.method).toEqual('GET');

      httpTestingController
        .match((request) => !request.url.includes('deployment'))
        .forEach((request) => {
          request.flush([]);
        });

      req.flush(mockResults);

      expect(component.deploymentResults).toEqual(mockResults);
    });

    it('should get decisions', () => {
      component.search(testId);

      const req = httpTestingController.expectOne(
        `api/decision-definition?decisionDefinitionId=${testId}&firstResult=0&maxResults=1`,
      );
      expect(req.request.method).toEqual('GET');

      httpTestingController
        .match((request) => !request.url.includes('decision-definition'))
        .forEach((request) => {
          request.flush([]);
        });

      req.flush(mockResults);

      expect(component.decisionDefinitionResults).toEqual(mockResults);
    });
  });

  describe('Change', () => {
    let navigateSpy: Mock;
    beforeEach(async () => {
      navigateSpy = vi.spyOn(router, 'navigate');
      component.searchInput = {
        handleClearClick: vi.fn(),
        close: vi.fn(),
      } as any;
    });

    it('should handle process definition change', () => {
      component.definitionResults = [{} as ProcessDefinition];
      component.change({ id: testId });

      expect(navigateSpy).toHaveBeenCalledWith(['', 'process-definitions', testId], { queryParams: {} });
    });

    it('should handle process instance change', () => {
      component.instanceResults = [{} as ProcessInstance];
      component.change({ id: testId });

      expect(navigateSpy).toHaveBeenCalledWith(['', 'process-instances', testId], { queryParams: {} });
    });

    it('should handle job change', () => {
      component.jobResults = [{} as Job];
      component.change({ id: 'cba', processInstanceId: testId, failedActivityId: 'fail' });

      expect(navigateSpy).toHaveBeenCalledWith(['', 'process-instances', testId], {
        queryParams: {
          activityId: 'fail',
          jobId: 'cba',
          tab: 'jobs',
        },
      });
    });

    it('should handle incident change', () => {
      component.incidentResults = [{} as Incident];
      component.change({ id: 'cba', processInstanceId: testId, activityId: 'activity' });

      expect(navigateSpy).toHaveBeenCalledWith(['', 'process-instances', testId], {
        queryParams: {
          activityId: 'activity',
          incidentId: 'cba',
          tab: 'incidents',
        },
      });
    });

    it('should handle batch change', () => {
      component.batchResults = [{} as BatchResponse];
      component.change({ id: testId });

      expect(navigateSpy).toHaveBeenCalledWith(['', 'batches', testId], { queryParams: {} });
    });

    it('should handle deployment change', () => {
      component.deploymentResults = [{} as DeploymentResponse];
      component.change({ id: testId });

      expect(navigateSpy).toHaveBeenCalledWith(['', 'deployments', testId], { queryParams: {} });
    });

    it('should handle decision change', () => {
      component.decisionDefinitionResults = [{} as DecisionDefinition];
      component.change({ id: testId });

      expect(navigateSpy).toHaveBeenCalledWith(['', 'decision-definitions', testId], { queryParams: {} });
    });
  });

  describe('Get Result Path', () => {
    it('should get definition path', () => {
      component.definitionResults = [{} as ProcessDefinition];

      expect(component.getResultPath()).toEqual('process-definitions');
    });

    it('should get instance path', () => {
      component.instanceResults = [{} as ProcessInstance];

      expect(component.getResultPath()).toEqual('process-instances');
    });

    it('should get job path', () => {
      component.jobResults = [{} as Job];

      expect(component.getResultPath()).toEqual('process-instances');
    });

    it('should get incident path', () => {
      component.incidentResults = [{} as Incident];

      expect(component.getResultPath()).toEqual('process-instances');
    });

    it('should get batch path', () => {
      component.batchResults = [{} as BatchResponse];

      expect(component.getResultPath()).toEqual('batches');
    });

    it('should get deployment path', () => {
      component.deploymentResults = [{} as DeploymentResponse];

      expect(component.getResultPath()).toEqual('deployments');
    });

    it('should get decision path', () => {
      component.decisionDefinitionResults = [{} as DecisionDefinition];

      expect(component.getResultPath()).toEqual('decision-definitions');
    });
  });
});
