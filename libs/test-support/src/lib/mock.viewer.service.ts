import { vi } from 'vitest';

const mockOverlays = { add: vi.fn(), remove: vi.fn() };
const mockCanvas = { zoom: vi.fn(), addMarker: vi.fn(), removeMarker: vi.fn() };
const mockSelection = { select: vi.fn(), deselect: vi.fn() };
const mockEventBus = { on: vi.fn(), fire: vi.fn() };
const mockActivity = {
  width: 40,
};
const mockRegistry = { get: vi.fn().mockReturnValue(mockActivity), getAll: vi.fn().mockReturnValue([]) };

export const mockNavigatedViewerGet = vi.fn((item: string) => {
  if (item === 'overlays') return mockOverlays;
  if (item === 'canvas') return mockCanvas;
  if (item === 'selection') return mockSelection;
  if (item === 'eventBus') return mockEventBus;
  if (item === 'colorRenderer') return { setColors: vi.fn() };
  if (item === 'elementRegistry') return mockRegistry;
  return {};
});

export const MockViewerService = {
  getNavigatedViewer: vi.fn().mockReturnValue({
    importXML: (diagram: string) => (diagram === 'asdf' ? 'Invalid XML' : undefined),
    get: mockNavigatedViewerGet,
    emit: vi.fn(),
    destroy: vi.fn(),
  }),
  getMockCanvas: () => mockCanvas,
  getMockEventBus: () => mockEventBus,
  getMockOverlays: () => mockOverlays,
};
