import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { SubSink } from 'subsink';
import { IFilterParams } from 'ag-grid-community';
import { FilterDisable } from '@fxn/types/src';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DynamicallyDisabledFilterComponent } from './dynamically-disabled-filter.component';

vi.mock('subsink');

describe('DefaultFloatingFilterComponent', () => {
  const mockRoute = {
    queryParams: {
      subscribe: vi.fn(),
    },
  };
  const mockParams = {
    api: {
      addEventListener: vi.fn(),
      getColumnFilterModel: vi.fn(),
    },
    column: {
      getColDef: vi.fn().mockReturnValue({}),
    },
  };
  let mockSubSink: vi.MockedObjectDeep<SubSink>;

  let component: DynamicallyDisabledFilterComponent;
  let fixture: ComponentFixture<DynamicallyDisabledFilterComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DynamicallyDisabledFilterComponent],
      providers: [{ provide: ActivatedRoute, useValue: mockRoute }],
    });

    fixture = TestBed.createComponent(DynamicallyDisabledFilterComponent);
    component = fixture.componentInstance;
    mockSubSink = vi.mocked(component.subSink);
  });

  afterEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  describe('constructor', () => {
    it('creates instance with expected defaults', () => {
      expect(component.params).toBeUndefined();
      expect(component.subSink).toBeInstanceOf(SubSink);
      expect(component.tooltipText).toBe('');
      expect(component.disabledByQueryParams).toEqual([]);
      expect(component.disabledByGridFilters).toEqual([]);
    });
  });

  describe('isDisabled getter', () => {
    it('returns true when both or either disabled arrays have items, and false if neither do', () => {
      expect(component.isDisabled).toBe(false);

      component.disabledByQueryParams.push({ field: 'test-field', displayName: 'Test Field' });
      expect(component.isDisabled).toBe(true);

      component.disabledByGridFilters.push({ field: 'test-field', displayName: 'Test Field' });
      expect(component.isDisabled).toBe(true);

      component.disabledByQueryParams.pop();
      expect(component.isDisabled).toBe(true);

      component.disabledByGridFilters.pop();
      expect(component.isDisabled).toBe(false);
    });
  });

  describe('colDef getter', () => {
    it('returns the column definition in the params object', () => {
      component.agInit(mockParams as unknown as IFilterParams);
      const colDef = component.colDef;

      expect(mockParams.column.getColDef).toHaveBeenCalled();
      expect(colDef).toEqual({});
    });
  });

  describe('tooltipText getter', () => {
    it('returns string that joins display names when there are mulitple disabling filters', () => {
      component.disabledByGridFilters = [
        { field: 'test-field-1', displayName: 'Test Field 1' },
        { field: 'test-field-2', displayName: 'Test Field 2' },
      ];
      component.disabledByQueryParams = [
        { field: 'test-field-3', displayName: 'Test Field 3' },
        { field: 'test-field-4', displayName: 'Test Field 4' },
      ];

      expect(component.tooltipText).toBe(
        'Disabled while Test Field 1, Test Field 2, Test Field 3, Test Field 4 filters are in use',
      );
    });

    it('returns string with filter display name when there is just one disabling filter', () => {
      component.disabledByGridFilters = [{ field: 'test-field-1', displayName: 'Test Field 1' }];

      expect(component.tooltipText).toBe('Disabled while Test Field 1 filter is in use');
    });

    it('returns empty string when there are no disabling filters', () => {
      expect(component.tooltipText).toBe('');
    });
  });

  describe('agInit', () => {
    it('sets the params', () => {
      component.agInit(mockParams as unknown as IFilterParams);

      expect(component.params).toBe(mockParams);
    });

    it('adds event listener for filterChanged event', () => {
      mockParams.column.getColDef.mockReturnValueOnce({
        context: {
          disabledByFilters: [{ field: 'testField' }],
        },
      });
      mockParams.api.getColumnFilterModel.mockReturnValueOnce('test-filter-model');

      component.agInit(mockParams as unknown as IFilterParams);

      const [eventType, callback] = mockParams.api.addEventListener.mock.calls[0];
      expect(eventType).toBe('filterChanged');

      callback();

      expect(component.isDisabled).toBe(true);
    });

    it('adds a subscription to the queryParams observable', () => {
      mockParams.column.getColDef.mockReturnValueOnce({
        context: {
          disabledByQueryParams: [{ field: 'testField' }],
        },
      });
      const subscription = {};
      mockRoute.queryParams.subscribe.mockReturnValueOnce(subscription);

      component.agInit(mockParams as unknown as IFilterParams);

      expect(mockSubSink.add).toHaveBeenCalledWith(subscription);

      const [observer] = mockRoute.queryParams.subscribe.mock.calls[0];
      observer({ toggleFilters: 'testField' });

      expect(component.isDisabled).toBe(true);
    });
  });

  describe('ngOnDestroy', () => {
    it('unsubscribes from subscriptions', () => {
      component.ngOnDestroy();

      expect(mockSubSink.unsubscribe).toHaveBeenCalled();
    });
  });

  describe('onQueryParamsNext', () => {
    const filterDisable: FilterDisable = { field: 'testField', displayName: 'Test Field' };

    beforeEach(() => {
      mockParams.column.getColDef.mockReturnValueOnce({
        context: {
          disabledByQueryParams: [filterDisable],
        },
      });
      component.agInit(mockParams as unknown as IFilterParams);
    });

    it('sets disabledByQueryParams and tooltipText when query params disabling toggle filter is set', () => {
      component.onQueryParamsNext({ toggleFilters: `someOtherField,${filterDisable.field}` });

      expect(component.disabledByQueryParams).toEqual([filterDisable]);
      expect(component.tooltipText).toBe(`Disabled while ${filterDisable.displayName} filter is in use`);
    });

    it('does not set disabledByQueryParams and tooltipText when query params disabling filter is not set', () => {
      component.onQueryParamsNext({
        toggleFilters: 'someNonDisablingField',
      });

      expect(component.disabledByQueryParams).toEqual([]);
      expect(component.tooltipText).toBe('');
    });
  });

  describe('onOtherFilterChanged', () => {
    const filterDisable: FilterDisable = { field: 'testField', displayName: 'Test Field' };

    beforeEach(() => {
      mockParams.column.getColDef.mockReturnValueOnce({
        context: {
          disabledByFilters: [filterDisable],
        },
      });
      component.agInit(mockParams as unknown as IFilterParams);
    });

    it('should set disabledByGridFilters and tooltipText when disabling other grid filters are set', () => {
      mockParams.api.getColumnFilterModel.mockReturnValueOnce('test-filter-model');

      component.onOtherFilterChanged();

      expect(mockParams.api.getColumnFilterModel).toHaveBeenCalledWith(filterDisable.field);
      expect(component.disabledByGridFilters).toEqual([filterDisable]);
      expect(component.tooltipText).toBe(`Disabled while ${filterDisable.displayName} filter is in use`);
    });

    it('should not set disabledByGridFilters and tooltipText when disabling other grid filters are not set', () => {
      mockParams.api.getColumnFilterModel.mockReturnValueOnce(null);

      component.onOtherFilterChanged();

      expect(mockParams.api.getColumnFilterModel).toHaveBeenCalledWith(filterDisable.field);
      expect(component.disabledByGridFilters).toEqual([]);
      expect(component.tooltipText).toBe('');
    });
  });
});
