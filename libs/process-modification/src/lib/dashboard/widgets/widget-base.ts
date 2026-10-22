import { ChangeDetectorRef, inject } from '@angular/core';
import { Dictionary, FLUXNOVA_DATE_FORMAT } from '@fxn/types';
import { ActiveElement, ChartData, ChartOptions } from 'chart.js';
import { groupBy } from 'lodash-es';
import moment from 'moment-timezone';
import { BaseChartDirective } from 'ng2-charts';
import { WINDOW } from 'ngx-window-token';
import { SubSink } from 'subsink';
import { DEFAULT_CHART_OPTIONS, DEFAULT_PLOT_COLORS, LEGEND_DRILLDOWN_TITLE, LEGEND_TITLE } from '../chart-defaults';

export interface FluxnovaItem {
  processDefinitionKey?: string;
  processDefinitionId?: string;
}

export interface DrillDataItem {
  series: number[];
  labels: string[];
  id?: string;
}

export interface ChartSeriesItem {
  label: string;
  value: number;
  drilldownId?: string;
}

export class WidgetBase {
  protected window = inject<Window>(WINDOW);
  protected changeDetectorRef = inject(ChangeDetectorRef);

  protected TIMEFRAME_VALUE_SEPARATOR = '-';
  public DRILLDOWN_SUBTITLE = 'Click a slice to view the process definition.';
  public MAIN_SUBTITLE = 'Click a slice to view a breakdown for the definition key.';
  public MAX_ITEM_COUNT = 1000;

  public chartOptions: ChartOptions<'doughnut'> = DEFAULT_CHART_OPTIONS();
  public chartData: ChartData<'doughnut', number[], string> = {
    labels: [],
    datasets: [{ data: [], backgroundColor: [] }],
  };
  public dataLoading = false;
  public timeFrameOptions: { label: string; value: string }[] = [
    { label: 'Past 1 Hour', value: '1-hours' },
    { label: 'Past 4 Hours', value: '4-hours' },
    { label: 'Past 8 Hours', value: '8-hours' },
    { label: 'Past 1 Day', value: '1-days' },
    { label: 'Past 7 Days', value: '7-days' },
    { label: 'Past 30 Days', value: '30-days' },
    { label: 'Past 90 Days', value: '90-days' },
  ];
  public timeFrameSelected: string = this.timeFrameOptions[5].value;
  public totalItems = 0;
  public drilldown = false;
  public subtitle = this.MAIN_SUBTITLE;
  public legendTitle = LEGEND_TITLE;

  private sliceVisibility: boolean[] = [];
  private mainSeries: number[] = [];
  private mainLabels: string[] = [];
  private drillData: Record<string, DrillDataItem> = {};
  private hoveredIndex: number | null = null;

  private currentSeries: number[] = [];
  private currentLabels: string[] = [];
  private mainVisibilityStore: Record<string, boolean> = {};

  protected calculatedTimeFrame = '';
  protected data: FluxnovaItem[] = [];
  protected selectedDefinitionKey = '';
  protected subSink: SubSink = new SubSink();
  private pageLocation = '';

  get linkHref(): string {
    const currentUrl = new URL(this.window.location.href);
    currentUrl.pathname = `${currentUrl.pathname}/${this.pageLocation}`;
    currentUrl.search = this.getQueryParams();
    return currentUrl.toString();
  }

  get displayCount(): string | number {
    return this.totalItems < this.MAX_ITEM_COUNT ? this.totalItems : `${this.MAX_ITEM_COUNT}+`;
  }

  constructor(location: string) {
    this.pageLocation = location;
  }

  get labelsDef(): string[] {
    return (this.chartData.labels ?? []) as string[];
  }
  get visibilityDef(): boolean[] {
    return this.sliceVisibility;
  }
  getColor(index: number): string {
    return DEFAULT_PLOT_COLORS[index % DEFAULT_PLOT_COLORS.length];
  }

  protected getQueryParams(): string {
    return '';
  }

  protected getSliceColors(count: number): string[] {
    return Array.from({ length: count }, (_, index) => {
      const color = this.getColor(index);
      if (this.hoveredIndex === null || index === this.hoveredIndex) {
        return color;
      }

      const red = Number.parseInt(color.slice(1, 3), 16);
      const green = Number.parseInt(color.slice(3, 5), 16);
      const blue = Number.parseInt(color.slice(5, 7), 16);
      return `rgba(${red}, ${green}, ${blue}, 0.3)`;
    });
  }

  setChartData(series: number[], labels: string[], isDrilldown: boolean) {
    this.drilldown = isDrilldown;
    this.totalItems = this.calculateTotalItemsVisible(series);
    this.hoveredIndex = null;
    this.chartData = {
      labels,
      datasets: [
        {
          data: series,
          backgroundColor: this.getSliceColors(labels.length),
          borderWidth: 0,
          hoverOffset: 0,
        },
      ],
    };
  }

  onChartClick(event: { active?: ActiveElement[] }) {
    const activeElement = event.active?.[0];
    if (!activeElement) {
      return;
    }

    const selectedData = this.labelsDef[activeElement.index];
    if (this.drillData[selectedData]) {
      this.selectedDefinitionKey = selectedData;
      this.onDrilldown(selectedData);
    } else {
      const currentUrl = new URL(this.window.location.href);
      currentUrl.pathname = `${currentUrl.pathname}/process-definitions/${selectedData}`;
      this.window.open(currentUrl.toString(), '_blank');
    }
  }

  onChartHover(event: { active?: ActiveElement[] }, chart: BaseChartDirective<'doughnut'>) {
    const activeElement = event.active?.[0];
    const hoveredIndex = activeElement?.index ?? null;
    if (hoveredIndex === this.hoveredIndex) {
      return;
    }

    this.hoveredIndex = hoveredIndex;
    this.chartData.datasets[0].backgroundColor = this.getSliceColors(this.labelsDef.length);
    chart.update('none');
  }

  onLegendItemClick(originalIndex: number) {
    this.sliceVisibility[originalIndex] = !this.sliceVisibility[originalIndex];

    if (!this.drilldown) {
      const label = this.currentLabels[originalIndex];
      this.mainVisibilityStore[label] = this.sliceVisibility[originalIndex];
    }

    const newSeries = this.currentSeries.map((value, index) => (this.sliceVisibility[index] ? value : 0));
    this.setChartData(newSeries, this.currentLabels, this.drilldown);
  }

  onDrilldown(selectedLabel: string) {
    const drillSeries = this.drillData[selectedLabel].series;
    const drillLabels = this.drillData[selectedLabel].labels;

    this.setChartData(drillSeries, drillLabels, true);

    this.subtitle = this.DRILLDOWN_SUBTITLE;
    this.legendTitle = LEGEND_DRILLDOWN_TITLE;

    this.currentSeries = drillSeries;
    this.currentLabels = drillLabels;
    this.sliceVisibility = Array(this.currentSeries.length).fill(true);
  }

  onDrillup() {
    const restoredVisibility = this.mainLabels.map((label) =>
      this.mainVisibilityStore[label] !== undefined ? this.mainVisibilityStore[label] : true,
    );

    const adjustedMainSeries = this.mainSeries.map((value, index) => (restoredVisibility[index] ? value : 0));

    this.setChartData(adjustedMainSeries, this.mainLabels, false);

    this.selectedDefinitionKey = '';

    this.subtitle = this.MAIN_SUBTITLE;
    this.legendTitle = LEGEND_TITLE;

    this.currentSeries = this.mainSeries;
    this.currentLabels = this.mainLabels;
    this.sliceVisibility = restoredVisibility;
  }

  onInit() {
    this.loadData();
  }

  onDestroy() {
    this.subSink?.unsubscribe();
  }

  clearCurrentData() {
    this.chartData = { labels: [], datasets: [{ data: [], backgroundColor: [] }] };
  }

  loadData() {
    this.dataLoading = true;
    this.clearCurrentData();
    this.calculatedTimeFrame = moment()
      .subtract(this.selectedTimeFrameAmount, this.selectedTimeFrameUnit)
      .format(FLUXNOVA_DATE_FORMAT);
  }

  onDataLoaded(data: FluxnovaItem[]) {
    this.dataLoading = false;
    this.data = data;

    const seriesData = this.transformDataToSeriesData(data);
    this.setChartData(seriesData[0].series, seriesData[0].labels, false);

    this.mainSeries = seriesData[0].series;
    this.mainLabels = seriesData[0].labels;
    this.currentSeries = seriesData[0].series;
    this.currentLabels = seriesData[0].labels;

    seriesData.shift();
    seriesData.forEach((value) => {
      this.drillData[value.id as string] = value;
    });

    this.sortDrillData();
    this.sliceVisibility = Array(this.labelsDef.length).fill(true);

    this.mainLabels.forEach((label) => {
      if (this.mainVisibilityStore[label] === undefined) {
        this.mainVisibilityStore[label] = true;
      }
    });
  }

  transformDataToSeriesData(items: FluxnovaItem[]): DrillDataItem[] {
    const itemsByDefKey: Dictionary<FluxnovaItem[]> = groupBy(items, 'processDefinitionKey');
    const chartSeriesData: ChartSeriesItem[] = [];
    const allData: DrillDataItem[] = [];

    Object.keys(itemsByDefKey).forEach((defKey) => {
      const itemsByDefId: Dictionary<FluxnovaItem[]> = groupBy(itemsByDefKey[defKey], 'processDefinitionId');

      chartSeriesData.push({
        label: defKey,
        value: itemsByDefKey[defKey].length,
        drilldownId: defKey,
      });

      const drillLabels: string[] = [];
      const drillSeries: number[] = [];

      for (const [id, fluxnovaItems] of Object.entries(itemsByDefId) as [string, FluxnovaItem[]][]) {
        drillLabels.push(id);
        drillSeries.push(fluxnovaItems.length);
      }

      allData.push({
        id: defKey,
        labels: drillLabels,
        series: drillSeries,
      });
    });

    chartSeriesData.sort((a, b) => {
      if (b.value !== a.value) {
        return b.value - a.value;
      }

      return a.label.localeCompare(b.label);
    });

    const mainLabels = chartSeriesData.map((data) => data.label);
    const mainSeries = chartSeriesData.map((data) => data.value);

    allData.unshift({
      labels: mainLabels as string[],
      series: mainSeries as number[],
    });

    return allData;
  }

  sortDrillData() {
    Object.values(this.drillData).forEach((item) => {
      const combined = item.labels.map((label, i) => ({
        label,
        value: item.series[i],
      }));

      combined.sort((a, b) => {
        if (b.value !== a.value) {
          return b.value - a.value;
        }

        return a.label.localeCompare(b.label);
      });

      item.labels = combined.map((d) => d.label);
      item.series = combined.map((d) => d.value);
    });
  }

  onTimeFrameSelected() {
    this.loadData();
  }

  get selectedTimeFrameAmount(): number {
    return +this.timeFrameSelected.split(this.TIMEFRAME_VALUE_SEPARATOR)[0];
  }

  get selectedTimeFrameUnit(): 'hours' | 'days' {
    return this.timeFrameSelected.split(this.TIMEFRAME_VALUE_SEPARATOR)[1] as 'hours' | 'days';
  }

  protected calculateTotalItemsVisible(series: number[]): number {
    return series.reduce((sum, value) => sum + value, 0);
  }
}
