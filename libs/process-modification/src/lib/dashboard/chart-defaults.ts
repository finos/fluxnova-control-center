import * as Apexcharts from 'ng-apexcharts';

interface LegendItemStyle {
  color: string;
  fill: string;
  'font-size': number;
  textOverflow: string;
  width: number;
}

export const PRIMARY_BLUE = '#024a7a';
export const LEGEND_HOVER_STYLE: LegendItemStyle = {
  color: PRIMARY_BLUE,
  fill: PRIMARY_BLUE,
  'font-size': 16,
  textOverflow: 'ellipsis',
  width: 210,
};
export const LEGEND_ITEM_STYLE: LegendItemStyle = {
  color: '#515151',
  fill: '#515151',
  'font-size': 14,
  textOverflow: 'ellipsis',
  width: 210,
};
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
export const DEFAULT_CHART_OPTIONS = () =>
  <Apexcharts.ApexOptions>{
    chart: {
      type: 'donut',
      width: 630,
      height: 350,
      style: {
        fontFamily: 'Arial',
      },
    },
    dataLabels: {
      enabled: false,
    },
    colors: DEFAULT_PLOT_COLORS,
    plotOptions: {
      pie: {
        size: 350,
      },
    },
  };
