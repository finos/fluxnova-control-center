import { ColDefWithFilterParams } from './column-definition';
import { defaultColDefinition, defaultColumnDefsByColType } from './default-column-definition';

export const deploymentColFields = ['id', 'name', 'deploymentTime', 'source'];

export const deploymentColDefs: { [field: string]: ColDefWithFilterParams } = {
  id: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.defaultFilter,
    ...defaultColumnDefsByColType.sortable,
    ...defaultColumnDefsByColType.id,
    ...defaultColumnDefsByColType.link,
    initialWidth: 330, // Wide enough for a GUID
    filterParams: {
      comparators: ['equals'],
    },
    headerName: 'ID',
    field: 'id',
  },
  deploymentTime: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.date,
    ...defaultColumnDefsByColType.dateFilter,
    ...defaultColumnDefsByColType.sortable,
    filterParams: {
      filterKeyAndValueByComparator: {
        inRange: {
          before: 'dateTo',
          after: 'dateFrom',
        },
        before: { before: 'dateFrom' },
        after: { after: 'dateFrom' },
      },
      comparators: ['inRange', 'before', 'after'],
      inRangeInclusive: true,
    },
    headerName: 'Deploy Time',
    field: 'deploymentTime',
    initialSort: 'desc',
  },
  source: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.defaultFilter,
    ...defaultColumnDefsByColType.largeInitialWidth,
    filterParams: {
      comparators: ['equals'],
    },
    headerName: 'Source',
    field: 'source',
  },
  name: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.sortable,
    ...defaultColumnDefsByColType.defaultFilter,
    ...defaultColumnDefsByColType.setWidthToFillRemainingSpace,
    filterParams: {
      comparators: ['contains'],
      filterKeyByComparator: {
        contains: 'nameLike',
      },
    },
    headerName: 'Name',
    field: 'name',
  },
};
