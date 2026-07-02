import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { BehaviorSubject } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AgPaginationComponent } from './ag-pagination.component';
import { defaultPageSize } from './paging-defaults';

describe('AgPaginationComponent', () => {
  let component: AgPaginationComponent;
  let fixture: ComponentFixture<AgPaginationComponent>;

  const qp$ = new BehaviorSubject({});
  const mockRoute = {
    queryParams: qp$,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AgPaginationComponent],
      imports: [NgSelectModule, FormsModule, NgbPaginationModule],
      providers: [{ provide: ActivatedRoute, useValue: mockRoute }],
    });

    fixture = TestBed.createComponent(AgPaginationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    qp$.next({});

    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should load the defaults when there is nothing in the query params', () => {
    component.ngOnInit();

    expect(component.page).toBe(1);
    expect(component.pageSize).toBe(defaultPageSize);
  });

  it('should get page and page size from route params', () => {
    qp$.next({ pageSize: 150, page: 2 });

    component.ngOnInit();

    expect(component.page).toBe(2);
    expect(component.pageSize).toBe(150);
  });

  it('should trigger a page selection event when the page size changes', () => {
    const emitSpy = vi.spyOn(component.paginationChanged, 'emit');
    component.updatePageSize(20);
    vi.advanceTimersByTime(0);
    expect(emitSpy).toHaveBeenCalledWith({ page: 1, pageSize: 20 });
  });

  it('should emit an event when the page changes', async () => {
    component.totalItems = 1000;
    component.pageSize = 5;
    fixture.detectChanges();

    const emitSpy = vi.spyOn(component.paginationChanged, 'emit');
    component.pagination.selectPage(100);
    vi.advanceTimersByTime(0);
    fixture.detectChanges();

    expect(emitSpy).toHaveBeenCalledTimes(1);
    expect(emitSpy).toHaveBeenCalledWith({ pageSize: 5, page: 100 });
  });

  it('should calculate the upper bound of pagination results correctly', () => {
    component.totalItems = 103;
    component.page = 1;
    expect(component.upperBoundResults).toBe(50);
    component.page = 3;
    expect(component.upperBoundResults).toBe(103);
  });
});
