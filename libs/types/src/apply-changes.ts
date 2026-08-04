export interface ApplyChangesModalOptions {
  willTerminate: boolean;
}

export interface ApplyChangesModalResults {
  confirmed: boolean;
  clearChanges: boolean;
  skipCustomListeners?: boolean;
  skipIoMappings?: boolean;
  annotation?: string;
}
