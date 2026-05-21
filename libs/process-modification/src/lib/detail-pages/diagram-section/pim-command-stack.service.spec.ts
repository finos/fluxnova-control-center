import { of, throwError } from 'rxjs';
import { ToastService } from '@fxn/common';
import { TestBed } from '@angular/core/testing';
import { CompleteActivityInstanceInfo } from '@fxn/types';
import { beforeEach, describe, expect, it, Mocked, vi } from 'vitest';
import { DiagramUtilsService, SEQUENCE_FLOW } from '../../common/diagram/services';
import { ProcessInstanceService } from '../../services/process-instance.service';
import { DATA_RELOAD_DELAY } from '../../common/app-constants';
import { PimCommandStackService } from './pim-command-stack.service';
import { ContextMenuItemAction } from './context-menu/context-menu-item.service';

describe('Pim Command Stack Service', () => {
  const mockProcessInstanceService = {
    postProcessModification: vi.fn(() => of({})),
  } as unknown as Mocked<ProcessInstanceService>;
  const mockToastService = {
    error: vi.fn(),
    success: vi.fn(),
  } as unknown as Mocked<ToastService>;
  const command = {
    target: { type: SEQUENCE_FLOW, id: 'asdf' },
    type: ContextMenuItemAction.ADD_TOKEN,
    processInstanceId: '1234',
  };

  let service: PimCommandStackService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PimCommandStackService,
        { provide: ProcessInstanceService, useValue: mockProcessInstanceService },
        { provide: ToastService, useValue: mockToastService },
        DiagramUtilsService,
      ],
    });
    service = TestBed.inject(PimCommandStackService);

    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => vi.useRealTimers());

  it('add should add a command onto the stack and set isEmpty$ to false', () => {
    let isEmpty = true;
    service.isEmpty$.subscribe((value) => {
      isEmpty = value;
    });
    service.add(command);

    expect(service.stack).toContain(command);
    expect(isEmpty).toBeFalsy();
  });

  it('transform commands into modifications', () => {
    service.stack.push(command);
    service.stack.push({
      target: { type: SEQUENCE_FLOW, id: 'qwer' },
      type: ContextMenuItemAction.REMOVE_TOKEN,
      processInstanceId: '1234',
    });
    service.stack.push({
      target: { type: 'bpmn:UserTask', id: 'zxcv' },
      type: ContextMenuItemAction.ADD_TOKEN,
      processInstanceId: '1234',
    });
    const result = service.transformCommandsToModifications();

    expect(result).toEqual([
      {
        transitionId: 'asdf',
        type: 'startTransition',
      },
      {
        activityId: 'qwer',
        type: 'cancel',
      },
      {
        activityId: 'zxcv',
        type: 'startBeforeActivity',
      },
    ]);
  });

  it('execute should translate the command into an modifications', () => {
    service.stack.push(command);
    service.execute({ skipCustomListeners: true, skipIoMappings: false });

    expect(mockProcessInstanceService.postProcessModification).toHaveBeenCalledWith('1234', {
      instructions: [
        {
          transitionId: 'asdf',
          type: 'startTransition',
        },
      ],
      skipCustomListeners: true,
      skipIoMappings: false,
    });
  });

  it('execute should clear the stack and notify the user of success if execute succeeds', async () => {
    let isEmpty = false;
    service.isEmpty$.subscribe((value) => {
      isEmpty = value;
    });
    service.stack.push(command);
    service.execute({ skipCustomListeners: true, skipIoMappings: true });

    await vi.advanceTimersByTimeAsync(DATA_RELOAD_DELAY);

    expect(service.stack.length).toBe(0);
    expect(isEmpty).toBeTruthy();
    expect(mockToastService.success).toHaveBeenCalledWith('Successfully modified process: 1234');
  });

  it('execute should notify the user of the error if execute fails', () => {
    service.stack.push(command);
    mockProcessInstanceService.postProcessModification.mockReturnValue(
      throwError(() => {
        throw { error: { message: 'im an error' } };
      }),
    );
    service.execute({ skipCustomListeners: true, skipIoMappings: false });

    expect(mockToastService.error).toHaveBeenCalledWith('Failed to modify process. im an error');
  });

  it('execute should update isApplyingChanges correctly', () => {
    const isApplyingChanges: boolean[] = [];
    const sub = service.isApplyingChanges$.subscribe((value) => {
      isApplyingChanges.push(value);
    });

    service.stack.push(command);
    service.execute({ skipCustomListeners: true, skipIoMappings: false });

    // true when saving, then false again when complete
    expect(isApplyingChanges).toEqual([true, false]);
    sub.unsubscribe();
  });

  it('clear should empty the stacks and change isEmpty$(s) to true', () => {
    let isEmpty = false;
    let isUndoEmpty = false;
    service.isEmpty$.subscribe((value) => {
      isEmpty = value;
    });

    service.isUndoEmpty$.subscribe((value) => {
      isUndoEmpty = value;
    });

    service.stack.push(command);
    service.undoStack.push(command);
    service.clear();

    expect(service.stack.length).toEqual(0);
    expect(service.undoStack.length).toEqual(0);
    expect(isEmpty).toBeTruthy();
    expect(isUndoEmpty).toBeTruthy();
  });

  it('undo should remove the top command from the stack and put it in the undo stack', () => {
    let isEmpty = false;
    let isUndoEmpty = true;

    service.isEmpty$.subscribe((value) => {
      isEmpty = value;
    });

    service.isUndoEmpty$.subscribe((value) => {
      isUndoEmpty = value;
    });

    service.stack.push(command);
    service.undo();

    expect(service.stack.length).toEqual(0);
    expect(service.undoStack.length).toEqual(1);
    expect(service.undoStack[0]).toEqual(command);
    expect(isEmpty).toBeTruthy();
    expect(isUndoEmpty).toBeFalsy();
  });

  it('redo should remove the top command from the undo stack and put it in the stack', () => {
    let isEmpty = true;
    let isUndoEmpty = false;

    service.isEmpty$.subscribe((value) => {
      isEmpty = value;
    });

    service.isUndoEmpty$.subscribe((value) => {
      isUndoEmpty = value;
    });

    service.addToUndo(command);
    service.redo();

    expect(service.stack.length).toEqual(1);
    expect(service.stack[0]).toEqual(command);
    expect(service.undoStack.length).toEqual(0);
    expect(isEmpty).toBeFalsy();
    expect(isUndoEmpty).toBeTruthy();
  });

  it('containsCommandForElement should return true when there is a command for an element in the stack', () => {
    service.stack.push(command);

    expect(service.containsCommandForElement(command.target)).toBeTruthy();
  });

  it('containsCommandForElement should return false when there is not a command for an element in the stack', () => {
    service.stack.push(command);

    expect(service.containsCommandForElement({})).toBeTruthy();
  });

  describe('willActionsTerminateProcess', () => {
    it('should return false if stack contains an ADD_TOKEN command', () => {
      service.add({
        processInstanceId: '1234',
        target: { id: 'foo' },
        type: ContextMenuItemAction.ADD_TOKEN,
      });

      const info: CompleteActivityInstanceInfo = {
        active: {
          childActivityInstances: [{ activityId: 'foo' }],
          childTransitionInstances: [],
        },
        historical: [],
      };
      expect(service.willActionsTerminateProcess(info)).toBeFalsy();
    });

    it('should return true when number of REMOVE_TOKEN commands equals distinct active instances', () => {
      const info: CompleteActivityInstanceInfo = {
        active: {
          childActivityInstances: [{ activityId: 'a1' }, { activityId: 'a2' }],
          childTransitionInstances: [],
        },
        historical: [],
      };

      service.add({
        processInstanceId: '1234',
        target: { id: 'a1' },
        type: ContextMenuItemAction.REMOVE_TOKEN,
      });
      service.add({
        processInstanceId: '1234',
        target: { id: 'a2' },
        type: ContextMenuItemAction.REMOVE_TOKEN,
      });

      expect(service.willActionsTerminateProcess(info)).toBeTruthy();
    });

    it('should return false when REMOVE_TOKEN count does not match active instances count', () => {
      const info: CompleteActivityInstanceInfo = {
        active: {
          childActivityInstances: [{ activityId: 'x' }, { activityId: 'y' }, { activityId: 'z' }],
          childTransitionInstances: [],
        },
        historical: [],
      };

      service.add({
        processInstanceId: '1234',
        target: { id: 'x' },
        type: ContextMenuItemAction.REMOVE_TOKEN,
      });
      service.add({
        processInstanceId: '1234',
        target: { id: 'y' },
        type: ContextMenuItemAction.REMOVE_TOKEN,
      });

      expect(service.willActionsTerminateProcess(info)).toBeFalsy();
    });

    it('should include transition instances in the active count', () => {
      const info: CompleteActivityInstanceInfo = {
        active: {
          childActivityInstances: [{ activityId: 't1' }],
          childTransitionInstances: [{ activityId: 't2' }],
        },
        historical: [],
      };

      service.add({
        processInstanceId: '1234',
        target: { id: 't1' },
        type: ContextMenuItemAction.REMOVE_TOKEN,
      });
      service.add({
        processInstanceId: '1234',
        target: { id: 't2' },
        type: ContextMenuItemAction.REMOVE_TOKEN,
      });

      expect(service.willActionsTerminateProcess(info)).toBeTruthy();
    });
  });
});
