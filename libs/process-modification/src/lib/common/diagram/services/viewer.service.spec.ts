import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ViewerService } from './viewer.service';

describe('Viewer Service', () => {
  const service = new ViewerService();

  beforeEach(() => {
    document.body.innerHTML = '<div id="canvas"></div>';
    vi.clearAllMocks();
  });

  it('should return a viewer when getNavigatedViewer is called', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const viewer = service.getNavigatedViewer(container);

    expect(viewer).toBeTruthy();
    expect(container.querySelector('.bjs-container')).toBeTruthy();
  });
});
