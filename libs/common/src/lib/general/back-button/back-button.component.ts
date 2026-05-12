import { Component, Input } from '@angular/core';

@Component({
  selector: 'fluxnova-back-button',
  template: `<a class="ps-4 pt-4 pointer d-block" [routerLink]="backTo" fluxnovaTruncateWithTooltip>
    <fluxnova-icon iconName="left-chevron" class="ms-n1 text-primary fs-11 pe-2"></fluxnova-icon>
    <a> {{ previousPageName }} </a>
  </a>`,
  standalone: false,
})
export class BackButtonComponent {
  private _backTo = '../';

  @Input() previousPageName = 'Home';

  @Input() set backTo(route: string) {
    if (route) this._backTo = route;
  }

  get backTo(): string {
    return this._backTo;
  }
}
