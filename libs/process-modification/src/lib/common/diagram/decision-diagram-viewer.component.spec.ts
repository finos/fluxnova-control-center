import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { firstValueFrom, of } from 'rxjs';
import { DIAGRAM_TYPE } from '@fxn/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DecisionDefinitionService } from '../../services/decision-definition.service';
import { DiagramService } from '../../services/diagram.service';
import { DiagramRendererService } from './services/diagram-renderer.service';
import { DecisionDiagramViewerComponent } from './decision-diagram-viewer.component';

describe('DecisionDefinitionDiagramSectionComponent', () => {
  let component: DecisionDiagramViewerComponent;
  let fixture: ComponentFixture<DecisionDiagramViewerComponent>;

  const mockDiagram = { definitionId: '123', xml: '<xml></xml>', name: 'hello' };
  const mockDiagramService = {
    getDiagram: vi.fn().mockReturnValue(of(mockDiagram)),
  };
  const mockDecisionDefinitionService = {
    getDecisionDefinitionDetail: vi.fn().mockReturnValue(
      of({
        id: '123',
        key: 'fooKey',
        category: 'http://fluxnova.org/schema/1.0/dmn',
        name: 'foo',
        version: 7,
        resource: 'foo.dmn',
        deploymentId: 'efa27f1d-7542-11ef-b506-069c0b38fee2',
        tenantId: null,
        decisionRequirementsDefinitionId: 'fooKey:9:efa628a2-7542-11ef-b506-069c0b38fee2',
        decisionRequirementsDefinitionKey: 'foo',
        historyTimeToLive: 60,
        versionTag: null,
      }),
    ),
  };

  const mockRenderer = {
    open: vi.fn(),
    render: vi.fn(),
    reposition: vi.fn(),
    navigatedViewer: {
      destroy: vi.fn(),
    },
  };

  const mockDiagramRendererService = {
    renderDiagram: vi.fn(),
    openDiagramView: vi.fn(),
    getDiagramRenderer: vi.fn().mockReturnValue(mockRenderer),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DecisionDiagramViewerComponent],
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        {
          provide: DiagramService,
          useValue: mockDiagramService,
        },
        {
          provide: DiagramRendererService,
          useValue: mockDiagramRendererService,
        },
        {
          provide: DecisionDefinitionService,
          useValue: mockDecisionDefinitionService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DecisionDiagramViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    vi.clearAllMocks();
  });

  it('should load the diagram xml and supporting data', () => {
    component.id = 'asdf';

    expect(mockDiagramService.getDiagram).toHaveBeenCalledWith('asdf', DIAGRAM_TYPE.DMN);
    expect(mockDecisionDefinitionService.getDecisionDefinitionDetail).toHaveBeenCalledWith('asdf');
  });

  it('should render the diagram', async () => {
    const nativeElement = 'i am an element';
    const elem = {
      nativeElement,
    };

    component.diagramContainerDiv = elem;
    component.id = 'asdf';

    const rendered = await firstValueFrom(component.diagramRendered);
    expect(rendered).toBe(true);

    expect(mockDiagramRendererService.getDiagramRenderer).toHaveBeenCalledWith(
      mockDiagram.xml,
      DIAGRAM_TYPE.DMN,
      nativeElement,
    );
    expect(mockDiagramRendererService.renderDiagram).toHaveBeenCalledWith(mockRenderer, 'fooKey');
  });
});
