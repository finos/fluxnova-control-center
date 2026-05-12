import { TestBed } from '@angular/core/testing';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProcessVariableModalService } from './process-variable-modal-service';
import { ProcessVariableModalComponent } from './process-variable-modal.component';

describe('ProcessVariableModalService', () => {
  const mockModalService = {
    open: vi.fn(),
  };
  let service: ProcessVariableModalService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: NgbModal, useValue: mockModalService }, ProcessVariableModalService],
    });
    service = TestBed.inject(ProcessVariableModalService);
  });

  describe('show', () => {
    it('creates a modal instance and awaits its result', async () => {
      const variableOptions = {};
      const modalOptions = {};
      const result = {};
      const mockModalInstance = {
        componentInstance: {
          options: null,
        },
        result,
      };
      mockModalService.open.mockReturnValueOnce(mockModalInstance);

      const showResult = await service.show(variableOptions, modalOptions);

      expect(mockModalService.open).toHaveBeenCalledWith(ProcessVariableModalComponent, modalOptions);
      expect(mockModalInstance.componentInstance.options).toBe(variableOptions);
      expect(showResult).toBe(mockModalInstance.result);
    });

    it('returns default result when error is thrown', async () => {
      const variableOptions = {};
      const modalOptions = {};
      mockModalService.open.mockImplementationOnce(() => {
        throw new Error();
      });

      const result = await service.show(variableOptions, modalOptions);

      expect(result).toEqual({ variableValue: '', variableName: '', variableType: '', saved: false, valueInfo: {} });
    });
  });

  describe('hide', () => {
    it('dismisses the modal instance', () => {
      const mockModalInstance = {
        dismiss: vi.fn(),
      };

      service.instance = mockModalInstance as unknown as NgbModalRef;
      service.hide();

      expect(mockModalInstance.dismiss).toHaveBeenCalled();
    });
  });
});
