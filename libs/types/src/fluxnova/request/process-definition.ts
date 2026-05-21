import { ActivityInstanceHistoryFilter } from './activity-instance';

export class ProcessDefinitionFilter {
  processDefinitionId?: string;
  processDefinitionIdIn?: string[];
  name?: string;
  nameLike?: string;
  deploymentId?: string;
  deploymentAfter?: string;
  deploymentAt?: string;
  key?: string;
  keysIn?: string[];
  keyLike?: string;
  version?: string;
  latestVersion?: boolean;
  versionTag?: string;
  versionTagLike?: string;
  withoutVersionTag?: boolean;
  suspended?: boolean;
  active?: boolean;
  sortBy?: string;
  sortOrder?: string;
  resourceName?: string;
  resourceNameLike?: string;
  category?: string;
  categoryLike?: string;
  startableInTasklist?: boolean;
  notStartableInTasklist?: boolean;
  tenantIdIn?: string[];
  static toUrlSearchParams = (filter: ProcessDefinitionFilter): URLSearchParams => {
    const qString = new URLSearchParams();

    Object.entries(filter).forEach(([key, value]) => {
      if (Array.isArray(value)) qString.append(key, value.join(','));
      else qString.append(key, value.toString());
    });

    return qString;
  };
}

export interface CalledProcessDefinitionFilter extends ActivityInstanceHistoryFilter {
  processDefinitionId: string;
}
