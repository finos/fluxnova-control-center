import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { PermissionService } from '@fxn/common/src/lib/services/permission.service';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { describe, expect, it, vi } from 'vitest';
import { ApplyChangesConfirmModalComponent } from './confirm-modal.component';

describe('Confirm Modal Component', () => {
  let fixture: ComponentFixture<ApplyChangesConfirmModalComponent>;
  let component: ApplyChangesConfirmModalComponent;
  let nativeElement: HTMLElement;

  const mockNgbActiveModal = {
    close: vi.fn(),
  };
  const mockPermissionService = {
    meetsPermissionSpecification: vi.fn(),
  };

  const buildComponent = () => {
    TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        { provide: NgbActiveModal, useValue: mockNgbActiveModal },
        { provide: PermissionService, useValue: mockPermissionService },
      ],
      declarations: [ApplyChangesConfirmModalComponent],
    });

    fixture = TestBed.createComponent(ApplyChangesConfirmModalComponent);
    component = fixture.componentInstance;
    nativeElement = fixture.nativeElement;
  };

  beforeEach(() => vi.useFakeTimers());

  afterEach(() => vi.useRealTimers());

  it('has enabled continue button when user has permission to delete', async () => {
    mockPermissionService.meetsPermissionSpecification.mockResolvedValueOnce(true);

    buildComponent();
    component.options = { willTerminate: true };
    component.ngOnInit();

    await vi.runAllTimersAsync();

    fixture.detectChanges();

    expect(nativeElement.querySelector<HTMLButtonElement>('.modal-footer button:last-of-type')?.disabled).toBe(false);
  });

  it('has disabled continue button when user does not have permission to delete', async () => {
    mockPermissionService.meetsPermissionSpecification.mockResolvedValueOnce(false);

    buildComponent();
    component.options = { willTerminate: true };
    component.ngOnInit();

    await vi.runAllTimersAsync();

    fixture.detectChanges();

    expect(nativeElement.querySelector<HTMLButtonElement>('.modal-footer button:last-of-type')?.disabled).toBe(true);
  });

  it('displays expected message when they do not have permission to delete', async () => {
    mockPermissionService.meetsPermissionSpecification.mockResolvedValueOnce(false);

    buildComponent();
    component.options = { willTerminate: true };
    component.ngOnInit();

    await vi.runAllTimersAsync();

    fixture.detectChanges();

    expect(nativeElement.querySelector('.warning')?.textContent?.includes('Insufficient Permissions')).toBe(true);
  });
});
