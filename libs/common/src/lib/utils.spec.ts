import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ItemType } from '@fxn/types';
import { mockConsoleError } from '@fxn/test-support/vitest';
import { downloadDataBuffer, getTypeString, parseJson } from './utils';

describe('utils', () => {
  const item = {
    created: '123456789',
    value: 'testModel',
  };
  const mockValidValue: any = JSON.stringify(item);
  const mockInvalidValue: any = '<html>!!!!<html>';
  const createObjectURLMock = vi.fn().mockReturnValue('blob:url');
  const revokeObjectURLMock = vi.fn();
  const createElementMock = vi.fn().mockReturnValue({
    href: '',
    download: '',
    dispatchEvent: vi.fn(),
  });

  let logSpy: any;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'error');
    Object.defineProperty(window.URL, 'createObjectURL', {
      value: createObjectURLMock,
    });
    Object.defineProperty(window.URL, 'revokeObjectURL', {
      value: revokeObjectURLMock,
    });
    document.createElement = createElementMock;
  });

  it('should return parsed value', () => {
    const parsedValue = parseJson(mockValidValue, false);
    expect(parsedValue).toEqual(item);
  });

  it('should return false if can not parse the value and error to be logged', () => {
    const parsedValue = parseJson(mockInvalidValue, false);
    expect(parsedValue).toEqual(false);
    expect(logSpy).toHaveBeenCalledTimes(0);
  });

  it('should return false if can not parse the value and error to not be logged', () => {
    mockConsoleError();
    const parsedValue = parseJson(mockInvalidValue, true);
    expect(parsedValue).toEqual(false);
    expect(logSpy).toHaveBeenCalledTimes(1);
  });

  it('should get type string', () => {
    expect(getTypeString(ItemType.ProcessInstance)).toEqual('Process Instance');
    expect(getTypeString(ItemType.ProcessDefinition)).toEqual('Process Definition');
    expect(getTypeString(ItemType.Job)).toEqual('Job');
    expect(getTypeString(ItemType.JobDefinition)).toEqual('Job Definition');
    expect(getTypeString(ItemType.Incident)).toEqual('Incident');
    expect(getTypeString(ItemType.Batch)).toEqual('Batch');
    expect(getTypeString(ItemType.Deployment)).toEqual('Deployment');
    expect(getTypeString(ItemType.DecisionDefinition)).toEqual('Decision Definition');
    expect(getTypeString(ItemType.DecisionInstance)).toEqual('Decision Instance');
  });

  it('should download data buffer', () => {
    const arrayBuffer = new ArrayBuffer(8);
    const resourceName = 'test.txt';

    downloadDataBuffer(arrayBuffer, resourceName);

    expect(createObjectURLMock).toHaveBeenCalledWith(expect.any(Blob));
    expect(createElementMock).toHaveBeenCalledWith('a');
    expect(createElementMock().href).toBe('blob:url');
    expect(createElementMock().download).toBe(resourceName);
    expect(createElementMock().dispatchEvent).toHaveBeenCalledWith(expect.any(MouseEvent));
    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:url');
  });
});
