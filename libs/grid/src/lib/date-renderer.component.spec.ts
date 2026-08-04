import { Directive, Pipe, PipeTransform } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { DateRendererComponent } from './date-renderer.component';

describe('Date Renderer Component', () => {
  let component: DateRendererComponent;
  let fixture: ComponentFixture<DateRendererComponent>;

  const mockParams = {
    value: 'initial value',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DateRendererComponent, MockFluxnovaTruncateWithTooltipDirective, MockFluxnovaDatePipe],
    });

    fixture = TestBed.createComponent(DateRendererComponent);
    component = fixture.componentInstance;
    component.agInit(mockParams);
  });

  it('should handle a params update', () => {
    expect(component.params.value).toEqual(mockParams.value);
    component.refresh({ value: 'new value' });
    expect(component.params.value).toEqual('new value');
  });
});

@Directive({
  selector: '[fluxnovaTruncateWithTooltip]',
  standalone: false,
})
export class MockFluxnovaTruncateWithTooltipDirective {}

@Pipe({
  name: 'fluxnovaDate',
  standalone: false,
})
export class MockFluxnovaDatePipe implements PipeTransform {
  transform() {}
}
