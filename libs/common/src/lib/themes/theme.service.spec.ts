import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { getBpmnColors } from './bpmn-colors';
import { ThemeService } from './theme.service';

describe('theme service', () => {
  let service: ThemeService;
  let mockOldLink: Partial<HTMLLinkElement>;
  let mockNewLink: Partial<HTMLLinkElement>;
  let mockBody: Partial<HTMLBodyElement>;
  let mockDocument: Partial<Document>;
  let mockWindow: Partial<Window>;
  const sampleManifest = {
    'default.css': 'default-theme.044aaafc1d46e8cd058d.css',
    'dark.css': 'dark-theme.913b7c5c229d769eb6f6.css',
    'high-contrast-theme.css': 'high-contrast-theme.92d1e452881a4bb33ac5.css',
  };

  beforeEach(() => {
    mockOldLink = {
      id: 'default',
    };
    mockNewLink = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    (mockNewLink.addEventListener as Mock).mockImplementation((type, handler) => handler());
    mockBody = {
      removeChild: vi.fn(),
      appendChild: vi.fn(),
    };
    mockDocument = {
      getElementById: vi.fn().mockReturnValue(mockOldLink),
      createElement: vi.fn().mockReturnValue(mockNewLink),
      body: mockBody as HTMLBodyElement,
    };
    mockWindow = {
      webpackManifest: sampleManifest,
    };

    TestBed.configureTestingModule({
      providers: [
        ThemeService,
        { provide: Document, useValue: mockDocument },
        { provide: Window, useValue: mockWindow },
      ],
    });
    service = TestBed.inject(ThemeService);
  });

  it('should return bpmn colors for a given theme', () => {
    expect(service.getBpmnColors('default')).toEqual(getBpmnColors('default'));
  });
});
