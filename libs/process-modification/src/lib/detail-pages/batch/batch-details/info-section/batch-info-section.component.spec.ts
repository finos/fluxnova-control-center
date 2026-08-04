import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { DateFormatPipe } from '@fxn/common';
import { beforeEach, describe, expect, it } from 'vitest';
import { BatchInfoSectionComponent } from './batch-info-section.component';

describe('BatchInfoSectionComponent', () => {
  let component: BatchInfoSectionComponent;
  let fixture: ComponentFixture<BatchInfoSectionComponent>;

  const mockActivatedRoute = {
    snapshot: {
      params: {
        id: '1234',
      },
    },
  } as unknown as ActivatedRoute;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BatchInfoSectionComponent, DateFormatPipe],
      schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: mockActivatedRoute,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BatchInfoSectionComponent);
    component = fixture.componentInstance;
    component.batch = { id: '1234' };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should populate batchId', () => {
    expect(component.batchId).toEqual(mockActivatedRoute.snapshot.params.id);
  });

  it('should populate batch', () => {
    expect(component.batch.id).toEqual(component.batchId);
  });
});
