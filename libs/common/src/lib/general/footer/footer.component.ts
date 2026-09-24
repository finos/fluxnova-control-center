import { Component, inject, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { asyncScheduler, map, Observable, observeOn } from 'rxjs';
import { SelectTenantComponent } from '../../auth/select-tenant.component';
import { UserService } from '../../services/user.service';
import { VersionService } from '../../services/version.service';

@Component({
  selector: 'fluxnova-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  providers: [],
  standalone: false,
})
export class FooterComponent implements OnChanges, OnInit {
  private userService = inject(UserService);
  private versionService = inject(VersionService);

  @Input() sliderOpen = false;
  showLinks = false;
  tenantTooltip$?: Observable<string>;

  @ViewChild('tenantSelector') tenantSelector?: SelectTenantComponent;

  public engineVersion$?: Observable<string | undefined>;

  get uiVersion() {
    return window.fluxnovaConfig?.version;
  }

  footerinfoClick(event: Event) {
    if (this.sliderOpen) {
      this.showLinks = !this.showLinks;
      event.stopPropagation();
    }
  }

  ngOnInit() {
    this.tenantTooltip$ = this.userService.$selectedTenant.pipe(
      map((tenant) => (tenant ? `Tenant: ${tenant?.displayName} (${tenant?.id})` : 'Tenant')),
    );

    this.engineVersion$ = this.versionService.getRestAPIVersion().pipe(
      observeOn(asyncScheduler),
      map((resp) => resp.version),
    );
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.sliderOpen && !changes.sliderOpen.currentValue) {
      this.showLinks = false;
      this.tenantSelector?.closeMenu();
    }
  }
}
