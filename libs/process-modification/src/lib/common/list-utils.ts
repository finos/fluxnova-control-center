import {
  activeBatchColFields,
  batchColDefs,
  ColDefWithFilterParams,
  ColumnDefinitions,
  completedBatchColDefs,
  completedBatchColFields,
  decisionDefinitionColDefs,
  decisionDefinitionColFields,
  decisionDefinitionDefaultToggleFilters,
  decisionDefinitionListToggleFilters,
  decisionInstanceAllColsColDefs,
  defaultProcessDefinitionListToggleFilters,
  deploymentColDefs,
  deploymentColFields,
  GridSort,
  incidentListDefaultFilters,
  ItemType,
  jobListDefaultToggleFilters,
  jobListToggleFilters,
  ListViewState,
  predefinedIncidentColDefs,
  predefinedIncidentColFields,
  predefinedJobColDefs,
  predefinedJobColFields,
  predefinedProcessDefColFields,
  predefinedProcessDefinitionColDefs,
  predefinedProcessInstanceColDefs,
  predefinedProcessInstanceColFields,
  processDefinitionListDefaultFilters,
  processDefinitionListToggleFilters,
  processInstanceListDefaultFilters,
  processInstanceListToggleFilters,
  processInstanceTabDefaultFilters,
  SubItemType,
} from '@fxn/types';
import { ColDef, ColumnState } from 'ag-grid-community';
import { filter, isEqual, map } from 'lodash-es';
import { Params } from '@angular/router';
import { PimTab } from '../detail-pages/item-detail-tab-utils';

export function getDefaultListViewState(itemType: ItemType, subType?: SubItemType): ListViewState {
  let predefinedColFields: string[];

  switch (itemType) {
    case ItemType.Incident:
      predefinedColFields = predefinedIncidentColFields;
      break;
    case ItemType.Job:
      predefinedColFields = predefinedJobColFields;
      break;
    case ItemType.ProcessDefinition:
      predefinedColFields = predefinedProcessDefColFields;
      break;
    case ItemType.DecisionDefinition:
      predefinedColFields = decisionDefinitionColFields;
      break;
    case ItemType.Deployment:
      predefinedColFields = deploymentColFields;
      break;
    case ItemType.Batch:
      predefinedColFields = subType === SubItemType.Active ? activeBatchColFields : completedBatchColFields;
      break;
    case ItemType.ProcessInstance:
    default:
      predefinedColFields = predefinedProcessInstanceColFields;
      break;
  }

  const columnDefinitions = getPredefinedColDefs(itemType, subType);
  return new ListViewState(
    predefinedColFields.map((id) => {
      const columnDefinition = columnDefinitions[id];
      columnDefinition.colId = id;
      return columnDefinition;
    }),
  );
}

export function getItemListToggleFilters(itemType: ItemType) {
  switch (itemType) {
    case ItemType.DecisionDefinition:
      return decisionDefinitionListToggleFilters;
    case ItemType.Job:
      return jobListToggleFilters;
    case ItemType.ProcessDefinition:
      return processDefinitionListToggleFilters;
    case ItemType.ProcessInstance:
      return processInstanceListToggleFilters;
    default:
      return undefined;
  }
}

export function getDefaultListFilters(itemType: ItemType) {
  switch (itemType) {
    case ItemType.ProcessInstance:
      return processInstanceListDefaultFilters;
    case ItemType.ProcessDefinition:
      return processDefinitionListDefaultFilters;
    case ItemType.Incident:
      return incidentListDefaultFilters;
    default:
      return undefined;
  }
}

export function getDefaultTabFilters(itemType: PimTab) {
  switch (itemType) {
    case PimTab.Instances:
      return processInstanceTabDefaultFilters;
    default:
      return {};
  }
}

export function getDefaultSorting(itemType: ItemType, subType?: SubItemType) {
  return filter(getPredefinedColDefs(itemType, subType), 'initialSort')?.map(colDefToGridSort);
}

export function getDefaultSortingFromColumnDefinitions(columnDefinitions: ColDef[]) {
  return filter(columnDefinitions, 'initialSort')?.map(colDefToGridSort);
}

function colDefToGridSort(colDef: ColDef): GridSort {
  // Suppressing the rule because we're only calling with columns with an initialSort
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return { colId: colDef.field!, sort: colDef.initialSort! };
}

export function getDefaultToggleFilters(itemType: ItemType): string[] | undefined {
  switch (itemType) {
    case ItemType.Job:
      return jobListDefaultToggleFilters;
    case ItemType.ProcessDefinition:
      return defaultProcessDefinitionListToggleFilters;
    case ItemType.DecisionDefinition:
      return decisionDefinitionDefaultToggleFilters;
    default:
      return undefined;
  }
}

export function getPredefinedColDefs(itemType: ItemType, subType?: SubItemType): ColumnDefinitions {
  switch (itemType) {
    case ItemType.Batch:
      return subType === SubItemType.Completed ? completedBatchColDefs : batchColDefs;
    case ItemType.Job:
      return predefinedJobColDefs;
    case ItemType.ProcessDefinition:
      return predefinedProcessDefinitionColDefs;
    case ItemType.Incident:
      return predefinedIncidentColDefs;
    case ItemType.DecisionDefinition:
      return decisionDefinitionColDefs;
    case ItemType.Deployment:
      return deploymentColDefs;
    case ItemType.DecisionInstance:
      return decisionInstanceAllColsColDefs;
    case ItemType.ProcessInstance:
    default:
      return predefinedProcessInstanceColDefs;
  }
}

export function getDefaultRouting(itemType: ItemType): Params {
  const defaultFilters = getDefaultListFilters(itemType);
  const filters = JSON.stringify(defaultFilters);
  const defaultSorting = getDefaultSorting(itemType);
  const sorting = JSON.stringify(defaultSorting);
  const defaultToggleFilters = getDefaultToggleFilters(itemType);
  const toggleFilters = defaultToggleFilters?.join(',');

  return { filters, sorting, toggleFilters };
}

export function haveColumnStatesDeviatedFromDefault(
  itemType: ItemType,
  columnStates: ColumnState[],
  subType?: SubItemType,
): boolean {
  return haveColumnStatesDiverged(columnStates, getDefaultListViewState(itemType, subType).columnDefs);
}

export function haveColumnStatesDiverged(
  currentColumnStates: ColumnState[],
  baselineColumnDefinitions: ColDef[],
): boolean {
  if (!isEqual(map(currentColumnStates, 'colId'), map(baselineColumnDefinitions, 'colId'))) {
    return true;
  }

  return !!(baselineColumnDefinitions as ColDefWithFilterParams[]).find(
    (colDef: ColDefWithFilterParams, index) =>
      currentColumnStates[index] &&
      (!!currentColumnStates[index].pinned !== !!colDef.pinned ||
        (colDef.flex !== 1 && currentColumnStates[index].width !== colDef.initialWidth)),
  );
}

export function mergeSavedStateWithColumnDefinitions(
  columnStates: ColumnState[],
  itemType: ItemType,
  subType?: SubItemType,
): ListViewState {
  const defaultListViewState = getDefaultListViewState(itemType, subType);
  return mergeSavedListViewStateWithSuppliedColumnDefinitions(
    columnStates,
    Object.values(defaultListViewState.columnDefs),
  );
}

export function mergeSavedListViewStateWithSuppliedColumnDefinitions(columnStates: ColumnState[], colDefs: ColDef[]) {
  // First ensure that any new or removed columns are synced between the saved state and the column definitions
  const syncedColumnStates = syncNewOrRemovedColumns(columnStates, new ListViewState(colDefs));

  // Reshape colDefs into a more efficiently-accessible key -> ColDef structure
  const columnDefinitions = colDefs.reduce(
    (acc: { [key: string]: ColDef }, def: ColDef) => ({ ...acc, ...{ [def.colId ?? def.field ?? '']: def } }),
    {} as ColumnDefinitions,
  );

  return new ListViewState(
    syncedColumnStates.map(
      (state: ColumnState) =>
        ({
          ...columnDefinitions[state.colId],
          ...state,
          // When the grid loads initially, it uses the initialWidth to
          // set the width of the column so we need to set the initialWidth
          // of the definition to the width of the saved width of the column.
          initialWidth: state.width,
        }) as unknown as ColDefWithFilterParams,
    ),
  );
}

export function syncNewOrRemovedColumns(savedColumnStates: ColumnState[], defaultListState: ListViewState) {
  const updatedColumnStates = [...savedColumnStates];
  const columnStates = defaultListState.getColumnStates();
  const savedColIds = new Set(savedColumnStates.map((savedColState) => savedColState.colId));
  for (const colState of columnStates) {
    if (!savedColIds.has(colState.colId)) {
      updatedColumnStates.push(colState);
      savedColIds.add(colState.colId);
    }
  }
  const columnStateIds = new Set(columnStates.map((colState) => colState.colId));
  return updatedColumnStates.filter((savedColState) => columnStateIds.has(savedColState.colId));
}
