import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  ActivityNameFromDomRendererComponent,
  ActivityNameFromDomRendererParams,
} from './activity-name-from-dom-renderer.component';

describe('ActivityGridCellComponent', () => {
  let component: ActivityNameFromDomRendererComponent;
  let fixture: ComponentFixture<ActivityNameFromDomRendererComponent>;
  const calledActivityId = 'test-call-activity-id';
  const calledActivityName = 'test-call-activity-name';
  let doc: Document;

  function getMockSvgElement(labelPositionedOutside = false) {
    const svgElement = document.createElement('svg');
    const gElement = document.createElement('g');
    const textElement = document.createElement('text');

    gElement.setAttribute('data-element-id', labelPositionedOutside ? `${calledActivityId}_label` : calledActivityId);
    gElement.appendChild(textElement);

    textElement.textContent = calledActivityName;

    gElement.appendChild(textElement);
    svgElement.appendChild(gElement);

    return svgElement;
  }

  function initializeComponent() {
    component.agInit({
      data: { activityId: calledActivityId },
      sourceField: 'activityId',
    } as ActivityNameFromDomRendererParams);
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({});
    doc = TestBed.inject(DOCUMENT);
    fixture = TestBed.createComponent(ActivityNameFromDomRendererComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    doc?.body?.querySelector('svg')?.remove();
    TestBed.resetTestingModule();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have refresh always return false', () => {
    expect(component.refresh()).toBe(false);
  });

  it('should set calledActivityName to inner label text when it exists', () => {
    doc.body.appendChild(getMockSvgElement());

    initializeComponent();

    expect(component.calledActivityName).toBe(calledActivityName);
  });

  it('should set calledActivityName to outer label text when it exists', () => {
    doc.body.appendChild(getMockSvgElement(true));

    initializeComponent();

    expect(component.calledActivityName).toBe(calledActivityName);
  });
});
