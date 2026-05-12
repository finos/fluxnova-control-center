import { ComponentRef, Directive, inject, Input, OnDestroy, TemplateRef, ViewContainerRef } from '@angular/core';
import { LoadingComponent } from './loading.component';

@Directive({
  selector: '[fluxnovaLoading], [fluxnovaLoadingBlocking]',
  standalone: false,
})
export class LoadingDirective implements OnDestroy {
  private vcRef = inject(ViewContainerRef);

  loadingComponent?: ComponentRef<LoadingComponent>;

  @Input()
  set fluxnovaLoading(loading: boolean) {
    this.toggle(loading, false);
  }

  @Input()
  set fluxnovaLoadingBlocking(loading: boolean) {
    this.toggle(loading, true);
  }

  constructor() {
    const templateRef = inject<TemplateRef<any>>(TemplateRef);

    //create the main component immediately
    if (templateRef) {
      this.vcRef.createEmbeddedView(templateRef);
    }
  }

  toggle(loading: boolean, blocking: boolean) {
    if (loading) {
      if (!this.loadingComponent) {
        this.loadingComponent = this.vcRef.createComponent(LoadingComponent);
        this.loadingComponent.instance.blockInteraction = blocking;
      } else {
        this.vcRef.insert(this.loadingComponent.hostView);
      }
    } else {
      if (this.loadingComponent) {
        this.vcRef.detach(this.vcRef.indexOf(this.loadingComponent.hostView));
      }
    }
  }

  ngOnDestroy(): void {
    if (this.loadingComponent) {
      this.loadingComponent.destroy();
    }
  }
}
