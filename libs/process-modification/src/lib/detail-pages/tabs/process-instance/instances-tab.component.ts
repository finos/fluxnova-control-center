import { ColDef, FilterModel, IRowNode } from 'ag-grid-community';
import { Component, ElementRef, inject, OnDestroy, ViewChild } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { MODAL_DEFAULTS } from '@fxn/common';
import {
  detailPageInstancesTabColFields,
  GridSort,
  ItemTypeActions,
  predefinedInstanceTabColDefs,
  ProcessInstance,
  ProcessInstanceStatesMap,
} from '@fxn/types';
import { top } from '@popperjs/core';
import { SubSink } from 'subsink';
import { ProcessDefinitionService } from '../../../services/process-definition.service';
import { MigrateModalComponent } from '../../../detail-pages/process-definition/modals/migrate-modal/migrate-modal.component';
import { ProcessInstanceService } from '../../../services/process-instance.service';
import { PimTab, PimTabRowQueryParam } from '../../item-detail-tab-utils';
import { BaseTabComponent } from '../base-tab-component';
import { PaginatedDataRequest } from '../../../services/types/paginated-data-request';

@Component({
  selector: 'fluxnova-instances-tab',
  templateUrl: './instances-tab.component.html',
  standalone: false,
})
export class InstancesTabComponent extends BaseTabComponent implements OnDestroy {
  private instanceService = inject(ProcessInstanceService);
  private definitionService = inject(ProcessDefinitionService);
  private modalService = inject(NgbModal);

  @ViewChild('modalContainer') modalContainer?: ElementRef<HTMLElement>;

  modal?: NgbModalRef;
  protected someMigratableInstances = false;
  protected multipleDefinitionVersions = false;
  private subscriptions = new SubSink();
  buttonPermissionsNeeded = [ItemTypeActions.MigrateProcessInstance];

  get processDefinitionId(): string {
    return this.detailItemId ?? '';
  }

  override get dataFilter(): any {
    return {
      processDefinitionId: this.processDefinitionId,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder,
      ...this.userSuppliedFilters,
    };
  }

  override columnDefinitions: ColDef<any, any>[] = detailPageInstancesTabColFields.map((colId: string) => ({
    colId,
    ...predefinedInstanceTabColDefs[colId],
    cellClass: 'pointer',
  }));

  override get tab(): PimTab {
    return PimTab.Instances;
  }

  override get rowItemQueryParam(): PimTabRowQueryParam {
    return PimTabRowQueryParam.Instances;
  }

  protected get migrateButtonTooltip(): string | undefined {
    if (!this.multipleDefinitionVersions) {
      return 'Migration requires multiple versions';
    } else if (!this.someMigratableInstances) {
      return 'Definition has no active instances to migrate';
    } else {
      return undefined;
    }
  }

  protected get migrateButtonDisabled(): boolean {
    return !this.someMigratableInstances || !this.multipleDefinitionVersions;
  }

  override dataService(request: PaginatedDataRequest): any {
    return this.instanceService.getProcessInstancesWithIncidentInfo(request);
  }

  override async init() {
    await super.init();

    this.changeSelection([]);
    this.resetFilterAndSort();

    this.subscriptions.add(
      this.definitionService
        .getProcessDefinitionVersionsById(this.processDefinitionId)
        .subscribe((results) => (this.multipleDefinitionVersions = results.length > 1)),
      this.instanceService
        .getProcessInstanceCountByFilter({ processDefinitionId: this.processDefinitionId })
        .subscribe((count) => (this.someMigratableInstances = count > 0)),
    );
  }

  changeSelection(rows: ProcessInstance[]) {
    this.selectedRows = rows;
    this.eventBus.selectedRowsUpdated(rows);
  }

  onSelectionChange(rows: any[]) {
    this.changeSelection(rows);
  }

  override async onFilterChanged(filterModel: FilterModel) {
    await super.onFilterChanged(filterModel);
    this.changeSelection([]);
  }

  override onSortChanged(sort: GridSort[]) {
    super.onSortChanged(sort);
    this.changeSelection([]);
  }

  resetFilterAndSort() {
    this.agGrid?.api.setFilterModel({});
    this.agGrid?.api.applyColumnState({
      state: [],
      defaultState: {
        sort: null,
      },
    });
  }

  openModal() {
    this.modal = this.modalService.open(MigrateModalComponent, {
      ...MODAL_DEFAULTS,
      modalDialogClass: 'dynamic-modal',
    });

    this.modal.result
      .then((result) => {
        if (!result) this.eventBus.reloadNeeded();
      })
      .catch(() => {});

    const component = this.modal.componentInstance as MigrateModalComponent;
    component.processInstances = this.selectedRows;
    component.processDefinitionId = this.processDefinitionId;
    component.tenantId = this.route.snapshot.params.tenant;
  }

  override isRowSelectable(row: IRowNode<ProcessInstance>): boolean {
    return (
      row.data?.state === ProcessInstanceStatesMap.ACTIVE.value ||
      row.data?.state === ProcessInstanceStatesMap.SUSPENDED.value
    );
  }

  override ngOnDestroy() {
    super.ngOnDestroy();
    this.subscriptions.unsubscribe();
  }

  protected readonly top = top;
}
