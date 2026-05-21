import { beforeEach, describe, expect, it, vi } from 'vitest';
import NavigatedViewer from 'bpmn-js/lib/NavigatedViewer';
import OutlineModule from 'bpmn-js/lib/features/outline';
import { ColorRenderer } from '../extensions/color-renderer';
import { ViewerService } from './viewer.service';

vi.mock('bpmn-js/lib/NavigatedViewer');
const mockedNavigatedViewer = vi.mocked(NavigatedViewer);

describe('Viewer Service', () => {
  const service = new ViewerService();

  beforeEach(vi.clearAllMocks);

  it('should return a viewer when getNavigatedViewer is called', () => {
    const navigatedViewerInstance = {};
    mockedNavigatedViewer.mockImplementation(function () {
      return navigatedViewerInstance;
    });

    const viewer = service.getNavigatedViewer(undefined);

    expect(viewer).toBe(navigatedViewerInstance);
    expect(mockedNavigatedViewer).toHaveBeenCalledWith({
      container: '#canvas',
      additionalModules: expect.arrayContaining([
        expect.objectContaining({ __init__: ['colorRenderer'], colorRenderer: ['type', ColorRenderer] }),
        OutlineModule,
      ]),
    });
  });
});
