import { describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { UriUtilsService } from './uri-utils.service';

describe('UriUtilsService', () => {
  it('should be created', () => {
    TestBed.configureTestingModule({});
    const service: UriUtilsService = TestBed.inject(UriUtilsService);
    expect(service).toBeTruthy();
  });

  it('should have getBaseHref return /', async () => {
    @Component({
      template: ` <base href="/" /> `,
    })
    class TestComponent {}

    const testBed = TestBed.configureTestingModule({});

    const service = testBed.inject(UriUtilsService);

    testBed.createComponent(TestComponent);

    const baseHref = service.getBaseHref();

    expect(baseHref).toBe('/');
  });

  it('should have getBaseHref return /path-prefix/', async () => {
    @Component({
      template: ` <base href="/path-prefix/" /> `,
    })
    class TestComponent {}

    const testBed = TestBed.configureTestingModule({});

    const service = testBed.inject(UriUtilsService);

    testBed.createComponent(TestComponent);

    const baseHref = service.getBaseHref();

    expect(baseHref).toBe('/path-prefix/');
  });
});
