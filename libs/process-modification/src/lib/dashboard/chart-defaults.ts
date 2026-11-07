import { ChartOptions } from 'chart.js';

export const LEGEND_TITLE = 'Process Definition Key';
export const LEGEND_DRILLDOWN_TITLE = 'Process Definition ID';
export const DEFAULT_INNER_SIZE = '65%';
export const DEFAULT_PLOT_COLORS: string[] = [
  '#368727',
  '#9747F6',
  '#5B2C8F',
  '#FF8210',
  '#04C8A8',
  '#058070',
  '#0D544B',
  '#981077',
  '#740A56',
  '#490533',
  '#2751C2',
  '#1D3986',
  '#132454',
  '#111E42',
  '#DC1616',
  '#A11313',
  '#861616',
  '#490606',
  '#DE5E06',
  '#9D3B0F',
  '#F1A204',
  '#DE8001',
  '#B85905',
  '#0799D9',
  '#075A85',
  '#053C58',
  '#032537',
];
export const DEFAULT_CHART_OPTIONS = (): ChartOptions<'doughnut'> => ({
  responsive: false,
  maintainAspectRatio: false,
  cutout: DEFAULT_INNER_SIZE,
  font: {
    family: 'Arial',
  },
  plugins: {
    legend: {
      display: false,
    },
  },
});
