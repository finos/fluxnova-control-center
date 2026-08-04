import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { GeneralModule } from '@fxn/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HeatmapSettingsModalComponent } from './heatmap-settings-modal.component';

describe('HeatmapSettingsModalComponent', () => {
  let component: HeatmapSettingsModalComponent;
  let fixture: ComponentFixture<HeatmapSettingsModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, GeneralModule],
      declarations: [HeatmapSettingsModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HeatmapSettingsModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have initial isOpen value of false', () => {
    expect(component.contentState.isOpen).toBeFalsy();
  });

  it('should have viewByOptions with correct values', () => {
    expect(component.viewByOptions.length).toBe(2);
    expect(component.viewByOptions[0]).toEqual({ label: 'Time Spent', value: 'timeSpent' });
    expect(component.viewByOptions[1]).toEqual({ label: 'Quantity', value: 'quantity' });
  });

  it('should have timelineOptions with correct values', () => {
    expect(component.timelineOptions.length).toBe(5);
    expect(component.timelineOptions[0].value).toBe('pastDay');
    expect(component.timelineOptions[1].value).toBe('pastWeek');
    expect(component.timelineOptions[2].value).toBe('pastMonth');
    expect(component.timelineOptions[3].value).toBe('pastQuarter');
    expect(component.timelineOptions[4].value).toBe('pastYear');
  });

  it('should have correct initial selected options', () => {
    expect(component.selectedViewByOption).toBe('timeSpent');
    expect(component.selectedTimelineOption).toBe('pastMonth');
  });

  it('should toggle isOpen property when ToggleOpen is called', () => {
    expect(component.contentState.isOpen).toBeFalsy();

    component.toggleOpen();
    expect(component.contentState.isOpen).toBeTruthy();

    component.toggleOpen();
    expect(component.contentState.isOpen).toBeFalsy();
  });

  describe('handleClickOutside', () => {
    let mockModalElement: HTMLElement;
    let outsideElement: HTMLElement;
    let dropdownElement: HTMLElement;
    let originalQuerySelector: (selector: string) => Element | null;

    beforeEach(() => {
      mockModalElement = document.createElement('div');
      outsideElement = document.createElement('div');
      dropdownElement = document.createElement('div');

      // @ts-expect-error ElementRef is not a real element, but we need to mock it
      component['elRef'] = { nativeElement: mockModalElement };

      originalQuerySelector = document.querySelector;
      vi.spyOn(document, 'querySelector').mockImplementation((selector: string) => {
        if (selector === '.ng-dropdown-panel') {
          return dropdownElement;
        }
        return null;
      });

      vi.spyOn(component, 'toggleOpen');
    });

    afterEach(() => {
      document.querySelector = originalQuerySelector;
      vi.restoreAllMocks();
    });

    it('should close modal when clicking outside', () => {
      component.contentState.isOpen = true;
      component.handleClickOutside(outsideElement);
      expect(component.toggleOpen).toHaveBeenCalled();
    });

    it('should not close modal when clicking inside', () => {
      component.contentState.isOpen = true;
      vi.spyOn(mockModalElement, 'contains').mockReturnValue(true);
      component.handleClickOutside(mockModalElement);
      expect(component.toggleOpen).not.toHaveBeenCalled();
    });

    it('should not close modal when clicking on dropdown', () => {
      component.contentState.isOpen = true;
      const dropdownChildElement = document.createElement('div');
      vi.spyOn(dropdownElement, 'contains').mockReturnValue(true);
      component.handleClickOutside(dropdownChildElement);
      expect(component.toggleOpen).not.toHaveBeenCalled();
    });

    it('should not toggle when modal is already closed', () => {
      component.contentState.isOpen = false;
      component.handleClickOutside(outsideElement);
      expect(component.toggleOpen).not.toHaveBeenCalled();
    });
  });

  describe('onTabAnimationEnd', () => {
    it('should emit closeComplete when heatmapDeactivating is true', () => {
      component.heatmapDeactivating = true;
      const emitSpy = vi.spyOn(component.closeComplete, 'emit');

      component.onTabAnimationEnd();

      expect(emitSpy).toHaveBeenCalled();
    });

    it('should not emit closeComplete when heatmapDeactivating is false', () => {
      component.heatmapDeactivating = false;
      const emitSpy = vi.spyOn(component.closeComplete, 'emit');

      component.onTabAnimationEnd();

      expect(emitSpy).not.toHaveBeenCalled();
    });
  });
});
