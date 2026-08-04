import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { ToastService } from '@fxn/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ProcessDefinition, ProcessInstance } from '@fxn/types';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, Mocked, vi } from 'vitest';
import { VersionMigrationService } from '../../../../services/version-migration.service';
import { ProcessInstanceService } from '../../../../services/process-instance.service';
import { ProcessDefinitionService } from '../../../../services/process-definition.service';
import { DiagramService } from '../../../../services/diagram.service';
import { MigrateModalComponent } from './migrate-modal.component';

describe('MigrateModalComponent', () => {
  let component: MigrateModalComponent;
  let fixture: ComponentFixture<MigrateModalComponent>;
  const version1Definition = {
    id: 'definition-1-id',
    version: 1,
    key: 'key1',
  } as ProcessDefinition;
  const version2Definition = {
    version: 2,
    id: 'definition-2-id',
    key: 'key2',
  } as ProcessDefinition;
  const instances = [{ id: 'instance-1' }, { id: 'instance-2' }] as ProcessInstance[];
  const mockToasts = { success: vi.fn(), error: vi.fn() };

  const mockMigrationService = {
    executeProcessInstancesMigration: vi.fn().mockReturnValue(of({ id: '1234' })),
  };
  const mockModal = { close: vi.fn() };
  const mockSourceRegistry = [
    { id: 'sameElement1' },
    { id: 'deletedElement1' },
    { id: 'sameElement2' },
    { id: 'deletedElement2' },
  ];
  const mockTargetRegistry = [{ id: 'sameElement1' }, { id: 'sameElement2' }, { id: 'addedElement1' }];
  const mockSourceCanvas = {
    addMarker: vi.fn(),
    removeMarker: vi.fn(),
  };
  const mockTargetCanvas = {
    addMarker: vi.fn(),
  };
  const mockSource = {
    navigatedViewer: {
      get: (module: string) => {
        if (module === 'elementRegistry') {
          return { getAll: () => mockSourceRegistry };
        }
        return mockSourceCanvas;
      },
    },
  } as any;
  const mockTarget = {
    navigatedViewer: {
      get: (module: string) => {
        if (module === 'elementRegistry') {
          return { getAll: () => mockTargetRegistry };
        }
        return mockTargetCanvas;
      },
    },
    resource: undefined,
  } as any;

  const mockProcessInstanceService: Mocked<ProcessInstanceService> = {
    getProcessInstanceCountByFilter: vi.fn(() => of(10)),
  } as unknown as Mocked<ProcessInstanceService>;

  const mockDefinitionService = {
    getProcessDefinitionById: vi.fn().mockReturnValue(of(version1Definition)),
    getProcessDefinitionVersionsById: vi.fn().mockReturnValue(
      of([
        { versionNumber: 1, versionDefinitionId: 'definition-1-id' },
        { versionNumber: 2, versionDefinitionId: 'definition-2-id' },
      ]),
    ),
  };

  const mockDiagService = {
    getProcessDefinitionDiagram: vi.fn().mockReturnValue(of({ xml: '' })),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MigrateModalComponent],
      providers: [
        { provide: VersionMigrationService, useValue: mockMigrationService },
        { provide: NgbActiveModal, useValue: mockModal },
        { provide: ToastService, useValue: mockToasts },
        { provide: ProcessInstanceService, useValue: mockProcessInstanceService },
        { provide: ProcessDefinitionService, useValue: mockDefinitionService },
        { provide: DiagramService, useValue: mockDiagService },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(MigrateModalComponent);
    component = fixture.componentInstance;
    component.processDefinitionId = version1Definition.id;
    component.processInstances = instances;
    fixture.detectChanges();
    component.sourceDiagramComponent = mockSource;
    component.targetDiagramComponent = mockTarget;

    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => vi.useRealTimers());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load the required data', async () => {
    component.ngOnInit();

    await vi.advanceTimersByTimeAsync(1);

    expect(component.processDefinition).toEqual(version1Definition);
    expect(component.versions).toEqual([
      { versionNumber: 1, versionDefinitionId: 'definition-1-id' },
      { versionNumber: 2, versionDefinitionId: 'definition-2-id' },
    ]);
    expect(component.totalCount).toBe(10);
    expect(mockDefinitionService.getProcessDefinitionVersionsById).toHaveBeenCalledWith(version1Definition.id);
    expect(mockDefinitionService.getProcessDefinitionById).toHaveBeenCalledWith(version1Definition.id);
    expect(mockProcessInstanceService.getProcessInstanceCountByFilter).toHaveBeenCalledWith({
      processDefinitionId: version1Definition.id,
      unfinished: true,
    });
  });

  it('shows version information for the given definition', async () => {
    component.ngOnInit();
    await vi.advanceTimersByTimeAsync(1);
    fixture.detectChanges();
    expect(component.oldVersion?.versionNumber).toEqual(version1Definition.version);
    expect(component.versionOptions?.[0].disabled).toBe(true);
  });

  it('does not set target version diagram when the toggle is off', async () => {
    selectTargetVersion(version2Definition.version as number);

    await vi.advanceTimersByTimeAsync(1);

    expect(mockTarget.id).toEqual(undefined);
  });

  it('sets target version diagram when the toggle is on', async () => {
    component.isDiagramOpen = true;
    selectTargetVersion(version2Definition.version as number);

    await vi.advanceTimersByTimeAsync(1);

    expect(component.targetDefinitionId).toEqual(version2Definition.id);
    expect(mockTarget.id).toEqual(version2Definition.id);
  });

  it('auto selects the next version', () => {
    expect(component.newVersionNumber).toEqual(version2Definition.version);
  });

  it("auto selects the previous version when it's already the latest version", () => {
    component.setVersions(2);
    expect(component.newVersionNumber).toEqual(version1Definition.version);
  });

  it('reloads the process definition and closes the modal', () => {
    selectTargetVersion(version2Definition.version as number);
    component.tenantId = 'asdf';
    component.executeMigration();
    expect(component.isMigrating).toBe(false);
    expect(mockToasts.success).toHaveBeenCalledWith(
      'Request to migrate 2 instances to version 2 submitted successfully.  Click <a href="asdf/batches/1234">here</a> to view the status of the migration.',
      { delay: 10000 },
    );
    expect(mockModal.close).toHaveBeenCalled();
  });

  it('sets correct css classes for diagram elements that were added or deleted', () => {
    component.showDiff();
    expect(mockTargetCanvas.addMarker).toHaveBeenCalledWith('addedElement1', 'addition');
    expect(mockSourceCanvas.addMarker).toHaveBeenCalledWith('deletedElement1', 'deletion');
    expect(mockSourceCanvas.addMarker).toHaveBeenCalledWith('deletedElement2', 'deletion');
    expect(mockSourceCanvas.addMarker).not.toHaveBeenCalledWith('sameElement1', expect.any(String));
  });

  it('removes correct css classes for diagram elements that were deleted', () => {
    component.showDiff();
    component.clearDiff();
    // No need to remove from target because it is refreshed every time.
    expect(mockSourceCanvas.removeMarker).toHaveBeenCalledWith('deletedElement1', 'deletion');
    expect(mockSourceCanvas.removeMarker).toHaveBeenCalledWith('deletedElement2', 'deletion');
    expect(mockSourceCanvas.removeMarker).not.toHaveBeenCalledWith('sameElement1', expect.any(String));
  });

  it('passes boolean options to migration request', () => {
    component.skipCustomListeners = true;
    component.skipIoMappings = true;
    component.updateEventTriggers = true;
    selectTargetVersion(version2Definition.version as number);
    component.executeMigration();
    expect(mockMigrationService.executeProcessInstancesMigration).toHaveBeenCalledWith({
      migrationPlan: {
        sourceProcessDefinitionId: version1Definition.id,
        targetProcessDefinitionId: version2Definition.id,
        updateEventTriggers: true,
      },
      skipCustomListeners: true,
      skipIoMappings: true,
      processInstanceIds: ['instance-1', 'instance-2'],
    });

    component.skipCustomListeners = false;
    component.skipIoMappings = false;
    component.updateEventTriggers = false;
    component.executeMigration();
    expect(mockMigrationService.executeProcessInstancesMigration).toHaveBeenCalledWith({
      migrationPlan: {
        sourceProcessDefinitionId: version1Definition.id,
        targetProcessDefinitionId: version2Definition.id,
        updateEventTriggers: false,
      },
      skipCustomListeners: false,
      skipIoMappings: false,
      processInstanceIds: ['instance-1', 'instance-2'],
    });
  });

  it('correctly sets request object when no instances are provided', () => {
    component.processInstances = [];
    selectTargetVersion(version2Definition.version as number);
    component.executeMigration();
    expect(mockMigrationService.executeProcessInstancesMigration).toHaveBeenCalledWith({
      migrationPlan: {
        sourceProcessDefinitionId: version1Definition.id,
        targetProcessDefinitionId: version2Definition.id,
        updateEventTriggers: false,
      },
      skipCustomListeners: true,
      skipIoMappings: true,
      processInstanceQuery: { processDefinitionId: version1Definition.id },
    });
  });

  it('correctly sets request object when instances are provided', () => {
    component.processInstances = instances;
    selectTargetVersion(version2Definition.version as number);
    component.executeMigration();
    expect(mockMigrationService.executeProcessInstancesMigration).toHaveBeenCalledWith({
      migrationPlan: {
        sourceProcessDefinitionId: version1Definition.id,
        targetProcessDefinitionId: version2Definition.id,
        updateEventTriggers: false,
      },
      skipCustomListeners: true,
      skipIoMappings: true,
      processInstanceIds: ['instance-1', 'instance-2'],
    });
  });

  function selectTargetVersion(versionNumber: number) {
    component.newVersionNumber = versionNumber;
    component.updateTargetVersion();
  }
});
