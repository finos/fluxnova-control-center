import { Component, inject, TemplateRef } from '@angular/core';
import { Toast, ToastService } from '../../services/toast.service';

@Component({
  selector: 'fluxnova-toasts',
  templateUrl: './toast-container.component.html',
  styleUrls: ['./toast-container.component.scss'],
  standalone: false,
})
export class ToastContainerComponent {
  toastService = inject(ToastService);

  mouseMoveListener?: EventListener;

  isTemplate(toast: any) {
    return toast.info instanceof TemplateRef;
  }

  isError(toast: any) {
    return !!toast.info?.detailedMessage;
  }

  isString(toast: any) {
    return typeof toast.info === 'string';
  }

  removeAnim(toast: Toast) {
    setTimeout(() => {
      this.toastService.remove(toast);
    }, 1000);
  }

  drag(event: MouseEvent, el: HTMLDivElement, toast: Toast) {
    let i = 20;
    let prev = event.screenX;

    let ticking = false;

    const update = () => {
      ticking = false;

      if (i > 0) {
        el.setAttribute('style', `transform: translateX(${i}px);`);
      } else {
        el.setAttribute('style', `transform: translateX(${i / 2}px);`);
      }
    };

    const removeEventListeners = () => {
      if (this.mouseMoveListener) {
        document.removeEventListener('mousemove', this.mouseMoveListener);
      }
      document.removeEventListener('mouseup', f);
    };

    const f = () => {
      if (this.mouseMoveListener) {
        el.setAttribute('style', `transform: translateX(0px); transition: 0.5s;`);
        removeEventListeners();
      }
    };

    this.mouseMoveListener = (e: Event) => {
      const mouseEvent = e as MouseEvent;
      i = prev - event.screenX + Math.trunc(i * 0.1);

      if (!ticking) {
        requestAnimationFrame(update);
      }
      ticking = true;

      if (mouseEvent.screenX > (event.view?.innerWidth || 0) - 80) {
        this.removeAnim(toast);
        removeEventListeners();
      }

      prev = mouseEvent.screenX;
    };

    removeEventListeners();
  }
}
