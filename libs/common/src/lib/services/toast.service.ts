import { Injectable, TemplateRef } from '@angular/core';
import { remove } from 'lodash-es';

export enum ToastType {
  primary,
  secondary,
  success,
  info,
  warning,
  danger,
  dark,
  light,
}

export interface Toast {
  info: string | TemplateRef<any>;
  shouldShowDetails?: boolean;
  options?: ToastOptions;
}

interface ToastOptions {
  autoHide?: boolean;
  type?: ToastType;
  header?: string;
  delay?: number;
  icon?: string;
  borderCls?: string;
  textColor?: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  isEnabled = true;
  toasts: Toast[] = [];

  disable() {
    this.isEnabled = false;
  }

  show(info: string | TemplateRef<any>, options: ToastOptions = {}) {
    if (this.isEnabled) {
      const toast = { info, options };
      switch (options.type) {
        case ToastType.danger:
          toast.options.borderCls = 'toast-border-danger';
          toast.options.icon = 'warning';
          toast.options.textColor = 'text-danger';
          toast.options.header = 'Error';
          break;
        case ToastType.warning:
          toast.options.borderCls = 'toast-border-warning';
          toast.options.icon = 'warning';
          toast.options.textColor = 'text-warning';
          toast.options.header = 'Warning';
          break;
        case ToastType.success:
          toast.options.borderCls = 'toast-border-success';
          toast.options.icon = 'success';
          toast.options.textColor = 'text-success';
          toast.options.header = 'Success';
          break;
        case ToastType.info:
          toast.options.borderCls = 'toast-border-info';
          toast.options.icon = 'info-outline';
          toast.options.textColor = 'text-info';
      }
      this.toasts.push(toast);
    }
  }

  error(error: string | TemplateRef<any>, options: ToastOptions = {}) {
    this.show(error, { type: ToastType.danger, autoHide: false, ...options });
  }

  warning(info: string | TemplateRef<any>, options: ToastOptions = {}) {
    this.show(info, { type: ToastType.warning, autoHide: true, ...options });
  }

  success(info: string | TemplateRef<any>, options: ToastOptions = {}) {
    this.show(info, { type: ToastType.success, autoHide: true, ...options });
  }

  info(info: string | TemplateRef<any>, options: ToastOptions = {}) {
    this.show(info, { type: ToastType.info, autoHide: true, ...options });
  }

  remove(toast: Toast) {
    remove(this.toasts, toast);
  }

  clear() {
    this.toasts = [];
  }

  clearErrors() {
    this.toasts = this.toasts.filter((toast) => toast.options?.type !== ToastType.danger);
  }
}
