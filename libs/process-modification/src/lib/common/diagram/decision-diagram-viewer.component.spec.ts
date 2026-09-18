import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DIAGRAM_TYPE } from '@fxn/types';
import { firstValueFrom, of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DecisionDefinitionService } from '../../services/decision-definition.service';
import { DiagramService } from '../../services/diagram.service';
import { DecisionDiagramViewerComponent } from './decision-diagram-viewer.component';
import { DiagramRendererService } from './services/diagram-renderer.service';

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

  it('should render the diagram with an empty view id when the definition has no key', async () => {
    component.diagramContainerDiv = { nativeElement: 'i am an element' } as any;

    await component.renderDiagram(mockDiagram, {} as any);

    expect(mockDiagramRendererService.renderDiagram).toHaveBeenCalledWith(mockRenderer, '');
  });

  it('should highlight every supplied rule row', () => {
    const firstRow = { classList: { add: vi.fn(), remove: vi.fn() } };
    const secondRow = { classList: { add: vi.fn(), remove: vi.fn() } };
    component.diagramContainerDiv = {
      nativeElement: {
        querySelector: vi.fn((selector: string) =>
          selector.includes('rule-one') ? { parentElement: firstRow } : { parentElement: secondRow },
        ),
      },
    } as any;

    component.ruleIdsToHighlight = ['rule-one', 'rule-two'];
    component.ngAfterViewInit();

    expect(firstRow.classList.add).toHaveBeenCalledWith('row-highlighted');
    expect(secondRow.classList.add).toHaveBeenCalledWith('row-highlighted');
  });

  it('should not highlight when the diagram container is not available', () => {
    component.diagramContainerDiv = undefined;

    component.ruleIdsToHighlight = ['rule-one'];

    expect(() => component.ngAfterViewInit()).not.toThrow();
  });

  it('should treat a nullish rule id list as empty', () => {
    const querySelector = vi.fn();
    component.diagramContainerDiv = { nativeElement: { querySelector } } as any;

    component.ruleIdsToHighlight = undefined as unknown as string[];
    component.ngAfterViewInit();

    expect(querySelector).not.toHaveBeenCalled();
  });

  it('should ignore rule ids that do not match a row', () => {
    component.diagramContainerDiv = {
      nativeElement: {
        querySelector: vi.fn(() => null),
      },
    } as any;

    component.ruleIdsToHighlight = ['missing-rule'];

    expect(() => component.ngAfterViewInit()).not.toThrow();
  });

  it('should clear previously highlighted rows before highlighting the new ones', async () => {
    const firstRow = { classList: { add: vi.fn(), remove: vi.fn() } };
    const secondRow = { classList: { add: vi.fn(), remove: vi.fn() } };
    component.diagramContainerDiv = {
      nativeElement: {
        querySelector: vi.fn((selector: string) =>
          selector.includes('rule-one') ? { parentElement: firstRow } : { parentElement: secondRow },
        ),
      },
    } as any;

    component.ruleIdsToHighlight = ['rule-one'];
    component.ngAfterViewInit();

    component.ruleIdsToHighlight = ['rule-two'];
    await component.renderDiagram(mockDiagram, { key: 'fooKey' } as any);

    expect(firstRow.classList.remove).toHaveBeenCalledWith('row-highlighted');
    expect(secondRow.classList.add).toHaveBeenCalledWith('row-highlighted');
  });
});
