/* eslint-disable max-lines */
import pluralize from 'pluralize';
import { forkJoin, Observable, Observer, of, take, throwError, timer } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  ConfirmModalService,
  ConfirmOptions,
  ConfirmOptionsDynamicContent,
  convertDateToFluxnovaString,
  getTypeString,
  MODAL_DEFAULTS,
  ToastService,
} from '@fxn/common';
import { inject, Injectable } from '@angular/core';
import { Batch, FluxnovaVariableTypes, ItemType, ItemTypeActions } from '@fxn/types';
import { isEmpty } from 'lodash-es';
import { StartProcessDefinitionModalService } from '../detail-pages/process-definition/modals/start-process-definition-modal/start-process-definition-modal-service';
import { DATA_RELOAD_DELAY } from '../common/app-constants';
import { ProcessDefinitionService } from './process-definition.service';
import { ProcessInstanceService } from './process-instance.service';
import { DeploymentService } from './deployment.service';
import { JobService } from './job.service';
import { BatchService } from './support/batch.service';

export interface ConfirmActionCallbacks {
  success: CallableFunction;
  canceled?: CallableFunction;
  error?: CallableFunction;
}

export interface ModalOptions {
  action: string;
  quantity: number;
  type: string;
  readMoreContent?: string[];
  lineItems?: any[];
  customMessage?: string;
  customTitle?: string;
  customButtonLabel?: string;
}

const BASE_MODAL_OPTS = (options: ModalOptions) => ({
  message:
    options.customMessage ??
    `<span><p class="ps-3 mb-2">Are you sure you want to
    ${options.action.toLowerCase()} ${options.quantity > 1 ? options.quantity : 'this'}
    ${pluralize(options.type.toLowerCase(), options.quantity)}?</p></span>`,
  title: options.customTitle ?? `${options.action} ${pluralize(options.type, options.quantity)}`,
  confirmButtonLabel: options.customButtonLabel ?? options.action,
  lineItems: options.lineItems,
  dynamicContent: {
    readMoreContent: options.readMoreContent,
  },
});

export const readMoreDefaults = {
  suspend: [
    `<div class="mt-3">Suspending a process instance means that the execution is stopped, so the
  <i>token state</i> will not change. However, actions that do not change token state,
  like setting or removing variables, etc. will still succeed.</div>`,
    `<div>
<div class="my-3">
Tasks belonging to this process instance will also be suspended. This
means that any actions influencing the tasks' lifecycle will fail, such as
</div>
<div class="my-3">
<!--The reason we use the unicode value for bullet point here is because you can't really style uls with bootstrap-->
<!--to get the padding right, and since we inject this html via [innerHTML] in the modal template, classes/styles from-->
<!--that page don't apply to these elements without running into scope issues. -->
<div><span class="me-1">&#8226;</span> claiming</div>
<div><span class="me-1">&#8226;</span> completing</div>
<div><span class="me-1">&#8226;</span> delegation</div>
<div><span class="me-1">&#8226;</span> changes in task assignees, owners, etc.</div>
</div>
<div class="my-3">Actions that only change task properties will still succeed, such as changing
variables.</div>
<div class="my-3">If a process instance is in the state suspended, the engine will also not
execute jobs associated with this process instance. </div>
<div class="mt-3">If this process instance has a process instance hierarchy, suspending this
process instance from the hierarchy will not suspend other process instances
from that hierarchy.</div>
</div>`,
  ],
  activate: [
    `<div class="mt-3">Activating a process instance means that the execution is running, so the
<i>token state</i> will change.</div>`,
    `
<div class="my-3">Tasks belonging to this process instance will also be activated.</div>
<div class="my-3">If a process instance is in the state active, the engine will also execute jobs
associated with this process instance.</div>
<div class="mt-3">If this process instance has a process instance hierarchy, activating this
process instance from the hierarchy will not activate other process
instances from that hierarchy.</div>
`,
  ],
};

@Injectable({
  providedIn: 'root',
})
export class ConfirmActionService {
  private confirmModalService = inject(ConfirmModalService);
  startInstanceService = inject(StartProcessDefinitionModalService);
  private toastService = inject(ToastService);
  private processDefinitionService = inject(ProcessDefinitionService);
  private processInstanceService = inject(ProcessInstanceService);
  private deploymentService = inject(DeploymentService);
  private jobService = inject(JobService);
  private batchService = inject(BatchService);

  async displayConfirmationModal({
    message,
    lineItems,
    title,
    confirmButtonLabel,
    isBulkTerminate,
    inputs,
    hideCancelButton,
    dynamicContent,
  }: ConfirmOptions) {
    return await this.confirmModalService?.show(
      {
        message: `<span>${message}</span>`,
        lineItems,
        title,
        confirmButtonLabel,
        isBulkTerminate,
        inputs,
        hideCancelButton,
        dynamicContent,
      },
      {
        ...MODAL_DEFAULTS,
        modalDialogClass: 'dynamic-modal',
      },
    );
  }

  public async activateOrSuspendDefinition(ids: string[], action: string, successCallback?: any) {
    const result = await this.displayConfirmationModal({
      ...BASE_MODAL_OPTS({ action: action, quantity: ids.length, type: getTypeString(ItemType.ProcessDefinition) }),
      inputs: {
        checkboxes: [
          {
            label: `${action} all instances of this definition`,
            name: 'includeInstances',
            itemTypeAction:
              action === 'Activate' ? ItemTypeActions.ActivateProcessInstance : ItemTypeActions.SuspendProcessInstance,
          },
        ],
      },
    });

    if (result?.confirmed) {
      return this.handleAction(
        action === 'Activate'
          ? this.processDefinitionService.activateDefinition(ids[0], result.inputs?.includeInstances)
          : this.processDefinitionService.suspendDefinition(ids[0], result.inputs?.includeInstances),
        ItemType.ProcessDefinition,
        action,
        ids[0],
        { success: successCallback },
      );
    }

    return of({ canceled: true });
  }

  async deleteDefinition(ids: string[], successCallback?: any) {
    const action = 'Delete';

    const result = await this.displayConfirmationModal({
      ...BASE_MODAL_OPTS({ action: action, quantity: ids.length, type: getTypeString(ItemType.ProcessDefinition) }),
      inputs: {
        checkboxes: [
          {
            label: 'Include instances, historic instances, and jobs.',
            name: 'cascade',
          },
          {
            label: 'Skip Custom Listeners',
            name: 'skipCustomListeners',
            value: false,
            showInfoBubble: true,
            infoTooltip: 'If the value is enabled, only built-in listeners will be notified with the end event.',
          },
          {
            label: 'Skip IO Mappings',
            name: 'skipIoMappings',
            value: false,
            showInfoBubble: true,
            infoTooltip: 'If the value is enabled, IO mappings will be skipped during process deletion.',
          },
        ],
      },
    });

    if (result?.confirmed) {
      return this.handleAction(
        this.processDefinitionService.deleteDefinition(
          ids[0],
          result?.inputs?.cascade,
          result?.inputs?.skipCustomListeners,
          result?.inputs?.skipIoMappings,
        ),
        ItemType.ProcessDefinition,
        action,
        ids[0],
        { success: successCallback },
      );
    }

    return of({ canceled: true });
  }

  async startProcess(id: string, successCallback?: any) {
    const result = await this.startInstanceService?.show(
      {
        processDefinitionId: id,
        businessKey: '123',
        title: 'Start Process',
        message: 'You can start a process instance with data by entering a valid Start Form request body.',
        jsonValue: 'JSON: none',
        typeOptions: Object.values(FluxnovaVariableTypes).map((value) => ({
          value: value,
          name: value,
        })),
      },
      {
        ...MODAL_DEFAULTS,
        modalDialogClass: 'dynamic-modal',
      },
    );

    if (result?.submitted) {
      if (successCallback) successCallback(result);
      return of(await this.showStartProcessSuccessConfirmation(result.instanceId));
    }

    return of({ canceled: true });
  }

  showStartProcessSuccessConfirmation(instanceId: string) {
    return this.displayConfirmationModal({
      message: `<p class ="ps-3">Process instance started successfully.<br>New process instance id: ${instanceId} </p>`,
      title: 'Start Process',
      confirmButtonLabel: 'Close',
      hideCancelButton: true,
    });
  }

  private handleAction(
    obs: Observable<any>,
    type: ItemType,
    action: string,
    entityIds: string | string[],
    callbacks?: ConfirmActionCallbacks,
    customMessages?: { success: string; failure: string },
    isBulk = false,
  ) {
    const ids = Array.isArray(entityIds) ? entityIds : [entityIds];
    const observer: Observer<any> = {} as Observer<any>;
    const observerCallback = (result?: any) => {
      const successMessage =
        customMessages?.success ||
        (isBulk
          ? `${action} was successful for the selected ${pluralize(getTypeString(type).toLowerCase(), ids.length)}`
          : `${action} ${getTypeString(type).toLowerCase()} was successful for ${ids[0]}`);

      this.toastService.success(successMessage);

      if (callbacks && callbacks.success && (!result || !result.canceled)) {
        timer(DATA_RELOAD_DELAY).subscribe(() => callbacks.success(result));
      }

      return result;
    };

    if (isBulk) {
      observer.complete = observerCallback;
    } else {
      observer.next = observerCallback;
    }

    obs
      .pipe(
        catchError((err) => {
          this.toastService.error(
            err?.error?.cause?.message ||
              err?.error?.message ||
              customMessages?.failure ||
              `Could not ${action.toLowerCase()} ${getTypeString(type).toLowerCase()}.`,
          );

          if (callbacks && callbacks.error) {
            callbacks.error(err);
          }

          return throwError(err);
        }),
      )
      .subscribe(observer);

    return obs;
  }

  async suspendOrActivateInstance(tenantId: string, ids: string[], suspended = false) {
    const actionLabel = suspended ? 'Suspend' : 'Activate';

    const confirmResult = await this.displayConfirmationModal({
      ...BASE_MODAL_OPTS({
        action: actionLabel,
        quantity: ids.length,
        type: getTypeString(ItemType.ProcessInstance),
        readMoreContent: actionLabel === 'Suspend' ? readMoreDefaults.suspend : readMoreDefaults.activate,
      }),
    });

    if (confirmResult?.confirmed) {
      return this.processInstanceService.suspendOrActivate(tenantId, ids, suspended);
    }

    return of({ canceled: true });
  }

  async terminateInstance(tenantId: string, ids: string[]) {
    const confirmResult = await this.displayConfirmationModal({
      ...BASE_MODAL_OPTS({ action: 'Terminate', quantity: ids.length, type: getTypeString(ItemType.ProcessInstance) }),
      isBulkTerminate: ids.length > 1,
      inputs: {
        checkboxes: [
          {
            label: 'Terminate Sub Processes',
            name: 'includeSubprocesses',
            value: true,
          },
          {
            label: 'Skip Custom Listeners',
            name: 'skipCustomListeners',
            value: true,
            showInfoBubble: true,
            infoTooltip: 'If the value is enabled, only built-in listeners will be notified with the end event.',
          },
          {
            label: 'Skip IO Mappings',
            name: 'skipIoMappings',
            value: true,
            showInfoBubble: true,
            infoTooltip: 'If the value is enabled IO mappings will be skipped during process deletion.',
          },
        ],
      },
    });

    if (confirmResult?.confirmed) {
      return this.processInstanceService.terminate(tenantId, {
        processInstanceIds: ids,
        failIfNotExists: false,
        deleteReason: confirmResult.reason || '',
        skipCustomListeners: confirmResult.inputs?.skipCustomListeners || false,
        skipIoMappings: confirmResult.inputs?.skipIoMappings || false,
        skipSubprocesses: !confirmResult.inputs?.includeSubprocesses || false,
      });
    }

    return of({ canceled: true });
  }

  async deleteDeployment(ids: string[], successCallback?: any) {
    const action = 'Delete';

    const result = await this.displayConfirmationModal({
      ...BASE_MODAL_OPTS({ action: action, quantity: ids.length, type: getTypeString(ItemType.Deployment) }),
      inputs: {
        checkboxes: [
          {
            label: 'Include instances, historic instances, and jobs.',
            name: 'cascade',
          },
          {
            label: 'Skip Custom Listeners',
            name: 'skipCustomListeners',
            value: true,
            showInfoBubble: true,
            infoTooltip: 'If the value is enabled, only built-in listeners will be notified with the end event.',
          },
          {
            label: 'Skip IO Mappings',
            name: 'skipIoMappings',
            value: true,
            showInfoBubble: true,
            infoTooltip: 'If the value is enabled IO mappings will be skipped during process deletion.',
          },
        ],
      },
    });

    if (result?.confirmed) {
      return this.handleAction(
        this.deploymentService.deleteDeployment(
          ids[0],
          result?.inputs?.cascade,
          result?.inputs?.skipCustomListeners,
          result?.inputs?.skipIoMappings,
        ),
        ItemType.Deployment,
        action,
        ids[0],
        { success: successCallback },
      );
    }

    return of({ canceled: true });
  }

  async suspendOrActivateJob(ids: string[], action: string, lineItems: any[], successCallback?: any) {
    const result = await this.displayConfirmationModal({
      ...BASE_MODAL_OPTS({
        action: action,
        quantity: ids.length,
        type: getTypeString(ItemType.Job),
        lineItems: lineItems,
      }),
    });

    if (result?.confirmed) {
      // Can't use HandleAction here because jobs need special treatment
      return this.handleSuspendOrActivateJob(
        action,
        ItemType.Job,
        { suspended: action === 'Suspend' },
        ids,
        successCallback,
      );
    }

    return of({ canceled: true });
  }

  async suspendOrActivateJobDefinition(ids: string[], action: string, lineItems: any[], successCallback?: any) {
    const actionPastTense = action === 'Activate' ? 'Activated' : 'Suspended';
    const result = await this.displayConfirmationModal({
      ...BASE_MODAL_OPTS({
        action: action,
        quantity: ids.length,
        type: getTypeString(ItemType.JobDefinition),
        lineItems: lineItems,
        customMessage: `<p class="ps-3">Are you sure you want to ${action.toLowerCase()} ${ids.length > 1 ? ids.length : 'this'} job definition${ids.length > 1 ? 's' : ''}?
                        This means any new jobs created from ${ids.length > 1 ? 'these definitions' : 'this definition'} will also be initially ${actionPastTense.toLowerCase()}.</p>`,
      }),
      inputs: {
        checkboxes: [
          {
            label: 'Include Existing Jobs',
            name: 'includeExistingJobs',
            value: true,
            showInfoBubble: true,
            infoTooltip: `All existing instances of this job definition will be ${actionPastTense.toLowerCase()} as well.`,
            itemTypeAction: action === 'Activate' ? ItemTypeActions.ActivateJob : ItemTypeActions.SuspendJob,
          },
        ],
        radioButtons: [
          {
            label: 'Execute Immediately',
            name: 'executeImmediately',
            defaultOption: true,
            showInfoBubble: true,
            infoTooltip: `${action}s the job definition immediately.`,
          },
          {
            label: 'Delay Execution',
            name: 'delayExecution',
            showInfoBubble: true,
            infoTooltip: `${action}s the job definition on a specified date.`,
            controlsDynamicContent: true,
          },
        ],
      },
      dynamicContent: {
        inputs: {
          dateSelector: true,
        },
      },
    });

    if (result?.confirmed) {
      const includeJobs = result.inputs?.includeExistingJobs;
      const executionDate =
        result.selectedRadioOption === 'delayExecution'
          ? convertDateToFluxnovaString(result.selectedDate as Date)
          : undefined;
      // Can't use HandleAction here because jobs need special treatment
      return this.handleSuspendOrActivateJob(
        action,
        ItemType.JobDefinition,
        { suspended: action === 'Suspend', includeJobs, executionDate },
        ids,
        successCallback,
      );
    }

    return of({ canceled: true });
  }

  handleSuspendOrActivateJob(
    action: string,
    type: ItemType,
    options: { suspended: boolean; includeJobs?: boolean; executionDate?: string },
    jobIds: string[],
    successCallback?: any,
  ) {
    // Fluxnova doesn't have an endpoint for suspending multiple jobs, so individual calls are made per id.
    forkJoin(
      jobIds.map((id) => {
        const serviceMethod = type === ItemType.Job ? 'updateSuspendStatus' : 'updateDefinitionSuspendStatus';
        return this.jobService[serviceMethod](id, options).pipe(
          map((val) => ({
            // track failed and successful requests
            id,
            success: true,
            payload: val,
          })),
          catchError((err) =>
            of({
              id,
              success: false,
              payload: err,
            }),
          ),
        );
      }),
    )
      .pipe(
        map((res) => ({
          // separate failed and successful requests
          successReqs: res
            .filter((ob) => ob.success)
            .map((ob) => ({
              id: ob.id,
              result: ob.payload,
            })),
          failReqs: res
            .filter((ob) => !ob.success)
            .map((ob) => ({
              id: ob.id,
              error: ob.payload,
            })),
        })),
      )
      .subscribe(({ successReqs, failReqs }) => {
        if (!isEmpty(successReqs) && !isEmpty(failReqs)) {
          this.toastService.success(
            `${getTypeString(type)} ${action} succeeded for ${successReqs.length} ${getTypeString(type).toLowerCase()}s`,
          );
          this.toastService.error(
            `${getTypeString(type)} ${action} failed for ${failReqs.length} ${getTypeString(type).toLowerCase()}s`,
          );
          timer(DATA_RELOAD_DELAY).subscribe(() => successCallback(options.executionDate !== undefined));
        } else if (!isEmpty(failReqs)) {
          this.toastService.error(
            `${getTypeString(type)} ${action} failed for all ${getTypeString(type).toLowerCase()}s`,
          );
        } else {
          this.toastService.success(
            `${getTypeString(type)} ${action} succeeded for all ${getTypeString(type).toLowerCase()}s`,
          );
          timer(DATA_RELOAD_DELAY).subscribe(() => successCallback(options.executionDate !== undefined));
        }
      });
  }

  async retryJob(tenantId: string, ids: string[], lineItems: any[], successCallback?: any) {
    const action = 'Retry';
    const result = await this.displayConfirmationModal({
      ...BASE_MODAL_OPTS({
        action: action,
        quantity: ids.length,
        type: getTypeString(ItemType.Job),
        lineItems: lineItems,
        customMessage: `<p class="ps-3">Set the retry count of the following jobs:</p>`,
        customTitle: 'Set Retry Count',
        customButtonLabel: 'Set Count',
      }),
      inputs: {
        numberInput: {
          label: 'Set Count',
          name: 'retry',
          min: 1,
          max: 9,
          showInfoBubble: true,
          infoTooltip: 'Sets the retries of the job to the given number.',
        },
        radioButtons: [
          {
            label: 'Keep due date',
            name: 'keepDueDate',
            defaultOption: true,
            showInfoBubble: true,
            infoTooltip: 'Keep the previous due date of the job.',
          },
          {
            label: 'Set due date',
            name: 'setDueDate',
            showInfoBubble: true,
            infoTooltip: 'Choose a due date for the job.',
            controlsDynamicContent: true,
          },
        ],
      },
      dynamicContent: {
        inputs: {
          dateSelector: true,
        },
      },
    });

    if (result?.confirmed) {
      const userRetries = result.numberInput ?? 0;
      const selectedDate =
        result.selectedRadioOption === 'setDueDate'
          ? convertDateToFluxnovaString(result.selectedDate as Date)
          : undefined;
      this.jobService
        .updateJobRetries(tenantId, ids, userRetries, selectedDate)
        .pipe(take(1))
        .subscribe(() => {
          timer(DATA_RELOAD_DELAY).subscribe(() => successCallback());
        });
    }

    return of({ canceled: true });
  }

  async deleteJob(id: string, lineItems: any[], successCallback?: any) {
    const action = 'Delete';
    const result = await this.displayConfirmationModal({
      ...BASE_MODAL_OPTS({ action: action, quantity: 1, type: getTypeString(ItemType.Job), lineItems: lineItems }),
    });
    if (result?.confirmed) {
      this.handleAction(this.jobService.deleteJob(id), ItemType.Job, action, id, { success: successCallback });
    }

    return of({ canceled: true });
  }

  async changeJobDueDate(id: string, lineItems: any[], successCallback?: any) {
    const action = 'Change';

    const result = await this.displayConfirmationModal({
      ...BASE_MODAL_OPTS({
        action: action,
        quantity: 1,
        type: getTypeString(ItemType.Job),
        lineItems: lineItems,
        customMessage: `<p class="ps-3">Select one of the options below to change this job's due date:</p>`,
        customTitle: `Change Job Due Date`,
      }),
      inputs: {
        radioButtons: [
          {
            label: 'Recalculate from creation time',
            name: 'creationDate',
            defaultOption: true,
            showInfoBubble: true,
            infoTooltip:
              "Recalculate the due date using the expression defined in the BPMN. If this expression is defined, it will be reevaluated using the job's creation time; if not, this recalculation will fail.",
          },
          {
            label: 'Recalculate from current time',
            name: 'currentDate',
            showInfoBubble: true,
            infoTooltip:
              'Recalculate the due date using the expression defined in the BPMN. If this expression is defined, it will be reevaluated using the current time; if not, this recalculation will fail.',
          },
          {
            label: 'Set a specific date',
            name: 'specificDate',
            showInfoBubble: true,
            infoTooltip:
              'Override the current due date with a specific date set by you. Expressions defined in the BPMN will not be evaluated.',
            controlsDynamicContent: true,
          },
        ],
      },
      dynamicContent: {
        inputs: {
          checkboxes: [
            {
              label: 'Cascade',
              name: 'cascade',
              value: true,
              showInfoBubble: true,
              infoTooltip: 'Apply change to subsequent jobs.',
            },
          ],
          dateSelector: true,
        },
      },
    });

    if (result?.confirmed) {
      const cascade = result.inputs?.cascade ?? false;
      if (result.selectedRadioOption === 'specificDate' && result.selectedDate) {
        return this.handleAction(
          this.jobService.setJobDueDate(id, convertDateToFluxnovaString(result.selectedDate), cascade),
          ItemType.Job,
          action,
          id,
          { success: successCallback },
          {
            success: `Successfully set due date for job ${id}`,
            failure: `Could not set due date for job ${id}`,
          },
        );
      } else {
        return this.handleAction(
          this.jobService.recalculateJobDueDate(id, result.selectedRadioOption === 'creationDate'),
          ItemType.Job,
          action,
          id,
          { success: successCallback },
          {
            success: `Successfully recalculated due date for job ${id}`,
            failure: `Could not recalculate due date for job ${id}`,
          },
        );
      }
    }

    return of({ canceled: true });
  }

  async setJobDefinitionPriority(id: string, lineItems: any[], priorityIsSet: boolean, successCallback?: any) {
    const action = 'Change';

    const persistentInputs: ConfirmOptionsDynamicContent['inputs'] = {
      numberInput: {
        label: 'Priority',
        name: 'priority',
        min: Number.MIN_SAFE_INTEGER,
        max: Number.MAX_SAFE_INTEGER,
        showInfoBubble: true,
        infoTooltip:
          'The new priority set for jobs created from this definition. This new priority overrides any setting specified in the BPMN 2.0 XML.',
      },
      // TODO: Re-enable when the Fluxnova API bug is fixed so that this parameter works again
      // checkboxes: [
      //   {
      //     label: 'Include Existing Jobs',
      //     name: 'includeJobs',
      //     value: false,
      //     showInfoBubble: true,
      //     infoTooltip:
      //       'Including jobs means that all existing jobs of the given definition will receive this priority as well.',
      //     permissions: 'ChangeJobDueDate',
      //   },
      // ],
    };

    const result = await this.displayConfirmationModal({
      ...BASE_MODAL_OPTS({
        action: action,
        quantity: 1,
        type: getTypeString(ItemType.Job),
        lineItems: lineItems,
        customMessage: `<p class="ps-3">Change the overriding priority for jobs created from this definition.</p>`,
        customTitle: `Change Overriding Job Priority`,
      }),
      inputs: priorityIsSet
        ? {
            radioButtons: [
              {
                label: 'Clear Overriding Job Priority',
                name: 'clearJobPriority',
                showInfoBubble: true,
                infoTooltip: 'Clears any previously set overriding priority on the selected job definition.',
              },
              {
                label: 'Set Overriding Job Priority',
                name: 'setJobPriority',
                defaultOption: true,
                showInfoBubble: true,
                infoTooltip:
                  'Sets an overriding job priority on any new or active jobs created from this job definition.',
                controlsDynamicContent: true,
              },
            ],
          }
        : persistentInputs,
      dynamicContent: {
        inputs: priorityIsSet ? persistentInputs : undefined,
      },
    });

    if (result?.confirmed) {
      const includeJobs = result.inputs?.includeJobs ?? false;
      const priority =
        priorityIsSet && result.selectedRadioOption === 'clearJobPriority' ? null : (result.numberInput ?? 0);

      return this.handleAction(
        this.jobService.setJobDefinitionPriority(id, priority, includeJobs),
        ItemType.JobDefinition,
        action,
        id,
        { success: successCallback },
        {
          success: `Successfully changed overriding job priority for job definition ${id}`,
          failure: `Could not change overriding job priority for job definition ${id}`,
        },
      );
    }

    return of({ canceled: true });
  }

  async activateOrSuspendBatch(id: string, suspended: boolean, callbacks: ConfirmActionCallbacks) {
    const action = suspended ? 'Activate' : 'Suspend';

    const result = await this.displayConfirmationModal({
      ...BASE_MODAL_OPTS({
        action: action,
        quantity: 1,
        type: getTypeString(ItemType.Batch),
      }),
    });

    if (result?.confirmed) {
      return this.handleAction(this.batchService.suspend(id || '', !suspended), ItemType.Batch, action, id, callbacks);
    } else if (callbacks && callbacks.canceled) {
      callbacks.canceled(result);
    }

    return of({ canceled: true });
  }

  async activateOrSuspendBatches(ids: string[], suspended: boolean, callbacks: ConfirmActionCallbacks) {
    const action = suspended ? 'Activate' : 'Suspend';

    const result = await this.displayConfirmationModal({
      ...BASE_MODAL_OPTS({
        action: action,
        quantity: ids.length,
        lineItems: ids.map((id) => ({ id })),
        type: getTypeString(ItemType.Batch),
      }),
    });

    if (result?.confirmed) {
      this.handleAction(
        this.batchService.suspendMultiple(ids, !suspended),
        ItemType.Batch,
        action,
        ids,
        callbacks,
        undefined,
        true,
      );
    } else if (callbacks && callbacks.canceled) {
      callbacks.canceled(result);
    }
  }

  async retryJobsForBatches(
    batchAndJobDefinitionIds: { batchId: string; batchJobDefinitionId: string }[],
    callbacks: ConfirmActionCallbacks,
  ) {
    const action = 'Retry';

    const result = await this.displayConfirmationModal({
      ...BASE_MODAL_OPTS({
        customMessage: `<span><p class="ps-3 mb-2">Are you sure you want to retry jobs for ${batchAndJobDefinitionIds.length} ${pluralize('batch', batchAndJobDefinitionIds.length)}?</p></span>`,
        action,
        quantity: batchAndJobDefinitionIds.length,
        lineItems: batchAndJobDefinitionIds.map((row) => ({
          id: `${row.batchId}`,
        })),
        type: `${pluralize(getTypeString(ItemType.JobDefinition), batchAndJobDefinitionIds.length)} for Batch`,
      }),
    });

    const jobDefinitionIds = batchAndJobDefinitionIds.map((row) => row.batchJobDefinitionId);

    if (result?.confirmed) {
      this.handleAction(
        this.jobService.retryJobsByDefinitions(jobDefinitionIds),
        ItemType.JobDefinition,
        action,
        jobDefinitionIds,
        callbacks,
        undefined,
        true,
      );
    } else if (callbacks && callbacks.canceled) {
      callbacks.canceled(result);
    }
  }

  async retryJobsForBatch(batchJobDefinitionId: string, callbacks: ConfirmActionCallbacks) {
    const action = 'Retry';

    const result = await this.displayConfirmationModal({
      ...BASE_MODAL_OPTS({
        action,
        quantity: 1,
        type: `${getTypeString(ItemType.JobDefinition)} for Batch`,
      }),
    });

    if (result?.confirmed) {
      return this.handleAction(
        this.jobService.retryJobsByDefinition(batchJobDefinitionId as string),
        ItemType.JobDefinition,
        action,
        batchJobDefinitionId,
        callbacks,
      );
    } else if (callbacks && callbacks.canceled) {
      callbacks.canceled(result);
    }

    return of({ canceled: true });
  }

  async deleteBatch(id: string, batch: Batch, callbacks: ConfirmActionCallbacks) {
    const cascadeOption = {
      checkboxes: [{ label: 'Delete the historic batch and historic job logs.', name: 'cascade' }],
    };
    const action = 'Delete';

    const result = await this.displayConfirmationModal({
      ...BASE_MODAL_OPTS({
        action,
        quantity: 1,
        type: getTypeString(ItemType.Batch),
      }),
      inputs: batch.endTime ? undefined : cascadeOption,
    });

    if (result?.confirmed) {
      return this.handleAction(
        batch.endTime
          ? this.batchService.deleteHistoric(id)
          : this.batchService.delete(id, result?.inputs?.cascade || false),
        ItemType.Batch,
        action,
        id,
        callbacks,
      );
    } else if (callbacks && callbacks.canceled) {
      callbacks.canceled(result);
    }

    return of({ canceled: true });
  }

  async deleteBatches(ids: string[], completedBatches: boolean, callbacks: ConfirmActionCallbacks) {
    const action = 'Delete';

    const cascadeOption = {
      checkboxes: [{ label: 'Delete the historic batch and historic job logs.', name: 'cascade' }],
    };
    const result = await this.displayConfirmationModal({
      ...BASE_MODAL_OPTS({
        action,
        quantity: ids.length,
        lineItems: ids.map((id) => ({ id })),
        type: getTypeString(ItemType.Batch),
      }),
      inputs: completedBatches ? undefined : cascadeOption,
    });

    if (result?.confirmed) {
      this.handleAction(
        completedBatches
          ? this.batchService.deleteMultipleHistoric(ids)
          : this.batchService.deleteMultiple(ids, result?.inputs?.cascade || false),
        ItemType.Batch,
        action,
        ids,
        callbacks,
        undefined,
        true,
      );
    } else if (callbacks && callbacks.canceled) {
      callbacks.canceled(result);
    }
  }
}
