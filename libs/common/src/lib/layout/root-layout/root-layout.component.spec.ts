import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import { APP_BASE_HREF } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, RouterModule } from '@angular/router';
import { NgbCollapseModule, NgbModalModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { LetDirective } from '@ngrx/component';
import * as rxjs from 'rxjs';
import { of } from 'rxjs';
import { AuthModule } from '../../auth/auth.module';
import { IconComponent } from '../../general/icons/icon.component';
import { IS_PRODUCTION } from '../../injection-tokens';
import { SideDrawerComponent } from '../side-drawer/side-drawer.component';
import { RootLayoutComponent } from './root-layout.component';

describe('RootLayoutComponent', () => {
  let subject: rxjs.Subject<any>;
  let fromEventSpy: Mock;
  const mockHttp = {
    get: vi.fn(),
  };

  let fixture: ComponentFixture<RootLayoutComponent>;
  let router: Router;

  beforeEach(() => {
    fromEventSpy = vi.spyOn(rxjs, 'fromEvent');
    subject = new rxjs.Subject<any>();
    fromEventSpy.mockReturnValue(subject.asObservable());

    TestBed.configureTestingModule({
      imports: [
        LetDirective,
        AuthModule,
        RouterModule.forRoot([]),
        NgbCollapseModule,
        NgbModalModule,
        NgbTooltipModule,
      ],
      declarations: [
        RootLayoutComponent,
        IconComponent,
        MockHeaderComponent,
        MockFooterComponent,
        MockToastsComponent,
        SideDrawerComponent,
      ],
      providers: [
        { provide: APP_BASE_HREF, useValue: '/' },
        { provide: IS_PRODUCTION, useValue: true },
        { provide: HttpClient, useValue: mockHttp },
      ],
    });

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(RootLayoutComponent);
    mockHttp.get.mockReturnValue(of({}));
    fixture.detectChanges();
  });

  it('should create the app', () => {
    expect(fixture.debugElement.componentInstance).toBeTruthy();
  });

  it.skip('should show forbidden component if user has no access', async () => {
    await router.navigate(['route-with-no-access']);
    fixture.detectChanges();
    const compiled = fixture.debugElement.nativeElement;
    expect(compiled.querySelector('fluxnova-forbidden')).not.toBeNull();
  });

  it('should make an http call on click', () => {
    mockHttp.get.mockReturnValue(of({}));
    expect(fromEventSpy).toHaveBeenCalled();
    vi.useFakeTimers();
    subject.next('click1');
    expect(mockHttp.get).toHaveBeenCalled();
    subject.next('click2');
    expect(mockHttp.get).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(320000);
    subject.next('click3');
    expect(mockHttp.get).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });
});

@Component({
  selector: 'fluxnova-header',
  template: 'header',
  standalone: false,
})
export class MockHeaderComponent {}

@Component({
  selector: 'fluxnova-footer',
  template: 'footer',
  standalone: false,
})
export class MockFooterComponent {
  @Input() sliderOpen: any;
}

@Component({
  selector: 'fluxnova-toasts',
  template: 'toasts',
  standalone: false,
})
export class MockToastsComponent {}
