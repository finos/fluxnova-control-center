import { Directive, inject, Input, TemplateRef, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[fluxnovaHasPermissions]',
  standalone: false,
})
export class MockFluxnovaHasPermissionsDirective {
  private tpl = inject<TemplateRef<any>>(TemplateRef);
  private vc = inject(ViewContainerRef);

  @Input() fluxnovaHasPermissions: any;

  constructor() {
    this.vc.createEmbeddedView(this.tpl);
  }
}
