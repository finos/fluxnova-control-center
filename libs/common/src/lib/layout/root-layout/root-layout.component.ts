import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, inject, OnInit } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { NavigationEnd, Router, RoutesRecognized } from '@angular/router';
import { fromEvent, Observable } from 'rxjs';
import { filter, map, pairwise, throttleTime } from 'rxjs/operators';
import { ToastService } from '../../services/toast.service';
import { FluxnovaRouteData } from '../fluxnova-route-data';

@Component({
  selector: 'fluxnova-root-layout',
  templateUrl: './root-layout.component.html',
  styleUrls: ['./root-layout.component.scss'],
  standalone: false,
})
export class RootLayoutComponent implements AfterViewInit, OnInit {
  private router = inject(Router);
  private toastService = inject(ToastService);
  private http = inject(HttpClient);
  private document = inject<Document>(DOCUMENT);

  routeDataChanging$ = this.router.events.pipe(
    filter((event) => event instanceof RoutesRecognized),
    map((event: RoutesRecognized) => event.state.root.firstChild?.data as FluxnovaRouteData),
  );
  hideContextBar$ = this.routeDataChanging$.pipe(map((data: FluxnovaRouteData) => data && !!data.hideContextBar));

  ngOnInit(): void {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        pairwise(),
      )
      .subscribe((events: [NavigationEnd, NavigationEnd]) => this.clearErrors(events));

    // click heartbeat to avoid timeout when interacting but not making api calls
    const clickObservable: Observable<Event> = fromEvent(this.document, 'click');
    clickObservable.pipe(throttleTime(300000)).subscribe(() => {
      this.http.get('./api/liveness').subscribe(
        () => {},
        (error) => console.error('Error making call to /api/liveness for heartbeat', error),
      );
    });
  }

  /**
   * Clear error toasts if routing happens, but only if the path changes
   */
  private clearErrors(events: [NavigationEnd, NavigationEnd]) {
    const from = events[0].url;
    const to = events[1].url;
    // If query params are the only change, don't do anything
    if (from.split('?')[0] !== to.split('?')[0]) {
      this.toastService.clearErrors();
    }
  }

  ngAfterViewInit(): void {
    window.AppReady = true;
  }
}
