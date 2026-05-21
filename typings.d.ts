declare module 'inherits' {
  function inherits(ctor?: any, ctorSuper?: any): void;

  namespace inherits {}
  export = inherits;
}

declare interface FluxnovaConfig {
  authRequired: boolean;
  env?: string;
  isRunningLocally: boolean;
  version?: string;
  redirectTimeout?: number;
  fxnPublicUrl?: string;
  otel?: OTELConfig;
}

declare interface OTELConfig {
  attributes: { [key: string]: string };
  debug: boolean;
  enabled: boolean;
  serviceName: string;
}

declare interface Window {
  AppReady?: boolean;
  webpackManifest: { [bundle: string]: string };
  fluxnovaVersion: string;
  fluxnovaConfig: FluxnovaConfig;
  fluxnovaIntegration?: {
    execute: (connector: string, payload: any) => Promise<any>;
  };
  ng: {
    getComponent: (element: any) => any;
  };
}

declare module '*.png' {
  const value: string;
  export default value;
}

declare module '*.svg' {
  const value: string;
  export default value;
}

declare module '*.jpg' {
  const value: string;
  export default value;
}

declare module '*.gif' {
  const value: string;
  export default value;
}

declare module 'mochawesome/addContext' {
  export default function addContext(test: any, context: any): void;
}

declare module '@bpmn-io/dmn-migrate' {
  export function migrateDiagram(xml: string): Promise<string>;
}

declare module 'dmn-js/lib/NavigatedViewer' {
  export default class DmnJS {
    constructor(options: any) {}
    /**
     * Retrieves the currently active viewer instance (DRD viewer, Decision Table viewer, Literal Expression viewer).
     *
     * This is an object that can render the diagram and provides APIs like "get" to access services (canvas, eventBus, zoomScroll).
     *
     * Useful when you want to interact with the currently displayed diagram's services or manipulate the view.
     * @returns Viewer
     */
    getActiveViewer(): any {}
    /**
     * Retrieves metadata about the currently active view, such as its type and element.
     *
     * This is not the viewer, but rather a descriptor of what is currently being shown.
     *
     * @returns View
     */
    getActiveView(): any {}
    getViews(): any[] {}
    importXML(xml: string): Promise<void> {}
    open(view: any) {}
    detach() {}
    destroy() {}
  }
}

declare module 'visual-heatmap' {
  interface HeatmapOptions {
    size: number;
    opacity: number;
    intensity: number;
    min?: number;
    max?: number;
    gradient: { color: number[]; offset: number }[];
  }

  interface HeatmapData {
    averageDuration: { [activityId: string]: number };
    count: { [activityId: string]: number };
  }

  interface HeatmapParams {
    active: boolean;
    viewBy?: string;
    timeline?: string;
  }

  export default class Heatmap {
    constructor(container: string, options: HeatmapOptions);
    renderData(data: { x: number; y: number; value: number; radius: number }[]): void;
    render(): void;
    resize(): void;
    setMax(max: number): Heatmap;
    setMin(min: number): Heatmap;
    setTranslate(translation: [number, number]): Heatmap;
    setZoom(zoom: number): Heatmap;
    setSize(size: number): Heatmap;
  }
}
