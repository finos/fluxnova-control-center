import 'zone.js';
import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import '@angular/localize/init';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';

// Polyfill provided by https://github.com/nrwl/nx/issues/1178#issuecomment-498924910
if (!('DragEvent' in window)) {
  Object.defineProperty(window, 'DragEvent', {
    configurable: true,
    writable: true,
    value: class DragEvent extends Event {},
  });
}

getTestBed().resetTestEnvironment();
getTestBed().initTestEnvironment(BrowserTestingModule, platformBrowserTesting(), {
  teardown: { destroyAfterEach: false },
});
