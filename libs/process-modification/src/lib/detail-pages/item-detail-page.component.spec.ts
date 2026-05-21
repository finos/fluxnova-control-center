import { lastValueFrom, of } from 'rxjs';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { LetDirective } from '@ngrx/component';
import { BrowserModule } from '@angular/platform-browser';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { SplitGutterInteractionEvent } from 'angular-split';
import { beforeEach, describe, expect, it, Mocked, vi } from 'vitest';
import { ConfirmActionService } from '../services/confirm-action.service';
import { ItemDetailPageCommunicationService } from './item-detail-page.communication.service';
import { ItemDetailPageComponent } from './item-detail-page.component';
import { PimTab } from './item-detail-tab-utils';

const itemId = 'itemId123';
describe('ItemDetailPageComponent', () => {
  let component: ItemDetailPageComponent;
  let fixture: ComponentFixture<ItemDetailPageComponent>;
  const mockRoute = {
    snapshot: {
      data: {
        itemType: 'ProcessDefinition',
        itemTypeListName: 'Mock List Name',
        itemTypeName: 'Mock Type Name',
        itemTypeClass: 'mock-type-class',
      },
      params: { id: itemId },
      queryParams: { tab: 'job-definitions' },
    },
    params: of({ id: itemId }),
    queryParams: of({ tab: 'job-definitions' }),
  };
  const mockRouter: Mocked<Router> = {
    navigate: vi.fn(),
  } as unknown as Mocked<Router>;

  beforeEach(() => {
    mockRoute.snapshot.data.itemType = 'ProcessDefinition';
    TestBed.configureTestingModule({
      imports: [LetDirective, BrowserModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        { provide: ActivatedRoute, useValue: mockRoute },
        { provide: Router, useValue: mockRouter },
        { provide: ItemDetailPageCommunicationService },
        { provide: ConfirmActionService, useValue: {} },
      ],
      declarations: [ItemDetailPageComponent],
    });
    fixture = TestBed.createComponent(ItemDetailPageComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set initial values and tabs layout from route for definitions', async () => {
    await expect(lastValueFrom(component.itemId$)).resolves.toEqual(itemId);
    expect(component.routeData).toEqual(mockRoute.snapshot.data);
    await expect(lastValueFrom(component.queryParams$)).resolves.toEqual(mockRoute.snapshot.queryParams);
    component.setInitialActiveTab([PimTab.Instances, PimTab.Incidents, PimTab.JobDefinitions]);
    expect(component.activeTab).toEqual(PimTab.JobDefinitions);
  });

  it('should set initial values and tabs layout from route for a finished instance', async () => {
    mockRoute.snapshot.data.itemType = 'ProcessInstance';
    fixture = TestBed.createComponent(ItemDetailPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    expect(component.routeData.itemType).toEqual('ProcessInstance');
    component.setInitialActiveTab([PimTab.Incidents, PimTab.History]);
    expect(component.activeTab).toEqual(PimTab.Incidents);
  });

  it('should navigate on active tabs change', () => {
    component.activeTabsChanged('newactivetab');

    fixture.detectChanges();

    expect(mockRouter.navigate).toHaveBeenCalledWith([], {
      replaceUrl: true,
      queryParamsHandling: 'replace',
      queryParams: { tab: 'newactivetab' },
    });
  });

  it('should not call getInitialTabCount if there was no old tab (i.e., on first load)', () => {
    const getInitialTabCountSpy = vi.spyOn(component, 'getInitialTabCount');
    component.activeTab = '';

    component.activeTabsChanged(PimTab.Instances);

    expect(getInitialTabCountSpy).not.toHaveBeenCalled();
  });

  it('should call getInitialTabCount if there was an old tab', () => {
    const getInitialTabCountSpy = vi.spyOn(component, 'getInitialTabCount').mockReturnValue(of(5));

    // Set an initial active tab
    component.activeTab = PimTab.Instances;

    component.activeTabsChanged(PimTab.Incidents);

    expect(getInitialTabCountSpy).toHaveBeenCalledWith(PimTab.Instances);
    expect(getInitialTabCountSpy).toHaveBeenCalledTimes(1);
  });

  it('should update counts when getInitialTabCount returns a count', () => {
    const mockCount = 10;
    vi.spyOn(component, 'getInitialTabCount').mockReturnValue(of(mockCount));

    // Set an initial active tab
    component.activeTab = PimTab.Instances;
    component.counts = {};

    component.activeTabsChanged(PimTab.Incidents);

    expect(component.counts[PimTab.Instances]).toBe(mockCount);
  });

  it('should not update counts when getInitialTabCount returns undefined', () => {
    vi.spyOn(component, 'getInitialTabCount').mockReturnValue(of(undefined));

    // Set an initial active tab
    component.activeTab = PimTab.Instances;
    component.counts = {};

    component.activeTabsChanged(PimTab.Incidents);

    expect(component.counts[PimTab.Instances]).toBeUndefined();
  });

  it('get itemId should return the id in the route', () => {
    expect(component.itemId).toBe(itemId);
  });

  it('should create panel state', () => {
    expect(component.infoPanelState.getSize()).toEqual(component.initialPanelSize.leftPaneWidth);
    expect(component.infoPanelState.getVisibility()).toEqual(true);
  });

  it('should modify panel state', () => {
    expect(component.infoPanelState.getSize()).toEqual(component.initialPanelSize.leftPaneWidth);
    expect(component.infoPanelState.getVisibility()).toEqual(true);

    component.infoPanelState.setSize(5);
    component.infoPanelState.setVisibility(false);

    expect(component.infoPanelState.getSize()).toEqual(5);
    expect(component.infoPanelState.getVisibility()).toEqual(false);

    component.infoPanelState.toggleVisibility();

    expect(component.infoPanelState.getVisibility()).toEqual(true);
  });

  it('should expand or collapse panel correctly', () => {
    const infoToggleVisibilitySpy = vi.spyOn(component.infoPanelState, 'toggleVisibility');
    const tabToggleVisibilitySpy = vi.spyOn(component.tabPanelState, 'toggleVisibility');
    const setSizeSpy = vi.spyOn(component.diagramPanelState, 'setSize');

    component.expandOrCollapsePanel(component.infoPanelState);

    expect(infoToggleVisibilitySpy).toHaveBeenCalledTimes(1);
    expect(setSizeSpy).not.toHaveBeenCalled();

    component.expandOrCollapsePanel(component.tabPanelState);

    expect(tabToggleVisibilitySpy).toHaveBeenCalledTimes(1);
    expect(setSizeSpy).toHaveBeenCalledWith(100 - component.tabPanelState.getSize());
  });

  it('should handle panel drag end where panel is open', () => {
    const event = {
      gutterNum: 0,
      sizes: [250, '*'],
    } as SplitGutterInteractionEvent;
    const setSizeSpy = vi.spyOn(component.infoPanelState, 'setSize');
    const setVisibilitySpy = vi.spyOn(component.infoPanelState, 'setVisibility');

    component.handlePanelDragEnd(component.infoPanelState, event, 0);

    expect(setSizeSpy).toHaveBeenCalledWith(event.sizes[0]);
    expect(setVisibilitySpy).toHaveBeenCalledWith(true);
  });

  it('should handle panel drag end where panel is closed', () => {
    const event = {
      gutterNum: 0,
      sizes: [0, '*'],
    } as SplitGutterInteractionEvent;
    const setSizeSpy = vi.spyOn(component.infoPanelState, 'setSize');
    const setVisibilitySpy = vi.spyOn(component.infoPanelState, 'setVisibility');

    component.handlePanelDragEnd(component.infoPanelState, event, 0);

    expect(setSizeSpy).not.toHaveBeenCalled();
    expect(setVisibilitySpy).toHaveBeenCalledWith(false);
  });

  it('should go full screen if panels are open when toggleDiagramFullscreen', () => {
    expect(component.infoPanelState.getVisibility()).toEqual(true);
    expect(component.tabPanelState.getVisibility()).toEqual(true);

    component.toggleDiagramFullscreen();

    expect(component.infoPanelState.getVisibility()).toEqual(false);
    expect(component.tabPanelState.getVisibility()).toEqual(false);
  });

  it('should open panels if closed when toggleDiagramFullscreen', () => {
    component.toggleDiagramFullscreen();

    expect(component.infoPanelState.getVisibility()).toEqual(false);
    expect(component.tabPanelState.getVisibility()).toEqual(false);

    component.toggleDiagramFullscreen();

    expect(component.infoPanelState.getVisibility()).toEqual(true);
    expect(component.tabPanelState.getVisibility()).toEqual(true);
  });
});
