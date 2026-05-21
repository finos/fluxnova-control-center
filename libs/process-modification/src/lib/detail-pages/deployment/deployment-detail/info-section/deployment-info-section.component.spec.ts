import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, Mocked, vi } from 'vitest';
import { DeploymentService } from '../../../../services/deployment.service';
import { ProcessDefinitionService } from '../../../../services/process-definition.service';
import { DecisionDefinitionService } from '../../../../services/decision-definition.service';
import { DeploymentInfoSectionComponent } from './deployment-info-section.component';

describe('Deployment Info Section Component', () => {
  let component: DeploymentInfoSectionComponent;
  let fixture: ComponentFixture<DeploymentInfoSectionComponent>;

  const mockHttp = { get: vi.fn(), post: vi.fn() };

  const mockRoute = {
    snapshot: {
      params: { id: 1 },
    },
  };

  const mockProcessDefinitionService: Mocked<ProcessDefinitionService> = {
    getProcessDefinitionsByFilter: vi.fn(() =>
      of([
        {
          id: 1,
          name: 'testingName',
          key: 'testingKey',
          version: 1,
          resource: 'testing.bpmn',
        },
      ]),
    ),
  } as unknown as Mocked<ProcessDefinitionService>;

  const mockDecisionDefinitionService = {
    getDecisionDefinitionList: vi.fn(() =>
      of([
        {
          id: '1',
          name: 'testDecision',
          key: 'testKey',
        },
      ]),
    ),
  } as unknown as Mocked<DecisionDefinitionService>;

  const mockDeploymentService = {
    getDeploymentDetails: vi.fn(() => of({})),
    setSelectedResource: vi.fn(),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DeploymentInfoSectionComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
      providers: [
        { provide: HttpClient, useValue: mockHttp },
        { provide: ActivatedRoute, useValue: mockRoute },
        { provide: ProcessDefinitionService, useValue: mockProcessDefinitionService },
        { provide: DecisionDefinitionService, useValue: mockDecisionDefinitionService },
        { provide: DeploymentService, useValue: mockDeploymentService },
      ],
    });
    fixture = TestBed.createComponent(DeploymentInfoSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should format the date shown correctly', () => {
    const myDate = new Date();

    const year = myDate.getFullYear();
    const month = (myDate.getMonth() + 1).toString().padStart(2, '0');
    const day = myDate.getDate().toString().padStart(2, '0');
    const hours = myDate.getHours().toString().padStart(2, '0');
    const minutes = myDate.getMinutes().toString().padStart(2, '0');
    const seconds = myDate.getSeconds().toString().padStart(2, '0');

    expect(component.formatDate(myDate.toString())).toEqual(`${year}-${month}-${day} ${hours}:${minutes}:${seconds}`);
  });

  it('should correctly show a version when one matches the resource type', () => {
    component.handleSelectResource({
      id: '123',
      deploymentId: '1234',
      name: 'testing.bpmn',
    });
    fixture.detectChanges();

    expect(component.version).toEqual(1);
  });

  it('should correctly show a version when one matches a .dmn resource type', () => {
    // Add a DMN resource to the deploymentProcessResourceList
    component.deploymentProcessResourceList.push({
      id: '456',
      name: 'testDecision',
      key: 'testKey',
      fileName: 'test-decision.dmn',
      version: 2,
    });

    component.handleSelectResource({
      id: '456',
      deploymentId: '1234',
      name: 'test-decision.dmn',
    });
    fixture.detectChanges();

    expect(component.version).toEqual(2);
  });
});
