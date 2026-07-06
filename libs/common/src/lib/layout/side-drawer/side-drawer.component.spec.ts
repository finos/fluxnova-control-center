import { DOCUMENT } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, Input, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, RouterModule } from '@angular/router';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockUserService } from '@fxn/test-support';
import { AuthService } from '../../auth/auth.service';
import { IconComponent } from '../../general/icons/icon.component';
import { SideDrawerToggleService } from '../../services/side-drawer-toggle.service';
import { UserService } from '../../services/user.service';
import { SideDrawerComponent } from './side-drawer.component';

@Component({
  selector: 'fluxnova-mock-process-instance-list',
  template: '',
})
export class MockProcessInstanceListComponent {}

describe('SideDrawerComponent', () => {
  const mockAuthService = {};
  let sideDrawerToggleService: SideDrawerToggleService;
  let component: SideDrawerComponent;
  let router: Router;
  let fixture: ComponentFixture<SideDrawerComponent>;

  let mockDocument: Document;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SideDrawerComponent, IconComponent, MockFooterComponent],
      imports: [
        RouterModule.forRoot([
          {
            path: 'process-instances',
            component: MockProcessInstanceListComponent,
          },
        ]),
      ],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        { provide: UserService, useValue: mockUserService },
        SideDrawerToggleService,
      ],
      schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA],
    });
    mockDocument = TestBed.inject(DOCUMENT);
    fixture = TestBed.createComponent(SideDrawerComponent);
    router = TestBed.inject(Router);
    sideDrawerToggleService = TestBed.inject(SideDrawerToggleService);
    vi.spyOn(router, 'navigate');
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should run sideDrawerToggleService closeSideDrawer when component closeSideDrawer is called', () => {
    const spyOn = vi.spyOn(sideDrawerToggleService, 'closeSideDrawer');

    component.closeSideDrawer();

    expect(spyOn).toHaveBeenCalled();
  });

  it('should run sideDrawerToggleService toggleOpenOrClose when component toggleOpenOrClose is called', () => {
    const spyOn = vi.spyOn(sideDrawerToggleService, 'toggleOpenOrClose');

    component.toggleOpenOrClose();

    expect(spyOn).toHaveBeenCalled();
  });

  it('should stop event propagation and close tooltip when handleLinkClick is called', () => {
    const mockEvent = { stopPropagation: vi.fn() } as unknown as Event;
    const mockTooltip = { close: vi.fn() } as unknown as NgbTooltip;

    component.handleLinkClick(mockEvent, mockTooltip);

    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    expect(mockTooltip.close).toHaveBeenCalled();
  });

  describe('profileClick', () => {
    it('should toggle profile dropdown', () => {
      const mockEvent = { stopPropagation: vi.fn() } as unknown as Event;

      expect(component.isProfileDropdownOpen).toBe(false);

      component.profileClick(mockEvent);

      expect(component.isProfileDropdownOpen).toBe(true);
      expect(mockEvent.stopPropagation).toHaveBeenCalled();

      component.profileClick(mockEvent);

      expect(component.isProfileDropdownOpen).toBe(false);
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
    });
  });

  describe('getLogoutURI', () => {
    it('should return the correct logout link', () => {
      vi.spyOn(mockDocument, 'baseURI', 'get').mockReturnValue('http://fluxnova.finos.org/');

      expect(component.getLogoutURI()).toBe('http://fluxnova.finos.org/api/logout');
    });
  });
});

@Component({
  selector: 'fluxnova-footer',
  template: 'footer',
  standalone: false,
})
export class MockFooterComponent {
  @Input() sliderOpen: any;
}
