import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IconComponent, MultiSelectComponent } from '@fxn/common';
import { Subject } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MultiSelectFloatingFilterComponent } from './multi-select-floating-filter.component';

describe('MultiSelectFloatingFilterComponent', () => {
  let component: MultiSelectFloatingFilterComponent;
  let fixture: ComponentFixture<MultiSelectFloatingFilterComponent>;

  const filterString = 'task def name';
  const mockParams = {
    api: {
      setFilterModel: vi.fn(),
      getFilterModel: vi.fn(),
      addEventListener: vi.fn(),
    },
    column: {
      getColId: () => 'taskDefinitionName',
      getColDef: vi.fn(
        () =>
          ({
            filterParams: { isMultiselect: true, comparators: ['multi', 'contains'], maxSelectedItems: 4 },
          }) as any,
      ),
    },
  };

  const mockRoute = {
    queryParams: new Subject<any>(),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MultiSelectFloatingFilterComponent, MultiSelectComponent, IconComponent],
      providers: [{ provide: ActivatedRoute, useValue: mockRoute }],
    });

    fixture = TestBed.createComponent(MultiSelectFloatingFilterComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should attempt to update the Ag-Grid filter model', () => {
    const currentModel = { type: 'inclusive' };
    const expected = {
      ...currentModel,
      taskDefinitionName: {
        filterType: 'stringifiedArray',
        filter: JSON.stringify([filterString]),
        type: 'multi',
      },
    };
    mockParams.api.getFilterModel.mockReturnValue(currentModel);
    component.agInit(mockParams as any);
    component.updateSelectedItems([{ value: filterString, label: filterString }]);
    expect(mockParams.api.setFilterModel).toHaveBeenCalledTimes(1);
    expect(mockParams.api.setFilterModel).toHaveBeenCalledWith(expected);
  });

  it('should update comparator and set filter model', () => {
    const currentModel = { type: 'inclusive' };
    const defaultType = 'multi';
    const type = 'contains';
    const expected = {
      ...currentModel,
      taskDefinitionName: {
        filterType: 'stringifiedArray',
        filter: JSON.stringify([filterString]),
        type: type,
      },
    };
    mockParams.api.getFilterModel.mockReturnValue(currentModel);
    component.agInit(mockParams as any);
    expect(component.currentFilterComparator).toEqual(defaultType);
    component.selectedItemsString = JSON.stringify([filterString]);
    component.updateCurrentFilterComparator(type);
    expect(mockParams.api.setFilterModel).toHaveBeenCalledWith(expected);
  });

  it('should react to an outside change to the filter', () => {
    component.onParentModelChanged({ filter: JSON.stringify([filterString]) });
    expect(component.selectedItemsString).toEqual(JSON.stringify([filterString]));
    component.onParentModelChanged(null as any);
    expect(component.selectedItemsString).toEqual(undefined);
  });

  it('should sanitize filter and reset item options', () => {
    const unsanitizedFilter = JSON.stringify(['one', 'One', 'TWO', ' three!', '', '4']);
    const expectedSanitizedFilterArray = [
      { label: 'one', value: 'one' },
      { label: 'One', value: 'One' },
      { label: 'TWO', value: 'TWO' },
      { label: 'three!', value: 'three!' },
      { label: '4', value: '4' },
    ];
    component.presetMultiFilterOptions = undefined;
    component.allowAddNewItems = true;
    component.itemOptions = undefined;
    component.onParentModelChanged({ filter: unsanitizedFilter });
    expect(component.selectedItemsArray).toEqual(expectedSanitizedFilterArray);
    expect(component.itemOptions).toEqual(expectedSanitizedFilterArray);
  });

  it('should NOT sanitize filter and reset item options', () => {
    const unsanitizedFilter = JSON.stringify(['one', 'One', 'TWO', ' three!', '', '4']);
    const expectedSanitizedFilterArray = [
      { label: 'one', value: 'one' },
      { label: 'One', value: 'One' },
      { label: 'TWO', value: 'TWO' },
      { label: ' three!', value: ' three!' },
      { label: '', value: '' },
      { label: '4', value: '4' },
    ];
    component.presetMultiFilterOptions = undefined;
    component.allowAddNewItems = true;
    component.disableSanitize = true;
    component.itemOptions = undefined;
    component.onParentModelChanged({ filter: unsanitizedFilter });
    expect(component.selectedItemsArray).toEqual(expectedSanitizedFilterArray);
    expect(component.itemOptions).toEqual(expectedSanitizedFilterArray);
  });

  it('should sanitize a string filter and reset item options', () => {
    const unsanitizedFilter = 'filter STRING ';
    const expectedSanitizedFilterArray = [{ label: 'filter STRING', value: 'filter STRING' }];
    component.presetMultiFilterOptions = undefined;
    component.allowAddNewItems = true;
    component.itemOptions = undefined;
    component.onParentModelChanged({ filter: unsanitizedFilter });
    expect(component.selectedItemsArray).toEqual(expectedSanitizedFilterArray);
    expect(component.itemOptions).toEqual(expectedSanitizedFilterArray);
  });

  it('should honor the maxSelectedItems configuration', () => {
    component.agInit(mockParams as any);
    expect(component.maxSelectedItems).toEqual(4);
  });

  it('should update filter comparator to multi if the input has a comma', () => {
    component.agInit(mockParams as any);
    component.updateCurrentFilterComparator('contains');
    component.updateSelectedItems([
      { value: 'firstItem,secondItem,ThirdItem', label: 'firstItem,secondItem,ThirdItem' },
    ]);
    expect(component.currentFilterComparator).toEqual('multi');
  });
});
