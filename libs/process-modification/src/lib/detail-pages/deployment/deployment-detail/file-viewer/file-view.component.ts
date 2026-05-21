import { Component, EventEmitter, inject, Input, OnDestroy, Output, ViewChild } from '@angular/core';
import { DeploymentResource } from '@fxn/types';
import { CodeEditorComponent } from '@fxn/common';
import { SubSink } from 'subsink';
import { DeploymentResourceUtilsService } from '../../../../services/deployment-resource-utils.service';
import { DeploymentService } from '../../../../services/deployment.service';
import { GenericDiagramSectionViewComponent } from '../../../../common/diagram/generic-diagram-viewer.component';

@Component({
  selector: 'fluxnova-deployment-file-view',
  templateUrl: './file-view.component.html',
  styleUrls: ['./file-view.component.scss'],
  standalone: false,
})
export class FileViewComponent implements OnDestroy {
  protected resourceUtilsService = inject(DeploymentResourceUtilsService);
  deploymentService = inject(DeploymentService);

  private _resource?: DeploymentResource;
  private _diagramSection?: GenericDiagramSectionViewComponent;
  public subs = new SubSink();
  @Output() viewChanged = new EventEmitter<void>();

  @ViewChild(CodeEditorComponent)
  codeEditor?: CodeEditorComponent;

  @ViewChild(GenericDiagramSectionViewComponent)
  set diagramSection(diagSection: GenericDiagramSectionViewComponent) {
    this._diagramSection = diagSection;
    this.updateView();
  }

  get diagramSection(): any {
    return this._diagramSection;
  }

  fvcWidth?: string;

  @Input() set widthOffset(width: number) {
    this.fvcWidth = `calc(100vw - ${width}px)`;
  }

  get resourceName(): string {
    return this._resource?.name ?? '';
  }

  get resourceData() {
    return this._resource?.data ?? '';
  }

  get showFileText() {
    return !!this.resourceUtilsService.getViewableFileLanguage(this._resource);
  }

  get showDiagram() {
    return this.resourceUtilsService.isDiagram(this._resource);
  }

  get resource(): DeploymentResource | undefined {
    return this._resource;
  }

  set resource(resource: DeploymentResource) {
    if (this._resource === resource) return;

    this._resource = resource;
    this.updateView();
  }

  get showDownload(): boolean {
    const hasResource = !!this.resource;
    const isNotOtherOptions = !this.showFileText && !this.showDiagram;

    return hasResource && isNotOtherOptions;
  }

  get showDisplayForNoMatch(): boolean {
    return !this.resource;
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  public handleDownload() {
    this.subs.add(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.resourceUtilsService.getResourceDataBuffer(this.resource!).subscribe({
        next: (arrayBuffer: any) => {
          const blob = new Blob([arrayBuffer]);
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = this.resourceName;
          a.dispatchEvent(
            new MouseEvent('click', {
              bubbles: true,
              cancelable: true,
              view: window,
            }),
          );
          window.URL.revokeObjectURL(url);
        },
        error: (e) => console.error(e),
      }),
    );
  }

  updateView() {
    if (this._diagramSection && this.resource && this.resourceUtilsService.isDiagram(this.resource)) {
      this._diagramSection.diagramType = this.resourceUtilsService.getDiagramType(this.resource);
      this._diagramSection.onDiagramXmlRetrieved({
        xml: this.resourceData || '',
        definitionId: this.resource.id,
        name: this.resourceName,
      });
      const viewer: any = this._diagramSection.navigatedViewer;
      if (viewer) {
        viewer.on('views.changed', () => {
          this.viewChanged.emit();
        });
      }
    }

    const resourceLanguage = this.resourceUtilsService.getViewableFileLanguage(this.resource);
    if (this.codeEditor && !!resourceLanguage)
      this.codeEditor.scriptInfo = {
        content: this.resourceData,
        name: this.resourceName || '',
        language: resourceLanguage,
      };

    this.viewChanged.emit();
  }

  protected onEditorInitialized() {
    if (this.codeEditor) this.codeEditor.scriptInfo = { content: this.resourceData, name: this.resourceName };
  }
}
