import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IconComponent } from '@fxn/common';
import { beforeEach, describe, expect, it } from 'vitest';
import { DiagramLegendComponent } from './diagram-legend.component';

describe('DiagramLegendComponent', () => {
  let component: DiagramLegendComponent;
  let fixture: ComponentFixture<DiagramLegendComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DiagramLegendComponent, IconComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DiagramLegendComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should contain colorData', () => {
    expect(component.colorData).toBeInstanceOf(Array);
    expect(component.colorData.length).toBe(4);
  });

  it('should properly `open` and `close`', () => {
    component.open({ preventDefault: () => {} } as MouseEvent);
    expect(component.legendStyle.visibility).toBe('visible');

    component.close({ target: document.createElement('div') });
    expect(component.legendStyle.visibility).toBe('hidden');
  });

  it('should close via force', () => {
    component.open({ preventDefault: () => {} } as MouseEvent);
    expect(component.legendStyle.visibility).toBe('visible');

    component.close({ target: component.diagramLegend.nativeElement }, true);
    expect(component.legendStyle.visibility).toBe('hidden');
  });
});
