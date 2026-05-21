import { UserTaskStatesMap } from '../user-task-states';
import { ColDefWithFilterParams } from './column-definition';
import { defaultColDefinition, defaultColumnDefsByColType } from './default-column-definition';

export const predefinedUserTaskColFields = [
  'id',
  'name',
  'taskDefinitionKey',
  'assignee',
  'owner',
  'created',
  'due',
  'followUp',
  'priority',
  'delegationState',
];

export const predefinedUserTaskColDefs: { [field: string]: ColDefWithFilterParams } = {
  id: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.id,
    ...defaultColumnDefsByColType.multiSelectFilter,
    ...defaultColumnDefsByColType.sortable,
    headerName: 'ID',
    field: 'id',
    initialWidth: 330,
    filterParams: {
      filterFormat: 'textArray',
      filterKeyByComparator: { multi: 'taskIdIn' },
      comparators: ['multi'],
      sortByKey: 'id',
    },
  },
  name: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.defaultFilter,
    ...defaultColumnDefsByColType.sortable,
    ...defaultColumnDefsByColType.setWidthToFillRemainingSpace,
    field: 'name',
    headerName: 'Activity Name',
    filterParams: {
      filterKeyByComparator: {
        contains: 'nameLike',
        equals: 'name',
      },
      comparators: ['contains', 'equals'],
      sortByKey: 'name',
    },
    cellRendererParams: {
      sourceField: 'name',
    },
  },
  taskDefinitionKey: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.defaultFilter,
    headerName: 'Activity ID',
    field: 'taskDefinitionKey',
    filterParams: {
      filterKeyByComparator: { equals: 'taskDefinitionKey' },
      comparators: ['equals'],
    },
  },
  assignee: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.xSmallInitialWidth,
    ...defaultColumnDefsByColType.xSmallMinWidth,
    field: 'assignee',
    headerName: 'Assignee',
    initialWidth: 90,
  },
  owner: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.xSmallInitialWidth,
    ...defaultColumnDefsByColType.xSmallMinWidth,
    field: 'owner',
    headerName: 'Owner',
    initialWidth: 90,
  },
  created: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.date,
    ...defaultColumnDefsByColType.dateFilter,
    ...defaultColumnDefsByColType.sortable,
    field: 'created',
    headerName: 'Creation Date',
    filterParams: {
      filterKeyAndValueByComparator: {
        inRange: {
          createdBefore: 'dateTo',
          createdAfter: 'dateFrom',
        },
        before: { createdBefore: 'dateFrom' },
        after: { createdAfter: 'dateFrom' },
      },
      comparators: ['inRange', 'before', 'after'],
      inRangeInclusive: true,
    },
    initialSort: 'desc',
  },
  due: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.date,
    ...defaultColumnDefsByColType.dateFilter,
    ...defaultColumnDefsByColType.sortable,
    field: 'due',
    headerName: 'Due Date',
    filterParams: {
      sortByKey: 'dueDate',
      filterKeyAndValueByComparator: {
        inRange: {
          dueBefore: 'dateTo',
          dueAfter: 'dateFrom',
        },
        before: { dueBefore: 'dateFrom' },
        after: { dueAfter: 'dateFrom' },
      },
      comparators: ['inRange', 'before', 'after'],
    },
  },
  followUp: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.date,
    ...defaultColumnDefsByColType.dateFilter,
    ...defaultColumnDefsByColType.sortable,
    field: 'followUp',
    headerName: 'Follow Up Date',
    filterParams: {
      sortByKey: 'followUpDate',
      filterKeyAndValueByComparator: {
        inRange: {
          followUpBefore: 'dateTo',
          followUpAfter: 'dateFrom',
        },
        before: { followUpBefore: 'dateFrom' },
        after: { followUpAfter: 'dateFrom' },
      },
      comparators: ['inRange', 'before', 'after'],
    },
  },
  priority: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.xSmallInitialWidth,
    field: 'priority',
    headerName: 'Priority',
  },
  delegationState: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.largeInitialWidth,
    ...defaultColumnDefsByColType.singleSelectFilter,
    field: 'delegationState',
    headerName: 'Delegation State',
    filterParams: {
      singleFilterOptions: [
        { label: UserTaskStatesMap.PENDING.label, value: UserTaskStatesMap.PENDING.filterKey },
        { label: UserTaskStatesMap.RESOLVED.label, value: UserTaskStatesMap.RESOLVED.filterKey },
      ],
    },
  },
};
