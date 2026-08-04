import { inject, Injectable } from '@angular/core';
import { of, Subject, take, timer } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { concat, filter, groupBy, isEmpty, some } from 'lodash-es';
import { ToastService } from '@fxn/common';
import { CompleteActivityInstanceInfo } from '@fxn/types';
import { DiagramUtilsService } from '../../common/diagram/services';
import { ProcessInstanceService } from '../../services/process-instance.service';
import { DATA_RELOAD_DELAY } from '../../common/app-constants';
import { ContextMenuItemAction } from './context-menu/context-menu-item.service';

export enum ModificationType {
  cancel = 'cancel',
  startBeforeActivity = 'startBeforeActivity',
  startAfterActivity = 'startAfterActivity',
  startTransition = 'startTransition',
}

interface Command {
  processInstanceId: string;
  target: any;
  type: ContextMenuItemAction;
}

interface Modification {
  activityId: any;
  type: ModificationType;
}

@Injectable({ providedIn: 'root' })
export class PimCommandStackService {
  private processInstanceService = inject(ProcessInstanceService);
  private diagramUtilService = inject(DiagramUtilsService);
  private toastService = inject(ToastService);

  private _stack: Command[] = [];
  private _undoStack: Command[] = [];
  private _isEmpty$: Subject<boolean> = new Subject<boolean>();
  private _isUndoEmpty$: Subject<boolean> = new Subject<boolean>();
  private _isApplyingChanges$: Subject<boolean> = new Subject<boolean>();
  private _wasStackAppliedSuccessfully$: Subject<boolean> = new Subject<boolean>();

  public add(command: Command) {
    this.clearUndo();
    this._stack.push(command);
    this._isEmpty$.next(this.isEmpty);
  }

  public addToUndo(command: Command) {
    this._undoStack.push(command);
    this._isUndoEmpty$.next(this.isUndoEmpty);
  }

  public clear() {
    this._stack = [];
    this._isEmpty$.next(this.isEmpty);

    this.clearUndo();
  }

  public clearUndo() {
    this._undoStack = [];
    this._isUndoEmpty$.next(this.isUndoEmpty);
  }

  public undo() {
    if (this._stack.length) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.addToUndo(this._stack.pop()!);
      this._isEmpty$.next(this.isEmpty);
    }
  }

  public redo() {
    if (this._undoStack.length) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this._stack.push(this._undoStack.pop()!);
      this._isEmpty$.next(this.isEmpty);
      this._isUndoEmpty$.next(this.isUndoEmpty);
    }
  }

  /**
   * Returns the "most recently added" command.  In this
   * case it really returns the last value in the array,
   * since we didn't reverse the order for keeping track
   * of the commands.
   */
  public top(): Command {
    return this._stack[this._stack.length - 1];
  }

  public get stack(): Command[] {
    return this._stack;
  }

  public get undoStack(): Command[] {
    return this._undoStack;
  }

  /**
   * Returns true if the stack is currently empty.
   */
  public get isEmpty(): boolean {
    return this._stack.length === 0;
  }

  /**
   * Returns a subject to subscribe to in order to
   * get updates on the emptiness of the stack.
   */
  public get isEmpty$(): Subject<boolean> {
    return this._isEmpty$;
  }

  /**
   * Returns true if the undo stack is currently empty.
   */
  public get isUndoEmpty(): boolean {
    return this._undoStack.length === 0;
  }

  /**
   * Returns a subject to subscribe to in order to
   * get updates on the emptiness of the undo stack.
   */
  public get isUndoEmpty$(): Subject<boolean> {
    return this._isUndoEmpty$;
  }

  public get isApplyingChanges$(): Subject<boolean> {
    return this._isApplyingChanges$;
  }

  public get currentProcessInstanceId() {
    return this.top().processInstanceId;
  }

  /**
   * Returns a subject to subscribe to in order to
   * know if the execute applied the changes successfully.
   */
  public get wasStackAppliedSuccessfully$(): Subject<boolean> {
    return this._wasStackAppliedSuccessfully$;
  }

  public willActionsTerminateProcess(activityInstanceInfo?: CompleteActivityInstanceInfo): boolean {
    if (some(this._stack, ['type', 'add_token'])) return false;
    else {
      const activeInstances = groupBy(
        concat(
          activityInstanceInfo?.active?.childActivityInstances,
          activityInstanceInfo?.active?.childTransitionInstances,
        ),
        'activityId',
      );

      const removeTokenCommands = filter(this._stack, ['type', ContextMenuItemAction.REMOVE_TOKEN]);

      if (Object.keys(activeInstances).length === removeTokenCommands.length) return true;
    }

    return false;
  }

  public execute(params: { skipCustomListeners?: boolean; skipIoMappings?: boolean; annotation?: string }) {
    this._isApplyingChanges$.next(true);
    this.processInstanceService
      .postProcessModification(this.currentProcessInstanceId, {
        instructions: this.transformCommandsToModifications(),
        ...params,
      })
      .pipe(
        take(1),
        catchError((err) => {
          this._wasStackAppliedSuccessfully$.next(false);
          this.toastService.error(`Failed to modify process. ${err.error.message}`);
          return of({
            error: `Failed to modify process. ${err.error.message}`,
          });
        }),
      )
      .subscribe((result: any) => {
        if (isEmpty(result?.error)) {
          timer(DATA_RELOAD_DELAY).subscribe(() => {
            this.toastService.success(`Successfully modified process: ${this.currentProcessInstanceId}`);
            this.clear();
            this._wasStackAppliedSuccessfully$.next(true);
          });
        } else this._wasStackAppliedSuccessfully$.next(false);

        this._isApplyingChanges$.next(false);
      });
  }

  public transformCommandsToModifications(): Modification[] {
    const instructions: Modification[] = [];

    for (const command of this._stack) {
      const instruction: any = {};

      if (command.type === ContextMenuItemAction.REMOVE_TOKEN) {
        instruction.type = ModificationType.cancel;
        instruction.activityId = command.target.id;
      } else if (this.diagramUtilService.elementIsFlow(command.target)) {
        instruction.type = ModificationType.startTransition;
        instruction.transitionId = command.target.id;
      } else {
        instruction.type = ModificationType.startBeforeActivity;
        instruction.activityId = command.target.id;
      }

      instructions.push(instruction);
    }

    return instructions;
  }

  public containsCommandForElement(element: any): boolean {
    return filter(this._stack, { target: element }).length > 0;
  }
}
