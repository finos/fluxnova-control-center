import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import { Toast, ToastType } from '../../services/toast.service';
import { ToastContainerComponent } from './toast-container.component';

describe('ToastContainerComponent', () => {
  let component: ToastContainerComponent;
  let fixture: ComponentFixture<ToastContainerComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ToastContainerComponent],
      imports: [NgbToastModule],
    });

    fixture = TestBed.createComponent(ToastContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should detect if it is passed a string', () => {
    expect(component.isTemplate('hello')).toBe(false);
  });

  it('should animate a toast on removal', () => {
    vi.useFakeTimers();

    const toast: Toast = {
      info: '',
      options: {
        type: ToastType.info,
        borderCls: 'toast-border-info',
        textColor: 'text-info',
        icon: 'fa-info-circle',
      },
    };
    component.toastService.toasts = [toast];

    component.removeAnim(toast);
    vi.advanceTimersByTime(1000);

    expect(component.toastService.toasts.length).toEqual(0);
  });
});
