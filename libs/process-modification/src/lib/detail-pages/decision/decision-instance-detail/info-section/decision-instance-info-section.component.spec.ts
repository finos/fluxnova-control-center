import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, Mocked, vi } from 'vitest';
import { DecisionDefinitionService } from '../../../../services/decision-definition.service';
import { DecisionInstanceService } from '../../../../services/decision-instance.service';
import { DecisionInstanceInfoSectionComponent } from './decision-instance-info-section.component';

describe('DecisionInstanceInfoSectionComponent', () => {
  let component: DecisionInstanceInfoSectionComponent;
  let fixture: ComponentFixture<DecisionInstanceInfoSectionComponent>;

  const defServiceMock: Mocked<DecisionDefinitionService> = {
    getDecisionDefinitionDetail: vi.fn(() => of({ deploymentId: 'deploymentId' })),
  } as unknown as Mocked<DecisionDefinitionService>;

  const instServiceMock: Mocked<DecisionInstanceService> = {
    getInstance: vi.fn(() => of({ id: 'instanceId' })),
  } as unknown as Mocked<DecisionInstanceService>;

  const mockActivatedRoute = {
    snapshot: {
      params: {
        id: 'asdf',
        instanceId: 'qwer',
      },
    },
  } as unknown as ActivatedRoute;

  const mockRouter = {
    navigate: vi.fn(),
    url: 'test/page/',
  } as unknown as Router;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      declarations: [DecisionInstanceInfoSectionComponent],
      providers: [
        { provide: DecisionDefinitionService, useValue: defServiceMock },
        { provide: DecisionInstanceService, useValue: instServiceMock },
        {
          provide: ActivatedRoute,
          useValue: mockActivatedRoute,
        },
        {
          provide: Router,
          useValue: mockRouter,
        },
      ],
    });

    fixture = TestBed.createComponent(DecisionInstanceInfoSectionComponent);
    component = fixture.componentInstance;

    component.ngOnInit();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should get the deployment details', () => {
    expect(defServiceMock.getDecisionDefinitionDetail).toHaveBeenCalledWith('asdf');
  });

  it('should get the instance details', () => {
    expect(instServiceMock.getInstance).toHaveBeenCalledWith('qwer');
  });

  it('should aggregate the data from the services', () => {
    expect(component.decisionInstance).toEqual({ id: 'instanceId', deploymentId: 'deploymentId' });
  });
});
