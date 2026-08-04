import { ItemType } from '@fxn/types';

export function parseJson(json: any, doLogError = true) {
  try {
    return JSON.parse(json);
  } catch (error) {
    if (doLogError) console.error('Failed parsing JSON', error);
    return false;
  }
}

// Should only take an angular path (e.g. "/:tenant/page").
// Also, using the Angular route.params does not work unless inside an
// "activated" component
export function getUrlSegments(url: string) {
  const segments = url.split('/');
  return {
    tenant: segments[1],
    page: segments[2],
  };
}

export function getTypeString(type: ItemType) {
  switch (type) {
    case ItemType.ProcessInstance:
      return 'Process Instance';
    case ItemType.ProcessDefinition:
      return 'Process Definition';
    case ItemType.Job:
      return 'Job';
    case ItemType.JobDefinition:
      return 'Job Definition';
    case ItemType.Incident:
      return 'Incident';
    case ItemType.Batch:
      return 'Batch';
    case ItemType.Deployment:
      return 'Deployment';
    case ItemType.DecisionDefinition:
      return 'Decision Definition';
    case ItemType.DecisionInstance:
      return 'Decision Instance';
    default:
      return '';
  }
}

export function downloadDataBuffer(arrayBuffer: any, resourceName: string) {
  const blob = new Blob([arrayBuffer]);
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;

  a.download = resourceName;
  a.dispatchEvent(
    new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window,
    }),
  );
  window.URL.revokeObjectURL(url);
}
