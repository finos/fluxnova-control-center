import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ElementRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';

vi.mock('@ng-bootstrap/ng-bootstrap', () => ({
  NgbTooltip: class {
    ngOnInit = vi.fn();
    ngOnDestroy = vi.fn();
    ngbTooltip = 'this should be overridden by the directive';
  },
}));

import { TruncateWithTooltipDirective } from './truncate-with-tooltip.directive';

describe('TruncateWithTooltipDirective', () => {
  let directive: TruncateWithTooltipDirective;

  const mockElementRef = {
    nativeElement: {
      offsetWidth: 100,
      scrollWidth: 0,
      innerText: 'the text to truncate',
    },
  };

  beforeEach(() => {
    vi.useFakeTimers();

    TestBed.configureTestingModule({
      providers: [TruncateWithTooltipDirective, { provide: ElementRef, useValue: mockElementRef }],
    });

    directive = TestBed.inject(TruncateWithTooltipDirective);
    directive.ngOnInit();
  });

  afterEach(() => vi.clearAllMocks());

  it('should create an instance', () => {
    expect(directive).toBeTruthy();
  });

  it('should not setup tooltip when there is no overflow', () => {
    setupNoTruncation();
    directive.onMouseOver();
    vi.runAllTimers();
    expect(directive.tooltipDirective.ngOnInit).toHaveBeenCalledTimes(0);
    expect(directive.tooltipDirective.ngbTooltip).toEqual('');
  });

  it('should setup tooltip when there is overflow', () => {
    setupTruncation();
    directive.onMouseOver();
    vi.runAllTimers();
    expect(directive.tooltipDirective.ngOnInit).toHaveBeenCalledTimes(1);
    verifyTooltipContent();
  });

  it('should check for a change to truncation on mouseover', () => {
    setupNoTruncation();
    directive.onMouseOver();
    vi.runAllTimers();
    expect(directive.tooltipDirective.ngOnInit).toHaveBeenCalledTimes(0);
    expect(directive.tooltipDirective.ngbTooltip).toEqual('');

    setupTruncation();
    directive.onMouseOver();
    expect(directive.tooltipDirective.ngOnInit).toHaveBeenCalledTimes(1);
    verifyTooltipContent();
  });

  it('should only setup the tooltip once', () => {
    setupTruncation();
    directive.onMouseOver();
    vi.runAllTimers();
    expect(directive.tooltipDirective.ngOnInit).toHaveBeenCalledTimes(1);
    verifyTooltipContent();

    directive.onMouseOver();
    expect(directive.tooltipDirective.ngOnInit).toHaveBeenCalledTimes(1);
    verifyTooltipContent();
  });

  it('should cleanup the NgbTooltip component', () => {
    directive.ngOnDestroy();
    expect(directive.tooltipDirective.ngOnDestroy).toHaveBeenCalledTimes(1);
  });

  function setupNoTruncation() {
    mockElementRef.nativeElement.offsetWidth = 100;
    mockElementRef.nativeElement.scrollWidth = 0;
  }

  function setupTruncation() {
    mockElementRef.nativeElement.offsetWidth = 100;
    mockElementRef.nativeElement.scrollWidth = 1000;
  }

  function verifyTooltipContent() {
    expect(directive.tooltipDirective.ngbTooltip).toEqual(mockElementRef.nativeElement.innerText);
  }
});
