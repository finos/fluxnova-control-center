import 'zone.js';
import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import '@angular/localize/init';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';
import { afterEach } from 'vitest';

if (typeof window.DragEvent === 'undefined') {
  Object.defineProperty(window, 'DragEvent', {
    value: class DragEvent {},
  });
}

getTestBed().resetTestEnvironment();
getTestBed().initTestEnvironment(BrowserTestingModule, platformBrowserTesting(), {
  teardown: { destroyAfterEach: false },
});

afterEach(() => {
  getTestBed().resetTestingModule();
});
