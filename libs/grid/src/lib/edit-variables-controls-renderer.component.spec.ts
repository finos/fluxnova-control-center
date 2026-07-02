import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ICellRendererParams, IRowNode } from 'ag-grid-community';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EditVariablesControlsRendererComponent } from './edit-variables-controls-renderer.component';

describe('EditVariablesControlsRendererComponent', () => {
  let component: EditVariablesControlsRendererComponent;
  let fixture: ComponentFixture<EditVariablesControlsRendererComponent>;

  function initializeComponent(params: Partial<ICellRendererParams>) {
    component.agInit(params as ICellRendererParams);
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({});
    fixture = TestBed.createComponent(EditVariablesControlsRendererComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  const cellRendererParams = {
    data: {
      processDefinitionId: 'test-process-definition-id',
      processInstanceId: 'test-process-instance-id',
    },
  };

  describe('agInit', () => {
    it('should set params', () => {
      const params: Partial<ICellRendererParams> = {
        ...cellRendererParams,
      };

      initializeComponent(params);

      expect(component.params).toBe(params);
    });
  });

  describe('deleteButtonClicked', () => {
    it('should call deleteClicked on componentParent with correct arguments', () => {
      const params: Partial<ICellRendererParams> = {
        ...cellRendererParams,
        node: {
          rowIndex: 1,
          data: {},
        } as IRowNode,
        context: {
          componentParent: {
            deleteClicked: vi.fn(),
          },
        },
      };

      initializeComponent(params);
      component.deleteButtonClicked();

      expect(params.context?.componentParent.deleteClicked).toHaveBeenCalledWith(
        params.node?.rowIndex,
        params.node?.data,
      );
    });
  });

  describe('editButtonClicked', () => {
    it('should call editClicked on componentParent with correct arguments', () => {
      const params: Partial<ICellRendererParams> = {
        ...cellRendererParams,
        node: {
          rowIndex: 1,
        } as IRowNode,
        context: {
          componentParent: {
            editClicked: vi.fn(),
          },
        },
      };

      initializeComponent(params);
      component.editButtonClicked();

      expect(params.context?.componentParent.editClicked).toHaveBeenCalledWith(params.node?.rowIndex);
    });
  });

  describe('showEditButton', () => {
    it('should return the value returned by showEdit on cellRendererParams', () => {
      const showEditMock = vi.fn().mockReturnValue('test-return-value');
      const params: Partial<ICellRendererParams> = {
        ...cellRendererParams,
        colDef: {
          cellRendererParams: {
            showEdit: showEditMock,
          },
        },
      };

      initializeComponent(params);
      const showEdit = component.showEditButton();

      expect(showEdit).toBe('test-return-value');
      expect(showEditMock).toHaveBeenCalledWith(params);
    });
  });

  describe('refresh', () => {
    it('should return false', () => {
      const result = component.refresh();

      expect(result).toBe(false);
    });
  });
});
