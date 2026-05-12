import { ComponentFixture, TestBed } from '@angular/core/testing';

import {
  DecisionDefinition,
  DecisionRequirementsDefinition,
  DeploymentResource,
  ItemType,
  ListViewState,
} from '@fxn/types';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ItemsTableComponent } from '../../../../common/items-table/items-table.component';
import { DeploymentService } from '../../../../services/deployment.service';
import { PimTab } from '../../../item-detail-tab-utils';
import { DecisionDefinitionsTabComponent } from './decision-definitions-tab.component';

describe('DecisionDefinitionsTabComponent', () => {
  let component: DecisionDefinitionsTabComponent;
  let fixture: ComponentFixture<DecisionDefinitionsTabComponent>;
  let httpClient: HttpClient;
  let deploymentService: DeploymentService;

  const mockResource: DeploymentResource = {
    data: '<xml></xml>',
    deploymentId: 'deploymentId1',
    id: 'id1',
    name: 'test-name.dmn',
  };

  const mockRoute = {
    queryParams: of({ resourceName: 'mockResourceName' }),
    snapshot: {
      params: { id: 1 },
    },
  };

  const mockDecisionRequirementsDefinitions: DecisionRequirementsDefinition[] = [
    {
      category: 'category1',
      deploymentId: 'deploymentId1',
      id: 'id1',
      key: 'key1',
      name: 'name1',
      resource: 'test-name.dmn',
      tenantId: 'tenantId1',
      version: 1,
    },
  ];
  const mockDecisionDefinitions: DecisionDefinition[] = [
    {
      category: 'category1',
      decisionRequirementsDefinitionId: 'decisionRequirementsDefinitionId1',
      decisionRequirementsDefinitionKey: 'decisionRequirementsDefinitionKey1',
      deploymentId: 'deploymentId1',
      historyTimeToLive: 0,
      id: 'id1',
      key: 'key1',
      name: 'name1',
      resource: 'resource1',
      tenantId: 'tenantId1',
      version: 1,
      versionTag: 'v1.0',
    },
  ];

  beforeEach(async () => {
    const mockGetFn = vi.fn().mockImplementation((url: string) => {
      let response: any = null;

      if (url.includes('decision-requirements-definition')) {
        response = mockDecisionRequirementsDefinitions;
      } else if (url.includes('decision-definition')) {
        response = mockDecisionDefinitions;
      }

      return of(response);
    });

    TestBed.configureTestingModule({
      providers: [
        provideHttpClientTesting(),
        provideHttpClient(),
        DeploymentService,
        { provide: ActivatedRoute, useValue: mockRoute },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
      declarations: [DecisionDefinitionsTabComponent],
    });

    httpClient = TestBed.inject(HttpClient);
    deploymentService = TestBed.inject(DeploymentService);
    fixture = TestBed.createComponent(DecisionDefinitionsTabComponent);
    component = fixture.componentInstance;

    vi.spyOn(httpClient, 'get').mockImplementation(mockGetFn);
    vi.useFakeTimers();
  });

  afterEach(() => vi.useRealTimers());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should fetch data on selectedResource change', async () => {
    deploymentService.setSelectedResource(mockResource);
    fixture.detectChanges();

    // Trigger ngOnInit to call loadData
    component.ngOnInit();

    // Simulate the passage of async operations
    await vi.runAllTimersAsync();

    expect(component.data).toBe(mockDecisionDefinitions);
  });

  it('should handle HTTP errors gracefully', async () => {
    const observableWithError = throwError(() => new Error('This is an error'));
    vi.spyOn(httpClient, 'get').mockReturnValue(observableWithError);

    deploymentService.setSelectedResource(mockResource);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.data).toEqual([]);
  });

  describe('column preferences', () => {
    const itemType = ItemType.Deployment;
    const tab = PimTab.Definitions;

    const storageKey = `${itemType}-detail-tab-${tab}-dmn.listviewstate`.toLowerCase();
    const localStorageMock = {
      getItem: vi.fn((key: string): any => {
        if (key === storageKey)
          return { columnState: [{ colId: 'name', pinned: true, flex: 1, width: 330 }], differentThanDefaults: true };

        return undefined;
      }),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };

    beforeEach(() => {
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
        writable: true,
      });

      component.detailItem = { id: '123', type: itemType };
    });

    it('should load the column preferences from local storage', () => {
      const listView = new ListViewState([{ colId: 'name', pinned: true, flex: 1, width: 330 }]);

      fixture.detectChanges();

      expect(localStorageMock.getItem).toHaveBeenCalledWith(storageKey);
      expect(component.listViewState?.getColumnStates()).toContainEqual(listView.getColumnStates()[0]);
    });

    it('should save the column preferences to local storage', () => {
      const listView = new ListViewState([{ colId: 'name', pinned: false, flex: 1, width: 330 }]);

      component.columnPrefsUpdated(listView);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        storageKey,
        JSON.stringify({ columnState: listView.getColumnStates(), differentThanDefaults: true }),
      );
    });
  });

  describe('resetting the grid', () => {
    it('should reset the grid when reset grid button is clicked', () => {
      component.init();
      const resetUrlSpy = vi.spyOn(component, 'resetUrl');
      const mockItemTable = { resetColumnDefs: vi.fn() };
      component.itemTable = mockItemTable as unknown as ItemsTableComponent;
      component.onFilterChanged({ testFilter: 'test-value' });
      component.onSortChanged([{ sort: 'asc', colId: 'version' }]);

      component.onResetGridClick();

      expect(component.filters).toEqual({});
      expect(component.sorting).toEqual([]);
      expect(resetUrlSpy).toHaveBeenCalled();
      expect(mockItemTable.resetColumnDefs).toHaveBeenCalledWith(new ListViewState(component.columnDefinitions));
    });
  });
});
