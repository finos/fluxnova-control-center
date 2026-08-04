import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { TestBed } from '@angular/core/testing';
import { beforeAll, describe, expect, it, Mocked, vi } from 'vitest';
import { EvaluateDecisionModalService } from './evaluate-decision-modal.service';

const mockNgbModalRef: Mocked<NgbModalRef> = {
  componentInstance: {},
  dismiss: vi.fn(),
} as unknown as Mocked<NgbModalRef>;

const mockNgbModal: Mocked<NgbModal> = {
  open: vi.fn().mockReturnValue(mockNgbModalRef),
} as unknown as Mocked<NgbModal>;

let service: EvaluateDecisionModalService;

describe('EvaluateDecisionModalService', () => {
  beforeAll(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: NgbModal, useValue: mockNgbModal }, EvaluateDecisionModalService],
    });

    service = TestBed.inject(EvaluateDecisionModalService);

    vi.clearAllMocks();
  });

  describe('show', () => {
    it('should use modalService to open modal', async () => {
      await service.show({});

      expect(mockNgbModal.open).toHaveBeenCalled();
    });

    it('should return expected value when modal open fails', async () => {
      mockNgbModal.open = vi.fn().mockImplementation(() => {
        throw new Error();
      });

      const result = await service.show({});

      expect(result).toEqual({ jsonValue: '', submitted: false });
    });
  });

  describe('hide', () => {
    it('should dismiss the modal', async () => {
      await service.show({});

      const instance = service.instance;

      expect(instance).toBeDefined();

      service.hide();

      expect(instance?.dismiss).toHaveBeenCalled();
    });
  });
});
