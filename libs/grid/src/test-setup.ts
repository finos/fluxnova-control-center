import 'zone.js';
import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import '@angular/localize/init';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';

// Polyfill provided by https://github.com/nrwl/nx/issues/1178#issuecomment-498924910
Object.defineProperty(window, 'DragEvent', {
  value: class DragEvent {},
});

getTestBed().resetTestEnvironment();
getTestBed().initTestEnvironment(BrowserTestingModule, platformBrowserTesting(), {
  teardown: { destroyAfterEach: false },
});
