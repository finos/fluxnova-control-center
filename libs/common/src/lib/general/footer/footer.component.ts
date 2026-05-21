import { Component, inject, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { map, Observable } from 'rxjs';
import { SubSink } from 'subsink';
import { VersionService } from '../../services/version.service';
import { UserService } from '../../services/user.service';
import { SelectTenantComponent } from '../../auth/select-tenant.component';

@Component({
  selector: 'fluxnova-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  providers: [],
  standalone: false,
})
export class FooterComponent implements OnChanges, OnInit, OnDestroy {
  private userService = inject(UserService);
  private versionService = inject(VersionService);

  protected subs: SubSink = new SubSink();

  @Input() sliderOpen = false;
  showLinks = false;
  tenantTooltip$?: Observable<string>;

  @ViewChild('tenantSelector') tenantSelector?: SelectTenantComponent;

  public engineVersion?: string;

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

    this.subs.add(
      this.versionService.getRestAPIVersion().subscribe((resp) => {
        this.engineVersion = resp.version;
      }),
    );
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.sliderOpen && !changes.sliderOpen.currentValue) {
      this.showLinks = false;
      this.tenantSelector?.closeMenu();
    }
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
