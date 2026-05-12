import { beforeEach, describe, expect, it } from 'vitest';
import { Toast, ToastService, ToastType } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;
  const message1 = 'This is the first test toast';
  const message2 = 'This is the second test toast';
  const errorMessage = 'This is an error message';
  const warningMessage = 'This is a warning message';
  const successMessage = 'This is a success message';
  const infoMessage = 'This is an info message';
  const options = { autoHide: false, error: true, header: 'Error' };
  const errorOptions = {
    autoHide: false,
    borderCls: 'toast-border-danger',
    icon: 'warning',
    textColor: 'text-danger',
    header: 'Error',
    type: 5,
  };

  const warningOptions = {
    autoHide: true,
    borderCls: 'toast-border-warning',
    icon: 'warning',
    textColor: 'text-warning',
    header: 'Warning',
    type: 4,
  };

  const successOptions = {
    autoHide: true,
    borderCls: 'toast-border-success',
    icon: 'success',
    textColor: 'text-success',
    header: 'Success',
    type: 2,
  };

  const infoOptions = {
    autoHide: true,
    borderCls: 'toast-border-info',
    icon: 'info-outline',
    textColor: 'text-info',
    type: 3,
  };

  beforeEach(() => {
    service = new ToastService();
  });

  it('should save toasts according to what is passed', () => {
    service.show(message1);
    service.error(errorMessage);
    service.warning(warningMessage);
    service.success(successMessage);
    service.info(infoMessage);
    expect(service.toasts).toEqual([
      { info: message1, options: {} },
      { info: errorMessage, options: errorOptions },
      { info: warningMessage, options: warningOptions },
      { info: successMessage, options: successOptions },
      { info: infoMessage, options: infoOptions },
    ]);

    service.show(message2, options);
    expect(service.toasts).toEqual([
      { info: message1, options: {} },
      { info: errorMessage, options: errorOptions },
      { info: warningMessage, options: warningOptions },
      { info: successMessage, options: successOptions },
      { info: infoMessage, options: infoOptions },
      { info: message2, options },
    ]);
  });

  it('should remove a specific toast', () => {
    service.show(message1);
    service.show(message2);
    expect(service.toasts).toEqual([
      { info: message1, options: {} },
      { info: message2, options: {} },
    ]);

    service.remove({ info: message1 });
    expect(service.toasts).toEqual([{ info: message2, options: {} }]);
  });

  it('should set the right scss classes on a toast', () => {
    const toastConfigs: Toast[] = [
      {
        info: '',
        options: {
          type: ToastType.success,
          borderCls: 'toast-border-success',
          textColor: 'text-success',
          icon: 'success',
          header: 'Success',
        },
      },
      {
        info: '',
        options: {
          type: ToastType.danger,
          borderCls: 'toast-border-danger',
          icon: 'warning',
          textColor: 'text-danger',
          header: 'Error',
        },
      },
      {
        info: '',
        options: {
          type: ToastType.warning,
          borderCls: 'toast-border-warning',
          icon: 'warning',
          textColor: 'text-warning',
          header: 'Warning',
        },
      },
      {
        info: '',
        options: {
          type: ToastType.info,
          borderCls: 'toast-border-info',
          textColor: 'text-info',
          icon: 'info-outline',
        },
      },
    ];

    toastConfigs.forEach((toast) => {
      service.show(toast.info, { type: toast.options?.type });
      expect(service.toasts[0]).toEqual(toast);
      service.remove(service.toasts[0]);
    });

    expect(service.toasts.length).toEqual(0);
  });

  it('should not show toasts when disabled', () => {
    service.isEnabled = false;
    service.error('whatever');
    expect(service.toasts).toEqual([]);
  });

  it('should allow overriding defaults for success toast', () => {
    service.success('asdf', { autoHide: true, delay: 12000 });
    expect(service.toasts[0].options?.delay).toEqual(12000);
  });

  it('should allow overriding defaults for info toast', () => {
    service.info('asdf', { autoHide: true, delay: 12000 });
    expect(service.toasts[0].options?.delay).toEqual(12000);
  });

  it('should allow overriding defaults for warning toast', () => {
    service.warning('asdf', { autoHide: true, delay: 12000 });
    expect(service.toasts[0].options?.delay).toEqual(12000);
  });

  it('should allow overriding defaults for error toast', () => {
    service.error('asdf', { autoHide: true, delay: 12000 });
    expect(service.toasts[0].options?.delay).toEqual(12000);
  });
});
