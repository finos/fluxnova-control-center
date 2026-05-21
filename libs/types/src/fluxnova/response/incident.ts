import { ItemList } from '../../common';
import { BaseHistory } from './history';

export class Incident extends BaseHistory {
  incidentTimestamp?: string;
  incidentType?: string;
  activityId?: string;
  failedActivityId?: string;
  causeIncidentId?: string;
  rootCauseIncidentId?: string;
  configuration?: string;
  tenantId?: string;
  incidentMessage?: string;
  jobDefinitionId?: string;
  annotation?: string;
  createTime?: string;
  endTime?: string;
  open?: boolean;
  deleted?: boolean;
  resolved?: boolean;
  removalTime?: string;
}

export class IncidentList implements ItemList<Incident> {
  totalCount?: number;
  items?: Incident[];
}
