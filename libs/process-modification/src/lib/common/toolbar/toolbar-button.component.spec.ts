import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { IconComponent } from '@fxn/common';
import { beforeEach, describe, expect, it } from 'vitest';
import { ToolbarButtonComponent } from './toolbar-button.component';

describe('ToolbarButtonComponent', () => {
  let component: ToolbarButtonComponent;
  let fixture: ComponentFixture<ToolbarButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ToolbarButtonComponent, IconComponent],
      imports: [NgbTooltip],
    }).compileComponents();

    fixture = TestBed.createComponent(ToolbarButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
