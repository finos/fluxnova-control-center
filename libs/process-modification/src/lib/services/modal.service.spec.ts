import { TestBed } from '@angular/core/testing';
import { NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ModalService } from './modal.service';

describe('ModalService', () => {
  let service: ModalService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ModalService],
    });

    service = TestBed.inject(ModalService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should blur the active element before opening the modal', () => {
    // Arrange
    const mockActiveElement = document.createElement('button');
    vi.spyOn(document, 'activeElement', 'get').mockReturnValue(mockActiveElement);
    vi.spyOn(mockActiveElement, 'blur');

    const content = 'Test Content';
    const options: NgbModalOptions = { size: 'lg' };

    // Act
    service.open(content, options);

    // Assert
    expect(mockActiveElement.blur).toHaveBeenCalled();
  });
});
