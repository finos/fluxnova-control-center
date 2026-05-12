import {
  ItemType,
  ListViewState,
  predefinedProcessInstanceColFields,
  processInstanceTabDefaultFilters,
  SubItemType,
} from '@fxn/types';
import { ColumnState } from 'ag-grid-community';
import { pick } from 'lodash-es';
import { describe, expect, it, vi } from 'vitest';
import { PimTab } from '../detail-pages/item-detail-tab-utils';
vi.mock('./list-utils', async () => {
  const original = await vi.importActual<typeof import('./list-utils')>('./list-utils');
  // This allows us to mock the default stored column definitions to test additional/removed columns
  return {
    ...original,
    getDefaultListViewState: vi.fn().mockImplementation(() => {
      const predefinedColFields = predefinedProcessInstanceColFields;
      const columnDefinitions = original.getPredefinedColDefs(ItemType.ProcessInstance);
      return new ListViewState(
        predefinedColFields.map((id) => {
          const columnDefinition = columnDefinitions[id];
          columnDefinition.colId = id;
          return columnDefinition;
        }),
      );
    }),
    mergeSavedStateWithColumnDefinitions: vi
      .fn()
      .mockImplementation((columnStates: ColumnState[], itemType: ItemType, subType?: SubItemType) => {
        const defaultListViewState = getDefaultListViewState(itemType, subType);
        return mergeSavedListViewStateWithSuppliedColumnDefinitions(
          columnStates,
          Object.values(defaultListViewState.columnDefs),
        );
      }),
  };
});
import * as ListUtils from './list-utils';
import { getDefaultListViewState, mergeSavedListViewStateWithSuppliedColumnDefinitions } from './list-utils';

describe('List utils', () => {
  describe('getListResetRouting', () => {
    it('should return the defaults for the itemtype', () => {
      const defaultFilters = ListUtils.getDefaultRouting(ItemType.ProcessDefinition);

      expect(defaultFilters).toEqual({
        sorting: JSON.stringify([{ colId: 'name', sort: 'asc' }]),
        filters: JSON.stringify({ suspended: { type: 'equals', filter: 'active', filterType: 'select' } }),
        toggleFilters: 'latestVersion',
      });
    });
  });

  describe('haveColumnStatesDeviatedFromDefault', () => {
    it('checks if column prefs have changed', () => {
      const withChangesCheck = ListUtils.haveColumnStatesDeviatedFromDefault(ItemType.ProcessInstance, [
        { colId: 'name', pinned: false, width: 100 },
      ]);
      expect(withChangesCheck).toEqual(true);

      const listViewState: ListViewState = ListUtils.getDefaultListViewState(ItemType.ProcessInstance);
      const withoutChangesCheck = ListUtils.haveColumnStatesDeviatedFromDefault(
        ItemType.ProcessInstance,
        listViewState.getColumnStates(),
      );
      expect(withoutChangesCheck).toEqual(false);
    });
  });

  describe('mergeSavedStateWithColumnDefinitions', () => {
    it('merges saved state with predefined column definitions correctly', () => {
      const columnStates: ColumnState[] = [
        { colId: 'id', width: 150, pinned: 'left' },
        { colId: 'processDefinitionName', width: 100 },
      ];

      const result = ListUtils.mergeSavedStateWithColumnDefinitions(columnStates, ItemType.ProcessInstance);

      expect(
        result.columnDefs.map((col) => pick(col, ['initialWidth', 'width', 'pinned', 'flex', 'colId'])),
      ).toContainEqual({ colId: 'id', initialWidth: 150, pinned: 'left', width: 150 });
      expect(
        result.columnDefs.map((col) => pick(col, ['initialWidth', 'width', 'pinned', 'flex', 'colId'])),
      ).toContainEqual({ colId: 'processDefinitionName', initialWidth: 100, width: 100 });
    });

    it('handles empty saved state gracefully', () => {
      const columnStates: ColumnState[] = [];

      const result = ListUtils.mergeSavedStateWithColumnDefinitions(columnStates, ItemType.ProcessInstance);
      const expectedResult = ListUtils.mergeSavedStateWithColumnDefinitions(
        ListUtils.getDefaultListViewState(ItemType.ProcessInstance).getColumnStates(),
        ItemType.ProcessInstance,
      ).columnDefs;

      // Empty saved state should result in default column definitions
      expect(result.columnDefs).toEqual(expectedResult);
    });

    it('handles new added columns in default definitions', () => {
      const originalDefaultListViewState = ListUtils.getDefaultListViewState(ItemType.ProcessInstance);
      const originalColumnStates = originalDefaultListViewState.getColumnStates();
      const fakeState = new ListViewState([
        ...originalDefaultListViewState.columnDefs,
        { colId: 'newColumn', width: 100 },
      ]); // or construct with whatever cols you need
      vi.spyOn(ListUtils, 'getDefaultListViewState').mockReturnValueOnce(fakeState);
      const result = ListUtils.mergeSavedStateWithColumnDefinitions(originalColumnStates, ItemType.ProcessInstance);
      expect(result.columnDefs).toContainEqual(expect.objectContaining({ colId: 'newColumn' }));
    });

    it('handles new removed columns in default definitions', () => {
      const originalDefaultListViewState = ListUtils.getDefaultListViewState(ItemType.ProcessInstance);
      const originalColumnStates = originalDefaultListViewState.getColumnStates();
      const fakeState = new ListViewState(
        originalDefaultListViewState.columnDefs.filter((col) => col.colId !== 'processDefinitionKey'),
      );
      vi.spyOn(ListUtils, 'getDefaultListViewState').mockReturnValueOnce(fakeState);
      const result = ListUtils.mergeSavedStateWithColumnDefinitions(originalColumnStates, ItemType.ProcessInstance);
      expect(result.columnDefs).not.toContainEqual(expect.objectContaining({ colId: 'processDefinitionKey' }));
    });
  });

  describe('getDefaultTabFilters', () => {
    it.each([
      [PimTab.Instances, processInstanceTabDefaultFilters],
      ['Unimplemented Tab' as PimTab, {}],
    ])('should return the default tab filters for the tab', (tab, expectedFilters) => {
      const result = ListUtils.getDefaultTabFilters(tab);

      expect(result).toEqual(expectedFilters);
    });
  });
});
