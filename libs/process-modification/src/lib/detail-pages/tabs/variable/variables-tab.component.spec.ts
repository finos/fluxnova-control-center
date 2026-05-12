import { LetDirective } from '@ngrx/component';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthorizationHttpService, GeneralModule, MODAL_DEFAULTS, ToastService } from '@fxn/common';
import { cloneDeep } from 'lodash-es';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { marbles } from 'rxjs-marbles';
import { FluxnovaVariableTypes, ItemType, ListViewState, Variable } from '@fxn/types';
import { AgGridAngular } from 'ag-grid-angular';
import { toastServiceSpy } from '@fxn/test-support/vitest';
import {
  complexFluxnovaVariableTypes,
  createMockFluxnovaVariables,
  simpleFluxnovaVariableTypes,
} from '@fxn/test-support/src/lib/mock-fluxnova-process-variables';
import { ModuleRegistry } from 'ag-grid-community';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { beforeEach, describe, expect, it, Mocked, vi } from 'vitest';
import { AG_GRID_MODULES } from '@fxn/grid';
import { ProcessInstanceService } from '../../../services/process-instance.service';
import { VariableService } from '../../../services/variable.service';
import { ItemDetailPageCommunicationService } from '../../item-detail-page.communication.service';
import { ProcessVariableModalService } from '../../process-instance/process-variable-modal/process-variable-modal-service';
import { ItemsTableComponent } from '../../../common/items-table/items-table.component';
import { PimTab } from '../../item-detail-tab-utils';
import { VariablesTabComponent } from './variables-tab.component';

ModuleRegistry.registerModules(AG_GRID_MODULES);

describe('Variables Tab Component', () => {
  let component: VariablesTabComponent;
  let fixture: ComponentFixture<VariablesTabComponent>;
  let mockedVariables: Variable[];
  let mockVariableService: Mocked<VariableService>;

  const mockEvent: any = {
    api: {
      getFilterModel: vi.fn(() => ({
        name: {
          filter: 'variable',
          type: 'contains',
        },
      })),
      setFilterModel: vi.fn(),
      getColumnState: vi.fn(() => [{ colId: 'name', sort: 'asc' }]),
      getRenderedNodes: vi.fn(),
    },
  };
  const processInstancesById: any = {
    '123': {
      id: '123',
      state: 'ACTIVE',
    },
    'completed-instance': {
      id: 'completed-instance',
      state: 'COMPLETED',
    },
  };

  const mockProcessInstanceService = {
    getProcessInstance: vi.fn((id: string) => of(processInstancesById?.[id])),
  } as unknown as Mocked<ProcessInstanceService>;

  const mockProcessVariableModalService = {
    show: vi.fn(() => Promise.resolve({ saved: true })),
    hide: vi.fn(),
  };

  const mockRoute = {
    queryParams: new BehaviorSubject({}),
  };

  const mockAuthHttpService = {
    checkSync: vi.fn().mockResolvedValue(true),
  };

  beforeEach(() => {
    mockedVariables = createMockFluxnovaVariables(5);
    mockVariableService = {
      deleteProcessVariable: vi.fn(() => of({})),
      deleteTaskVariable: vi.fn(() => of({})),
      deleteExecutionVariable: vi.fn(() => of({})),
      getProcessVariablesByFilter: vi.fn(() => of(mockedVariables as Variable[])),
      updateProcessVariables: vi.fn(() => of()),
      updateTaskVariables: vi.fn(() => of()),
      updateExecutionVariables: vi.fn(() => of()),
    } as unknown as Mocked<VariableService>;

    TestBed.configureTestingModule({
      declarations: [VariablesTabComponent],
      imports: [FormsModule, LetDirective, GeneralModule],
      providers: [
        { provide: AuthorizationHttpService, useValue: mockAuthHttpService },
        { provide: ActivatedRoute, useValue: mockRoute },
        { provide: ProcessInstanceService, useValue: mockProcessInstanceService },
        { provide: VariableService, useValue: mockVariableService },
        { provide: ToastService, useValue: toastServiceSpy },
        { provide: ProcessVariableModalService, useValue: mockProcessVariableModalService },
        ItemDetailPageCommunicationService,
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    });

    fixture = TestBed.createComponent(VariablesTabComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
    component.itemTable = {
      agGrid: {
        api: {
          setFilterModel: vi.fn(),
          ensureIndexVisible: vi.fn(),
          applyColumnState: vi.fn(),
          getFilterModel: vi.fn(),
          getColumnState: vi.fn(() => []),
          forEachNode: vi.fn(),
          getColumn: vi.fn(),
          getRenderedNodes: vi.fn(() => []),
          redrawRows: vi.fn(),
        },
      } as unknown as AgGridAngular,
    } as ItemsTableComponent;

    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => vi.useRealTimers());

  describe('when initializing', () => {
    it('should initialize the data with an active process', async () => {
      component.detailItem = { id: '123', type: ItemType.ProcessInstance };
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(1);

      expect(component.detailItemId).toBe('123');
      expect(component.columnDefinitions.map((def) => def.headerName)).toEqual(['Name', 'Type', 'Value', 'Scope', '']);
      expect(component.dataSubscription).toBeDefined();
      expect(mockVariableService.getProcessVariablesByFilter).toHaveBeenCalledWith(
        {
          filter: {
            processInstanceIdIn: ['123'],
            sortBy: 'variableName',
            sortOrder: 'asc',
          },
          maxResults: 50,
          firstResult: 0,
        },
        true,
      );
      expect(component.isLoading).toBe(false);
    });

    it('should initialize the data with an inactive process', async () => {
      component.detailItem = { id: 'completed-instance', type: ItemType.ProcessInstance };
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(1);

      expect(component.detailItemId).toBe('completed-instance');
      expect(component.columnDefinitions.map((def) => def.headerName)).toEqual([
        'Name',
        'Type',
        'Value',
        'Scope',
        'Create Time',
      ]);
      expect(component.dataSubscription).toBeDefined();
      expect(mockVariableService.getProcessVariablesByFilter).toHaveBeenCalledWith(
        {
          filter: {
            processInstanceIdIn: ['completed-instance'],
            sortBy: 'variableName',
            sortOrder: 'asc',
          },
          maxResults: 50,
          firstResult: 0,
        },
        false,
      );
      expect(component.isLoading).toBe(false);
    });

    it(
      'shows an error when loading fails',
      marbles(async () => {
        mockProcessInstanceService.getProcessInstance.mockReturnValueOnce(
          throwError(() => {
            throw new Error('im an error');
          }),
        );

        component.detailItem = { id: '123', type: ItemType.ProcessInstance };
        fixture.detectChanges();

        expect(toastServiceSpy.error).toHaveBeenCalledWith('im an error');
      }),
    );
  });

  describe('after initialization', () => {
    beforeEach(() => {
      component.detailItem = { id: '123', type: ItemType.ProcessInstance };
      fixture.detectChanges();
      vi.clearAllMocks();
    });

    it('closes modals when the component is destroyed', () => {
      component.ngOnDestroy();
      expect(mockProcessVariableModalService.hide).toHaveBeenCalled();
    });

    it('#isComplexType should return true on complex type', () => {
      complexFluxnovaVariableTypes.forEach((value) => {
        expect(component.isComplexType(value as Variable)).toBe(true);
      });
    });

    it('#isComplexType should return false on simple type', () => {
      simpleFluxnovaVariableTypes.forEach((type) => {
        expect(component.isComplexType(type as Variable)).toBe(false);
      });
    });

    it('should return false if isComplexType is called with variable with type undefined', () => {
      expect(
        component.isComplexType({
          id: '123',
          name: 'test',
        }),
      ).toEqual(false);
    });

    it('should save new process variable when save is clicked', () => {
      const newVariable = {
        id: 'faoisjeoifja',
        name: 'myNewVar',
        type: 'String' as FluxnovaVariableTypes,
        value: 'My new var value',
        scopeType: 'Process',
      } as Variable;
      component.variablesToBeSaved = [...component.data, newVariable];

      component.saveClicked();
      component.loadData();

      expect(mockVariableService.updateProcessVariables).toHaveBeenCalledWith(newVariable);
    });

    it('should save new task variable when save is clicked', () => {
      const newVariable = {
        id: 'faoisjeoifja',
        name: 'myNewVar',
        type: 'String' as FluxnovaVariableTypes,
        value: 'My new var value',
        scopeType: 'Activity',
        taskId: 'task-id',
      } as Variable;
      component.variablesToBeSaved = [...component.data, newVariable];

      component.saveClicked();
      component.loadData();

      expect(mockVariableService.updateTaskVariables).toHaveBeenCalledWith(newVariable);
    });

    it('should save new execution variable when save is clicked', () => {
      const newVariable = {
        id: 'faoisjeoifja',
        name: 'myNewVar',
        type: 'String' as FluxnovaVariableTypes,
        value: 'My new var value',
        scopeType: 'Activity',
        executionId: 'execution-id',
      } as Variable;
      component.variablesToBeSaved = [...component.data, newVariable];

      component.saveClicked();
      component.loadData();

      expect(mockVariableService.updateExecutionVariables).toHaveBeenCalledWith(newVariable);
    });

    it('should call modal service when deleteClicked is called', async () => {
      component.detailItem = { id: '123', type: ItemType.ProcessInstance };
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(1);

      component.deleteClicked(0, mockedVariables[0]);

      await vi.advanceTimersByTimeAsync(1);

      expect(mockProcessVariableModalService.show).toHaveBeenCalledTimes(1);
      expect(mockProcessVariableModalService.show).toHaveBeenCalledWith(
        {
          confirmButtonLabel: 'Delete',
          modalType: 'Delete',
          processInstanceActive: true,
          variable: {
            activityInstanceId: '',
            batchId: '',
            caseExecutionId: '',
            caseInstanceId: '',
            errorMessage: '',
            executionId: '',
            id: '0',
            name: 'variable#0',
            processDefinitionId: '1',
            processInstanceId: 'abcd1234',
            scopeType: 'Process',
            taskId: '',
            tenantId: '',
            type: 'Boolean',
            value: undefined,
            valueInfo: {
              objectTypeName: '',
              serializationDataFormat: '',
            },
          },
          allVariables: mockedVariables,
          typeOptions: Object.values(FluxnovaVariableTypes)
            .filter((value) => value !== 'Bytes')
            .map((value) => ({
              value: value,
              name: value,
            })),
        },
        {
          ...MODAL_DEFAULTS,
          modalDialogClass: 'dynamic-modal',
        },
      );
    });

    it('should save modification for single simple type', () => {
      const updatedVariables = createMockFluxnovaVariables(4, ['Object']);
      updatedVariables[0].value = '{ "prop": "test" }';

      mockVariableService.updateProcessVariables.mockReturnValue(of(null as any));
      mockVariableService.getProcessVariablesByFilter.mockReturnValueOnce(of(updatedVariables));

      mockedVariables = createMockFluxnovaVariables(1, ['File']);
      mockedVariables.forEach((variable) => {
        variable.name = 'updated';
        variable.type = FluxnovaVariableTypes.Integer;
        variable.value = '5';
      });
      component.variablesToBeSaved = cloneDeep(mockedVariables);

      component.saveClicked();

      expect(mockVariableService.updateProcessVariables).toHaveBeenCalledTimes(1);
      checkUpdateVariableCalls();
      updatedVariables[0].value = JSON.stringify(JSON.parse('{ "prop": "test" }'), null, '\t');
    });

    it('should save modification for simple types', () => {
      const updatedVariables = createMockFluxnovaVariables(1, ['Object']);
      updatedVariables[0].value = '{ "prop": "test" }';

      mockVariableService.updateProcessVariables.mockReturnValue(of(null as any));

      mockedVariables = createMockFluxnovaVariables(4, ['File', 'Object', 'Json', 'Xml']);
      mockedVariables.forEach((variable) => {
        variable.name = 'updated';
        variable.value = 'updatedValue';
        if (variable.type === 'Object') variable.id = '';
      });
      component.variablesToBeSaved = cloneDeep(mockedVariables);

      component.saveClicked();

      expect(mockVariableService.updateProcessVariables).toHaveBeenCalledTimes(4);
      checkUpdateVariableCalls();
    });

    it('should load variables when filter is changed', () => {
      component.detailItem = { id: '123', type: ItemType.ProcessInstance };
      component.onFilterChanged(mockEvent);

      expect(mockVariableService.getProcessVariablesByFilter).toHaveBeenCalledWith(
        {
          filter: {
            processInstanceIdIn: ['123'],
            sortBy: 'variableName',
            sortOrder: 'asc',
          },
          maxResults: 50,
          firstResult: 0,
        },
        true,
      );
    });

    it('should load variables when sorting is chnged', () => {
      component.detailItem = { id: '123', type: ItemType.ProcessInstance };
      component.onSortChanged(mockEvent);

      expect(mockVariableService.getProcessVariablesByFilter).toHaveBeenCalledWith(
        {
          filter: {
            processInstanceIdIn: ['123'],
            sortBy: 'variableName',
            sortOrder: 'asc',
          },
          maxResults: 50,
          firstResult: 0,
        },
        true,
      );
    });

    it('should update columns when reloadNeeded event is received', async () => {
      expect(component.columnDefinitions.map((def) => def.headerName)).toEqual(['Name', 'Type', 'Value', 'Scope', '']);
      mockProcessInstanceService.getProcessInstance.mockReturnValueOnce(of({ id: 'suspended-id', state: 'SUSPENDED' }));
      component.eventBus.reloadNeeded();
      await vi.advanceTimersByTimeAsync(201);
      expect(component.columnDefinitions.map((def) => def.headerName)).toEqual([
        'Name',
        'Type',
        'Value',
        'Scope',
        'Create Time',
      ]);
    });

    it('variable should be undefined when adding a new variable', () => {
      component.data = createMockFluxnovaVariables(1, ['String']);
      component.addNewVariable();

      expect(mockProcessVariableModalService.show).toHaveBeenCalledWith(
        {
          ...component.getModalValues('Add', -1),
          processInstanceActive: true,
          allVariables: component.data,
        },
        { centered: true, modalDialogClass: 'dynamic-modal', size: 'lg' },
      );
    });

    it('should call displayProcessVariableModal when editClicked is called', () => {
      component.data = mockedVariables;
      component.editClicked(1);
      expect(mockProcessVariableModalService.show).toHaveBeenCalledWith(
        {
          variable: mockedVariables[1],
          modalType: 'Edit',
          typeOptions: component.getDropdownTypes(),
          confirmButtonLabel: 'Save',
          allVariables: component.data,
          processInstanceActive: true,
        },
        {
          ...MODAL_DEFAULTS,
          modalDialogClass: 'dynamic-modal',
        },
      );
    });
  });

  describe.each([
    ['unfinished', '123'],
    ['finished', 'completed-instance'],
  ])('column preferences for %s instance', (tabVariant, instanceId) => {
    const itemType = ItemType.ProcessInstance;
    const tab = PimTab.Variables;

    const storageKey = `${itemType}-detail-tab-${tab}-${tabVariant}.listviewstate`.toLowerCase();
    const localStorageMock = {
      getItem: vi.fn((key: string): any => {
        if (key === storageKey)
          return { columnState: [{ colId: 'name', pinned: true, width: 330 }], differentThanDefaults: true };

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

      component.detailItem = { id: instanceId, type: itemType };
    });

    it('should load the column preferences from local storage', () => {
      const listView = new ListViewState([{ colId: 'name', pinned: true, width: 330 }]);

      fixture.detectChanges();

      expect(localStorageMock.getItem).toHaveBeenCalledWith(storageKey);
      expect(component.listViewState?.getColumnStates()).toContainEqual(listView.getColumnStates()[0]);
    });

    it('should save the column preferences to local storage', () => {
      const listView = new ListViewState([{ colId: 'name', pinned: false, width: 330 }]);

      component.columnPrefsUpdated(listView);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        storageKey,
        JSON.stringify({ columnState: listView.getColumnStates(), differentThanDefaults: true }),
      );
    });
  });

  function checkUpdateVariableCalls() {
    mockedVariables.forEach((variable) => {
      expect(mockVariableService.updateProcessVariables).toHaveBeenCalledWith(variable);
    });
    expect(mockVariableService.getProcessVariablesByFilter).toHaveBeenCalledWith(
      {
        filter: {
          processInstanceIdIn: ['123'],
          sortBy: 'variableName',
          sortOrder: 'asc',
        },
        maxResults: 50,
        firstResult: 0,
      },
      true,
    );
  }

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
