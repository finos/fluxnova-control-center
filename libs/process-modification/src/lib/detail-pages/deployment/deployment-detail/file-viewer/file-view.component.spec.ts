import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { marbles } from 'rxjs-marbles';
import { DeploymentResource } from '@fxn/types';
import { BrowserModule } from '@angular/platform-browser';
import { CodeEditorComponent } from '@fxn/common';
import { beforeEach, describe, expect, it, test, vi } from 'vitest';
import { DeploymentResourceUtilsService } from '../../../../services/deployment-resource-utils.service';
import { DeploymentService } from '../../../../services/deployment.service';
import { GenericDiagramSectionViewComponent } from '../../../../common/diagram/generic-diagram-viewer.component';
import { FileViewComponent } from './file-view.component';

let component: FileViewComponent;
let fixture: ComponentFixture<FileViewComponent>;

describe('FileViewComponent', () => {
  describe('should render different resource file types', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [BrowserModule],
        schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        providers: [provideHttpClient(withInterceptorsFromDi()), DeploymentResourceUtilsService, DeploymentService],
        declarations: [FileViewComponent],
      }).compileComponents();

      fixture = TestBed.createComponent(FileViewComponent);
      component = fixture.componentInstance;
    });

    test('should render with bpmnResource', () => {
      const bpmnResource: DeploymentResource = {
        data: 'will have some bpmn schema based xml',
        deploymentId: 'test-deployment-id',
        id: 'test-id',
        name: 'bpmn-resource-file.bpmn',
      };

      component.resource = bpmnResource;

      fixture.detectChanges();

      expect(component.showDiagram).toBe(true);
      expect(component.showFileText).toBe(false);
      expect(component.showDownload).toBe(false);
      expect(component.showDisplayForNoMatch).toBe(false);
      expect(component.resource).toStrictEqual(bpmnResource);
      expect(component.resourceName).toBe(bpmnResource.name);
      expect(component.resourceData).toBe(bpmnResource.data);
    });

    test('should render with dmnResource', () => {
      const dmnResource: DeploymentResource = {
        data: 'will have some dmn schema based xml',
        deploymentId: 'test-deployment-id',
        id: 'test-id',
        name: 'dmn-resource-file.dmn',
      };

      component.resource = dmnResource;

      fixture.detectChanges();

      expect(component.showDiagram).toBe(true);
      expect(component.showFileText).toBe(false);
      expect(component.showDownload).toBe(false);
      expect(component.showDisplayForNoMatch).toBe(false);
      expect(component.resource).toStrictEqual(dmnResource);
      expect(component.resourceName).toBe(dmnResource.name);
      expect(component.resourceData).toBe(dmnResource.data);
    });

    test('should render with javascript resource', () => {
      const javascriptResource: DeploymentResource = {
        data: 'will have some javascript content here',
        deploymentId: 'test-deployment-id',
        id: 'test-id',
        name: 'javascript-resource-file.js',
      };

      component.resource = javascriptResource;

      fixture.detectChanges();

      expect(component.showDiagram).toBe(false);
      expect(component.showFileText).toBe(true);
      expect(component.showDownload).toBe(false);
      expect(component.showDisplayForNoMatch).toBe(false);
      expect(component.resource).toStrictEqual(javascriptResource);
      expect(component.resourceName).toBe(javascriptResource.name);
      expect(component.resourceData).toBe(javascriptResource.data);
    });

    test('should render with typescript resource', () => {
      const typescriptResource: DeploymentResource = {
        data: 'will have some typescript content here',
        deploymentId: 'test-deployment-id',
        id: 'test-id',
        name: 'typescript-resource-file.ts',
      };

      component.resource = typescriptResource;

      fixture.detectChanges();

      expect(component.showDiagram).toBe(false);
      expect(component.showFileText).toBe(true);
      expect(component.showDownload).toBe(false);
      expect(component.showDisplayForNoMatch).toBe(false);
      expect(component.resource).toStrictEqual(typescriptResource);
      expect(component.resourceName).toBe(typescriptResource.name);
      expect(component.resourceData).toBe(typescriptResource.data);
    });

    test('should render with other resource - groovy', () => {
      const groovyResource: DeploymentResource = {
        data: 'will have some groovy resource content here',
        deploymentId: 'test-deployment-id',
        id: 'test-id',
        name: 'groovy-resource-file.groovy',
      };

      component.resource = groovyResource;

      fixture.detectChanges();

      expect(component.showDiagram).toBe(false);
      expect(component.showFileText).toBe(true);
      expect(component.showDownload).toBe(false);
      expect(component.showDisplayForNoMatch).toBe(false);
      expect(component.resource).toStrictEqual(groovyResource);
      expect(component.resourceName).toBe(groovyResource.name);
      expect(component.resourceData).toBe(groovyResource.data);
    });

    test('should render with unsupported file - text file', () => {
      const txtFileResource: DeploymentResource = {
        data: 'will have some text resource content here',
        deploymentId: 'test-deployment-id',
        id: 'test-id',
        name: 'text-resource-file.txt',
      };

      component.resource = txtFileResource;

      fixture.detectChanges();

      expect(component.showDiagram).toBe(false);
      expect(component.showFileText).toBe(false);
      expect(component.showDownload).toBe(true);
      expect(component.showDisplayForNoMatch).toBe(false);
      expect(component.resource).toStrictEqual(txtFileResource);
      expect(component.resourceName).toBe(txtFileResource.name);
      expect(component.resourceData).toBe(txtFileResource.data);
    });

    test('should render with unsupported file - ping file', () => {
      const pngFileResource: DeploymentResource = {
        data: 'will have some ping resource content here',
        deploymentId: 'test-deployment-id',
        id: 'test-id',
        name: 'image-png-resource-file.png',
      };

      component.resource = pngFileResource;

      fixture.detectChanges();

      expect(component.showDiagram).toBe(false);
      expect(component.showFileText).toBe(false);
      expect(component.showDownload).toBe(true);
      expect(component.showDisplayForNoMatch).toBe(false);
      expect(component.resource).toStrictEqual(pngFileResource);
      expect(component.resourceName).toBe(pngFileResource.name);
      expect(component.resourceData).toBe(pngFileResource.data);
    });

    test('should get and set the diagram section view component', () => {
      const mockDiagramSection = {} as GenericDiagramSectionViewComponent;
      component.diagramSection = mockDiagramSection;
      expect(component.diagramSection).toBe(mockDiagramSection);
      component.diagramSection = undefined as unknown as GenericDiagramSectionViewComponent;
    });
  });

  it(
    'downloads a file when the download is called',
    marbles((m) => {
      window.URL.createObjectURL = vi.fn(() => 'aTestUrl');
      window.URL.revokeObjectURL = vi.fn();

      const pngFileResource: DeploymentResource = {
        data: 'will have some ping resource content here',
        deploymentId: 'test-deployment-id',
        id: 'test-id',
        name: 'image-png-resource-file.png',
      };
      component.resource = pngFileResource;
      component.handleDownload();

      m.flush();
    }),
  );

  it('should set the code on the editor', () => {
    const mockEditor = {
      scriptInfo: {},
    } as unknown as CodeEditorComponent;

    component.codeEditor = mockEditor;
    component.updateView();
    component.resource = {
      data: 'will have some groovy resource content here',
      deploymentId: 'test-deployment-id',
      id: 'test-id',
      name: 'groovy-resource-file.groovy',
    };
    expect(mockEditor.scriptInfo).toEqual({
      content: 'will have some groovy resource content here',
      language: 'java',
      name: 'groovy-resource-file.groovy',
    });
  });

  it('should update the file view component width when widthOffset is updated', () => {
    component.widthOffset = 234;
    expect(component.fvcWidth).toBe('calc(100vw - 234px)');
  });

  it('should update the diagram section and emit viewChanged when resource is set', () => {
    component = fixture.componentInstance;
    const viewChangedSpy = vi.spyOn(component.viewChanged, 'emit');

    const mockDiagramSection = {
      diagramType: '',
      onDiagramXmlRetrieved: vi.fn(),
      navigatedViewer: {
        on: vi.fn(),
      },
    } as unknown as GenericDiagramSectionViewComponent;

    component.diagramSection = mockDiagramSection;
    const mockResource: DeploymentResource = {
      data: 'mock xml data',
      deploymentId: 'test-deployment-id',
      id: 'test-id',
      name: 'mock-resource.bpmn',
    };
    component.resource = mockResource;

    component.updateView();

    expect(mockDiagramSection.diagramType).toBe('bpmn');
    expect(mockDiagramSection.onDiagramXmlRetrieved).toHaveBeenCalledWith({
      xml: 'mock xml data',
      definitionId: 'test-id',
      name: 'mock-resource.bpmn',
    });
    expect((mockDiagramSection.navigatedViewer as any)?.on).toHaveBeenCalledWith('views.changed', expect.any(Function));
    expect(viewChangedSpy).toHaveBeenCalled();
  });

  it('should emit viewChanged when no diagram section or code editor is present', () => {
    component = fixture.componentInstance;
    const viewChangedSpy = vi.spyOn(component.viewChanged, 'emit');

    component.diagramSection = undefined as unknown as GenericDiagramSectionViewComponent;
    component.codeEditor = undefined;
    component.resource = {
      data: 'mock data',
      deploymentId: 'test-deployment-id',
      id: 'test-id',
      name: 'mock-resource.txt',
    };

    component.updateView();

    expect(viewChangedSpy).toHaveBeenCalled();
  });
});
