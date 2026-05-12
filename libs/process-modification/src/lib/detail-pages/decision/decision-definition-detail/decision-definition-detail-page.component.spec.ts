import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, lastValueFrom, of } from 'rxjs';
import { MODAL_DEFAULTS } from '@fxn/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonActions } from '@fxn/types/src/button-actions';
import { beforeEach, describe, expect, it, Mocked, vi } from 'vitest';
import { ConfirmActionService } from '../../../services/confirm-action.service';
import { DecisionDefinitionService } from '../../../services/decision-definition.service';
import { DecisionInstanceService } from '../../../services/decision-instance.service';
import { PimTab } from '../../item-detail-tab-utils';
import { EvaluateDecisionModalService } from './evaluate-decision-modal/evaluate-decision-modal.service';
import { DecisionDefinitionDetailPageComponent } from './decision-definition-detail-page.component';

describe('DecisionDefinitionDetailPageComponent', () => {
  let component: DecisionDefinitionDetailPageComponent;
  let fixture: ComponentFixture<DecisionDefinitionDetailPageComponent>;

  const mockRouter = {
    navigate: vi.fn(),
  };

  const mockRoute = {
    params: of([{ id: 1 }]),
    snapshot: {
      data: {
        itemType: 'Deployment',
        itemTypeClass: 'deployment',
        itemTypeListName: 'Deployments',
        itemTypeName: 'Deployment',
      },
      params: {
        id: 1,
      },
      queryParams: of({
        tab: '',
      }),
    },
  };

  const mockHttp = { get: vi.fn(() => ({ pipe: vi.fn() })) } as any;

  const mockEvaluateDecisionModalService = {
    show: vi.fn(),
  } as unknown as Mocked<EvaluateDecisionModalService>;

  const mockDecisionInstanceService = {
    getInstancesCount: vi.fn(() => of(0)),
  } as unknown as Mocked<DecisionInstanceService>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DecisionDefinitionDetailPageComponent],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockRoute },
        { provide: HttpClient, useValue: mockHttp },
        { provide: EvaluateDecisionModalService, useValue: mockEvaluateDecisionModalService },
        { provide: DecisionInstanceService, useValue: mockDecisionInstanceService },
        {
          provide: DecisionDefinitionService,
          useValue: {
            getDecisionDefinitionDetail: vi.fn(() =>
              of({
                id: '1',
              }),
            ),
          },
        },
        { provide: ConfirmActionService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(DecisionDefinitionDetailPageComponent);
    component = fixture.componentInstance;
    component.queryParams$ = of({ tab: 'testTab' });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set observables for is item found on init', async () => {
    component.ngOnInit();

    expect(component.isItemFound$).toBeDefined();
    await expect(lastValueFrom(component.isItemFound$ as any)).resolves.toEqual(true);
    expect(component.isLoading).toEqual(false);
  });

  it('returns an observable with tab count when tab is DecisionInstances', async () => {
    const mockFilter = { key: 'value' };

    vi.spyOn(mockDecisionInstanceService, 'getInstancesCount').mockReturnValue(of(5));
    const result$ = component.getUpdatedTabCountsObservable({ tab: PimTab.DecisionInstances, filter: mockFilter });

    const counts = await firstValueFrom(result$);
    expect(counts).toEqual({ [PimTab.DecisionInstances]: 5 });
  });

  it('returns an empty observable when tab is undefined', async () => {
    const result$ = component.getUpdatedTabCountsObservable({ tab: undefined as any, filter: {} });

    const counts = await firstValueFrom(result$);
    expect(counts).toEqual({});
  });

  it('returns an empty observable when serviceObservable is undefined', async () => {
    const result$ = component.getUpdatedTabCountsObservable({ tab: 'InvalidTab', filter: {} });

    const counts = await firstValueFrom(result$);
    expect(counts).toEqual({});
  });

  it('should show Evaluate modal when the EVALUATE_DECISION button is clicked', async () => {
    component.ngOnInit();

    await component.onToolbarButtonClick({ action: 'click', target: ButtonActions.EVALUATE_DECISION });

    expect(mockEvaluateDecisionModalService.show).toHaveBeenCalledWith(
      {
        decisionDefinitionId: 1,
        title: 'Evaluate Decision',
        message:
          'Evaluate a decision with this definition by entering the variable information to use for the evaluation.',
        jsonValue: '',
      },
      { ...MODAL_DEFAULTS, modalDialogClass: 'dynamic-modal' },
    );
  });

  it('should unsubscribe on destroy', () => {
    const unsubscribeSpy = vi.spyOn(component['subs$'], 'unsubscribe');

    component.ngOnDestroy();

    expect(unsubscribeSpy).toHaveBeenCalled();
  });
});
