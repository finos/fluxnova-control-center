import { Injectable } from '@angular/core';
import { ProcessInstance } from '@fxn/types';
import { BehaviorSubject, Subject, timer } from 'rxjs';
import { HeatmapParams } from 'visual-heatmap';
import { DATA_RELOAD_DELAY } from '../common/app-constants';

@Injectable({ providedIn: 'root' })
export class ItemDetailPageCommunicationService {
  private _tabFilterUpdated$: Subject<{ tab: string; filter: any }> = new Subject<any>();
  private _selectedRowsUpdated$: Subject<ProcessInstance[]> = new Subject<ProcessInstance[]>();
  private _rowClickedWithActivity$: Subject<string> = new Subject<string>();
  private _reloadNeeded$: Subject<boolean> = new Subject<boolean>();
  private _diagramRendered$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private _diagramFlowHighlighted$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);
  private _heatmapParams$: BehaviorSubject<HeatmapParams> = new BehaviorSubject<HeatmapParams>({ active: false });
  private _instanceStatisticsShown$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);

  public get selectedRowsUpdated$(): Subject<ProcessInstance[]> {
    return this._selectedRowsUpdated$;
  }

  public get tabFilterUpdated$(): Subject<{ tab: string; filter: any }> {
    return this._tabFilterUpdated$;
  }

  public get rowClickedWithActivity$(): Subject<string> {
    return this._rowClickedWithActivity$;
  }

  public get reloadNeeded$(): Subject<boolean> {
    return this._reloadNeeded$;
  }

  public get diagramRendered$(): Subject<boolean> {
    return this._diagramRendered$;
  }

  public get diagramFlowHighlighted$(): BehaviorSubject<boolean> {
    return this._diagramFlowHighlighted$;
  }

  public get heatmapParams$(): BehaviorSubject<HeatmapParams> {
    return this._heatmapParams$;
  }

  public get instanceStatisticsShown$(): BehaviorSubject<boolean> {
    return this._instanceStatisticsShown$;
  }

  /**
   * TODO: Generalize type so it works for all tabs.
   *
   * @param rows
   */
  public selectedRowsUpdated(rows: ProcessInstance[]) {
    this._selectedRowsUpdated$.next(rows);
  }

  public tabFilterUpdated(filter: { tab: string; filter: any }) {
    this._tabFilterUpdated$.next(filter);
  }

  public rowClickedWithActivity(id: string) {
    this._rowClickedWithActivity$.next(id);
  }

  public reloadNeeded(): void {
    timer(DATA_RELOAD_DELAY).subscribe(() => this._reloadNeeded$.next(true));
  }

  public setDiagramRendered(status: boolean): void {
    this._diagramRendered$.next(status);
  }

  public diagramFlowHighlighted(status: boolean): void {
    this._diagramFlowHighlighted$.next(status);
  }

  public heatmapParams(config: HeatmapParams): void {
    this._heatmapParams$.next(config);
  }

  public instanceStatisticsShown(status: boolean): void {
    this._instanceStatisticsShown$.next(status);
  }

  public reset() {
    this._diagramRendered$ = new BehaviorSubject<boolean>(false);
    this._selectedRowsUpdated$ = new Subject<ProcessInstance[]>();
    this._tabFilterUpdated$ = new Subject<any>();
    this._reloadNeeded$ = new Subject<boolean>();
    this._diagramFlowHighlighted$ = new BehaviorSubject<boolean>(true);
    this._instanceStatisticsShown$ = new BehaviorSubject<boolean>(true);
    this._heatmapParams$ = new BehaviorSubject<HeatmapParams>({ active: false });
  }
}
