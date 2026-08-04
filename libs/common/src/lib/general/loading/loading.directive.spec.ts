import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { TemplateRef, ViewContainerRef } from '@angular/core';
import { LoadingDirective } from './loading.directive';

describe('LoadingDirective', () => {
  let directive: LoadingDirective;

  const mockLoadingComponentInstance = { blockInteraction: false };
  const mockLoadingComponent = {
    hostView: { totallyReal: true },
    instance: mockLoadingComponentInstance,
    destroy: vi.fn(),
  };
  const mockVcRef = {
    createEmbeddedView: vi.fn(),
    createComponent: vi.fn(),
    insert: vi.fn(),
    detach: vi.fn(),
    indexOf: vi.fn(),
  };

  beforeEach(() => {
    mockVcRef.createComponent.mockReturnValue(mockLoadingComponent);

    TestBed.configureTestingModule({
      providers: [
        LoadingDirective,
        { provide: ViewContainerRef, useValue: mockVcRef },
        { provide: TemplateRef, useValue: {} },
      ],
    });

    directive = TestBed.inject(LoadingDirective);
  });

  afterEach(() => vi.clearAllMocks());

  it('should create an instance', () => {
    expect(directive).toBeTruthy();
  });

  it('should attempt to setup the loading component', () => {
    directive.fluxnovaLoading = true;
    expect(mockVcRef.createComponent).toHaveBeenCalledTimes(1);
  });

  it('should only create the loading component once', () => {
    directive.fluxnovaLoading = true;
    directive.fluxnovaLoading = false;
    directive.fluxnovaLoading = true;
    expect(mockVcRef.createComponent).toHaveBeenCalledTimes(1);
    expect(mockVcRef.detach).toHaveBeenCalledTimes(1);
    expect(mockVcRef.insert).toHaveBeenCalledTimes(1);
    expect(mockVcRef.insert).toHaveBeenCalledWith(mockLoadingComponent.hostView);
  });

  it('should set blocking when using fluxnovaLoadingBlocking', () => {
    directive.fluxnovaLoadingBlocking = true;
    expect(mockLoadingComponentInstance.blockInteraction).toBe(true);
  });
});
