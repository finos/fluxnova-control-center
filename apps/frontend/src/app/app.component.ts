import { Component, inject } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { NgbModal, NgbTooltipConfig } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'fluxnova-root',
  templateUrl: './app.component.html',
  styleUrls: [],
  standalone: false,
})
export class AppComponent {
  private readonly router = inject(Router);
  private readonly modalService = inject(NgbModal);
  private readonly tooltipConfig = inject(NgbTooltipConfig);

  title = 'Fluxnova Control Center';

  constructor() {
    this.tooltipConfig.openDelay = 500;
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart && event.navigationTrigger === 'popstate') {
        this.modalService.dismissAll();
      }
    });
  }
}
