import { inject, OnDestroy } from '@angular/core';
import { CellClickedEvent, ColDef } from 'ag-grid-community';
import { MODAL_DEFAULTS, TooltipInfoModalComponent } from '@fxn/common';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { PimTab, PimTabRowQueryParam } from '../../item-detail-tab-utils';
import { JobService } from '../../../services/job.service';
import { BaseTabComponent } from '../../tabs/base-tab-component';

import { PaginatedDataRequest } from '../../../services/types/paginated-data-request';

export class BaseBatchDetailsTabComponent extends BaseTabComponent implements OnDestroy {
  protected jobService: JobService = inject(JobService);
  protected modalService: NgbModal = inject(NgbModal);

  override columnDefinitions: ColDef<any, any>[] = [];

  override get tab(): PimTab {
    return PimTab.Jobs;
  }

  override get rowItemQueryParam(): PimTabRowQueryParam {
    return PimTabRowQueryParam.Jobs;
  }

  modal?: NgbModalRef;

  override get dataFilter(): any {
    return {
      jobDefinitionId: this.detailItemId,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder,
      ...this.userSuppliedFilters,
    };
  }

  override dataService(request: PaginatedDataRequest): any {
    return this.jobService.getJobsByFilter(request);
  }

  onCellClicked(event: CellClickedEvent) {
    if (event.colDef?.cellRendererParams?.isOpenModalOnClick && event.value) {
      this.modal = this.modalService?.open(TooltipInfoModalComponent, {
        ...MODAL_DEFAULTS,
        modalDialogClass: 'dynamic-modal',
      });
      const component = this.modal?.componentInstance as TooltipInfoModalComponent;
      component.text = event.value;
      component.title = event.colDef.headerName;
    }
  }
}
