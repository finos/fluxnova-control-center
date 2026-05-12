import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { ToolbarService } from './toolbar.service';
import { ToolbarButtonComponent } from './toolbar-button.component';

describe('ToolbarService', () => {
  let service: ToolbarService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToolbarService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should determine if right and left buttons are visible', () => {
    const buttons = [
      { iconName: 'edit', hidden: false },
      { iconName: 'download', hidden: false },
      { iconName: 'delete', hidden: true },
    ] as ToolbarButtonComponent[];

    expect(service.leftButtonVisible(buttons)).toBe(true);
    expect(service.rightButtonVisible(buttons)).toBe(true);

    buttons[1].hidden = true;
    expect(service.leftButtonVisible(buttons)).toBe(true);
    expect(service.rightButtonVisible(buttons)).toBe(false);

    buttons[0].hidden = true;
    expect(service.leftButtonVisible(buttons)).toBe(false);
    expect(service.rightButtonVisible(buttons)).toBe(false);
  });
});
