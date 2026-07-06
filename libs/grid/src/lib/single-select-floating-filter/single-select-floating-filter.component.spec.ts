import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProcessInstanceStatesMap } from '@fxn/types';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SingleSelectFloatingFilterComponent } from './single-select-floating-filter.component';

describe('SingleFloatingFilterComponent', () => {
  let component: SingleSelectFloatingFilterComponent;
  let fixture: ComponentFixture<SingleSelectFloatingFilterComponent>;

  const mockRoute = {
    queryParams: of({
      toggleFilters: 'cool',
    }),
  };

  const selectedItem = { label: ProcessInstanceStatesMap.ACTIVE.value, value: 'active' };
  const mockParams = {
    api: {
      setFilterModel: vi.fn(),
      getFilterModel: vi.fn(),
      addEventListener: vi.fn(),
    },
    column: {
      getColId: () => 'state',
      getColDef: vi.fn(() => ({
        filterParams: {},
      })),
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: ActivatedRoute, useValue: mockRoute }],
      declarations: [SingleSelectFloatingFilterComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    });

    fixture = TestBed.createComponent(SingleSelectFloatingFilterComponent);
    component = fixture.componentInstance;
  });

  it('should notify Ag-Grid when the select item changes', () => {
    const currentModel = { type: 'random' };
    const expected = {
      ...currentModel,
      state: {
        filterType: 'select',
        filter: 'active',
        type: 'equals',
      },
    };
    mockParams.api.getFilterModel.mockReturnValue(currentModel);
    component.agInit(mockParams as any);
    component.updateSelectedItem(selectedItem);
    expect(mockParams.api.setFilterModel).toHaveBeenCalledTimes(1);
    expect(mockParams.api.setFilterModel).toHaveBeenCalledWith(expected);
  });

  it('should return an Ag-Grid filter model if a selected item is set', () => {
    const expected = { filterType: 'select', filter: 'active', type: 'equals' };
    component.selectedItemsString = selectedItem.value;
    const result = component.getModel();
    expect(result).toEqual(expected);
  });

  it('should not return an Ag-Grid filter model if no selected item is set', () => {
    component.selectedItemsString = undefined;
    const result = component.getModel();
    expect(result).toBeNull();
  });

  it('should report the filter as active if a user id is set', () => {
    component.selectedItemsString = selectedItem.value;
    const result = component.isFilterActive();
    expect(result).toBeTruthy();
  });

  it('should report the filter as inactive if a user id is not set', () => {
    component.selectedItemsString = undefined;
    const result = component.isFilterActive();
    expect(result).toBeFalsy();
  });

  it('should accept a pre-existing filter', () => {
    const selectedState = 'completed';
    const model = { filter: selectedState, type: 'equals' };
    component.agInit(mockParams as any);
    component.setModel(model);
    expect(component.selectedItemsString).toEqual(selectedState);

    component.setModel(null as any);
    expect(component.selectedItemsString).toBeUndefined();
  });

  it('should set selectedItemsString to undefined', () => {
    component.selectedItemsString = 'before';
    component.updateSelectedItem(undefined as any);
    expect(component.selectedItemsString).toEqual(undefined);
  });

  it('should update selectedItemsString onParentModelChanged', () => {
    component.selectedItemsString = 'before';
    component.onParentModelChanged({ filter: 'after' });
    expect(component.selectedItemsString).toEqual('after');
  });
});
