import { CellRendererSelectorResult, ICellRendererParams } from 'ag-grid-community';
import { Dictionary } from '../dictionary';
import { FluxnovaVariableTypes } from '../fluxnova';
import { ColDefWithFilterParams } from './column-definition';
import { defaultColDefinition, defaultColumnDefsByColType } from './default-column-definition';

export const detailPageVariablesTabColFields = ['name', 'type', 'value', 'scope', 'editDelete'];
export const detailPageHistoricalVariablesTabColFields = ['name', 'type', 'value', 'scope', 'createTime'];

export const predefinedVariablesColDefs: Dictionary<ColDefWithFilterParams> = {
  name: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.defaultFilter,
    ...defaultColumnDefsByColType.sortable,
    ...defaultColumnDefsByColType.id,
    ...defaultColumnDefsByColType.largeInitialWidth,
    field: 'name',
    headerName: 'Name',
    cellRendererParams: {
      fieldTruthyValueDisablesEdit: 'id',
    },
    filterParams: {
      filterKeyByComparator: {
        contains: 'variableNameLike',
        equals: 'variableName',
      },
      comparators: ['contains', 'equals'],
      sortByKey: 'variableName',
    },
    cellStyle: { cursor: 'pointer' },
    initialSort: 'asc',
  },
  type: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.smallInitialWidth,
    field: 'type',
    headerName: 'Type',
    cellRendererParams: {
      dropdownItems: Object.values(FluxnovaVariableTypes),
    },
    cellStyle: { cursor: 'pointer' },
  },
  value: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.setWidthToFillRemainingSpace,
    ...defaultColumnDefsByColType.clickable,
    field: 'value',
    headerName: 'Value',
    resizable: true,
    cellRendererSelector: (params: any): CellRendererSelectorResult | undefined => {
      if (params.data && params.data.type === 'Date') {
        return {
          component: 'dateRenderer',
        };
      }
      return undefined;
    },
    cellRendererParams: {
      displaySecondaryInputOnConditionalValues: [{ key: 'type', value: FluxnovaVariableTypes.Object }],
      secondaryFieldLabel: 'Object Type Name',
      primaryFieldLabel: 'Variable Value',
      secondaryFieldKey: 'valueInfo.objectTypeName',
    },
    cellStyle: { cursor: 'pointer' },
    valueGetter: (params) => (['Bytes', 'File'].includes(params.data?.type) ? 'Download' : params.data?.value),
  },
  scope: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.largeInitialWidth,
    field: 'scope',
    headerName: 'Scope',
    cellStyle: { cursor: 'pointer' },
  },
  createTime: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.date,
    ...defaultColumnDefsByColType.mediumInitialWidth,
    field: 'createTime',
    headerName: 'Create Time',
  },
  editDelete: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.editControls,
    field: 'editDelete',
    headerName: '',
    initialWidth: 90,
    minWidth: 90,
    width: 90,
    filter: 'addButtonFloatingFilter',
    floatingFilterComponent: 'addButtonFloatingFilter',
    cellStyle: { 'border-left': '1px var(--neutral-700) solid' },
    pinned: 'right',
    lockPosition: 'right',
    cellRendererParams: {
      showEdit: (params: ICellRendererParams) => !['Bytes', 'File'].includes(params.data?.type),
    },
  },
};
