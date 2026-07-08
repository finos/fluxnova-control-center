import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { IconComponent } from '@fxn/common';
import { HttpClient } from '@angular/common/http';
import { Batch, ItemType, ProcessDefinition, ProcessInstance, ProcessInstanceStatesMap } from '@fxn/types';
import { PermissionService } from '@fxn/common/src/lib/services/permission.service';
import { ButtonActions } from '@fxn/types/src/button-actions';
import { ActionPermissionsSpec } from '@fxn/types';
import * as actionAccess from '@fxn/common/src/lib/auth/access-permissions/action-access';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import { ChangeDetectorRef, NO_ERRORS_SCHEMA } from '@angular/core';
import { DiagramToolbarComponent } from '../../detail-pages/diagram-section/diagram-toolbar/diagram-toolbar.component';
import { ToolbarButtonComponent } from './toolbar-button.component';
import { ToolbarComponent } from './toolbar.component';

describe('ToolbarComponent', () => {
  let component: ToolbarComponent;
  let fixture: ComponentFixture<ToolbarComponent>;
  let detectChangesSpy: Mock<ChangeDetectorRef['detectChanges']>;
  const mockHasPermissions = vi.fn();
  const mockPermissionService = { meetsPermissionSpecification: mockHasPermissions };
  const spyGetRequiredPermisssions = vi.spyOn(actionAccess, 'getRequiredActionPermissions');

  const actionButtons = ['activate', 'download_resource', 'suspend', 'retry', 'delete', 'terminate'].sort();

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      providers: [
        { provide: HttpClient, useValue: {} },
        { provide: PermissionService, useValue: mockPermissionService },
      ],
      declarations: [ToolbarComponent, ToolbarButtonComponent, IconComponent, DiagramToolbarComponent],
      imports: [NgbTooltip],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ToolbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    detectChangesSpy = vi.spyOn(component.cdr, 'detectChanges');
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have a list of action buttons', () => {
    expect(component.buttons?.toArray().length).toBe(6);
    expect(component.buttons?.map((btn) => btn.id).sort()).toEqual(actionButtons);
  });

  it('disable should disable buttons', () => {
    component.enable([ButtonActions.ACTIVATE]);

    //clear mocks because enable will call detectChanges
    vi.clearAllMocks();

    component.disable([ButtonActions.ACTIVATE]);

    expect(component.buttons?.find((btn) => btn.id === 'activate')?.enabled).toBe(false);
  });

  it('enable should enable buttons', () => {
    component.enable([ButtonActions.ACTIVATE]);

    expect(component.buttons?.find((btn) => btn.id === 'activate')?.enabled).toBe(true);
  });

  it('show should show buttons', () => {
    component.show([ButtonActions.ACTIVATE]);

    expect(component.buttons?.find((btn) => btn.id === 'activate')?.hidden).toBe(false);
    expect(detectChangesSpy).toHaveBeenCalledTimes(1);
  });

  it('hide should hide buttons', () => {
    component.show([ButtonActions.ACTIVATE]);

    //clear mocks because enable will call detectChanges
    vi.clearAllMocks();

    component.hide([ButtonActions.ACTIVATE]);

    expect(detectChangesSpy).toHaveBeenCalledTimes(1);
    expect(component.buttons?.find((btn) => btn.id === 'activate')?.hidden).toBe(true);
  });

  describe('when the item type is ProcessInstance', () => {
    beforeAll(() => {
      mockHasPermissions.mockResolvedValue(true);
    });

    afterAll(() => {
      mockHasPermissions.mockReset();
    });
    it('should show suspend, terminate, and download diagram buttons, and set diagramType to ProcessInstance', async () => {
      component.item = { type: ItemType.ProcessInstance };
      await vi.runAllTimersAsync();

      expect(component.diagramToolbar?.diagramType).toBe(ItemType.ProcessInstance);
      expect(component.buttons?.find((btn) => btn.id === 'suspend')?.hidden).toBe(false);
      expect(component.buttons?.find((btn) => btn.id === 'terminate')?.hidden).toBe(false);
      expect(component.buttons?.find((btn) => btn.id === 'download_resource')?.hidden).toBe(false);
    });

    it('should hide the activate button, disable diagramTools, show and enable the suspend and terminate buttons when an instance is active', async () => {
      component.item = { type: ItemType.ProcessInstance };
      await vi.runAllTimersAsync();

      component.updateButtonStates({ state: ProcessInstanceStatesMap.ACTIVE.value } as ProcessInstance);
      await vi.runAllTimersAsync();

      expect(component.diagramToolbar?.isEditEnabled).toBe(true);

      expect(component.buttons?.find((btn) => btn.id === 'activate')?.enabled).toBe(false);
      expect(component.buttons?.find((btn) => btn.id === 'activate')?.hidden).toBe(true);
      expect(component.buttons?.find((btn) => btn.id === 'suspend')?.enabled).toBe(true);
      expect(component.buttons?.find((btn) => btn.id === 'suspend')?.hidden).toBe(false);
      expect(component.buttons?.find((btn) => btn.id === 'terminate')?.enabled).toBe(true);
    });

    it('should hide the suspend button, disable diagramTools, show and enable the activate and terminate buttons when an instance is not active', async () => {
      component.item = { type: ItemType.ProcessInstance };
      await vi.runAllTimersAsync();

      component.updateButtonStates({ state: ProcessInstanceStatesMap.SUSPENDED.value } as ProcessInstance);
      await vi.runAllTimersAsync();

      expect(component.diagramToolbar?.isEditEnabled).toBe(false);
      expect(component.buttons?.find((btn) => btn.id === 'activate')?.hidden).toBe(false);
      expect(component.buttons?.find((btn) => btn.id === 'activate')?.enabled).toBe(true);
      expect(component.buttons?.find((btn) => btn.id === 'suspend')?.hidden).toBe(true);
      expect(component.buttons?.find((btn) => btn.id === 'suspend')?.enabled).toBe(false);
      expect(component.buttons?.find((btn) => btn.id === 'terminate')?.enabled).toBe(true);
    });

    it('should hide all action buttons and disable the diagram tools when the instance is not active or suspended', async () => {
      component.item = { type: ItemType.ProcessInstance };
      await vi.runAllTimersAsync();

      component.updateButtonStates({
        state: ProcessInstanceStatesMap.EXTERNALLY_TERMINATED.value,
      } as ProcessInstance);
      await vi.runAllTimersAsync();

      expect(component.diagramToolbar?.isEditEnabled).toBe(false);
      expect(component.buttons?.find((btn) => btn.id === 'activate')?.hidden).toBe(true);
      expect(component.buttons?.find((btn) => btn.id === 'suspend')?.hidden).toBe(true);
      expect(component.buttons?.find((btn) => btn.id === 'terminate')?.hidden).toBe(true);
    });
  });

  describe('when the item type is ProcessDefinition', () => {
    describe('disable/enable behavior', () => {
      beforeAll(() => {
        mockHasPermissions.mockResolvedValue(true);
      });

      afterAll(() => {
        mockHasPermissions.mockReset();
      });

      it('should show suspend, delete, download diagram and set diagramType to ProcessDefinition', async () => {
        component.item = { type: ItemType.ProcessDefinition };
        await vi.runAllTimersAsync();

        expect(component.diagramToolbar?.diagramType).toBe(ItemType.ProcessDefinition);
        expect(component.buttons?.find((btn) => btn.id === 'suspend')?.hidden).toBe(false);
        expect(component.buttons?.find((btn) => btn.id === 'delete')?.hidden).toBe(false);
        expect(component.buttons?.find((btn) => btn.id === 'download_resource')?.hidden).toBe(false);
      });

      it('should hide the activate button, and show and enable the suspend, delete, and start process buttons when a definition is not suspended', async () => {
        component.item = { type: ItemType.ProcessDefinition };
        await vi.runAllTimersAsync();

        component.updateButtonStates({ suspended: false } as ProcessDefinition);
        await vi.runAllTimersAsync();

        expect(component.diagramToolbar?.isStartEnabled).toBe(true);
        expect(component.buttons?.find((btn) => btn.id === 'suspend')?.enabled).toBe(true);
        expect(component.buttons?.find((btn) => btn.id === 'suspend')?.hidden).toBe(false);
        expect(component.buttons?.find((btn) => btn.id === 'activate')?.enabled).toBe(false);
        expect(component.buttons?.find((btn) => btn.id === 'activate')?.hidden).toBe(true);
        expect(component.buttons?.find((btn) => btn.id === 'delete')?.enabled).toBe(true);
      });

      it('should disable the suspend and start process button and enable the activate and delete buttons when a definition is suspended', async () => {
        component.item = { type: ItemType.ProcessDefinition };
        await vi.runAllTimersAsync();

        component.updateButtonStates({ suspended: true } as ProcessDefinition);
        await vi.runAllTimersAsync();

        expect(component.diagramToolbar?.isStartEnabled).toBe(false);
        expect(component.buttons?.find((btn) => btn.id === 'suspend')?.enabled).toBe(false);
        expect(component.buttons?.find((btn) => btn.id === 'suspend')?.hidden).toBe(true);
        expect(component.buttons?.find((btn) => btn.id === 'activate')?.enabled).toBe(true);
        expect(component.buttons?.find((btn) => btn.id === 'activate')?.hidden).toBe(false);
        expect(component.buttons?.find((btn) => btn.id === 'delete')?.enabled).toBe(true);
      });
    });

    describe('permissions behavior', () => {
      afterEach(() => mockHasPermissions.mockReset());

      it('hides buttons when the user does not have the required permissions', async () => {
        mockHasPermissions.mockResolvedValue(false);

        component.item = { type: ItemType.ProcessDefinition };
        await vi.runAllTimersAsync();

        expect(component.buttons?.find((btn) => btn.id === 'activate')?.hidden).toBe(true);
        expect(component.buttons?.find((btn) => btn.id === 'suspend')?.hidden).toBe(true);
        expect(component.buttons?.find((btn) => btn.id === 'delete')?.hidden).toBe(true);
        expect(component.buttons?.find((btn) => btn.id === 'download_resource')?.hidden).toBe(true);
        expect(spyGetRequiredPermisssions).toHaveBeenNthCalledWith(
          1,
          ItemType.ProcessDefinition,
          ButtonActions.SUSPEND,
          undefined,
        );
        expect(spyGetRequiredPermisssions).toHaveBeenNthCalledWith(
          2,
          ItemType.ProcessDefinition,
          ButtonActions.DELETE,
          undefined,
        );
        expect(spyGetRequiredPermisssions).toHaveBeenNthCalledWith(
          3,
          ItemType.ProcessDefinition,
          ButtonActions.DOWNLOAD_RESOURCE,
          undefined,
        );

        expect(mockHasPermissions).toHaveBeenNthCalledWith(1, ActionPermissionsSpec.SuspendProcessDefinition);
        expect(mockHasPermissions).toHaveBeenNthCalledWith(2, ActionPermissionsSpec.DeleteProcessDefinition);
        expect(mockHasPermissions).toHaveBeenNthCalledWith(3, ActionPermissionsSpec.DownloadResource);
      });
    });
  });

  describe('when the item type is DecisionDefinition', () => {
    let showSpy: Mock;

    beforeEach(async () => {
      showSpy = vi.spyOn(component, 'show');
      component.item = { type: ItemType.DecisionDefinition };
      await vi.runAllTimersAsync();
    });

    it('should have a diagram toolbar', () => {
      expect(component.diagramToolbar).toBeDefined();
    });

    it('should init buttons', () => {
      expect(component.diagramToolbar?.diagramType).toEqual(ItemType.DecisionDefinition);
      expect(showSpy).toHaveBeenCalledWith([]);
      expect(component.cdr.detectChanges).toHaveBeenCalled();

      expect(component.buttons?.find((btn) => btn.id === 'activate')?.hidden).toBe(true);
      expect(component.buttons?.find((btn) => btn.id === 'suspend')?.hidden).toBe(true);
      expect(component.buttons?.find((btn) => btn.id === 'delete')?.hidden).toBe(true);
      expect(component.buttons?.find((btn) => btn.id === 'retry')?.hidden).toBe(true);
    });
  });

  describe('when the item type is Batch', () => {
    beforeAll(() => {
      mockHasPermissions.mockResolvedValue(true);
    });

    beforeEach(async () => {
      component.item = { type: ItemType.Batch };
      await vi.runAllTimersAsync();
    });

    afterAll(() => {
      mockHasPermissions.mockReset();
    });

    it('should only show and enable the delete button for a completed batch', async () => {
      component.updateButtonStates({ endTime: '2025-08-05 10:33:05' } as Batch);
      await vi.runAllTimersAsync();

      expect(component.buttons?.find((btn) => btn.id === 'activate')?.hidden).toBe(true);
      expect(component.buttons?.find((btn) => btn.id === 'activate')?.enabled).toBe(false);
      expect(component.buttons?.find((btn) => btn.id === 'suspend')?.hidden).toBe(true);
      expect(component.buttons?.find((btn) => btn.id === 'suspend')?.enabled).toBe(false);
      expect(component.buttons?.find((btn) => btn.id === 'retry')?.hidden).toBe(true);
      expect(component.buttons?.find((btn) => btn.id === 'retry')?.enabled).toBe(false);
      expect(component.buttons?.find((btn) => btn.id === 'delete')?.hidden).toBe(false);
      expect(component.buttons?.find((btn) => btn.id === 'delete')?.enabled).toBe(true);
    });

    it('should hide the activate button, and show and enable the suspend and delete buttons when a batch is not suspended', async () => {
      component.item = { type: ItemType.Batch };
      await vi.runAllTimersAsync();

      component.updateButtonStates({ endTime: undefined, suspended: false } as Batch);
      await vi.runAllTimersAsync();

      expect(component.buttons?.find((btn) => btn.id === 'activate')?.enabled).toBe(false);
      expect(component.buttons?.find((btn) => btn.id === 'activate')?.hidden).toBe(true);
      expect(component.buttons?.find((btn) => btn.id === 'suspend')?.enabled).toBe(true);
      expect(component.buttons?.find((btn) => btn.id === 'suspend')?.hidden).toBe(false);
      expect(component.buttons?.find((btn) => btn.id === 'delete')?.enabled).toBe(true);
      expect(component.buttons?.find((btn) => btn.id === 'delete')?.hidden).toBe(false);
    });

    it('should disable the suspend button and enable the activate and delete buttons when a batch is suspended', async () => {
      component.item = { type: ItemType.Batch };
      await vi.runAllTimersAsync();

      component.updateButtonStates({ endTime: undefined, suspended: true } as Batch);
      await vi.runAllTimersAsync();

      expect(component.buttons?.find((btn) => btn.id === 'suspend')?.enabled).toBe(false);
      expect(component.buttons?.find((btn) => btn.id === 'suspend')?.hidden).toBe(true);
      expect(component.buttons?.find((btn) => btn.id === 'activate')?.enabled).toBe(true);
      expect(component.buttons?.find((btn) => btn.id === 'activate')?.hidden).toBe(false);
      expect(component.buttons?.find((btn) => btn.id === 'delete')?.enabled).toBe(true);
      expect(component.buttons?.find((btn) => btn.id === 'delete')?.hidden).toBe(false);
    });

    it('should show suspend, delete, and retry for batch', async () => {
      component.item = { type: ItemType.Batch };

      await vi.runAllTimersAsync();

      expect(component.buttons?.find((btn) => btn.id === 'suspend')?.hidden).toBe(false);
      expect(component.buttons?.find((btn) => btn.id === 'delete')?.hidden).toBe(false);
      expect(component.buttons?.find((btn) => btn.id === 'retry')?.hidden).toBe(false);
    });
  });

  describe('when the item type is Deployment', () => {
    beforeEach(async () => {
      component.item = { type: ItemType.Deployment };
      await vi.runAllTimersAsync();
    });

    it('should show only the download resource and delete buttons', () => {
      const buttonsHidden = actionButtons.filter(
        (actionButtonItem) =>
          actionButtonItem !== ButtonActions.DOWNLOAD_RESOURCE && actionButtonItem !== ButtonActions.DELETE,
      );
      const downloadButton = component.buttons?.find((btn) => btn.id === ButtonActions.DOWNLOAD_RESOURCE);
      const deleteButton = component.buttons?.find((btn) => btn.id === ButtonActions.DELETE);

      component.enable([ButtonActions.DOWNLOAD_RESOURCE, ButtonActions.DELETE]);
      component.show([ButtonActions.DOWNLOAD_RESOURCE, ButtonActions.DELETE]);

      for (const actionButtonItem of buttonsHidden) {
        const buttonHiddenItem = component.buttons?.find((btn) => btn.id === actionButtonItem);
        expect(buttonHiddenItem?.hidden).toBe(true);
        expect(buttonHiddenItem?.enabled).toBe(false);
      }

      expect(downloadButton?.hidden).toBe(false);
      expect(downloadButton?.enabled).toBe(true);
      expect(deleteButton?.hidden).toBe(false);
      expect(deleteButton?.enabled).toBe(true);
    });

    it('should show/hide divider if download resource is shown/hidden', () => {
      component.show([ButtonActions.ACTIVATE, ButtonActions.DOWNLOAD_RESOURCE]);
      expect(component.dividerActive).toBe(true);

      component.hide([ButtonActions.DOWNLOAD_RESOURCE]);
      expect(component.dividerActive).toBe(false);
    });
  });
});
