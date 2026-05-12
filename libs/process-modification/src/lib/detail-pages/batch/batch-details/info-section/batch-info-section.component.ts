import { Component, inject, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import type { Batch } from '@fxn/types';

@Component({
  selector: 'fluxnova-batch-info-section',
  templateUrl: './batch-info-section.component.html',
  styleUrls: ['./batch-info-section.component.scss'],
  standalone: false,
})
export class BatchInfoSectionComponent {
  route = inject(ActivatedRoute);

  protected readonly isNaN = isNaN;
  batchId = this.route.snapshot.params.id;
  @Input() batch: Batch = {};
  @Input() isLoading = false;
}
