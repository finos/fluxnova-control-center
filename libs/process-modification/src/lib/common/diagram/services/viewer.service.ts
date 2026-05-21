import { Injectable } from '@angular/core';
import NavigatedViewer from 'bpmn-js/lib/NavigatedViewer';
import DmnJSNavigatedViewer from 'dmn-js/lib/NavigatedViewer';
import OutlineModule from 'bpmn-js/lib/features/outline';
import { ColorRenderer } from '../extensions/color-renderer';

@Injectable({ providedIn: 'root' })
export class ViewerService {
  public getNavigatedViewer(canvasNE: any | undefined) {
    return new NavigatedViewer({
      container: canvasNE || '#canvas',
      additionalModules: [
        {
          __init__: ['colorRenderer'],
          colorRenderer: ['type', ColorRenderer],
        },
        OutlineModule as any,
      ],
    });
  }

  public getDMNJSViewer(canvasNE: any | undefined) {
    return new DmnJSNavigatedViewer({
      container: canvasNE,
      overflow: 'scroll',
    });
  }
}
