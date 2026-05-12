import { filter } from 'lodash-es';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DiagramUtilsService, PROCESS, SEQUENCE_FLOW } from '../../../common/diagram/services';
import { ContextMenuItemService } from './context-menu-item.service';

describe('Context Menu Item Service', () => {
  let component: ContextMenuItemService;

  beforeEach(() => {
    vi.clearAllMocks();

    TestBed.configureTestingModule({
      providers: [ContextMenuItemService, DiagramUtilsService],
    });

    component = TestBed.inject(ContextMenuItemService);
  });

  it('elementHasToken should return false for an element that is not active', () => {
    const result = component.elementHasActiveInstance({});

    expect(result).toBeFalsy();
  });

  it('elementHasToken should return true for a child activity instance', () => {
    const result = component.elementHasActiveInstance(
      { id: '1234' },
      {
        active: {
          childActivityInstances: [{ activityId: '1234' }],
        },
        historical: [],
      },
    );

    expect(result).toBeTruthy();
  });

  it('elementHasToken should return true for a nested childActivityInstance', () => {
    const result = component.elementHasActiveInstance(
      { id: '5678' },
      {
        active: {
          childActivityInstances: [{ activityId: '1234', childActivityInstances: [{ activityId: '5678' }] }],
        },
        historical: [],
      },
    );

    expect(result).toBeTruthy();
  });

  it('elementHasToken should return true for a child transition instance', () => {
    const result = component.elementHasActiveInstance(
      { id: '1234' },
      {
        active: {
          childActivityInstances: [{ activityId: '1234' }],
        },
        historical: [],
      },
    );

    expect(result).toBeTruthy();
  });

  it('getProcessInstanceMenuItems should return an array with redo and undo options', () => {
    const result = component.getProcessInstanceMenuItems({ id: '1234', type: PROCESS });

    expect(result.length).toBe(2);
    expect(result[0]?.action).toEqual('redo');
    expect(result[1]?.action).toEqual('undo');
  });

  it('getProcessInstanceMenuItems should return add_token when the element is not a process', () => {
    const result = component.getProcessInstanceMenuItems({ id: '1234', type: SEQUENCE_FLOW });

    expect(filter(result, ['action', 'add_token']).length).toBeGreaterThan(0);
  });

  it('getProcessInstanceMenuItems should return remove_token when the element is not a process', () => {
    const result = component.getProcessInstanceMenuItems({ id: '1234', type: 'bpmn:asdf' });

    expect(filter(result, ['action', 'remove_token']).length).toBeGreaterThan(0);
  });
});
