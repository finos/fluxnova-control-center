import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { TooltipInfoModalComponent } from './tooltip-info-modal.component';

describe('TooltipInfoModalComponent', () => {
  let component: TooltipInfoModalComponent;
  let fixture: ComponentFixture<TooltipInfoModalComponent>;

  const mockModal = { close: vi.fn() };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TooltipInfoModalComponent],
      providers: [{ provide: NgbActiveModal, useValue: mockModal }],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(TooltipInfoModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
