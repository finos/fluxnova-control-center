import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { ActionsFloatingContainerComponent } from './actions-floating-container.component';

describe('ActionsFloatingContainerComponent', () => {
  let fixture: ComponentFixture<ActionsFloatingContainerComponent>;
  let component: ActionsFloatingContainerComponent;
  let nativeElement: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ActionsFloatingContainerComponent],
    });
    fixture = TestBed.createComponent(ActionsFloatingContainerComponent);
    component = fixture.componentInstance;
    nativeElement = fixture.nativeElement;
  });

  test('Shows reset button when input showResetGridButton is true', () => {
    component.showResetGridButton = true;

    fixture.detectChanges();

    const resetButton = nativeElement.querySelector('button');
    expect(resetButton).toBeInstanceOf(HTMLButtonElement);
    expect(resetButton?.textContent?.includes('Reset Grid')).toBe(true);
  });

  test('Does not show reset button when input showResetGridButton is false', () => {
    component.showResetGridButton = false;

    fixture.detectChanges();

    const resetButton = nativeElement.querySelector('button');
    expect(resetButton).toBeNull();
  });

  test('Emits event when reset grid is clicked', () => {
    const emitSpy = vi.spyOn(component.resetGridClicked, 'emit');

    component.onResetGridClicked();

    expect(emitSpy).toHaveBeenCalled();
  });
});
