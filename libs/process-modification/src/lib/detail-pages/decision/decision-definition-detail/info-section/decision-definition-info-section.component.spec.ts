import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import * as utilsModule from '@fxn/common/src/lib/utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DecisionDefinitionService } from '../../../../services/decision-definition.service';
import { DecisionDefinitionInfoSectionComponent } from './decision-definition-info-section.component';

describe('DecisionDefinitionInfoSectionComponent', () => {
  let component: DecisionDefinitionInfoSectionComponent;
  let fixture: ComponentFixture<DecisionDefinitionInfoSectionComponent>;

  const versionList = Array.from({ length: 10 }).map((unusedObject, index) => ({
    category: 'test-category',
    decisionRequirementsDefinitionId: 'test-decisionRequirementsDefinitionId',
    decisionRequirementsDefinitionKey: 'test-decisionRequirementsDefinitionKey',
    deploymentId: 'test-deploymentId',
    historyTimeToLive: index,
    id: `testId${index}`,
    key: 'test-key',
    name: 'test-name',
    resource: `test-resource${index}`,
    tenantId: 'test-tenantId1',
    version: index,
    versionTag: 'test-versionTag',
  }));

  const decisionDefinitionId = versionList[0].id;

  const serviceMock = {
    getDecisionDefinitionVersionList: vi.fn().mockImplementation(() => of(versionList)),
    getDecisionDefinitions: vi.fn(),
    getDecisionDefinitionDetail: vi.fn(),
    getDecisionDefinitionList: vi.fn(),
    getDecisionDefinitionListCount: vi.fn(),
  } as unknown as DecisionDefinitionService;

  const mockActivatedRoute = {
    snapshot: {
      params: {
        id: decisionDefinitionId,
      },
    },
  } as unknown as ActivatedRoute;

  const mockRouter = {
    navigate: vi.fn(),
    url: 'test/page/',
  } as unknown as Router;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      declarations: [DecisionDefinitionInfoSectionComponent],
      providers: [
        { provide: DecisionDefinitionService, useValue: serviceMock },
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

    fixture = TestBed.createComponent(DecisionDefinitionInfoSectionComponent);
    component = fixture.componentInstance;

    component.ngOnInit();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should get currentVersionDefinitionId', () => {
    expect(component.currentVersionDefinitionId).toEqual(versionList[0].id);
  });

  it('should call navigate on ng-select on change', () => {
    vi.spyOn(utilsModule, 'getUrlSegments').mockImplementation(() => ({
      tenant: 'tenant',
      page: 'page',
    }));
    component.onChange(versionList[1].id);

    expect(mockRouter.navigate).toHaveBeenCalled();
  });
});
