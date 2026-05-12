import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MoveTokenService } from './move-token.service';

describe('MoveTokenService', () => {
  let service: MoveTokenService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MoveTokenService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should emit next() value when emitTokenMove is called', () => {
    const value = 'abc-123';
    const emitTokenMoveSpy = vi.spyOn(service.moveToken$, 'next');
    service.emitTokenMove(value);
    expect(emitTokenMoveSpy).toHaveBeenCalledWith(value);
  });

  it('should emit move token as observable', () => {
    const onTokenMoveSpy = vi.spyOn(service.moveToken$, 'asObservable');
    service.onTokenMove();
    expect(onTokenMoveSpy).toHaveBeenCalled();
  });
});
