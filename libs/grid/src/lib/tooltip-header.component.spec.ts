import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TooltipHeaderComponent } from './tooltip-header.component';

describe('tooltip header component', () => {
  let fixture: ComponentFixture<TooltipHeaderComponent>;
  let component: TooltipHeaderComponent;

  const mockInitParams = {
    column: {
      addEventListener: vi.fn(),
      isSortAscending: vi.fn(),
      isSortDescending: vi.fn(),
      isFilterActive: vi.fn(),
    },
    showColumnMenu: vi.fn(),
    setSort: vi.fn(),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TooltipHeaderComponent],
    });
    fixture = TestBed.createComponent(TooltipHeaderComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.resetAllMocks();
    TestBed.resetTestingModule();
  });

  it('should exist', () => {
    expect(component).toBeTruthy();
  });

  it('should attempt to init', () => {
    component.agInit(mockInitParams as any);
    expect(component.params).toEqual(mockInitParams);
    expect(mockInitParams.column.addEventListener).toHaveBeenCalledTimes(2);
    expect(mockInitParams.column.addEventListener).toHaveBeenNthCalledWith(1, 'sortChanged', expect.any(Function));
    expect(mockInitParams.column.addEventListener).toHaveBeenNthCalledWith(2, 'filterChanged', expect.any(Function));
  });

  it('should recognize when a column has no sorting', () => {
    component.agInit(mockInitParams as any);
    expect(component.ascSort).toEqual('inactive');
    expect(component.descSort).toEqual('inactive');
    expect(component.noSort).toEqual('active');
  });

  it('should recognize when a column is sorted ascending', () => {
    mockInitParams.column.isSortAscending.mockReturnValue(true);
    component.agInit(mockInitParams as any);
    expect(component.ascSort).toEqual('active');
    expect(component.descSort).toEqual('inactive');
    expect(component.noSort).toEqual('inactive');
  });

  it('should recognize when a column is sorted descending', () => {
    mockInitParams.column.isSortDescending.mockReturnValue(true);
    component.agInit(mockInitParams as any);
    expect(component.ascSort).toEqual('inactive');
    expect(component.descSort).toEqual('active');
    expect(component.noSort).toEqual('inactive');
  });

  it('should recognize when a column filter changes', () => {
    mockInitParams.column.isFilterActive.mockReturnValue(true);
    component.agInit(mockInitParams as any);
    component.onFilterChanged();
    expect(component.eFilter).toEqual('active');
    mockInitParams.column.isFilterActive.mockReturnValue(false);
    component.onFilterChanged();
    expect(component.eFilter).toEqual('inactive');
  });

  it('should change to asc sort when no sort is set and a sort change is requested', () => {
    component.agInit(mockInitParams as any);
    component.onSortRequested({} as any);
    expect(mockInitParams.setSort).toHaveBeenCalledTimes(1);
    expect(mockInitParams.setSort).toHaveBeenCalledWith('asc', undefined);
  });

  it('should change to desc sort when asc sort is set and a sort change is requested', () => {
    mockInitParams.column.isSortAscending.mockReturnValue(true);
    component.agInit(mockInitParams as any);
    component.onSortRequested({} as any);
    expect(mockInitParams.setSort).toHaveBeenCalledTimes(1);
    expect(mockInitParams.setSort).toHaveBeenCalledWith('desc', undefined);
  });

  it('should change to no sort when desc sort is set and a sort change is requested', () => {
    mockInitParams.column.isSortDescending.mockReturnValue(true);
    component.agInit(mockInitParams as any);
    component.onSortRequested({} as any);
    expect(mockInitParams.setSort).toHaveBeenCalledTimes(1);
    expect(mockInitParams.setSort).toHaveBeenCalledWith(null, undefined);
  });
});
