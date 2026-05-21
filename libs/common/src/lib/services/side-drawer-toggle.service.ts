import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { SIDE_DRAWER_CLOSED_WIDTH, SIDE_DRAWER_OPEN_WIDTH } from '../layout/side-drawer/side-drawer-constants';

@Injectable({
  providedIn: 'root',
})
export class SideDrawerToggleService {
  private isOpenSubject = new BehaviorSubject(false);

  constructor() {}

  public get isSidebarOpen$() {
    return this.isOpenSubject.asObservable();
  }

  public get sidebarWidth$() {
    return this.isSidebarOpen$.pipe(map((isOpen) => (isOpen ? SIDE_DRAWER_OPEN_WIDTH : SIDE_DRAWER_CLOSED_WIDTH)));
  }

  public toggleOpenOrClose() {
    const flippedToggleValue = !this.isOpenSubject.getValue();

    this.isOpenSubject.next(flippedToggleValue);
  }

  public closeSideDrawer() {
    this.isOpenSubject.next(false);
  }
}
