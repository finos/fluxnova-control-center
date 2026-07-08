import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA, Directive, Input, SimpleChange } from '@angular/core';
import { firstValueFrom, of } from 'rxjs';
import { mockUserInfo, mockUserService } from '@fxn/test-support';
import { VersionService } from '../../services/version.service';
import { IconComponent } from '../icons/icon.component';
import { UserService } from '../../services/user.service';
import { FooterComponent } from './footer.component';

describe('FooterComponent', () => {
  let component: FooterComponent;
  let fixture: ComponentFixture<FooterComponent>;
  let testBedInstance: TestBed;
  let mockVersionService: { getRestAPIVersion: () => any };

  beforeEach(() => {
    // Ensure window.fluxnovaConfig is always defined for all tests
    (window as any).fluxnovaConfig = { version: undefined };

    mockVersionService = {
      getRestAPIVersion: () => of({ version: undefined }),
    };
  });

  beforeEach(async () => {
    testBedInstance = TestBed.configureTestingModule({
      declarations: [FooterComponent, MockNgbTooltipDirective, IconComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        { provide: UserService, useValue: mockUserService },
        { provide: VersionService, useValue: mockVersionService },
      ],
    });

    testBedInstance.overrideComponent(FooterComponent, {
      set: {
        providers: [{ provide: VersionService, useValue: mockVersionService }],
      },
    });

    await testBedInstance.compileComponents();

    fixture = testBedInstance.createComponent(FooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show generic tenant if no user info populated', async () => {
    mockUserService.$selectedTenant.next(undefined);
    component.ngOnInit();
    const tooltip = await firstValueFrom(component.tenantTooltip$);
    expect(tooltip).toEqual('Tenant');
  });

  it('should show the tenant name and id in the tooltip', async () => {
    mockUserService.$selectedTenant.next(mockUserInfo.currentTenant);
    component.ngOnInit();
    const tooltip = await firstValueFrom(component.tenantTooltip$);
    expect(tooltip).toEqual('Tenant: Tenant 1 (tenant1)');
  });

  it('should return the correct uiVersion from window.fluxnovaConfig', () => {
    const testVersion = '1.2.3-test';
    (window as any).fluxnovaConfig = { version: testVersion };
    expect(component.uiVersion).toBe(testVersion);
  });

  it('should set engineVersion from VersionService.getRestAPIVersion', async () => {
    const testEngineVersion = 'engine-42.0.1';
    mockVersionService.getRestAPIVersion = () => of({ version: testEngineVersion });

    component.ngOnInit();
    fixture.detectChanges();

    expect(component.engineVersion).toBe(testEngineVersion);
  });

  it('should close the tenant menu when the drawer collapses', () => {
    const closeMenu = vi.fn();
    component.tenantSelector = { closeMenu } as any;
    component.showLinks = true;

    component.ngOnChanges({
      sliderOpen: new SimpleChange(true, false, false),
    });

    expect(component.showLinks).toBe(false);
    expect(closeMenu).toHaveBeenCalledTimes(1);
  });
});

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: '[ngbTooltip]',
  standalone: false,
})
export class MockNgbTooltipDirective {
  @Input() ngbTooltip: unknown;
}
