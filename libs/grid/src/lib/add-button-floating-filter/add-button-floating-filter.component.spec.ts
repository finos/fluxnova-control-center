import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IFilterParams } from 'ag-grid-community';
import { IconComponent } from '@fxn/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AddButtonFloatingFilterComponent } from './add-button-floating-filter.component';

describe('AddButtonFloatingFilterComponent', () => {
  let component: AddButtonFloatingFilterComponent;
  let fixture: ComponentFixture<AddButtonFloatingFilterComponent>;

  const mockParams = {
    context: { componentParent: { addNewVariable: vi.fn() } },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AddButtonFloatingFilterComponent, IconComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AddButtonFloatingFilterComponent);
    component = fixture.componentInstance;
    component.agInit(mockParams as IFilterParams);
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should invoke the addNewVariable method on parent component', () => {
    component.addButtonClicked();
    expect(mockParams.context.componentParent.addNewVariable).toHaveBeenCalled();
  });
});
