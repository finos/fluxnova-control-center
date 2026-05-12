import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { DiagramUtilsService } from './diagram-utils.service';

describe('Diagram Utils Service', () => {
  let service: DiagramUtilsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DiagramUtilsService],
    });

    service = TestBed.inject(DiagramUtilsService);
  });

  it('elementIsProcess should return true for a Process', () => {
    const result = service.elementIsProcess({ type: 'bpmn:Process' });

    expect(result).toBeTruthy();
  });

  it('elementIsProcess should return false if the element is not a process', () => {
    const result = service.elementIsProcess({ type: 'bpmn:SequenceFlow' });

    expect(result).toBeFalsy();
  });

  it('elementIsFlow should return true for a SequenceFlow', () => {
    const result = service.elementIsFlow({ type: 'bpmn:SequenceFlow' });

    expect(result).toBeTruthy();
  });

  it('elementIsFlow should return false if the element is not a sequence flow', () => {
    const result = service.elementIsFlow({ type: 'bpmn:Process' });

    expect(result).toBeFalsy();
  });
});
