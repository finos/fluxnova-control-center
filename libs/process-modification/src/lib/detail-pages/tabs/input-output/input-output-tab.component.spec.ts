import { LetDirective } from '@ngrx/component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthorizationHttpService, LoadingDirective } from '@fxn/common';
import { IRowNode } from 'ag-grid-community';
import { DecisionInstance } from '@fxn/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BaseTabComponent } from '../base-tab-component';
import { DecisionInstanceService } from '../../../services/decision-instance.service';
import { PimTab, PimTabRowQueryParam } from '../../item-detail-tab-utils';
import { PaginatedDataRequest } from '../../../services/types/paginated-data-request';
import { InputOutputTabComponent } from './input-output-tab.component';

describe('Input output tab component', () => {
  let component: InputOutputTabComponent;
  let fixture: ComponentFixture<InputOutputTabComponent>;

  const mockDecisionInstanceService = {
    getInstance: vi.fn().mockReturnValue({
      inputs: [
        {
          clauseName: 'testInput',
          type: 'Null',
          value: null,
        },
      ],
      outputs: [
        {
          clauseName: 'testOutput',
          type: 'Null',
          value: null,
        },
      ],
    }),
  };

  const mockRoute = {
    params: of({}),
    queryParams: {
      subscribe: vi.fn(),
    },
  };

  const mockAuthHttpService = {
    checkSync: vi.fn().mockResolvedValue(true),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [InputOutputTabComponent, LoadingDirective],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [LetDirective, NgbModule],
      providers: [
        { provide: ActivatedRoute, useValue: mockRoute },
        { provide: AuthorizationHttpService, useValue: mockAuthHttpService },
        { provide: DecisionInstanceService, useValue: mockDecisionInstanceService },
      ],
    });
    fixture = TestBed.createComponent(InputOutputTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('returns Inputs tab when showType is Inputs', () => {
    component.showType = 'inputs';
    expect(component.tab).toBe(PimTab.Inputs);
  });

  it('returns Outputs tab when showType is not Inputs', () => {
    component.showType = 'outputs';
    expect(component.tab).toBe(PimTab.Outputs);
  });

  it('returns Undefined for rowItemQueryParam', () => {
    expect(component.rowItemQueryParam).toBe(PimTabRowQueryParam.Undefined);
  });

  it('calls decisionInstanceService with correct decisionInstanceId', () => {
    const mockRequest = new PaginatedDataRequest({ decisionInstanceId: '123' });
    const spy = vi.spyOn(mockDecisionInstanceService, 'getInstance');
    component.dataService(mockRequest);
    expect(spy).toHaveBeenCalledWith('123');
  });

  it('loads inputs data when showType is inputs', () => {
    const mockData = { inputs: [{ clauseName: 'input1', type: 'String', value: 'value1' }] };
    mockDecisionInstanceService.getInstance.mockReturnValue(of(mockData));
    component.showType = 'inputs';
    component.loadData('123');
    expect(component.data).toEqual(mockData.inputs);
    expect(component.isLoading).toBe(false);
  });

  it('loads outputs data when showType is outputs', () => {
    const mockData = { outputs: [{ clauseName: 'output1', type: 'String', value: 'value1' }] };
    mockDecisionInstanceService.getInstance.mockReturnValue(of(mockData));
    component.showType = 'outputs';
    component.loadData('123');
    expect(component.data).toEqual(mockData.outputs);
    expect(component.isLoading).toBe(false);
  });

  it('handles error when dataService fails', () => {
    const error = new Error('Service error');
    mockDecisionInstanceService.getInstance.mockReturnValue(throwError(() => error));
    component.loadData('123');
    expect(component.data).toEqual([]);
    expect(component.isLoading).toBe(false);
  });

  it('updates totalCount correctly when data is loaded', () => {
    const mockData = [{ id: 1 }, { id: 2 }, { id: 3 }];
    component.onDataLoad(mockData);
    expect(component.totalCount).toBe(3);
  });

  it('sets totalCount to zero when empty data is loaded', () => {
    const mockData: any[] = [];
    component.onDataLoad(mockData);
    expect(component.totalCount).toBe(0);
  });

  it('returns false for selectable rows when parent returns true', () => {
    vi.spyOn(BaseTabComponent.prototype, 'isRowSelectable').mockReturnValue(true);
    const mockRow = { data: {} } as IRowNode<DecisionInstance>;
    const result = component.isRowSelectable(mockRow);
    expect(result).toBe(false);
  });

  it('returns true for selectable rows when parent returns false', () => {
    vi.spyOn(BaseTabComponent.prototype, 'isRowSelectable').mockReturnValue(false);
    const mockRow = { data: {} } as IRowNode<DecisionInstance>;
    const result = component.isRowSelectable(mockRow);
    expect(result).toBe(true);
  });
});
