import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { take } from 'rxjs';
import { AnimationState } from '@fxn/common';
import { ItemDetailPageCommunicationService } from '../../item-detail-page.communication.service';

@Component({
  selector: 'fluxnova-heatmap-modal',
  templateUrl: './heatmap-settings-modal.component.html',
  styleUrls: ['./heatmap-settings-modal.component.scss'],
  standalone: false,
})
export class HeatmapSettingsModalComponent implements OnInit, OnDestroy {
  private readonly elRef = inject(ElementRef);
  private readonly eventBus = inject(ItemDetailPageCommunicationService);

  @Input() heatmapDeactivating = false;
  @Output() closeComplete = new EventEmitter<void>();

  contentState = new AnimationState();

  viewByOptions = [
    { label: 'Time Spent', value: 'timeSpent' },
    { label: 'Quantity', value: 'quantity' },
  ];
  timelineOptions = [
    { label: 'Past day', value: 'pastDay' },
    { label: 'Past week', value: 'pastWeek' },
    { label: 'Past month', value: 'pastMonth' },
    { label: 'Past quarter', value: 'pastQuarter' },
    { label: 'Past year', value: 'pastYear' },
  ];
  selectedViewByOption = '';
  selectedTimelineOption = '';

  ngOnInit() {
    this.eventBus.heatmapParams$.pipe(take(1)).subscribe((heatmapParams) => {
      this.selectedViewByOption = heatmapParams.viewBy ?? 'timeSpent';
      this.selectedTimelineOption = heatmapParams.timeline ?? 'pastMonth';
      this.eventBus.heatmapParams({
        active: true,
        viewBy: this.selectedViewByOption,
        timeline: this.selectedTimelineOption,
      });
    });
  }

  ngOnDestroy() {
    this.eventBus.heatmapParams({
      active: false,
      viewBy: this.selectedViewByOption,
      timeline: this.selectedTimelineOption,
    });
  }

  toggleOpen() {
    this.contentState.toggle();
  }

  onTabAnimationEnd() {
    if (this.heatmapDeactivating) {
      this.closeComplete.emit();
    }
  }

  onUpdateHeatmap() {
    this.eventBus.heatmapParams({
      active: true,
      viewBy: this.selectedViewByOption,
      timeline: this.selectedTimelineOption,
    });
    this.toggleOpen();
  }

  @HostListener('document:mousedown', ['$event.target'])
  public handleClickOutside(target: HTMLElement) {
    const modal = this.elRef.nativeElement;
    if (
      this.contentState.isOpen &&
      !modal.contains(target) &&
      !document.querySelector('.ng-dropdown-panel')?.contains(target)
    ) {
      // This handles the ng-select dropdown because it is appended to the body
      this.toggleOpen();
    }
  }
}
