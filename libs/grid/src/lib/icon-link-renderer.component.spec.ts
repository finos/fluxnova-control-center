import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ICellRendererParams } from 'ag-grid-community';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RouterModule } from '@angular/router';
import { IconLinkRendererComponent } from './icon-link-renderer.component';

vi.mock('@fxn/common');
describe('Icon Link Renderer Component', () => {
  let component: IconLinkRendererComponent;
  let fixture: ComponentFixture<IconLinkRendererComponent>;

  const mockParams = {
    colDef: {
      cellRendererParams: {
        iconName: 'mock-icon',
        tooltipText: 'tooltip text',
        iconQueryParams: {
          param: 'queryParam',
        },
        iconIsInternalLink: true,
      },
    },
  } as unknown as ICellRendererParams;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [IconLinkRendererComponent],
      imports: [RouterModule.forRoot([])],
    });

    fixture = TestBed.createComponent(IconLinkRendererComponent);
    component = fixture.componentInstance;
    component.agInit(mockParams);
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('iconIsInternalPath should be set correctly', () => {
    expect(component.iconIsInternalPath).toBe(true);
  });

  it('tooltipText should be set correctly', () => {
    expect(component.tooltipText).toBe('tooltip text');
  });

  it('iconQueryParams should be set correctly', () => {
    expect(component.iconQueryParams).toStrictEqual({
      param: 'queryParam',
    });
  });

  it('iconName should be set correctly', () => {
    expect(component.iconName).toBe('mock-icon');
  });

  it('should get correct iconHref', () => {
    component.agInit({
      ...mockParams,
      colDef: {
        cellRendererParams: {
          iconPathParts: ['../../process-instances', ':id'],
        },
      },
      data: {
        id: 'test_process_instance_id',
      },
    });
    expect(component.iconHref).toBe('../../process-instances/test_process_instance_id/');
  });
});
