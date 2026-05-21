import { BpmnColors } from '@fxn/common';
import { DIAGRAM_TYPE } from '@fxn/types';
import NavigatedViewer from 'bpmn-js/lib/Viewer';
import { ColorRenderer } from './extensions/color-renderer';
import { DiagramRenderer } from './diagram-renderer';

export class DiagramBpmnRenderer implements DiagramRenderer {
  _diagramCanvas: any;

  constructor(
    private _resourceXMLData: string,
    private _navigatedViewer: NavigatedViewer,
    private _bpmnColors: BpmnColors,
  ) {
    this._diagramCanvas = this._navigatedViewer?.get('canvas');
  }

  detach() {
    this._navigatedViewer.detach();
  }

  async render() {
    this._navigatedViewer?.get<ColorRenderer>('colorRenderer')?.setColors(this._bpmnColors);
    await this._navigatedViewer.importXML(this._resourceXMLData);
  }

  reposition(): void {
    this._diagramCanvas?.zoom('fit-viewport', 'center');
  }

  get navigatedViewer() {
    return this._navigatedViewer;
  }

  getDiagramType() {
    return DIAGRAM_TYPE.BPMN;
  }
}
