export function getOverrideDefinitionObject(id: string, deploymentId: string) {
  return {
    id,
    key: 'MODEL-7047e74a-bfca-4b2d-a574-f41e5f57b058',
    category: 'https://bpmn.io/schema/bpmn',
    description: null,
    name: 'Migration Test',
    version: 6,
    resource: 'Migration-Test v1.bpmn',
    deploymentId,
    diagram: null,
    suspended: false,
    tenantId: null,
    versionTag: null,
    historyTimeToLive: 30,
    startableInTasklist: true,
  };
}

export function getOverrideInstanceObject(id: string, processDefinitionId: string) {
  return {
    id,
    businessKey: null,
    processDefinitionId,
    processDefinitionKey: 'MODEL-7047e74a-bfca-4b2d-a574-f41e5f57b058',
    processDefinitionName: 'Migration Test',
    processDefinitionVersion: 6,
    startTime: '2023-05-10T16:21:02.326-0400',
    endTime: null,
    removalTime: null,
    durationInMillis: null,
    startUserId: 'usr1234',
    startActivityId: 'StartEvent_1',
    deleteReason: null,
    rootProcessInstanceId: id,
    superProcessInstanceId: null,
    superCaseInstanceId: null,
    caseInstanceId: null,
    tenantId: null,
    state: 'ACTIVE',
  };
}
