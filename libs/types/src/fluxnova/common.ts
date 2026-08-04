export class OfProcessExecution {
  processDefinitionId?: string;
  processInstanceId?: string;
  executionId?: string;
}

export interface FluxnovaNode {
  id?: string;
  name?: string;
  processDefinitionId?: string;
}

export const FLUXNOVA_DATE_FORMAT = 'yyyy-MM-DDTHH:mm:ss.SSSZZ';

export enum DIAGRAM_TYPE {
  BPMN = 'bpmn',
  DRD = 'drd',
  DMN = 'dmn',
}
