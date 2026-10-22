import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FLUXNOVA_DATE_FORMAT } from '@fxn/types';
import moment from 'moment-timezone';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { IncidentService } from '../../services/incident.service';
import { PaginatedDataRequest } from '../../services/types/paginated-data-request';
import { LEGEND_DRILLDOWN_TITLE, LEGEND_TITLE } from '../chart-defaults';
import { IncidentVolumeComponent } from './incident-volume.component';

const mockDate = new Date('2023-10-25T10:00:00.000-0600');
vi.useFakeTimers();
vi.setSystemTime(mockDate);

describe('Incident Volume Widget', () => {
  let component: IncidentVolumeComponent;
  let fixture: ComponentFixture<IncidentVolumeComponent>;
  let mockIncidentService = {
    getIncidentsByFilterAndPagination: vi.fn(),
  };

  const DEF_KEY = 'test-process-definition-key';
  const DEF_ID = 'afc0f398-b9ae-11ee-a63f-02a54c776723';

  const INCIDENT = {
    id: '3a7a1a95-b9af-11ee-a63f-02a54c776723',
    processDefinitionKey: DEF_KEY,
    processDefinitionId: DEF_ID,
    createTime: '2024-01-23T00:21:14.656-0500',
    open: true,
    resolved: false,
    deleted: false,
  };

  beforeEach(async () => {
    mockIncidentService = {
      getIncidentsByFilterAndPagination: vi.fn(() => of([INCIDENT])),
    };

    await TestBed.configureTestingModule({
      declarations: [IncidentVolumeComponent],
      imports: [BaseChartDirective],
      providers: [
        { provide: IncidentService, useValue: mockIncidentService },
        provideCharts(withDefaultRegisterables()),
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(IncidentVolumeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(vi.clearAllMocks);

  it('calls service with PaginatedDataRequest for past 30 days on init', () => {
    expect(mockIncidentService.getIncidentsByFilterAndPagination).toHaveBeenCalledTimes(1);
    const arg = mockIncidentService.getIncidentsByFilterAndPagination.mock.calls[0][0];
    expect(arg).toBeInstanceOf(PaginatedDataRequest);
    expect(arg).toMatchObject({
      filter: {
        open: true,
        createTimeAfter: moment(mockDate).subtract(30, 'days').format(FLUXNOVA_DATE_FORMAT),
        sortBy: 'processDefinitionKey',
        sortOrder: 'desc',
      },
      maxResults: component.MAX_ITEM_COUNT,
      firstResult: 0,
    });
  });

  it('should load data for the past 30 days on init', () => {
    expect(mockIncidentService.getIncidentsByFilterAndPagination).toHaveBeenCalledWith({
      filter: {
        open: true,
        createTimeAfter: moment(mockDate).subtract(30, 'days').format(FLUXNOVA_DATE_FORMAT),
        sortBy: 'processDefinitionKey',
        sortOrder: 'desc',
      },
      maxResults: component.MAX_ITEM_COUNT,
      firstResult: 0,
    });
  });

  it('normalizes non-process-specific incidents', () => {
    const incident = { ...INCIDENT, processDefinitionId: null, processDefinitionKey: null };
    mockIncidentService.getIncidentsByFilterAndPagination.mockReturnValueOnce(of([incident]));

    const spy = vi.spyOn(component, 'onDataLoaded');
    component.loadData();

    expect(spy).toHaveBeenCalledWith([
      {
        ...incident,
        processDefinitionKey: '(not process specific)',
        processDefinitionId: '(not process specific)',
      },
    ]);
  });

  it('sets chart data and labels from transformed data', () => {
    expect(component.chartData.datasets[0].data).toEqual([1]);
    expect(component.chartData.labels).toEqual([DEF_KEY]);
    expect(component.totalItems).toBe(1);
    expect(component.legendTitle).toBe(LEGEND_TITLE);
    expect(component.subtitle).toBe(component.MAIN_SUBTITLE);
  });

  it('drills down into processDefinitionId when a chart slice with drill data is selected', () => {
    expect(component.drilldown).toBe(false);

    component.onChartClick({ active: [{ index: 0 }] });

    expect(component.drilldown).toBe(true);
    expect(component.legendTitle).toBe(LEGEND_DRILLDOWN_TITLE);
    expect(component.subtitle).toBe(component.DRILLDOWN_SUBTITLE);
    expect(component.chartData.labels).toEqual(expect.arrayContaining([DEF_ID]));
  });

  it('opens process definition page when no drill data exists for selection', () => {
    component.setChartData([2], ['no-drill-label'], false);
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null as any);

    component.onChartClick({ active: [{ index: 0 }] });

    expect(openSpy).toHaveBeenCalledWith(expect.stringMatching(/\/process-definitions\/no-drill-label$/), '_blank');
    openSpy.mockRestore();
  });

  it('toggles visibility via legendClick and recalculates total items', () => {
    // Build chart state with two slices
    const incidents = [
      { ...INCIDENT },
      { ...INCIDENT, id: 'i2' },
      { ...INCIDENT, id: 'i3' },
      { ...INCIDENT, id: 'i4', processDefinitionKey: 'other-def', processDefinitionId: 'other-def-id' },
      { ...INCIDENT, id: 'i5', processDefinitionKey: 'other-def', processDefinitionId: 'other-def-id' },
    ];
    mockIncidentService.getIncidentsByFilterAndPagination.mockReturnValueOnce(of(incidents));

    // Trigger reload to use mocked incidents
    component.onTimeFrameSelected();

    expect(component.totalItems).toBe(5);

    component.onLegendItemClick(1);
    expect(component.totalItems).toBe(3);
    expect(component.chartData.datasets[0].data).toEqual([3, 0]);

    component.onLegendItemClick(1);
    expect(component.totalItems).toBe(5);
    expect(component.chartData.datasets[0].data).toEqual([3, 2]);
  });

  it('reloads data when a new time frame is selected', () => {
    mockIncidentService.getIncidentsByFilterAndPagination.mockClear();

    component.timeFrameSelected = component.timeFrameOptions[6].value;
    component.onTimeFrameSelected();

    expect(mockIncidentService.getIncidentsByFilterAndPagination).toHaveBeenCalledTimes(1);
    const arg = mockIncidentService.getIncidentsByFilterAndPagination.mock.calls[0][0];
    expect(arg).toMatchObject({
      filter: {
        open: true,
        createTimeAfter: moment(mockDate).subtract(90, 'days').format(FLUXNOVA_DATE_FORMAT),
        sortBy: 'processDefinitionKey',
        sortOrder: 'desc',
      },
      maxResults: component.MAX_ITEM_COUNT,
      firstResult: 0,
    });
  });

  describe('widgetTitle pluralization', () => {
    it('shows singular for 1 day', () => {
      component.timeFrameSelected = '1-days';
      component.onTimeFrameSelected();
      expect(component.widgetTitle).toMatch(/.*in the last 1 day$/);
    });

    it('shows plural for 7 days', () => {
      component.timeFrameSelected = '7-days';
      component.onTimeFrameSelected();
      expect(component.widgetTitle).toMatch(/.*in the last 7 days$/);
    });
  });
});
