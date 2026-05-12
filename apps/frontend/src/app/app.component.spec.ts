import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { NavigationEnd, NavigationStart, Router, RouterEvent } from '@angular/router';
import { Subject } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  let app: AppComponent;
  const mockRouter = { events: new Subject<RouterEvent>() };
  const mockNgbModal = { dismissAll: vi.fn() };

  beforeAll(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: NgbModal, useValue: mockNgbModal },
      ],
    });
    app = TestBed.createComponent(AppComponent).debugElement.componentInstance;
  });

  afterEach(() => {
    mockNgbModal.dismissAll.mockClear();
  });

  it("should have as title 'Fluxnova Control Center'", () => {
    expect(app.title).toEqual('Fluxnova Control Center');
  });

  it('should dismiss modals when navigation is triggered by "popstate"', () => {
    mockRouter.events.next(new NavigationStart(1, 'test-url', 'popstate'));

    expect(mockNgbModal.dismissAll).toHaveBeenCalledTimes(1);
  });

  it('should ignore other navigation events, and start events not triggered by "popstate"', () => {
    mockRouter.events.next(new NavigationEnd(1, 'test-url', 'test-url'));
    mockRouter.events.next(new NavigationStart(1, 'test-url', 'hashchange'));

    expect(mockNgbModal.dismissAll).not.toHaveBeenCalled();
  });
});
