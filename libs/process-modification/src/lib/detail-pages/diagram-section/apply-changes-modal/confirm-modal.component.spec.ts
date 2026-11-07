import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PermissionService } from '@fxn/common/src/lib/services/permission.service';
import { ActionPermissionsSpec } from '@fxn/types';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
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
      schemas: [NO_ERRORS_SCHEMA],
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

  it('has enabled continue button when user has permission to delete', async () => {
    mockPermissionService.meetsPermissionSpecification.mockResolvedValue(true);

    buildComponent();
    component.options = { willTerminate: true };
    // Await permission resolution before the first render so the view reflects the granted permission.
    await component.ngOnInit();
    fixture.detectChanges();

    expect(mockPermissionService.meetsPermissionSpecification).toHaveBeenCalledWith(
      ActionPermissionsSpec.TerminateProcessInstance,
    );
    expect(nativeElement.querySelector<HTMLButtonElement>('.modal-footer button:last-of-type')?.disabled).toBe(false);
  });

  it('has disabled continue button when user does not have permission to delete', async () => {
    mockPermissionService.meetsPermissionSpecification.mockResolvedValueOnce(false);

    buildComponent();
    component.options = { willTerminate: true };
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(nativeElement.querySelector<HTMLButtonElement>('.modal-footer button:last-of-type')?.disabled).toBe(true);
  });

  it('displays expected message when they do not have permission to delete', async () => {
    mockPermissionService.meetsPermissionSpecification.mockResolvedValueOnce(false);

    buildComponent();
    component.options = { willTerminate: true };
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(nativeElement.querySelector('.warning')?.textContent?.includes('Insufficient Permissions')).toBe(true);
  });
});
