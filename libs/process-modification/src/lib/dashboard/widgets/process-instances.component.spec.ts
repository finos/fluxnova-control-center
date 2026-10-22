import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FLUXNOVA_DATE_FORMAT } from '@fxn/types';
import moment from 'moment-timezone';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProcessInstanceService } from '../../services/process-instance.service';
import { PaginatedDataRequest } from '../../services/types/paginated-data-request';
import { LEGEND_DRILLDOWN_TITLE, LEGEND_TITLE } from '../chart-defaults';
import { ProcessInstancesComponent } from './process-instances.component';

const mockDate = new Date('2023-10-25T10:00:00.000-0600');
vi.useFakeTimers();
vi.setSystemTime(mockDate);

describe('Process Instances Widget', () => {
  let component: ProcessInstancesComponent;
  let fixture: ComponentFixture<ProcessInstancesComponent>;
  let mockInstancesService = {
    getProcessInstancesByFilter: vi.fn(),
  };

  const DEF_KEY = 'test-process-definition-key';
  const DEF_ID = 'afc0f398-b9ae-11ee-a63f-02a54c776723';
  const INSTANCE = {
    id: '3a7a1a95-b9af-11ee-a63f-02a54c776723',
    processDefinitionKey: DEF_KEY,
    processDefinitionId: DEF_ID,
    processInstanceId: '33446672-b9af-11ee-a63f-02a54c776723',
    executionId: '33446672-b9af-11ee-a63f-02a54c776723',
    rootProcessInstanceId: '33446672-b9af-11ee-a63f-02a54c776723',
    startTime: '2024-01-23T00:21:14.656-0500',
    endTime: null,
    removalTime: null,
    tenantId: null,
    open: true,
    deleted: false,
    resolved: false,
  } as any;

  beforeEach(async () => {
    mockInstancesService = {
      getProcessInstancesByFilter: vi.fn(() => of([INSTANCE])),
    };

    await TestBed.configureTestingModule({
      declarations: [ProcessInstancesComponent],
      imports: [BaseChartDirective],
      providers: [
        { provide: ProcessInstanceService, useValue: mockInstancesService },
        provideCharts(withDefaultRegisterables()),
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ProcessInstancesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(vi.clearAllMocks);

  it('loads data for the past 30 days on init', () => {
    expect(mockInstancesService.getProcessInstancesByFilter).toHaveBeenCalledTimes(1);
    const arg = mockInstancesService.getProcessInstancesByFilter.mock.calls[0][0];
    expect(arg).toBeInstanceOf(PaginatedDataRequest);
    expect(arg).toMatchObject({
      filter: {
        unfinished: true,
        startedAfter: moment(mockDate).subtract(30, 'days').format(FLUXNOVA_DATE_FORMAT),
        sorting: [
          {
            sortBy: 'definitionKey',
            sortOrder: 'desc',
          },
        ],
      },
      maxResults: component.MAX_ITEM_COUNT,
      firstResult: 0,
    });
  });

  it('converts data to chart series and sets chart labels', () => {
    expect(component.chartData.datasets[0].data).toEqual([1]);
    expect(component.chartData.labels).toEqual([DEF_KEY]);
    expect(component.totalItems).toBe(1);
    expect(component.legendTitle).toBe(LEGEND_TITLE);
    expect(component.subtitle).toBe(component.MAIN_SUBTITLE);
  });

  it('reloads the data when a new time frame is selected', () => {
    mockInstancesService.getProcessInstancesByFilter.mockClear();

    component.timeFrameSelected = component.timeFrameOptions[6].value; // 90-days
    component.onTimeFrameSelected();

    expect(mockInstancesService.getProcessInstancesByFilter).toHaveBeenCalledTimes(1);
    const arg = mockInstancesService.getProcessInstancesByFilter.mock.calls[0][0];
    expect(arg).toMatchObject({
      filter: {
        unfinished: true,
        startedAfter: moment(mockDate).subtract(90, 'days').format(FLUXNOVA_DATE_FORMAT),
        sorting: [
          {
            sortBy: 'definitionKey',
            sortOrder: 'desc',
          },
        ],
      },
      maxResults: component.MAX_ITEM_COUNT,
      firstResult: 0,
    });
  });

  it('updates title hyperlink with total count', () => {
    expect(component.displayCount).toBe(1);
    expect(component.linkHref).toContain('process-instances');
  });

  it('updates title hyperlink with max indicator when capped', () => {
    component.MAX_ITEM_COUNT = 1;
    // trigger recalculation
    component.setChartData([1], [DEF_KEY], false);
    expect(component.displayCount).toBe('1+');
  });

  it('drills down to definition id when a chart slice with drill data is selected', () => {
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
    const incidents = [
      { ...INSTANCE },
      { ...INSTANCE, id: 'i2' },
      { ...INSTANCE, id: 'i3' },
      { ...INSTANCE, id: 'i4', processDefinitionKey: 'other-def', processDefinitionId: 'other-def-id' },
      { ...INSTANCE, id: 'i5', processDefinitionKey: 'other-def', processDefinitionId: 'other-def-id' },
    ];
    mockInstancesService.getProcessInstancesByFilter.mockReturnValueOnce(of(incidents));

    component.onTimeFrameSelected();

    expect(component.totalItems).toBe(5);

    component.onLegendItemClick(1);
    expect(component.totalItems).toBe(3);
    expect(component.chartData.datasets[0].data).toEqual([3, 0]);

    component.onLegendItemClick(1);
    expect(component.totalItems).toBe(5);
    expect(component.chartData.datasets[0].data).toEqual([3, 2]);
  });

  it('restores main series and visibility on drillup', () => {
    const incidents = [
      { ...INSTANCE },
      { ...INSTANCE, id: 'i2' },
      { ...INSTANCE, id: 'i3' },
      { ...INSTANCE, id: 'i4', processDefinitionKey: 'other-def', processDefinitionId: 'other-def-id' },
      { ...INSTANCE, id: 'i5', processDefinitionKey: 'other-def', processDefinitionId: 'other-def-id' },
    ];
    mockInstancesService.getProcessInstancesByFilter.mockReturnValueOnce(of(incidents));
    component.onTimeFrameSelected();

    component.onLegendItemClick(1);
    expect(component.chartData.datasets[0].data).toEqual([3, 0]);

    component.onChartClick({ active: [{ index: 0 }] });
    component.onChartClick({ active: [{ index: 0 }] });
    expect(component.drilldown).toBe(true);

    component.onDrillup();
    expect(component.drilldown).toBe(false);
    expect(component.subtitle).toBe(component.MAIN_SUBTITLE);
    expect(component.legendTitle).toBe(LEGEND_TITLE);
    expect(component.chartData.labels).toEqual(['test-process-definition-key', 'other-def']);
    expect(component.chartData.datasets[0].data).toEqual([3, 0]);
  });

  it('dims other slices on hover and restores colors when the pointer leaves', () => {
    component.setChartData([1, 2, 3], ['one', 'two', 'three'], false);
    const chart = { update: vi.fn() } as any;

    component.onChartHover({ active: [{ index: 1 }] }, chart);

    const hoveredColors = component.chartData.datasets[0].backgroundColor as string[];
    expect(hoveredColors[1]).toBe('#9747F6');
    expect(hoveredColors[0]).toContain('0.3)');
    expect(chart.update).toHaveBeenCalledWith('none');

    component.onChartHover({ active: [] }, chart);

    expect(component.chartData.datasets[0].backgroundColor).toEqual(['#368727', '#9747F6', '#5B2C8F']);
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
