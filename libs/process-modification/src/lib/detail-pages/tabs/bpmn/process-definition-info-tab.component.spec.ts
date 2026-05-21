import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { ItemType, ListViewState } from '@fxn/types';
import { of } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { beforeEach, describe, expect, it, Mocked, vi } from 'vitest';
import { ProcessInstanceService } from '../../../services/process-instance.service';
import { ProcessDefinitionService } from '../../../services/process-definition.service';
import { DeploymentService } from '../../../services/deployment.service';
import { PimTab } from '../../item-detail-tab-utils';
import { ItemsTableComponent } from '../../../common/items-table/items-table.component';
import { ProcessDefinitionInfoTabComponent } from './process-definition-info-tab.component';

const mockActivatedRoute = {
  queryParams: of({ rowItem: 'testId' }),
};

const mockRouter = {
  navigate: vi.fn(),
};

const mockDeploymentService = {
  selectedResource: of({ name: 'mockName' }),
  setSelectedResource: vi.fn(),
};

const mockProcessInstanceService: Mocked<ProcessInstanceService> = {
  getProcessInstanceCountByFilter: vi.fn(() => of(1)),
} as unknown as Mocked<ProcessInstanceService>;

const mockHttp = { get: vi.fn() };

const mockProcessDefinitionService: Mocked<ProcessDefinitionService> = {
  getProcessDefinitionsByFilter: vi.fn(() =>
    of([
      {
        id: 1,
        name: 'testingName',
        key: 'testingKey',
        version: 'V1',
        resource: 'testing.bpmn',
      },
    ]),
  ),
} as unknown as Mocked<ProcessDefinitionService>;

describe('Deployment Links Section Component', () => {
  let component: ProcessDefinitionInfoTabComponent;
  let fixture: ComponentFixture<ProcessDefinitionInfoTabComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ProcessDefinitionInfoTabComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
      providers: [
        { provide: ProcessDefinitionService, useValue: mockProcessDefinitionService },
        { provide: ProcessInstanceService, useValue: mockProcessInstanceService },
        { provide: HttpClient, useValue: mockHttp },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Router, useValue: mockRouter },
        { provide: DeploymentService, useValue: mockDeploymentService },
      ],
    });
    fixture = TestBed.createComponent(ProcessDefinitionInfoTabComponent);
    component = fixture.componentInstance;
    component.deploymentService.setSelectedResource({
      id: '123',
      deploymentId: '1234',
      name: 'testing.bpmn',
    });
    fixture.detectChanges();
  });

  it('should call super.init without errors', () => {
    expect(() => component.ngOnInit()).not.toThrow();
  });

  it('should identify its tab correctly', () => {
    expect(component.tab).toEqual(PimTab.Definitions);
  });

  // This tist is a false positive since switching to Vitest, skipping til it is rewritten.
  it.skip('should derive correct object structure from process instance and definition calls', () => {
    component.route = {
      queryParams: of({ rowItem: 'testId' }),
    } as any;
    const mockData = [
      {
        id: 1,
        name: 'testingName',
        key: 'testingKey',
        fileName: 'testing.bpmn',
        instanceCount: 1,
        processDefinitionVersion: 'V1',
      },
    ];

    component.onDataLoad(mockData);

    component.links$?.subscribe((value) => {
      expect(value).toEqual([
        {
          id: 1,
          name: 'testingName',
          key: 'testingKey',
          fileName: 'testing.bpmn',
          instanceCount: 1,
          processDefinitionVersion: 'V1',
        },
      ]);
    });
  });

  describe('column preferences', () => {
    const itemType = ItemType.Deployment;
    const tab = PimTab.Definitions;

    const storageKey = `${itemType}-detail-tab-${tab}-bpmn.listviewstate`.toLowerCase();
    const localStorageMock = {
      getItem: vi.fn((key: string): any => {
        if (key === storageKey)
          return {
            columnState: [{ colId: 'processDefinitionName', pinned: true, width: 330, flex: 1 }],
            differentThanDefaults: true,
          };

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
      const listView = new ListViewState([{ colId: 'processDefinitionName', pinned: true, width: 330, flex: 1 }]);

      fixture.detectChanges();

      expect(localStorageMock.getItem).toHaveBeenCalledWith(storageKey);
      expect(component.listViewState?.getColumnStates()).toContainEqual(listView.getColumnStates()[0]);
    });

    it('should save the column preferences to local storage', () => {
      const listView = new ListViewState([{ colId: 'processDefinitionName', pinned: false, width: 330, flex: 1 }]);

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
