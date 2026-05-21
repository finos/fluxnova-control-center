import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RouterModule } from '@angular/router';
import { LinkRendererComponent } from './link-renderer.component';

vi.mock('@fxn/common');
describe('Link Renderer Component', () => {
  let component: LinkRendererComponent;
  let fixture: ComponentFixture<LinkRendererComponent>;

  const mockParams = {
    $scope: undefined,
    api: undefined,
    colDef: {
      field: '',
    },
    column: undefined,
    context: undefined,
    data: undefined,
    eGridCell: undefined,
    eParentOfValue: undefined,
    formatValue: () => {},
    getValue: () => {},
    node: undefined,
    refreshCell: () => {},
    rowIndex: 0,
    setValue: () => {},
    value: '',
    valueFormatted: undefined,
    registerRowDragger: () => {},
  } as any;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [LinkRendererComponent],
      imports: [RouterModule.forRoot([])],
      providers: [],
    });

    fixture = TestBed.createComponent(LinkRendererComponent);
    component = fixture.componentInstance;
    component.agInit(mockParams);
    fixture.detectChanges();
  });

  it('should return the internalPath to false with no value', () => {
    expect(component.isInternalPath).toBe(true);
  });

  it('should return the internalPath to false if the value is set to a string', () => {
    component.refresh({ ...mockParams, value: 'test value' });
    expect(component.isInternalPath).toBe(true);
  });

  it('should return the internalPath to false if the value starts with http://', () => {
    component.refresh({ ...mockParams, value: 'http://' });
    expect(component.isInternalPath).toBe(false);
  });

  it('should return the internalPath to false if the value starts with https://', () => {
    component.refresh({ ...mockParams, value: 'https://' });
    expect(component.isInternalPath).toBe(false);
  });

  it('should set the href to the value being passed', () => {
    component.refresh({ ...mockParams, value: 'test value' });
    expect(component.href).toBe('test value');
  });

  it('should set the href to whatever /params.value is when the field is `id', () => {
    component.refresh({ ...mockParams, colDef: { field: 'id' }, value: 'test value' });
    expect(component.href).toBe('test value');
  });

  it('should set the href to `../process-definitions/${params.value}` if the field is `processDefinitionId', () => {
    component.refresh({ ...mockParams, colDef: { field: 'processDefinitionId' }, value: 'test_process_definition_id' });
    expect(component.href).toBe('../process-definitions/test_process_definition_id');
  });

  it('should set the href to `../process-instances/${params....processInstanceId}` if the field is `processInstanceId', () => {
    component.refresh({
      ...mockParams,
      colDef: { field: 'processInstanceId' },
      value: 'test_process_instance_id',
      data: { processInstanceId: 'test_process_instance_id' },
    });
    expect(component.href).toBe('../process-instances/test_process_instance_id');
  });

  it('should set the href to based on cellRenderer Params path and path param field if the colDef has cellRenderer Params', () => {
    component.refresh({
      ...mockParams,
      colDef: { field: 'jobId', cellRendererParams: { path: 'presetPath', pathParamField: 'processInstanceId' } },
      data: { processInstanceId: 'test_process_instance_id' },
    });
    expect(component.href).toBe('presetPath/test_process_instance_id');
  });

  it('should set the href to based on cellRenderer Params path and value if the colDef has cellRenderer Params path, but not valid pathParamField', () => {
    component.refresh({
      ...mockParams,
      value: 'mock-value',
      colDef: { field: 'jobId', cellRendererParams: { path: 'presetPath', pathParamField: 'fakeField' } },
      data: { processInstanceId: 'test_process_instance_id' },
    });
    expect(component.href).toBe('presetPath/mock-value');
  });

  it('should set disabled = true if required link value is missing', () => {
    component.refresh({
      ...mockParams,
      value: 'mock-value',
      colDef: { field: 'jobId', cellRendererParams: { requiredFieldToEnableLink: 'fakeField' } },
      data: { processInstanceId: 'test_process_instance_id' },
    });
    expect(component.disabled).toBe(true);
  });

  it('should set disabled = false if no fields are required', () => {
    component.refresh({
      ...mockParams,
      value: 'mock-value',
      colDef: { field: 'jobId', cellRendererParams: { requiredFieldToEnableLink: undefined } },
      data: { processInstanceId: 'test_process_instance_id' },
    });
    expect(component.disabled).toBe(false);
  });

  it('should set disabled = false if required link value is truthy', () => {
    component.refresh({
      ...mockParams,
      value: 'mock-value',
      colDef: { field: 'jobId', cellRendererParams: { requiredFieldToEnableLink: 'processInstanceId' } },
      data: { processInstanceId: 'test_process_instance_id' },
    });
    expect(component.disabled).toBe(false);
  });

  it('should set queryParams based on cellRendererParams', () => {
    component.refresh({
      ...mockParams,
      value: 'mock-job-id-value',
      colDef: {
        field: 'jobId',
        cellRendererParams: {
          queryParams: {
            tab: 'jobs',
            jobId: 'mock-job-id-value',
            activityId: 'failed-activity-id',
          },
        },
      },
    });
    expect(component.queryParams).toMatchObject({
      tab: 'jobs',
      jobId: 'mock-job-id-value',
      activityId: 'failed-activity-id',
    });
  });

  it('should set queryParams based on jobId queryParamType', () => {
    component.refresh({
      ...mockParams,
      value: 'mock-job-id-value',
      colDef: { field: 'jobId', cellRendererParams: { queryParamType: 'jobId' } },
      data: { processInstanceId: 'test_process_instance_id', failedActivityId: 'failed-activity-id' },
    });
    expect(component.queryParams).toMatchObject({
      tab: 'jobs',
      jobId: 'mock-job-id-value',
      activityId: 'failed-activity-id',
    });
  });

  it('should set queryParams based on jobDefinitionId queryParamType', () => {
    component.refresh({
      ...mockParams,
      value: 'mock-job-definition-id-value',
      colDef: { field: 'jobDefinitionId', cellRendererParams: { queryParamType: 'jobDefinitionId' } },
      data: {
        processInstanceId: 'test_process_instance_id',
        jobDefinition: { activityId: 'job-definition-activity-id' },
      },
    });
    expect(component.queryParams).toMatchObject({
      tab: 'job-definitions',
      jobDefinitionId: 'mock-job-definition-id-value',
      activityId: 'job-definition-activity-id',
    });
  });

  it('should set queryParams based on incidentId queryParamType', () => {
    component.refresh({
      ...mockParams,
      value: 'mock-incident-id-value',
      colDef: { field: 'incidentId', cellRendererParams: { queryParamType: 'incidentId' } },
      data: {
        id: 'mock-incident-id-value',
        processInstanceId: 'test_process_instance_id',
        activityId: 'incident-activity-id',
      },
    });
    expect(component.queryParams).toMatchObject({
      tab: 'incidents',
      incidentId: 'mock-incident-id-value',
      activityId: 'incident-activity-id',
    });
  });

  it('should build the link correctly from pathParts', () => {
    expect(
      component.getHrefByCellRendererParams({
        ...mockParams,
        value: 'mock-decision-instance-id-value',
        colDef: { field: 'id', cellRendererParams: { pathParts: ['../..', 'decision-instances', ':id'] } },
        data: {
          id: 'mock-decision-instance-id-value',
          processDefinitionId: 'test_process_definition_id',
        },
      }),
    ).toEqual('../../decision-instances/mock-decision-instance-id-value/');
  });
});
