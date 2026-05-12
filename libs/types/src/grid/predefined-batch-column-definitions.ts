import { ColDefWithFilterParams } from './column-definition';
import { defaultColDefinition, defaultColumnDefsByColType } from './default-column-definition';

export const activeBatchColFields = [
  'batchId',
  'createUserId',
  'startTime',
  'failedJobs',
  'batchProgress',
  'suspended',
  'type',
];

export const completedBatchColFields = [
  'batchId',
  'createUserId',
  'startTime',
  'endTime',
  'executionStartTime',
  'type',
];

export const batchColDefs: { [field: string]: ColDefWithFilterParams } = {
  batchId: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.defaultFilter,
    ...defaultColumnDefsByColType.sortable,
    ...defaultColumnDefsByColType.id,
    ...defaultColumnDefsByColType.link,
    initialWidth: 330, // Wide enough for a GUID
    filterParams: {
      comparators: ['equals'],
    },
    headerName: 'Batch ID',
    field: 'batchId',
  },
  failedJobs: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.xSmallInitialWidth,
    field: 'failedJobs',
    headerName: 'Failed Jobs',
  },
  suspended: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.singleSelectFilter,
    ...defaultColumnDefsByColType.smallInitialWidth,
    field: 'suspended',
    headerName: 'Suspended',
    filterParams: {
      booleanFilterKeys: ['suspended'],
      singleFilterOptions: [
        { label: 'True', value: 'suspended' },
        { label: 'False', value: 'active' },
      ],
    },
  },
  startTime: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.date,
    ...defaultColumnDefsByColType.dateFilter,
    ...defaultColumnDefsByColType.sortable,
    filterParams: {
      filterKeyAndValueByComparator: {
        inRange: {
          startedBefore: 'dateTo',
          startedAfter: 'dateFrom',
        },
        before: { startedBefore: 'dateFrom' },
        after: { startedAfter: 'dateFrom' },
      },
      comparators: ['inRange', 'before', 'after'],
      inRangeInclusive: true,
    },
    headerName: 'Start Time',
    field: 'startTime',
    initialSort: 'desc',
  },
  endTime: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.date,
    ...defaultColumnDefsByColType.sortable,
    headerName: 'End Time',
    field: 'endTime',
    floatingFilter: false,
  },
  type: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.defaultFilter,
    ...defaultColumnDefsByColType.setWidthToFillRemainingSpace,
    filterParams: {
      comparators: ['equals'],
    },
    initialWidth: 150,
    headerName: 'Type',
    field: 'type',
  },
  createUserId: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.defaultFilter,
    filterParams: {
      comparators: ['equals'],
      filterKeyByComparator: {
        equals: 'createdBy',
      },
    },
    initialWidth: 150,
    headerName: 'Create User',
    field: 'createUserId',
  },
  executionStartTime: {
    ...defaultColumnDefsByColType.date,
    ...defaultColumnDefsByColType.mediumInitialWidth,
    headerName: 'Execution Start Time',
    field: 'executionStartTime',
  },
  batchProgress: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.batchProgress,
    headerName: 'Progress',
    field: 'batchProgress',
  },
};

export const completedBatchColDefs: { [field: string]: ColDefWithFilterParams } = {
  ...batchColDefs,
  startTime: {
    ...batchColDefs.startTime,
    floatingFilter: false,
  },
  createUserId: {
    ...batchColDefs.createUserId,
    floatingFilter: false,
  },
};
