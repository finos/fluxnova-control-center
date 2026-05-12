import { beforeEach, describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { SIDE_DRAWER_CLOSED_WIDTH, SIDE_DRAWER_OPEN_WIDTH } from '../layout/side-drawer/side-drawer-constants';
import { SideDrawerToggleService } from './side-drawer-toggle.service';

describe('SideDrawerToggleService', () => {
  let service: SideDrawerToggleService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SideDrawerToggleService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should toggle sidebar state', async () => {
    service.toggleOpenOrClose();
    const isOpenAfterFirstToggle = await firstValueFrom(service.isSidebarOpen$);
    expect(isOpenAfterFirstToggle).toBe(true);

    service.toggleOpenOrClose();
    const isOpenAfterSecondToggle = await firstValueFrom(service.isSidebarOpen$);
    expect(isOpenAfterSecondToggle).toBe(false);
  });

  it('should close the sidebar', async () => {
    service.toggleOpenOrClose(); // Open the sidebar first
    service.closeSideDrawer();
    const isOpen = await firstValueFrom(service.isSidebarOpen$);
    expect(isOpen).toBe(false);
  });

  it('should return correct sidebar width when open', async () => {
    service.toggleOpenOrClose(); // Open the sidebar
    const width = await firstValueFrom(service.sidebarWidth$);
    expect(width).toBe(SIDE_DRAWER_OPEN_WIDTH);
  });

  it('should return correct sidebar width when closed', async () => {
    service.closeSideDrawer(); // Ensure the sidebar is closed
    const width = await firstValueFrom(service.sidebarWidth$);
    expect(width).toBe(SIDE_DRAWER_CLOSED_WIDTH);
  });
});
