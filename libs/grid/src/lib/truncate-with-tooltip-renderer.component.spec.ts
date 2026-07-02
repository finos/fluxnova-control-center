import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TruncateWithTooltipRendererComponent } from './truncate-with-tooltip-renderer.component';

describe('Truncate With Tooltip Renderer Component', () => {
  let component: TruncateWithTooltipRendererComponent;
  let fixture: ComponentFixture<TruncateWithTooltipRendererComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TruncateWithTooltipRendererComponent],
    });

    fixture = TestBed.createComponent(TruncateWithTooltipRendererComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should use inner html to render html with mark tag', () => {
    component.agInit({ value: 'test <mark>search term</mark>' });
    fixture.detectChanges();
    expect(component.isHtml).toBe(true);
  });

  it('should use inner html to render html with bold tag', () => {
    component.agInit({ value: '<b>variableName:</b>VariableValue' });
    fixture.detectChanges();
    expect(component.isHtml).toBe(true);
  });

  it('use text content if no mark tag is found', () => {
    component.agInit({ value: 'test search term' });
    fixture.detectChanges();
    expect(component.isHtml).toBe(false);
  });
});
