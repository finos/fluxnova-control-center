import { migrateDiagram } from '@bpmn-io/dmn-migrate';
import DmnJSNavigatedViewer from 'dmn-js/lib/NavigatedViewer';
import { DIAGRAM_TYPE } from '@fxn/types';
import { DiagramRenderer } from './diagram-renderer';

export class DiagramDmnRenderer implements DiagramRenderer {
  constructor(
    private _resourceXMLData: string,
    private _dmnViewer: DmnJSNavigatedViewer,
  ) {}

  public detach() {
    this._dmnViewer.detach();
  }

  public openFirstDecisionTable() {
    const decisionTableView = this._dmnViewer?.getViews().find(({ type }) => type === 'decisionTable');

    if (!decisionTableView) {
      return;
    }

    this._dmnViewer.open(decisionTableView);
  }

  public async open(viewId: string) {
    this._dmnViewer.open(this.getViewFromViewId(viewId));
  }

  public async render() {
    await this._dmnViewer?.importXML(await migrateDiagram(this._resourceXMLData));
  }

  public reposition(): void {
    const diagramCanvas = this._dmnViewer.getActiveViewer()?.get('canvas');

    diagramCanvas?.resized();
    diagramCanvas?.zoom('fit-viewport', 'center');
  }

  private getViewFromViewId(viewId: string) {
    return this._dmnViewer?.getViews().find(({ id }: { id: string }) => id === viewId);
  }

  get navigatedViewer() {
    return this._dmnViewer;
  }

  getDiagramType() {
    return this._dmnViewer.getActiveView().type === 'decisionTable' ? DIAGRAM_TYPE.DMN : DIAGRAM_TYPE.DRD;
  }
}
