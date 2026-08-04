import { Clipboard } from '@angular/cdk/clipboard';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastService } from '../../services/toast.service';
import { CopyLinkDirective } from './copy-link.directive';

const mockUrl = 'http://fakeURL.com';
@Component({
  template: ` <div id="link" fluxnovaCopyLink="${mockUrl}"></div> `,
  standalone: false,
})
class TestComponent {}

describe('CopyLinkDirective', () => {
  let directive: CopyLinkDirective;
  let fixture: ComponentFixture<TestComponent>;

  const mockToasts = {
    success: vi.fn(),
  };

  const mockClipboard = {
    copy: vi.fn(),
  };

  beforeEach(() => {
    fixture = TestBed.configureTestingModule({
      declarations: [TestComponent],
      providers: [
        CopyLinkDirective,
        { provide: ToastService, useValue: mockToasts },
        { provide: Clipboard, useValue: mockClipboard },
      ],
    }).createComponent(TestComponent);
    directive = TestBed.inject(CopyLinkDirective);
    fixture.detectChanges();
  });

  it('should copy url to clipboard on click', () => {
    directive.fluxnovaCopyLink = mockUrl;
    directive.onClick();
    expect(directive.clipboard.copy).toHaveBeenCalledWith(directive.fluxnovaCopyLink);
    expect(directive.toastService.success).toHaveBeenCalled();
  });
});
