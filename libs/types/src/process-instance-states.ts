export const ProcessInstanceStatesMap = {
  ACTIVE: { label: 'Active', value: 'ACTIVE', filterKey: 'active' },
  COMPLETED: { label: 'Completed', value: 'COMPLETED', filterKey: 'completed' },
  SUSPENDED: { label: 'Suspended', value: 'SUSPENDED', filterKey: 'suspended' },
  EXTERNALLY_TERMINATED: {
    label: 'Externally Terminated',
    value: 'EXTERNALLY_TERMINATED',
    filterKey: 'externallyTerminated',
  },
  INTERNALLY_TERMINATED: {
    label: 'Internally Terminated',
    value: 'INTERNALLY_TERMINATED',
    filterKey: 'internallyTerminated',
  },
  FINISHED: { label: 'Finished', value: 'FINISHED', filterKey: 'finished' },
  UNFINISHED: { label: 'Unfinished', value: 'UNFINISHED', filterKey: 'unfinished' },
};
