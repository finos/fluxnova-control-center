import { Clipboard } from '@angular/cdk/clipboard';
import { Directive, HostListener, inject, Input } from '@angular/core';
import { ToastService } from '../../services/toast.service';

@Directive({
  selector: '[fluxnovaCopyLink]',
  standalone: false,
})
export class CopyLinkDirective {
  clipboard = inject(Clipboard);
  toastService = inject(ToastService);

  @Input() fluxnovaCopyLink?: string;
  @Input() copyTextLabel = 'Link';

  @HostListener('click') onClick() {
    this.copy();
  }

  copy() {
    this.clipboard.copy(this.fluxnovaCopyLink || '');
    this.toastService.success(this.copyTextLabel + ' has been copied to clipboard');
  }
}
