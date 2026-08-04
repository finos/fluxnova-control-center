import { firstValueFrom, from, Observable, of } from 'rxjs';
import { Component, inject, OnDestroy } from '@angular/core';
import { cloneDeep } from 'lodash-es';
import { catchError, map, mergeMap, takeLast } from 'rxjs/operators';
import { MODAL_DEFAULTS } from '@fxn/common';
import {
  detailPageHistoricalVariablesTabColFields,
  detailPageVariablesTabColFields,
  FluxnovaVariableTypes,
  predefinedVariablesColDefs,
  ProcessInstanceStatesMap,
  Variable,
  VariableScopeType,
} from '@fxn/types';
import { SubSink } from 'subsink';
import { ColDef } from 'ag-grid-community';
import { ProcessInstanceService } from '../../../services/process-instance.service';
import { VariableService } from '../../../services/variable.service';
import { ProcessVariableModalService } from '../../process-instance/process-variable-modal/process-variable-modal-service';
import {
  VariableModalResult,
  VariableOptions,
} from '../../process-instance/process-variable-modal/process-variable-modal.component';
import { BaseTabComponent } from '../base-tab-component';
import { PimTab, PimTabRowQueryParam } from '../../item-detail-tab-utils';
import { PaginatedDataRequest } from '../../../services/types/paginated-data-request';

@Component({
  selector: 'fluxnova-variables-tab',
  templateUrl: './variables-tab.component.html',
  styleUrls: ['./variables-tab.component.scss'],
  standalone: false,
})
export class VariablesTabComponent extends BaseTabComponent implements OnDestroy {
  protected processInstanceService = inject(ProcessInstanceService);
  protected variableService = inject(VariableService);
  private processVariableModalService = inject(ProcessVariableModalService);

  override data: Variable[] = [];
  public isSaving = false;
  public isSaveEnabled = false;
  public variablesToBeSaved: Variable[] = [];
  public isProcessInstanceActive?: boolean = true;

  subs = new SubSink();

  override columnDefinitions: ColDef[] = [];

  override get tab(): PimTab {
    return PimTab.Variables;
  }

  override get tabVariant(): string {
    if (this.isProcessInstanceActive) {
      return 'unfinished';
    }

    return 'finished';
  }

  override get rowItemQueryParam(): PimTabRowQueryParam {
    // Currently unused because we don't allow selecting rows
    // on this tab, but this is needed by the BaseTabComponent
    return PimTabRowQueryParam.Variables;
  }

  override get dataFilter() {
    return {
      processInstanceIdIn: [this.detailItemId as string],
      sortBy: this.sortBy,
      sortOrder: this.sortOrder,
      ...this.userSuppliedFilters,
    };
  }

  override async init() {
    await this.setColumns();
    await super.init();
  }

  override async handleReload() {
    await this.setColumns();
    super.handleReload();
  }

  public async setColumns() {
    this.isProcessInstanceActive = await firstValueFrom(
      this.processInstanceService.getProcessInstance(this.detailItemId as string).pipe(
        map((processInstance) => {
          if (processInstance) {
            return processInstance.state === ProcessInstanceStatesMap.ACTIVE.value;
          }
          throw new Error('Invalid Process instance Id');
        }),
        catchError((error: any) => {
          this.toastService?.error(error.message);
          return of(false);
        }),
      ),
    );

    this.columnDefinitions = (
      this.isProcessInstanceActive ? detailPageVariablesTabColFields : detailPageHistoricalVariablesTabColFields
    ).map((colId: string) => ({
      colId,
      ...predefinedVariablesColDefs[colId],
    }));
  }

  override dataService(request: PaginatedDataRequest): any {
    return this.variableService.getProcessVariablesByFilter(request, this.isProcessInstanceActive);
  }

  public isComplexType(variable: Variable): boolean {
    if (!variable.type) return false;
    return ['File', 'Object', 'Json', 'Xml'].indexOf(variable.type) > -1;
  }

  public saveClicked(): void {
    this.isSaving = true;
    this.subs.add(
      this.saveVariables().subscribe({
        next: () => {
          this.loadData();
          this.sendFilterChangedNotification();
        },
        error: (err) => {
          this.isSaving = false;
          this.isSaveEnabled = false;
          this.toastService.error(`An error occurred while updating variables: ${err.message}`);
        },
        complete: () => {
          this.isSaveEnabled = false;
          this.isSaving = false;
          this.toastService.success(`The variables have been updated successfully`);
        },
      }),
    );
  }

  private saveVariables() {
    const updated = this.variablesToBeSaved.filter(
      (object) =>
        !this.data.some(
          (originalObject) =>
            object.value === originalObject.value &&
            object.type === originalObject.type &&
            object.name === originalObject.name &&
            object.valueInfo?.objectTypeName === originalObject.valueInfo?.objectTypeName &&
            object.valueInfo?.serializationDataFormat === originalObject.valueInfo?.serializationDataFormat,
        ),
    );
    return from(updated).pipe(
      mergeMap((variable) => this.handleScopedVariableUpdate(variable)),
      takeLast(1),
    );
  }

  public addNewVariable(): void {
    this.displayProcessVariableModal({ ...this.getModalValues('Add', -1) }).then(
      (variableResult?: VariableModalResult) => {
        if (variableResult?.saved) {
          const newVariable = this.createVariable(variableResult);
          this.variablesToBeSaved = [...cloneDeep(this.data), newVariable];
          this.saveClicked();
        }
      },
    );
  }

  public deleteClicked(rowIndex: number, variable: Variable) {
    this.displayProcessVariableModal({
      ...this.getModalValues('Delete', rowIndex),
    }).then((result) => {
      if (result.saved) {
        this.deleteVariable(variable);
      }
    });
  }

  public deleteVariable(variable: Variable): void {
    this.deleteVariableFromDB(variable);
  }

  private deleteVariableFromDB(variable: Variable): void {
    const deleteObservable: Observable<any> = this.handleScopedVariableUpdate(variable, true);
    this.subs.add(
      deleteObservable.subscribe({
        next: () => {
          this.loadData();
          this.sendFilterChangedNotification();
        },
        error: (err) => this.toastService.error(`An error occurred while deleting variables: ${err.message}`),
        complete: () => this.toastService.success(`The variable has been deleted successfully`),
      }),
    );
  }

  private handleScopedVariableUpdate(variable: Variable, deleteVar: boolean = false): Observable<Variable> {
    if (variable.scopeType === VariableScopeType.Process) {
      // Variable is scoped to the entire process instance
      return deleteVar
        ? this.variableService.deleteProcessVariable(variable)
        : this.variableService.updateProcessVariables(variable);
    }
    // Must be activity scoped so we'll see if it is a task variable or an execution variable
    else if (variable.taskId) {
      // Presence of taskId means it is a task variable
      return deleteVar
        ? this.variableService.deleteTaskVariable(variable)
        : this.variableService.updateTaskVariables(variable);
    } else {
      // Otherwise it is an execution variable
      return deleteVar
        ? this.variableService.deleteExecutionVariable(variable)
        : this.variableService.updateExecutionVariables(variable);
    }
  }

  override async onRowClick(event: any = {}): Promise<void> {
    if (event.event.target.nodeName !== 'FLUXNOVA-ICON') this.showReadOnlyModal(event);
  }

  public showReadOnlyModal(event: any) {
    this.displayProcessVariableModal({ ...this.getModalValues('Readonly', event.node.rowIndex) });
  }

  public editClicked(rowIndex: number) {
    this.displayProcessVariableModal({
      ...this.getModalValues('Edit', rowIndex),
    }).then((confirmResult?: VariableModalResult) => {
      if (confirmResult?.saved) {
        this.variablesToBeSaved = cloneDeep(this.data);
        this.variablesToBeSaved[rowIndex].value = confirmResult.variableValue;
        this.variablesToBeSaved[rowIndex].valueInfo = confirmResult.valueInfo;
        this.saveClicked();
      }
    });
  }

  private createVariable(variableModalResult: VariableModalResult): Variable {
    return {
      id: '',
      name: variableModalResult.variableName,
      type: FluxnovaVariableTypes[variableModalResult.variableType as keyof typeof FluxnovaVariableTypes],
      valueInfo: variableModalResult.valueInfo,
      value: variableModalResult.variableValue,
      scopeType: VariableScopeType.Process,
      processInstanceId: this.detailItemId,
    };
  }

  override ngOnDestroy() {
    super.ngOnDestroy();
    this.subs.unsubscribe();
    this.processVariableModalService.hide();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  override selectRow(id?: string, property: string = 'id'): void {}

  override onFirstDataRendered() {}

  async displayProcessVariableModal({ variable, modalType, typeOptions, confirmButtonLabel }: VariableOptions) {
    return this.processVariableModalService?.show(
      {
        variable,
        modalType,
        typeOptions,
        confirmButtonLabel,
        allVariables: this.data,
        processInstanceActive: this.isProcessInstanceActive,
      },
      {
        ...MODAL_DEFAULTS,
        modalDialogClass: 'dynamic-modal',
      },
    );
  }

  getDropdownTypes() {
    return Object.values(FluxnovaVariableTypes)
      .filter((type) => type !== 'Bytes')
      .map((value: string) => ({
        value: value,
        name: value,
      }));
  }

  getModalValues(type: 'Add' | 'Edit' | 'Readonly' | 'Delete', rowIndex: number): VariableOptions {
    return {
      variable: this.data[rowIndex],
      modalType: type,
      typeOptions: this.getDropdownTypes(),
      confirmButtonLabel: type === 'Delete' ? 'Delete' : 'Save',
    };
  }
}
