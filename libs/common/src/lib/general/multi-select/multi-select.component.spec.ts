import { ElementRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MultiSelectComponent } from './multi-select.component';

describe('MultiSelectComponent', () => {
  let fixture: ComponentFixture<MultiSelectComponent>;
  let component: MultiSelectComponent;
  let mockResizeObserver: {
    observe: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
    unobserve: ReturnType<typeof vi.fn>;
  };
  let capturedResizeCallback: ResizeObserverCallback | undefined;

  const mockOptions = [
    {
      value: 'value1',
      label: 'label1',
    },
    {
      value: 'value2',
      label: 'label2',
    },
  ];
  const mockSelectedArray = mockOptions.slice(0, 1);

  beforeEach(() => {
    mockResizeObserver = { observe: vi.fn(), disconnect: vi.fn(), unobserve: vi.fn() };
    vi.stubGlobal(
      'ResizeObserver',
      vi.fn().mockImplementation(function (callback: ResizeObserverCallback) {
        capturedResizeCallback = callback;
        return mockResizeObserver;
      }),
    );

    TestBed.configureTestingModule({
      imports: [NgSelectModule, FormsModule],
      declarations: [MultiSelectComponent],
    });
    fixture = TestBed.createComponent(MultiSelectComponent);
    component = fixture.componentInstance;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('should emit multiSelectionChange on remove item', () => {
    const mockEventEmitter = {
      emit: vi.fn(),
    };
    component.multiSelectionChange = mockEventEmitter as any;
    component.options = mockOptions;
    component.selectedArray = mockOptions;
    component.removeSelectItem(mockOptions[1]);
    expect(mockEventEmitter.emit).toHaveBeenCalledWith(mockSelectedArray);
  });

  it('should update number of displayed items on selected Array change', () => {
    component.options = mockOptions;
    component.selectedArray = mockSelectedArray;
    component.selectedDisplay = new ElementRef<any>({
      parentElement: { offsetWidth: 200 },
      children: [{ clientWidth: 75 }],
    });
    expect(component.numberOfLabelsToDisplay).toEqual(0);
    component.updateNumberOfDisplayedItems();
    vi.runAllTimers();
    expect(component.numberOfLabelsToDisplay).toEqual(1);
  });

  it('should hide all of selected labels if none will fit in parent select container', () => {
    component.options = mockOptions;
    component.selectedArray = mockOptions;
    component.selectedDisplay = new ElementRef<any>({
      parentElement: { offsetWidth: 150 },
      children: [{ clientWidth: 100 }, { clientWidth: 75 }],
    });
    expect(component.numberOfLabelsToDisplay).toEqual(0);
    component.updateNumberOfDisplayedItems();
    vi.runAllTimers();
    expect(component.numberOfLabelsToDisplay).toEqual(0);
  });

  it('should set maxSelectedItems on the ngSelect component', () => {
    component.maxSelectedItems = 12;
    fixture.detectChanges();
    expect(component.ngSelect?.maxSelectedItems()).toEqual(12);
  });

  it('should observe the ngSelect element for resize after view init and call updateNumberOfDisplayedItems when resized', () => {
    const updateSpy = vi.spyOn(component, 'updateNumberOfDisplayedItems');
    fixture.detectChanges();

    expect(mockResizeObserver.observe).toHaveBeenCalledWith(component.ngSelect?.element);

    // this simulates a resize event from the browser
    expect(capturedResizeCallback).toBeDefined();
    capturedResizeCallback?.([], {} as ResizeObserver);
    vi.runAllTimers(); // flush 200ms debounce

    expect(updateSpy).toHaveBeenCalled();
  });
});
