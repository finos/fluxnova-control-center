import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { WINDOW } from 'ngx-window-token';
import { MockFluxnovaHasPermissionsDirective } from '@fxn/test-support/src/lib/mock-fluxnova-has-permissions-directive';
import { afterEach, beforeEach, describe, expect, it, Mocked, vi } from 'vitest';
import { PimCommandStackService } from '../pim-command-stack.service';
import { ContextMenuComponent } from './context-menu.component';
import { ContextMenuItemAction } from './context-menu-item.service';

describe('Context Menu Component', () => {
  let component: ContextMenuComponent;
  let fixture: ComponentFixture<ContextMenuComponent>;
  const contextMenuWidth = 160;
  const contextMenuHeight = 140;
  const mockCommandStack = {
    clear: vi.fn(),
    undoStack: [],
  } as unknown as Mocked<PimCommandStackService>;
  let contextMenuElement: HTMLDivElement;
  const mockWindow = {
    innerWidth: 1800,
    innerHeight: 900,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ContextMenuComponent, MockFluxnovaHasPermissionsDirective],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        { provide: PimCommandStackService, useValue: mockCommandStack },
        { provide: WINDOW, useValue: mockWindow },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ContextMenuComponent);
    component = fixture.componentInstance;
    contextMenuElement = (fixture.nativeElement as HTMLDivElement).firstChild as HTMLDivElement;
    Object.defineProperty(contextMenuElement, 'getBoundingClientRect', {
      value: () => ({ width: contextMenuWidth, height: contextMenuHeight }),
    });
    fixture.detectChanges();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('open', () => {
    beforeEach(() => {
      component.init({
        target: {},
        items: [{ iconName: 'test-icon-name', title: 'test-title', action: ContextMenuItemAction.REDO }],
      });
    });

    it('positions itself to the bottom right of the mouse by default', async () => {
      component.open(0, 0);
      await vi.runAllTimersAsync();
      fixture.detectChanges();

      expect(contextMenuElement.style).toMatchObject({
        top: `0px`,
        left: `0px`,
        visibility: 'visible',
      });
    });

    it('positions itself above mouse when too close to the bottom of the window', async () => {
      const mouseY = mockWindow.innerHeight - 1;

      component.open(0, mouseY);
      await vi.runAllTimersAsync();
      fixture.detectChanges();

      expect(contextMenuElement.style).toMatchObject({
        top: `${mouseY - contextMenuHeight}px`,
        left: '0px',
        visibility: 'visible',
      });
    });

    it('positions itself left of mouse when too close to the right of the window', async () => {
      const mouseX = mockWindow.innerWidth - 1;

      component.open(mouseX, 0);
      await vi.runAllTimersAsync();
      fixture.detectChanges();

      expect(contextMenuElement.style).toMatchObject({
        top: '0px',
        left: `${mouseX - contextMenuWidth}px`,
        visibility: 'visible',
      });
    });
  });
});
