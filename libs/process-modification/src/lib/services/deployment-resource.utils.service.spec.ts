import { DeploymentResource } from '@fxn/types';
import { firstValueFrom, of } from 'rxjs';
import * as utilsModule from '@fxn/common/src/lib/utils';
import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DeploymentResourceUtilsService } from './deployment-resource-utils.service';

let service: DeploymentResourceUtilsService;
let textEncoder;
let testResourceTextResponse: string;
let resourceResponse: Uint8Array;
let mockHttp: any;

describe('DeploymentResourceUtilsService', () => {
  beforeEach(() => {
    textEncoder = new TextEncoder();
    testResourceTextResponse = 'test response';
    resourceResponse = textEncoder.encode(testResourceTextResponse);
    mockHttp = {
      get: vi.fn(() => resourceResponse),
    } as any;

    TestBed.configureTestingModule({
      providers: [DeploymentResourceUtilsService, { provide: HttpClient, useValue: mockHttp }],
    });

    service = TestBed.inject(DeploymentResourceUtilsService);

    window.URL.createObjectURL = vi.fn(() => '/some-test-url');
    window.URL.revokeObjectURL = vi.fn();

    const originalCreateElement = document.createElement.bind(document);

    document.createElement = vi.fn((tagName: string) => {
      if (tagName === 'a') {
        const element = originalCreateElement(tagName);
        vi.spyOn(element, 'dispatchEvent');
        return element;
      }
      return originalCreateElement(tagName);
    });
  });

  describe('isBPMN', () => {
    it('should return true for valid BPMN file', () => {
      const resource: DeploymentResource = {
        name: 'process.bpmn',
        id: 'test-id',
        deploymentId: 'test-deployment-id',
        data: '',
      };
      expect(service.isBPMN(resource)).toBe(true);
    });

    it('should return false for invalid BPMN file', () => {
      const resource: DeploymentResource = {
        name: 'process.txt',
        id: 'test-id',
        deploymentId: 'test-deployment-id',
        data: '',
      };
      expect(service.isBPMN(resource)).toBe(false);
    });
  });

  describe('isDMN', () => {
    it('should return true for valid DMN file', () => {
      const resource: DeploymentResource = {
        name: 'decision.dmn',
        id: 'test-id',
        deploymentId: 'test-deployment-id',
        data: '',
      };
      expect(service.isDMN(resource)).toBe(true);
    });

    it('should return false for invalid DMN file', () => {
      const resource: DeploymentResource = {
        name: 'decision.txt',
        id: 'test-id',
        deploymentId: 'test-deployment-id',
        data: '',
      };
      expect(service.isDMN(resource)).toBe(false);
    });
  });

  describe('getViewableFileLanguage', () => {
    const testCases = [
      { suffix: '.js', language: 'javascript' },
      { suffix: '.ts', language: 'javascript' },
      { suffix: '.groovy', language: 'java' },
      { suffix: '.xml', language: 'xml' },
      { suffix: '.txt', language: undefined },
    ];

    testCases.forEach(({ suffix, language }) => {
      it(`should return ${language} for a ${suffix} file`, () => {
        const resource: DeploymentResource = {
          name: `script${suffix}`,
          id: 'test-id',
          deploymentId: 'test-deployment-id',
          data: '',
        };
        expect(service.getViewableFileLanguage(resource)).toBe(language);
      });
    });
  });

  describe('isViewableResource', () => {
    it('should return true for viewable resource', () => {
      const resource: DeploymentResource = {
        name: 'script.groovy',
        id: 'test-id',
        deploymentId: 'test-deployment-id',
        data: '',
      };
      expect(!!service.getViewableFileLanguage(resource)).toBe(true);
    });

    it('should return false for un-viewable resource', () => {
      const resource: DeploymentResource = {
        name: 'script.txt',
        id: 'test-id',
        deploymentId: 'test-deployment-id',
        data: '',
      };
      expect(!!service.getViewableFileLanguage(resource)).toBe(false);
    });
  });

  describe('getSuffix', () => {
    it('should return the correct suffix', () => {
      const resource: DeploymentResource = {
        name: 'script.ts',
        id: 'test-id',
        deploymentId: 'test-deployment-id',
        data: '',
      };
      expect(service.getSuffix(resource)).toBe('.ts');
    });

    it('should return an empty string for undefined resource', () => {
      expect(service.getSuffix(undefined)).toBe('');
    });
  });

  describe('using resource buffers for resource', () => {
    const defaultResource: DeploymentResource = {
      deploymentId: '123',
      id: '234',
      name: 'testResource.js',
    };

    it('should make an http get request when getResourceDataBuffer is called', () => {
      service.getResourceDataBuffer(defaultResource);

      expect(mockHttp.get).toHaveBeenCalledWith(
        `api/deployment/${defaultResource.deploymentId}/resource/${defaultResource.id}/data`,
        { responseType: 'arraybuffer' },
      );
    });

    it('should return decoded resourceData when getResourceData is called', async () => {
      const spyOn = vi.spyOn(service, 'getResourceDataBuffer');

      spyOn.mockImplementation(() => of(resourceResponse));

      const response = await firstValueFrom(service.getResourceData(defaultResource));
      expect(response.data).toEqual(testResourceTextResponse);
    });

    it('should make an http get request when getDiagramDataBuffer is called', () => {
      service.getDiagramDataBuffer('defId');

      expect(mockHttp.get).toHaveBeenCalledWith(`api/process-definitions/defId/diagram/xml`, {
        responseType: 'arraybuffer',
      });
    });
  });

  describe('downloadResource', () => {
    const resource: DeploymentResource = {
      data: 'test data',
      deploymentId: 'test-deployment-id',
      id: 'test-id',
      name: 'test-resource-name.bpmn',
    };
    const mockDownloadDataBuffer = vi.spyOn(utilsModule, 'downloadDataBuffer').mockImplementation(() => ({}));

    beforeEach(() => {
      vi.spyOn(service, 'getResourceDataBuffer').mockImplementation(() => of([]));
      vi.spyOn(service, 'getDiagramDataBuffer').mockImplementation(() => of([]));
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it('should download deployment resource', () => {
      service.downloadDeploymentResource(resource);

      expect(mockDownloadDataBuffer).toHaveBeenCalledWith([], 'test-resource-name.bpmn');
    });

    it('should download diagram resource', () => {
      service.downloadDiagramResource('defId', 'defKey');

      expect(mockDownloadDataBuffer).toHaveBeenCalledWith([], 'defkey.bpmn');
    });
  });
});
