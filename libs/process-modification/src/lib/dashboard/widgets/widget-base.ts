import { groupBy } from 'lodash-es';
import { Dictionary, FLUXNOVA_DATE_FORMAT } from '@fxn/types';
import { SubSink } from 'subsink';
import moment from 'moment-timezone';
import { inject } from '@angular/core';
import { WINDOW } from 'ngx-window-token';
import { ApexChart, ApexDataLabels, ApexLegend, ApexOptions } from 'ng-apexcharts';
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

  protected TIMEFRAME_VALUE_SEPARATOR = '-';
  public DRILLDOWN_SUBTITLE = 'Click a slice to view the process definition.';
  public MAIN_SUBTITLE = 'Click a slice to view a breakdown for the definition key.';
  public MAX_ITEM_COUNT = 1000;

  public chartOptions: Partial<ApexOptions> = DEFAULT_CHART_OPTIONS();
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
  public suppressDrilldown = false;
  public subtitle = this.MAIN_SUBTITLE;
  public legendTitle = LEGEND_TITLE;

  private sliceVisibility: boolean[] = [];
  private mainSeries: number[] = [];
  private mainLabels: string[] = [];
  private colorMap: Record<string, string> = {};
  private indexMap: Record<string, number> = {};
  private drillData: Record<string, DrillDataItem> = {};

  private currentSeries: number[] = [];
  private currentLabels: string[] = [];
  private mainVisibilityStore: Record<string, boolean> = {};

  protected queryParams = () =>
    `filters={"status":{"filterType":"select","filter":"open","type":"equals"},"createTime":{"dateFrom":"${this.calculatedTimeFrame}","type":"greaterThan"},"processDefinitionKey":{"filterType":"commaSeparatedList","filter":"${this.selectedDefinitionKey}","type":"multi"}}&sorting=[{"colId":"createTime","sort":"desc"}]&toggleFilters=`;
  protected calculatedTimeFrame = '';
  protected data: FluxnovaItem[] = [];
  protected selectedDefinitionKey = '';
  protected subSink: SubSink = new SubSink();
  protected chart?: ApexChart;

  private pageLocation = '';

  get linkHref(): string {
    const currentUrl = new URL(this.window.location.href);
    currentUrl.pathname = `${currentUrl.pathname}/${this.pageLocation}`;
    currentUrl.search = this.queryParams();
    return currentUrl.toString();
  }

  get displayCount(): string | number {
    return this.totalItems < this.MAX_ITEM_COUNT ? this.totalItems : `${this.MAX_ITEM_COUNT}+`;
  }

  constructor(location: string) {
    this.pageLocation = location;
    this.chartOptions = {
      ...this.chartOptions,
      legend: {
        position: 'right',
        offsetX: -75,
        fontSize: '14px',
        width: 230,
        height: 330,
        formatter: (seriesName: string) => {
          const index = this.indexMap[seriesName];

          if (!this.sliceVisibility[index]) {
            return `<span style="text-decoration: line-through;">${seriesName}</span>`;
          }

          return seriesName;
        },
      },
    };
  }

  // Typed accessors for template bindings
  get chartDef(): ApexChart {
    return this.chartOptions.chart as ApexChart;
  }
  get labelsDef(): string[] {
    return this.chartOptions.labels as string[];
  }
  get legendDef(): ApexLegend {
    return this.chartOptions.legend as ApexLegend;
  }
  get dataLabelsDef(): ApexDataLabels {
    return this.chartOptions.dataLabels as ApexDataLabels;
  }
  get colorsDef(): any[] {
    return (this.chartOptions.colors as any[]) || [];
  }

  setChartData(series: number[], labels: string[], isDrilldown: boolean) {
    this.drilldown = isDrilldown;
    this.totalItems = this.calculateTotalItemsVisible(series);

    this.chartOptions = {
      ...this.chartOptions,
      series: series,
      labels: labels,
      chart: {
        ...this.chartOptions.chart,
        type: 'donut',
        events: {
          legendClick: (chartContext: any, seriesIndex: number, config: { globals: { seriesNames: string[] } }) => {
            const label = config.globals.seriesNames[seriesIndex];
            const originalIndex = this.indexMap[label];

            this.suppressDrilldown = true;
            this.onLegendItemClick(originalIndex, seriesIndex);
          },
          dataPointSelection: (event: any, chartContext: any, config: { dataPointIndex: number }) => {
            if (this.suppressDrilldown) {
              this.suppressDrilldown = false;
              return;
            }

            const selectedData = labels[config.dataPointIndex];

            if (this.drillData[selectedData]) {
              this.selectedDefinitionKey = selectedData;
              this.onDrilldown(event, this.selectedDefinitionKey);
            } else {
              const currentUrl = new URL(this.window.location.href);
              currentUrl.pathname = `${currentUrl.pathname}/process-definitions/${selectedData}`;
              window.open(currentUrl.toString(), '_blank');
            }
          },
          dataPointMouseEnter: (event: MouseEvent, chartContext: any, config: any) => {
            this.highlightSlice(config.dataPointIndex, chartContext.el);
          },
          dataPointMouseLeave: (event: MouseEvent, chartContext: any) => {
            this.resetOpacity(chartContext.el);
          },
        },
      },
    };
  }

  onLegendItemClick(originalIndex: number, currentIndex: number) {
    const newSeries = Array.isArray(this.chartOptions.series) ? [...this.chartOptions.series] : [];
    this.sliceVisibility[originalIndex] = !this.sliceVisibility[originalIndex];

    if (!this.drilldown) {
      const label = this.currentLabels[originalIndex];
      this.mainVisibilityStore[label] = this.sliceVisibility[originalIndex];
    }

    if (!this.sliceVisibility[originalIndex]) {
      newSeries.splice(currentIndex, 1, 0);
    } else {
      newSeries.splice(currentIndex, 0, this.currentSeries[originalIndex]);
      newSeries.splice(currentIndex + 1, 1);
    }

    this.totalItems = this.calculateTotalItemsVisible(newSeries as number[]);
    this.setChartData(newSeries as number[], this.chartOptions.labels as string[], this.drilldown);
  }

  onDrilldown(event: Event, selectedLabel: string) {
    const drillSeries = this.drillData[selectedLabel].series;
    const drillLabels = this.drillData[selectedLabel].labels;

    this.setChartData(drillSeries, drillLabels, true);

    this.subtitle = this.DRILLDOWN_SUBTITLE;
    this.legendTitle = LEGEND_DRILLDOWN_TITLE;

    this.currentSeries = drillSeries;
    this.currentLabels = drillLabels;
    this.indexMap = this.currentLabels.reduce(
      (val, label, index) => {
        val[label] = index;
        return val;
      },
      {} as Record<string, number>,
    );
    this.sliceVisibility = Array(this.currentSeries.length).fill(true);
  }

  onDrillup() {
    const restoredVisibility = this.mainLabels.map((label) =>
      this.mainVisibilityStore[label] !== undefined ? this.mainVisibilityStore[label] : true,
    );

    const adjustedMainSeries = this.mainSeries.map((val, idx) => (restoredVisibility[idx] ? val : 0));

    this.setChartData(adjustedMainSeries, this.mainLabels, false);

    this.selectedDefinitionKey = '';

    this.subtitle = this.MAIN_SUBTITLE;
    this.legendTitle = LEGEND_TITLE;

    this.currentSeries = this.mainSeries;
    this.currentLabels = this.mainLabels;
    this.indexMap = this.mainLabels.reduce(
      (val, label, index) => {
        val[label] = index;
        return val;
      },
      {} as Record<string, number>,
    );
    this.sliceVisibility = restoredVisibility;
  }

  highlightSlice(index: number, chartEl: HTMLElement) {
    const slices = Array.from(chartEl.querySelectorAll('.apexcharts-series path')) as SVGPathElement[];
    slices.forEach((slice, i) => {
      if (i !== index) {
        slice.classList.add('slice-hover-active');
      } else {
        slice.classList.remove('slice-hover-active'); // keep hovered slice fully visible
      }
    });
  }

  resetOpacity(chartEl: HTMLElement) {
    const slices = chartEl.querySelectorAll('.apexcharts-series path');
    slices.forEach((slice) => {
      slice.classList.remove('slice-hover-active');
    });
  }

  onInit() {
    this.loadData();
  }

  onDestroy() {
    this.subSink?.unsubscribe();
  }

  clearCurrentData() {
    delete this.chartOptions?.series;
    delete this.chartOptions?.labels;
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
    this.sliceVisibility = Array(this.chartOptions.labels?.length).fill(true);

    this.mainLabels.forEach((label, index) => {
      if (this.mainVisibilityStore[label] === undefined) {
        this.mainVisibilityStore[label] = true;
      }
      this.colorMap[label] = DEFAULT_PLOT_COLORS[index % DEFAULT_PLOT_COLORS.length];
    });

    this.indexMap = this.mainLabels.reduce(
      (val, label, index) => {
        val[label] = index;
        return val;
      },
      {} as Record<string, number>,
    );
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
