import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IconComponent, MultiSelectComponent } from '@fxn/common';
import { Observable, of } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DefaultFloatingFilterComponent } from './default-floating-filter.component';

describe('DefaultFloatingFilterComponent', () => {
  const mockRouter = {
    navigate: vi.fn(),
    events: of({}),
  };

  const mockRoute: { queryParams: Observable<any> } = {
    queryParams: of({
      toggleFilters: 'latestVersion',
    }),
  };

  let component: DefaultFloatingFilterComponent;
  let fixture: ComponentFixture<DefaultFloatingFilterComponent>;

  const filterString = 'task def name';
  const mockParams: any = {
    api: {
      setFilterModel: vi.fn(),
      getFilterModel: vi.fn(),
      addEventListener: vi.fn(),
    },
    column: {
      getColId: () => 'taskDefinitionName',
      getColDef: () => ({
        filterParams: {
          filterFormat: 'text',
          isMultiselect: false,
          comparators: ['contains', 'notContains'],
          maxSelectedItems: 4,
        },
      }),
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DefaultFloatingFilterComponent, MultiSelectComponent, IconComponent],
      providers: [
        { provide: ActivatedRoute, useValue: mockRoute },
        { provide: Router, useValue: mockRouter },
      ],
    });

    fixture = TestBed.createComponent(DefaultFloatingFilterComponent);
    component = fixture.componentInstance;
  });

  it('should attempt to update the Ag-Grid filter model', () => {
    const currentModel = { type: 'inclusive' };
    const expected = {
      ...currentModel,
      taskDefinitionName: {
        filter: filterString,
        type: 'contains',
      },
    };
    mockParams.api.getFilterModel.mockReturnValue(currentModel);
    component.agInit(mockParams);
    component.currentFilter = filterString;
    component.updateFilterModel();
    expect(mockParams.api.setFilterModel).toHaveBeenCalledTimes(1);
    expect(mockParams.api.setFilterModel).toHaveBeenCalledWith(expected);
  });

  it('should update comparator and set filter model', () => {
    const currentModel = { type: 'inclusive' };
    const defaultType = 'contains';
    const type = 'notContains';
    const expected = {
      ...currentModel,
      taskDefinitionName: {
        filter: filterString,
        type: type,
      },
    };
    mockParams.api.getFilterModel.mockReturnValue(currentModel);
    component.agInit(mockParams);

    expect(component.currentFilterComparator).toEqual(defaultType);
    component.currentFilter = filterString;
    component.updateCurrentFilterComparator(type);
    expect(component.currentFilterComparator).toEqual(type);
    expect(mockParams.api.setFilterModel).toHaveBeenCalledWith(expected);
  });

  it('should react to an outside change to the filter', () => {
    component.onParentModelChanged({ filter: filterString });
    expect(component.currentFilter).toEqual(filterString);
    component.onParentModelChanged(null as any);
    expect(component.currentFilter).toEqual(undefined);
  });

  it('clears filter input and updates the model', () => {
    component.agInit(mockParams);
    component.currentFilter = 'string';
    component.clear();
    expect(component.currentFilter).toBe(undefined);
    expect(mockParams.api.setFilterModel).toHaveBeenCalledWith({
      taskDefinitionName: null,
      type: 'inclusive',
    });
  });

  it('should set input type for based on col def type', () => {
    component.agInit(mockParams);
    expect(component.filterFormat).toEqual('text');
    const mockNumberParams: any = {
      ...mockParams,
      column: {
        getColId: () => 'priority',
        getColDef: () => ({
          filterParams: {
            filterFormat: 'number',
            filterKeyByComparator: {
              lessThan: 'priorityLowerThanOrEquals',
              greaterThan: 'priorityHigherThanOrEquals',
            },
            comparators: ['lessThan', 'greaterThan'],
            maxSelectedItems: 4,
          },
        }),
      },
    };
    component.agInit(mockNumberParams);
    expect(component.filterFormat).toEqual('number');
  });
});
