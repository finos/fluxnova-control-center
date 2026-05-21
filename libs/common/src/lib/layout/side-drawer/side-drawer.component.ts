import { Component, inject, OnDestroy, ViewChild } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';

import { SearchNavigationComponent } from '../../general/search-navigation/search-navigation.component';
import { SideDrawerToggleService } from '../../services/side-drawer-toggle.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'fluxnova-side-drawer',
  templateUrl: './side-drawer.component.html',
  styleUrls: ['./side-drawer.component.scss'],
  standalone: false,
})
export class SideDrawerComponent implements OnDestroy {
  private router = inject(Router);
  private toggleService = inject(SideDrawerToggleService);
  private document = inject<Document>(DOCUMENT);
  private userService = inject(UserService);

  @ViewChild('searchNavigationComponent') searchComponent?: SearchNavigationComponent;
  links$: Observable<{ path: string; name: string; class: string }[]>;

  isOpen$ = this.toggleService.isSidebarOpen$;
  isProfileDropdownOpen = false;
  private toggleSubscription?: Subscription;

  constructor() {
    this.links$ = this.userService.$selectedTenant.pipe(
      map((tenant) =>
        this.router.config
          .filter((x) => x.data && x.data?.itemType)
          .map((x) => ({
            path: x.path?.replace(':tenant', tenant?.id || '') as string,
            name: x.data?.itemTypeListName as string,
            class: x.data?.itemTypeClass,
          })),
      ),
    );
    this.toggleSubscription = this.toggleService.isSidebarOpen$.subscribe((isOpen) => {
      if (!isOpen) {
        this.isProfileDropdownOpen = false;
      }
    });
  }

  closeSideDrawer() {
    this.toggleService.closeSideDrawer();
  }

  toggleOpenOrClose() {
    this.toggleService.toggleOpenOrClose();
  }

  handleLinkClick(event: Event, tooltip: NgbTooltip): void {
    event.stopPropagation();
    tooltip.close();
  }

  profileClick(event: Event) {
    this.isProfileDropdownOpen = !this.isProfileDropdownOpen;
    event.stopPropagation();
  }

  getLogoutURI(): string {
    return this.document.baseURI + 'api/logout';
  }

  ngOnDestroy() {
    this.toggleSubscription?.unsubscribe();
  }
}
