import NavigatedViewer from 'bpmn-js/lib/NavigatedViewer';
import DmnJSNavigatedViewer from 'dmn-js/lib/NavigatedViewer';
import { DIAGRAM_TYPE } from '@fxn/types';

export interface DiagramRenderer {
  detach: () => void;
  open?: (viewId: string) => void;
  render: (viewId?: string) => Promise<void>;
  reposition: () => void;
  navigatedViewer: NavigatedViewer | DmnJSNavigatedViewer;
  getDiagramType: () => DIAGRAM_TYPE;
}
