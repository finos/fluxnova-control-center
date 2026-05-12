/* eslint-disable max-lines */
import {
  ConfirmModalService,
  convertDateToFluxnovaString,
  MODAL_DEFAULTS,
  ModalResult,
  ToastService,
} from '@fxn/common';
import { firstValueFrom, Observable, of, throwError } from 'rxjs';
import pluralize from 'pluralize';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, Mocked, vi } from 'vitest';
import { StartProcessDefinitionModalService } from '../detail-pages/process-definition/modals/start-process-definition-modal/start-process-definition-modal-service';
import { StartProcessDefinitionModalResult } from '../detail-pages/process-definition/modals/start-process-definition-modal/start-process-definition-modal.component';
import { DATA_RELOAD_DELAY } from '../common/app-constants';
import { ProcessDefinitionService } from './process-definition.service';
import { ConfirmActionCallbacks, ConfirmActionService, readMoreDefaults } from './confirm-action.service';
import { ProcessInstanceService } from './process-instance.service';
import { DeploymentService } from './deployment.service';
import { JobService } from './job.service';
import { BatchService } from './support/batch.service';

const mockDefinitionService = {
  activateDefinition: vi.fn().mockReturnValue(of({})),
  suspendDefinition: vi.fn().mockReturnValue(of({})),
  deleteDefinition: vi.fn().mockReturnValue(of({})),
  submitStartFormWithDefinitionId: vi.fn().mockReturnValue(of({})),
} as unknown as Mocked<ProcessDefinitionService>;

const mockInstanceService = {
  terminate: vi.fn().mockReturnValue(of({})),
  suspendOrActivate: vi.fn().mockReturnValue(of({})),
} as unknown as Mocked<ProcessInstanceService>;

const mockDeploymentService = {
  deleteDeployment: vi.fn().mockReturnValue(of({})),
} as unknown as Mocked<DeploymentService>;

const mockJobService = {
  updateDefinitionSuspendStatus: vi.fn().mockReturnValue(of({})),
  updateSuspendStatus: vi.fn().mockReturnValue(of({})),
  recalculateJobDueDate: vi.fn().mockReturnValue(of({})),
  setJobDueDate: vi.fn().mockReturnValue(of({})),
  updateJobRetries: vi.fn().mockReturnValue(of({ id: 'batchId' })),
  deleteJob: vi.fn().mockReturnValue(of({})),
  batchStatistics: vi.fn().mockReturnValue(of({})),
  setJobDefinitionPriority: vi.fn().mockReturnValue(of({})),
  retryJobsByDefinition: vi.fn().mockReturnValue(of({})),
  retryJobsByDefinitions: vi.fn().mockReturnValue(of({ success: [], failure: [] })),
} as unknown as Mocked<JobService>;

const mockModalService: Mocked<ConfirmModalService> = {
  show: vi.fn(() => Promise.resolve({ confirmed: true })),
  close: vi.fn(),
} as unknown as Mocked<ConfirmModalService>;

const mockSPModalService = {
  show: vi.fn(() => Promise.resolve({ confirmed: true })),
  close: vi.fn(),
} as unknown as Mocked<StartProcessDefinitionModalService>;
const mockToastService = {
  success: vi.fn(),
  error: vi.fn(),
} as unknown as Mocked<ToastService>;

const mockBatchService = {
  deleteHistoric: vi.fn().mockReturnValue(of(undefined)),
  delete: vi.fn().mockReturnValue(of(undefined)),
  deleteMultiple: vi.fn().mockReturnValue(of(undefined)),
  deleteMultipleHistoric: vi.fn().mockReturnValue(of(undefined)),
  suspend: vi.fn().mockReturnValue(of(undefined)),
  suspendMultiple: vi.fn().mockReturnValue(of(undefined)),
} as unknown as Mocked<BatchService>;

describe('ConfirmActionService', () => {
  let component: ConfirmActionService;

  const callbacks = {
    success: vi.fn(),
    error: vi.fn(),
    canceled: vi.fn(),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: ConfirmModalService, useValue: mockModalService },
        { provide: StartProcessDefinitionModalService, useValue: mockSPModalService },
        { provide: ToastService, useValue: mockToastService },
        { provide: ProcessDefinitionService, useValue: mockDefinitionService },
        { provide: ProcessInstanceService, useValue: mockInstanceService },
        { provide: DeploymentService, useValue: mockDeploymentService },
        { provide: JobService, useValue: mockJobService },
        { provide: BatchService, useValue: mockBatchService },
      ],
    });

    component = TestBed.inject(ConfirmActionService);
    component.displayConfirmationModal = vi.fn().mockResolvedValue({ confirmed: true });

    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => vi.useRealTimers());

  it('should call modalService.show', async () => {
    component.displayConfirmationModal = (
      await vi.importActual<typeof import('./confirm-action.service')>('./confirm-action.service')
    ).ConfirmActionService.prototype.displayConfirmationModal;

    await component.displayConfirmationModal({
      message: 'hello',
    });

    expect(mockModalService.show).toHaveBeenCalledWith(
      {
        message: '<span>hello</span>',
        confirmButtonLabel: undefined,
        hideCancelButton: undefined,
        inputs: undefined,
        isBulkTerminate: undefined,
        jobRetries: undefined,
        lineItems: undefined,
        title: undefined,
      },
      {
        ...MODAL_DEFAULTS,
        modalDialogClass: 'dynamic-modal',
      },
    );
  });

  describe('for process definition suspend', () => {
    it('should open a confirmation modal when attempting to suspend', () => {
      component.activateOrSuspendDefinition(['asdf'], 'Suspend');

      expect(component.displayConfirmationModal).toHaveBeenCalledWith({
        confirmButtonLabel: 'Suspend',
        dynamicContent: {
          readMoreContent: undefined,
        },
        lineItems: undefined,
        message: `<span><p class="ps-3 mb-2">Are you sure you want to
    suspend this
    process definition?</p></span>`,
        title: 'Suspend Process Definition',
        inputs: {
          checkboxes: [
            {
              label: 'Suspend all instances of this definition',
              name: 'includeInstances',
              itemTypeAction: 'SuspendProcessInstance',
            },
          ],
        },
      });
    });

    it('should call the suspend service when action is confirmed', async () => {
      component.displayConfirmationModal = vi.fn(() => Promise.resolve(<ModalResult>{ confirmed: true }));

      await component.activateOrSuspendDefinition(['asdf'], 'Suspend');

      expect(mockDefinitionService.suspendDefinition).toHaveBeenCalledWith('asdf', undefined);
    });

    it('should return {canceled: true} when the action is canceled', async () => {
      component.displayConfirmationModal = vi.fn(() => Promise.resolve(<ModalResult>{ confirmed: false }));

      const activateOrSuspendResult = await component.activateOrSuspendDefinition(['asdf'], 'Suspend');
      const firstValue = await firstValueFrom(activateOrSuspendResult);

      expect(mockDefinitionService.suspendDefinition).not.toHaveBeenCalled();
      expect(firstValue.canceled).toBe(true);
    });
  });

  describe('for process definition activate', () => {
    it('should open a confirmation modal when attempting to activate', () => {
      component.activateOrSuspendDefinition(['asdf'], 'Activate');

      expect(component.displayConfirmationModal).toHaveBeenCalledWith({
        confirmButtonLabel: 'Activate',
        dynamicContent: {
          readMoreContent: undefined,
        },
        lineItems: undefined,
        message: `<span><p class="ps-3 mb-2">Are you sure you want to
    activate this
    process definition?</p></span>`,
        title: 'Activate Process Definition',
        inputs: {
          checkboxes: [
            {
              label: 'Activate all instances of this definition',
              name: 'includeInstances',
              itemTypeAction: 'ActivateProcessInstance',
            },
          ],
        },
      });
    });

    it('should call the activate service when action is confirmed', async () => {
      component.displayConfirmationModal = vi.fn(() => Promise.resolve(<ModalResult>{ confirmed: true }));

      await component.activateOrSuspendDefinition(['asdf'], 'Activate');

      expect(mockDefinitionService.activateDefinition).toHaveBeenCalledWith('asdf', undefined);
    });

    it('should return {canceled: true} when the action is canceled', async () => {
      component.displayConfirmationModal = vi.fn(() => Promise.resolve(<ModalResult>{ confirmed: false }));

      const activateOrSuspendResult = await component.activateOrSuspendDefinition(['asdf'], 'Activate');
      const firstValue = await firstValueFrom(activateOrSuspendResult);

      expect(mockDefinitionService.activateDefinition).not.toHaveBeenCalled();
      expect(firstValue.canceled).toBe(true);
    });
  });

  describe('for process definition delete', () => {
    it('should open a confirmation modal when attempting to delete', () => {
      component.deleteDefinition(['asdf']);

      expect(component.displayConfirmationModal).toHaveBeenCalledWith({
        confirmButtonLabel: 'Delete',
        dynamicContent: {
          readMoreContent: undefined,
        },
        lineItems: undefined,
        message: `<span><p class="ps-3 mb-2">Are you sure you want to
    delete this
    process definition?</p></span>`,
        title: 'Delete Process Definition',
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
    });

    it('should call the delete service when action is confirmed', async () => {
      component.displayConfirmationModal = vi.fn(() => Promise.resolve(<ModalResult>{ confirmed: true }));

      await component.deleteDefinition(['asdf']);

      expect(mockDefinitionService.deleteDefinition).toHaveBeenCalledWith('asdf', undefined, undefined, undefined);
    });

    it('should return {canceled: true} when the action is canceled', async () => {
      component.displayConfirmationModal = vi.fn(() => Promise.resolve(<ModalResult>{ confirmed: false }));

      const deleteResult = await component.deleteDefinition(['asdf']);
      const firstValue = await firstValueFrom(deleteResult);

      expect(mockDefinitionService.deleteDefinition).not.toHaveBeenCalled();
      expect(firstValue.canceled).toBe(true);
    });
  });

  describe('for process definition start process', () => {
    it('should open the start process modal when attempting to start a process', () => {
      component.startProcess('asdf');

      expect(mockSPModalService.show).toHaveBeenCalledWith(
        {
          processDefinitionId: 'asdf',
          businessKey: '123',
          title: 'Start Process',
          message: 'You can start a process instance with data by entering a valid Start Form request body.',
          jsonValue: 'JSON: none',
          typeOptions: expect.arrayContaining([
            expect.objectContaining({
              name: expect.any(String),
              value: expect.any(String),
            }),
          ]),
        },
        {
          ...MODAL_DEFAULTS,
          modalDialogClass: 'dynamic-modal',
        },
      );
    });

    it('should show a success modal when process started successfully', async () => {
      mockSPModalService.show.mockImplementation(() =>
        Promise.resolve({ submitted: true, instanceId: 'asdf' } as unknown as StartProcessDefinitionModalResult),
      );

      await component.startProcess('asdf');

      expect(component.displayConfirmationModal).toHaveBeenCalledWith({
        message: `<p class ="ps-3">Process instance started successfully.<br>New process instance id: asdf </p>`,
        title: 'Start Process',
        confirmButtonLabel: 'Close',
        hideCancelButton: true,
      });
    });

    it('should return {canceled: true} when the action is canceled', async () => {
      mockSPModalService.show.mockImplementation(() =>
        Promise.resolve(<StartProcessDefinitionModalResult>{ submitted: false }),
      );

      const startProcessResult = await component.startProcess('asdf');
      const firstValue = await firstValueFrom(startProcessResult as Observable<{ canceled: boolean }>);

      expect(mockDefinitionService.submitStartFormWithDefinitionId).not.toHaveBeenCalled();
      expect(firstValue.canceled).toBe(true);
    });
  });

  describe('for process instance suspendOrActivate', () => {
    it('should open a confirmation modal', () => {
      component.suspendOrActivateInstance('test-tenant-id', ['asdf'], true);

      expect(component.displayConfirmationModal).toHaveBeenCalledWith({
        confirmButtonLabel: 'Suspend',
        dynamicContent: {
          readMoreContent: readMoreDefaults.suspend,
        },
        lineItems: undefined,
        message: `<span><p class="ps-3 mb-2">Are you sure you want to
    suspend this
    process instance?</p></span>`,
        title: 'Suspend Process Instance',
      });
    });

    it('should call the suspendOrActivate service when action is confirmed', async () => {
      const tenantId = 'test-tenant-id';
      component.displayConfirmationModal = vi.fn(() => Promise.resolve(<ModalResult>{ confirmed: true }));

      await component.suspendOrActivateInstance(tenantId, ['asdf'], true);

      expect(mockInstanceService.suspendOrActivate).toHaveBeenCalledWith(tenantId, ['asdf'], true);
    });

    it('should return {canceled: true} when the action is canceled', async () => {
      component.displayConfirmationModal = vi.fn(() => Promise.resolve(<ModalResult>{ confirmed: false }));

      const suspendOrActivateResult = await component.suspendOrActivateInstance('test-tenant-id', ['asdf'], true);
      const firstValue = await firstValueFrom(suspendOrActivateResult);

      expect(mockInstanceService.terminate).not.toHaveBeenCalled();
      expect(firstValue.canceled).toBe(true);
    });
  });

  describe('for process instance terminate', () => {
    it('should open a confirmation modal', () => {
      component.terminateInstance('test-tenant-id', ['adsf']);

      expect(component.displayConfirmationModal).toHaveBeenCalledWith({
        confirmButtonLabel: 'Terminate',
        dynamicContent: {
          readMoreContent: undefined,
        },
        lineItems: undefined,
        message: `<span><p class="ps-3 mb-2">Are you sure you want to
    terminate this
    process instance?</p></span>`,
        title: 'Terminate Process Instance',
        isBulkTerminate: false,
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
    });

    it('should call the terminate service when action is confirmed', async () => {
      const tenantId = 'test-tenant-id';
      component.displayConfirmationModal = vi.fn(() => Promise.resolve(<ModalResult>{ confirmed: true }));

      await component.terminateInstance(tenantId, ['asdf']);

      expect(mockInstanceService.terminate).toHaveBeenCalledWith(tenantId, {
        processInstanceIds: ['asdf'],
        failIfNotExists: false,
        deleteReason: '',
        skipCustomListeners: false,
        skipIoMappings: false,
        skipSubprocesses: true,
      });
    });

    it('should return {canceled: true} when the action is canceled', async () => {
      component.displayConfirmationModal = vi.fn(() => Promise.resolve(<ModalResult>{ confirmed: false }));

      const terminateResult = await component.terminateInstance('test-tenant-id', ['asdf']);
      const firstValue = await firstValueFrom(terminateResult);

      expect(mockInstanceService.terminate).not.toHaveBeenCalled();
      expect(firstValue.canceled).toBe(true);
    });
  });

  describe('for deployment delete', () => {
    it('should open a confirmation modal', () => {
      component.deleteDeployment(['adsf']);

      expect(component.displayConfirmationModal).toHaveBeenCalledWith({
        confirmButtonLabel: 'Delete',
        dynamicContent: {
          readMoreContent: undefined,
        },
        lineItems: undefined,
        message: `<span><p class="ps-3 mb-2">Are you sure you want to
    delete this
    deployment?</p></span>`,
        title: 'Delete Deployment',
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
    });

    it('should call the delete service when action is confirmed', async () => {
      component.displayConfirmationModal = vi.fn(() =>
        Promise.resolve(<ModalResult>{
          confirmed: true,
          inputs: { cascade: false, skipCustomListeners: true, skipIoMappings: true },
        }),
      );

      await component.deleteDeployment(['asdf']);

      expect(mockDeploymentService.deleteDeployment).toHaveBeenCalledWith('asdf', false, true, true);
    });

    it('should return {canceled: true} when the action is canceled', async () => {
      component.displayConfirmationModal = vi.fn(() => Promise.resolve(<ModalResult>{ confirmed: false }));

      const deleteResult = await component.deleteDeployment(['asdf']);
      const firstValue = await firstValueFrom(deleteResult);

      expect(mockDeploymentService.deleteDeployment).not.toHaveBeenCalled();
      expect(firstValue.canceled).toBe(true);
    });

    it('should handle error', async () => {
      mockDeploymentService.deleteDeployment.mockReturnValueOnce(throwError(() => new Error('Delete failed')));
      component.displayConfirmationModal = vi.fn(() =>
        Promise.resolve(<ModalResult>{
          confirmed: true,
          inputs: { cascade: false, skipCustomListeners: true, skipIoMappings: true },
        }),
      );

      const observable = await component.deleteDeployment(['asdf']);
      observable.subscribe();

      await expect(vi.runAllTimersAsync()).rejects.toThrowError('Delete failed');
    });
  });

  describe('for job definition suspendOrActivate', () => {
    it('should open a confirmation modal for suspend', () => {
      component.suspendOrActivateJobDefinition(['asdf'], 'Suspend', [], true);

      expect(component.displayConfirmationModal).toHaveBeenCalledWith({
        confirmButtonLabel: 'Suspend',
        dynamicContent: {
          inputs: {
            dateSelector: true,
          },
        },
        inputs: {
          checkboxes: [
            {
              label: 'Include Existing Jobs',
              name: 'includeExistingJobs',
              value: true,
              showInfoBubble: true,
              infoTooltip: `All existing instances of this job definition will be suspended as well.`,
              itemTypeAction: 'SuspendJob',
            },
          ],
          radioButtons: [
            {
              label: 'Execute Immediately',
              name: 'executeImmediately',
              defaultOption: true,
              showInfoBubble: true,
              infoTooltip: `Suspends the job definition immediately.`,
            },
            {
              label: 'Delay Execution',
              name: 'delayExecution',
              showInfoBubble: true,
              infoTooltip: `Suspends the job definition on a specified date.`,
              controlsDynamicContent: true,
            },
          ],
        },
        jobRetries: undefined,
        lineItems: [],
        message: `<p class="ps-3">Are you sure you want to suspend this job definition?
                        This means any new jobs created from this definition will also be initially suspended.</p>`,
        title: 'Suspend Job Definition',
      });
    });

    it('should open a confirmation modal for activate', () => {
      component.suspendOrActivateJobDefinition(['asdf'], 'Activate', [], true);

      expect(component.displayConfirmationModal).toHaveBeenCalledWith({
        confirmButtonLabel: 'Activate',
        dynamicContent: {
          inputs: {
            dateSelector: true,
          },
        },
        inputs: {
          checkboxes: [
            {
              label: 'Include Existing Jobs',
              name: 'includeExistingJobs',
              value: true,
              showInfoBubble: true,
              infoTooltip: `All existing instances of this job definition will be activated as well.`,
              itemTypeAction: 'ActivateJob',
            },
          ],
          radioButtons: [
            {
              label: 'Execute Immediately',
              name: 'executeImmediately',
              defaultOption: true,
              showInfoBubble: true,
              infoTooltip: `Activates the job definition immediately.`,
            },
            {
              label: 'Delay Execution',
              name: 'delayExecution',
              showInfoBubble: true,
              infoTooltip: `Activates the job definition on a specified date.`,
              controlsDynamicContent: true,
            },
          ],
        },
        jobRetries: undefined,
        lineItems: [],
        message: `<p class="ps-3">Are you sure you want to activate this job definition?
                        This means any new jobs created from this definition will also be initially activated.</p>`,
        title: 'Activate Job Definition',
      });
    });

    it('should call the updateDefinitionSuspendStatus service when action is confirmed', async () => {
      component.displayConfirmationModal = vi.fn(() =>
        Promise.resolve(<ModalResult>{
          confirmed: true,
          inputs: { includeExistingJobs: true },
          selectedRadioOption: 'executeImmediately',
          selectedDate: undefined,
        }),
      );
      const mockSuccessCallback = vi.fn();

      await component.suspendOrActivateJobDefinition(['asdf'], 'Suspend', [], mockSuccessCallback);

      expect(mockJobService.updateDefinitionSuspendStatus).toHaveBeenCalledWith('asdf', {
        suspended: true,
        includeJobs: true,
      });

      setTimeout(() => {
        expect(mockSuccessCallback).toHaveBeenCalledWith(false);
      }, DATA_RELOAD_DELAY);
    });

    it('should call the updateDefinitionSuspendStatus service with date when action is confirmed with set date', async () => {
      const date: Date = new Date();
      component.displayConfirmationModal = vi.fn(() =>
        Promise.resolve(<ModalResult>{
          confirmed: true,
          inputs: { includeExistingJobs: true },
          selectedRadioOption: 'delayExecution',
          selectedDate: date,
        }),
      );
      const mockSuccessCallback = vi.fn();

      await component.suspendOrActivateJobDefinition(['asdf'], 'Suspend', [], mockSuccessCallback);

      expect(mockJobService.updateDefinitionSuspendStatus).toHaveBeenCalledWith('asdf', {
        suspended: true,
        includeJobs: true,
        executionDate: convertDateToFluxnovaString(date),
      });

      setTimeout(() => {
        expect(mockSuccessCallback).toHaveBeenCalledWith(true);
      }, DATA_RELOAD_DELAY);
    });

    it('should return {canceled: true} when the action is canceled', async () => {
      component.displayConfirmationModal = vi.fn(() => Promise.resolve(<ModalResult>{ confirmed: false }));

      const result = await component.suspendOrActivateJobDefinition(['asdf'], 'Suspend', [], true);
      const firstValue = await firstValueFrom(result as Observable<{ canceled: boolean }>);

      expect(mockJobService.updateSuspendStatus).not.toHaveBeenCalled();
      expect(firstValue.canceled).toBe(true);
    });
  });

  describe('for job suspendOrActivate', () => {
    it('should open a confirmation modal for suspend', () => {
      component.suspendOrActivateJob(['asdf'], 'Suspend', [], true);

      expect(component.displayConfirmationModal).toHaveBeenCalledWith({
        confirmButtonLabel: 'Suspend',
        dynamicContent: {
          readMoreContent: undefined,
        },
        lineItems: [],
        message: `<span><p class="ps-3 mb-2">Are you sure you want to
    suspend this
    job?</p></span>`,
        title: 'Suspend Job',
      });
    });

    it('should open a confirmation modal for activate', () => {
      component.suspendOrActivateJob(['asdf'], 'Activate', [], true);

      expect(component.displayConfirmationModal).toHaveBeenCalledWith({
        confirmButtonLabel: 'Activate',
        dynamicContent: {
          readMoreContent: undefined,
        },
        lineItems: [],
        message: `<span><p class="ps-3 mb-2">Are you sure you want to
    activate this
    job?</p></span>`,
        title: 'Activate Job',
      });
    });

    it('should call the updateSuspendStatus service when action is confirmed', async () => {
      component.displayConfirmationModal = vi.fn(() => Promise.resolve(<ModalResult>{ confirmed: true }));
      const mockSuccessCallback = vi.fn();

      await component.suspendOrActivateJob(['asdf'], 'Suspend', [], mockSuccessCallback);

      expect(mockJobService.updateSuspendStatus).toHaveBeenCalledWith('asdf', { suspended: true });
      setTimeout(() => {
        expect(mockSuccessCallback).toHaveBeenCalled();
      }, DATA_RELOAD_DELAY);
    });

    it('should return {canceled: true} when the action is canceled', async () => {
      component.displayConfirmationModal = vi.fn(() => Promise.resolve(<ModalResult>{ confirmed: false }));

      const result = await component.suspendOrActivateJob(['asdf'], 'Suspend', [], true);
      const firstValue = await firstValueFrom(result as Observable<{ canceled: boolean }>);

      expect(mockJobService.updateSuspendStatus).not.toHaveBeenCalled();
      expect(firstValue.canceled).toBe(true);
    });
  });

  describe('for job changeDueDate', () => {
    it('should open a confirmation modal', () => {
      component.changeJobDueDate('asdf', [], true);

      expect(component.displayConfirmationModal).toHaveBeenCalledWith({
        confirmButtonLabel: 'Change',
        dynamicContent: {
          inputs: {
            checkboxes: [
              {
                infoTooltip: 'Apply change to subsequent jobs.',
                label: 'Cascade',
                name: 'cascade',
                showInfoBubble: true,
                value: true,
              },
            ],
            dateSelector: true,
          },
        },
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
        lineItems: [],
        message: `<p class="ps-3">Select one of the options below to change this job's due date:</p>`,
        title: 'Change Job Due Date',
      });
    });

    it('should call the recalculateDueDate service when action is confirmed for creation date', async () => {
      component.displayConfirmationModal = vi.fn(() =>
        Promise.resolve(<ModalResult>{ confirmed: true, selectedRadioOption: 'creationDate' }),
      );

      await component.changeJobDueDate('asdf', [], true);

      expect(mockJobService.recalculateJobDueDate).toHaveBeenCalledWith('asdf', true);
    });

    it('should call the recalculateDueDate service when action is confirmed for current date', async () => {
      component.displayConfirmationModal = vi.fn(() =>
        Promise.resolve(<ModalResult>{ confirmed: true, selectedRadioOption: 'currentDate' }),
      );

      await component.changeJobDueDate('asdf', [], true);

      expect(mockJobService.recalculateJobDueDate).toHaveBeenCalledWith('asdf', false);
    });

    it('should call the setDueDate service when action is confirmed for specific date', async () => {
      const date = new Date();
      const inputs = {
        cascade: true,
      };
      component.displayConfirmationModal = vi.fn(() =>
        Promise.resolve(<ModalResult>{
          confirmed: true,
          selectedRadioOption: 'specificDate',
          selectedDate: date,
          inputs,
        }),
      );

      await component.changeJobDueDate('asdf', [], true);

      expect(mockJobService.setJobDueDate).toHaveBeenCalledWith('asdf', convertDateToFluxnovaString(date), true);
    });

    it('should return {canceled: true} when the action is canceled', async () => {
      component.displayConfirmationModal = vi.fn(() => Promise.resolve(<ModalResult>{ confirmed: false }));

      const result = await component.changeJobDueDate('asdf', [], true);
      const firstValue = await firstValueFrom(result as Observable<{ canceled: boolean }>);

      expect(mockJobService.recalculateJobDueDate).not.toHaveBeenCalled();
      expect(firstValue.canceled).toBe(true);
    });
  });

  describe('for job retry', () => {
    it('should open a confirmation modal', () => {
      component.retryJob('test-tenant-id', ['asdf'], [], true);

      expect(component.displayConfirmationModal).toHaveBeenCalledWith({
        confirmButtonLabel: 'Set Count',
        dynamicContent: {
          inputs: {
            dateSelector: true,
          },
        },
        inputs: {
          numberInput: {
            infoTooltip: 'Sets the retries of the job to the given number.',
            label: 'Set Count',
            max: 9,
            min: 1,
            name: 'retry',
            showInfoBubble: true,
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
        lineItems: [],
        message: `<p class="ps-3">Set the retry count of the following jobs:</p>`,
        title: 'Set Retry Count',
      });
    });

    it('should call the updateJobRetries service with undefined date when action is confirmed without date', async () => {
      const tenantId = 'test-tenant-id';
      component.displayConfirmationModal = vi.fn(() =>
        Promise.resolve(<ModalResult>{ confirmed: true, numberInput: 1 }),
      );

      await component.retryJob(tenantId, ['asdf'], [], true);

      expect(mockJobService.updateJobRetries).toHaveBeenCalledWith(tenantId, ['asdf'], 1, undefined);
    });

    it('should call the updateJobRetries service with  date when action is confirmed with set date', async () => {
      const tenantId = 'test-tenant-id';
      const date: Date = new Date();
      component.displayConfirmationModal = vi.fn(() =>
        Promise.resolve(<ModalResult>{
          confirmed: true,
          numberInput: 1,
          selectedRadioOption: 'setDueDate',
          selectedDate: date,
        }),
      );

      await component.retryJob(tenantId, ['asdf'], [], true);

      expect(mockJobService.updateJobRetries).toHaveBeenCalledWith(
        tenantId,
        ['asdf'],
        1,
        convertDateToFluxnovaString(date),
      );
    });

    it('should call batch statistics when ids greater than 1', async () => {
      const tenantId = 'test-tenant-id';
      component.displayConfirmationModal = vi.fn(() =>
        Promise.resolve(<ModalResult>{ confirmed: true, numberInput: 1 }),
      );

      await component.retryJob(tenantId, ['asdf', 'fdsa'], [], true);

      expect(mockJobService.updateJobRetries).toHaveBeenCalledWith(tenantId, ['asdf', 'fdsa'], 1, undefined);
    });

    it('should return {canceled: true} when the action is canceled', async () => {
      component.displayConfirmationModal = vi.fn(() => Promise.resolve(<ModalResult>{ confirmed: false }));

      const result = await component.retryJob('test-tenant-id', ['asdf'], [], true);
      const firstValue = await firstValueFrom(result);

      expect(mockJobService.updateJobRetries).not.toHaveBeenCalled();
      expect(firstValue.canceled).toBe(true);
    });
  });

  describe('for job delete', () => {
    it('should open a confirmation modal', () => {
      component.deleteJob('asdf', [], true);

      expect(component.displayConfirmationModal).toHaveBeenCalledWith({
        confirmButtonLabel: 'Delete',
        dynamicContent: {
          readMoreContent: undefined,
        },
        jobRetries: undefined,
        lineItems: [],
        message: `<span><p class="ps-3 mb-2">Are you sure you want to
    delete this
    job?</p></span>`,
        title: 'Delete Job',
      });
    });

    it('should call the updateJobRetries service when action is confirmed', async () => {
      component.displayConfirmationModal = vi.fn(() => Promise.resolve(<ModalResult>{ confirmed: true }));

      await component.deleteJob('asdf', [], true);

      expect(mockJobService.deleteJob).toHaveBeenCalledWith('asdf');
    });

    it('should return {canceled: true} when the action is canceled', async () => {
      component.displayConfirmationModal = vi.fn(() => Promise.resolve(<ModalResult>{ confirmed: false }));

      const result = await component.deleteJob('asdf', [], true);
      const firstValue = await firstValueFrom(result);

      expect(mockJobService.deleteJob).not.toHaveBeenCalled();
      expect(firstValue.canceled).toBe(true);
    });
  });

  describe('for job definition set priority', () => {
    it('should open a confirmation modal without priority set', () => {
      component.setJobDefinitionPriority('asdf', [], false, true);

      expect(component.displayConfirmationModal).toHaveBeenCalledWith({
        confirmButtonLabel: 'Change',
        inputs: {
          // TODO: Re-enable when the Fluxnova API bug is fixed so that this parameter works again
          // checkboxes: [
          //   {
          //     infoTooltip:
          //       'Including jobs means that all existing jobs of the given definition will receive this priority as well.',
          //     label: 'Include Existing Jobs',
          //     name: 'includeJobs',
          //     showInfoBubble: true,
          //     value: false,
          //     itemTypeAction: 'ChangeJobDueDate',
          //   },
          // ],
          numberInput: {
            infoTooltip:
              'The new priority set for jobs created from this definition. This new priority overrides any setting specified in the BPMN 2.0 XML.',
            label: 'Priority',
            max: Number.MAX_SAFE_INTEGER,
            min: Number.MIN_SAFE_INTEGER,
            name: 'priority',
            showInfoBubble: true,
          },
        },
        dynamicContent: {},
        lineItems: [],
        message: `<p class="ps-3">Change the overriding priority for jobs created from this definition.</p>`,
        title: 'Change Overriding Job Priority',
      });
    });

    it('should open a confirmation modal with priority set', () => {
      component.setJobDefinitionPriority('asdf', [], true, true);

      expect(component.displayConfirmationModal).toHaveBeenCalledWith({
        confirmButtonLabel: 'Change',
        inputs: {
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
        },
        dynamicContent: {
          inputs: {
            // TODO: Re-enable when the Fluxnova API bug is fixed so that this parameter works again
            // checkboxes: [
            //   {
            //     infoTooltip:
            //       'Including jobs means that all existing jobs of the given definition will receive this priority as well.',
            //     label: 'Include Existing Jobs',
            //     name: 'includeJobs',
            //     showInfoBubble: true,
            //     value: false,
            //     permissions: 'ChangeJobDueDate',
            //   },
            // ],
            numberInput: {
              infoTooltip:
                'The new priority set for jobs created from this definition. This new priority overrides any setting specified in the BPMN 2.0 XML.',
              label: 'Priority',
              max: Number.MAX_SAFE_INTEGER,
              min: Number.MIN_SAFE_INTEGER,
              name: 'priority',
              showInfoBubble: true,
            },
          },
        },
        lineItems: [],
        message: `<p class="ps-3">Change the overriding priority for jobs created from this definition.</p>`,
        title: 'Change Overriding Job Priority',
      });
    });

    it('should call the setJobDefinitionPriority service when action is confirmed and priority is not set', async () => {
      component.displayConfirmationModal = vi.fn(() =>
        Promise.resolve(<ModalResult>{
          confirmed: true,
          numberInput: 1,
          inputs: {
            includeJobs: true,
          },
        }),
      );

      await component.setJobDefinitionPriority('asdf', [], false, true);

      expect(mockJobService.setJobDefinitionPriority).toHaveBeenCalledWith('asdf', 1, true);
    });

    it('should call the setJobDefinitionPriority service when action is confirmed and priority is set', async () => {
      component.displayConfirmationModal = vi.fn(() =>
        Promise.resolve(<ModalResult>{
          confirmed: true,
          numberInput: 1,
          inputs: {
            includeJobs: true,
          },
        }),
      );

      await component.setJobDefinitionPriority('asdf', [], true, true);

      expect(mockJobService.setJobDefinitionPriority).toHaveBeenCalledWith('asdf', 1, true);
    });

    it('should return {canceled: true} when the action is canceled', async () => {
      component.displayConfirmationModal = vi.fn(() => Promise.resolve(<ModalResult>{ confirmed: false }));

      const result = await component.setJobDefinitionPriority('asdf', [], false, true);
      const firstValue = await firstValueFrom(result);

      expect(mockJobService.setJobDefinitionPriority).not.toHaveBeenCalled();
      expect(firstValue.canceled).toBe(true);
    });
  });

  describe.each([true, false])('activateOrSuspendBatch, suspended=%p', (suspended) => {
    beforeEach(async () => {
      vi.clearAllMocks();
    });

    it('should open a confirmation modal', async () => {
      await component.activateOrSuspendBatch('asdf', suspended, callbacks);

      const action = suspended ? 'Activate' : 'Suspend';
      expect(component.displayConfirmationModal).toHaveBeenCalledWith({
        confirmButtonLabel: action,
        dynamicContent: {
          readMoreContent: undefined,
        },
        lineItems: undefined,
        message:
          '<span><p class="ps-3 mb-2">Are you sure you want to' +
          '\n    ' +
          `${action.toLowerCase()} this` +
          '\n    ' +
          'batch?</p></span>',
        title: `${action} Batch`,
      });
    });

    it('should call BatchService::suspend when action is confirmed', async () => {
      await component.activateOrSuspendBatch('asdf', suspended, callbacks);

      expect(mockBatchService.suspend).toHaveBeenCalledWith('asdf', !suspended);
    });

    it('should call "canceled" callback when action is canceled', async () => {
      component.displayConfirmationModal = vi.fn().mockResolvedValue({ confirmed: false });

      await component.retryJobsForBatch('asdf', callbacks);

      expect(callbacks.canceled).toHaveBeenCalled();
    });
  });

  describe.each([true, false])('activateOrSuspendBatches, suspended=%p', (suspended) => {
    beforeEach(async () => {
      vi.clearAllMocks();
    });

    it('should open a confirmation modal', async () => {
      const ids = ['asdf', 'fdsa'];

      await component.activateOrSuspendBatches(ids, suspended, callbacks);

      const action = suspended ? 'Activate' : 'Suspend';
      expect(component.displayConfirmationModal).toHaveBeenCalledWith({
        confirmButtonLabel: action,
        dynamicContent: {
          readMoreContent: undefined,
        },
        lineItems: ids.map((id) => ({ id })),
        message:
          '<span><p class="ps-3 mb-2">Are you sure you want to' +
          '\n    ' +
          `${action.toLowerCase()} ${ids.length}` +
          '\n    ' +
          `${pluralize('batch', ids.length)}?</p></span>`,
        title: `${action} Batches`,
      });
    });

    it('should call BatchService::suspend when action is confirmed', async () => {
      const ids = ['asdf', 'fdsa'];

      await component.activateOrSuspendBatches(ids, suspended, callbacks);

      expect(mockBatchService.suspendMultiple).toHaveBeenCalledWith(ids, !suspended);
    });

    it('should call "canceled" callback when action is canceled', async () => {
      component.displayConfirmationModal = vi.fn().mockResolvedValue({ confirmed: false });

      const ids = [
        { batchId: 'asdf', batchJobDefinitionId: 'asdf-jobdef' },
        { batchId: 'fdsa', batchJobDefinitionId: 'fdsa-jobdef' },
      ];

      await component.retryJobsForBatches(ids, callbacks);

      expect(callbacks.canceled).toHaveBeenCalled();
    });
  });

  describe('retryJobsForBatch', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should open a confirmation modal', async () => {
      await component.retryJobsForBatch('asdf', callbacks);

      expect(component.displayConfirmationModal).toHaveBeenCalledWith({
        confirmButtonLabel: 'Retry',
        dynamicContent: {
          readMoreContent: undefined,
        },
        lineItems: undefined,
        message:
          '<span><p class="ps-3 mb-2">Are you sure you want to' +
          '\n    ' +
          'retry this' +
          '\n    ' +
          'job definition for batch?</p></span>',
        title: 'Retry Job Definition for Batch',
      });
    });

    it('should call "canceled" callback when action is canceled', async () => {
      component.displayConfirmationModal = vi.fn().mockResolvedValue({ confirmed: false });

      await component.retryJobsForBatch('asdf', callbacks);

      expect(callbacks.canceled).toHaveBeenCalled();
    });

    it('should call JobService::retryJobsByDefinition when action is confirmed', async () => {
      await component.retryJobsForBatch('asdf', callbacks);

      expect(mockJobService.retryJobsByDefinition).toHaveBeenCalledWith('asdf');
    });
  });

  describe('retryJobsForBatches', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should open a confirmation modal', async () => {
      const batchAndJobDefinitionIds = [
        { batchId: 'asdf', batchJobDefinitionId: 'asdf-jobdef' },
        { batchId: 'fdsa', batchJobDefinitionId: 'fdsa-jobdef' },
      ];

      await component.retryJobsForBatches(batchAndJobDefinitionIds, callbacks);

      expect(component.displayConfirmationModal).toHaveBeenCalledWith({
        confirmButtonLabel: 'Retry',
        dynamicContent: {
          readMoreContent: undefined,
        },
        lineItems: [
          {
            id: 'asdf',
          },
          {
            id: 'fdsa',
          },
        ],
        message: `<span><p class="ps-3 mb-2">Are you sure you want to retry jobs for ${batchAndJobDefinitionIds.length} ${pluralize('batch', batchAndJobDefinitionIds.length)}?</p></span>`,
        title: 'Retry Job Definitions for Batches',
      });
    });

    it('should call "canceled" callback when action is canceled', async () => {
      const batchAndJobDefinitionIds = [
        { batchId: 'asdf', batchJobDefinitionId: 'asdf-jobdef' },
        { batchId: 'fdsa', batchJobDefinitionId: 'fdsa-jobdef' },
      ];

      component.displayConfirmationModal = vi.fn().mockResolvedValue({ confirmed: false });

      await component.retryJobsForBatches(batchAndJobDefinitionIds, callbacks);

      expect(callbacks.canceled).toHaveBeenCalled();
    });

    it('should call JobService::retryJobsByDefinitions when action is confirmed', async () => {
      const batchAndJobDefinitionIds = [
        { batchId: 'asdf', batchJobDefinitionId: 'asdf-jobdef' },
        { batchId: 'fdsa', batchJobDefinitionId: 'fdsa-jobdef' },
      ];
      await component.retryJobsForBatches(batchAndJobDefinitionIds, callbacks);

      expect(mockJobService.retryJobsByDefinitions).toHaveBeenCalledWith(
        batchAndJobDefinitionIds.map((rec) => rec.batchJobDefinitionId),
      );
    });
  });

  describe('deleteBatch', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should open a confirmation modal', async () => {
      await component.deleteBatch('testId', { id: 'testId' }, callbacks);

      expect(component.displayConfirmationModal).toHaveBeenCalledWith({
        confirmButtonLabel: 'Delete',
        dynamicContent: {
          readMoreContent: undefined,
        },
        inputs: {
          checkboxes: [
            {
              label: 'Delete the historic batch and historic job logs.',
              name: 'cascade',
            },
          ],
        },
        lineItems: undefined,
        message:
          '<span><p class="ps-3 mb-2">Are you sure you want to' +
          '\n    ' +
          'delete this' +
          '\n    ' +
          'batch?</p></span>',
        title: 'Delete Batch',
      });
    });

    it('should call "canceled" callback when action is canceled', async () => {
      component.displayConfirmationModal = vi.fn().mockResolvedValue({ confirmed: false });

      await component.deleteBatch('testId', { id: 'testId' }, callbacks);

      expect(callbacks.canceled).toHaveBeenCalled();
    });

    describe('finished batch', () => {
      it('should call BatchService::deleteHistoric when action is confirmed', async () => {
        await component.deleteBatch('testId', { id: 'testId', endTime: 'any time' }, callbacks);

        expect(mockBatchService.deleteHistoric).toHaveBeenCalledWith('testId');
      });
    });

    describe('unfinished batch', () => {
      it('should call BatchService::delete when action is confirmed', async () => {
        await component.deleteBatch('testId', { id: 'testId' }, {
          success: vi.fn(),
          error: vi.fn(),
          canceled: vi.fn(),
        } as ConfirmActionCallbacks);

        expect(mockBatchService.delete).toHaveBeenCalledWith('testId', false);
      });
    });
  });

  describe('deleteBatches', () => {
    const ids = ['asdf', 'fdsa'];

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should open a confirmation modal', async () => {
      await component.deleteBatches(ids, false, callbacks);

      expect(component.displayConfirmationModal).toHaveBeenCalledWith({
        confirmButtonLabel: 'Delete',
        dynamicContent: {
          readMoreContent: undefined,
        },
        inputs: {
          checkboxes: [
            {
              label: 'Delete the historic batch and historic job logs.',
              name: 'cascade',
            },
          ],
        },
        lineItems: ids.map((id) => ({ id })),
        message:
          '<span><p class="ps-3 mb-2">Are you sure you want to' +
          '\n    ' +
          `delete ${ids.length}` +
          '\n    ' +
          `${pluralize('batch', ids.length)}?</p></span>`,
        title: 'Delete Batches',
      });
    });

    it('should call "canceled" callback when action is canceled', async () => {
      component.displayConfirmationModal = vi.fn().mockResolvedValue({ confirmed: false });

      await component.deleteBatches(ids, false, callbacks);

      expect(callbacks.canceled).toHaveBeenCalled();
    });

    describe('finished batches', () => {
      it('should call BatchService::deleteHistoric when action is confirmed', async () => {
        await component.deleteBatches(ids, true, callbacks);

        expect(mockBatchService.deleteMultipleHistoric).toHaveBeenCalledWith(ids);
      });
    });

    describe('unfinished batches', () => {
      it('should call BatchService::deleteMultiple when action is confirmed', async () => {
        await component.deleteBatches(ids, false, callbacks);

        expect(mockBatchService.deleteMultiple).toHaveBeenCalledWith(ids, false);
      });
    });
  });
});
