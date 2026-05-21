import { beforeEach, describe, expect, it } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ValueWithUnitsComponent } from './value-with-units.component';

describe('ValueWithUnitsComponent', () => {
  let component: ValueWithUnitsComponent;
  let fixture: ComponentFixture<ValueWithUnitsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ValueWithUnitsComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(ValueWithUnitsComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should return "N/A" when value is undefined', () => {
    component.value = undefined;
    expect(component.getFormattedValue()).toBe('N/A');
  });

  it('should return "0" when value is 0', () => {
    component.value = 0;
    expect(component.getFormattedValue()).toBe('0');
  });

  it('should return singular unit when value is 1', () => {
    component.value = 1;
    component.unit = 'day';
    expect(component.getFormattedValue()).toBe('1 day');
  });

  it('should return plural unit when value is greater than 1', () => {
    component.value = 3;
    component.unit = 'month';
    expect(component.getFormattedValue()).toBe('3 months');
  });

  it('should return value with empty unit when unit is missing', () => {
    component.value = 5;
    component.unit = undefined;
    expect(component.getFormattedValue()).toBe('5 ');
  });
});
