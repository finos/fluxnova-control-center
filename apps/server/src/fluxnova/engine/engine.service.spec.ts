import globalAxios from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EngineService } from './engine.service';

let service: EngineService;

beforeEach(() => {
  service = new EngineService();
});

describe('Engine Service', () => {
  it('appends query parameters to the URL if options contain a URL', async () => {
    const mockResponse = { data: ['engine1', 'engine2'] };
    vi.spyOn(globalAxios, 'request').mockResolvedValue(mockResponse);

    const result = await service.getProcessEngines({ url: '?filter=active' });

    expect(result.data).toEqual(['engine1', 'engine2']);
    expect(globalAxios.request).toHaveBeenCalledWith(
      expect.objectContaining({ url: expect.stringContaining('?filter=active') }),
    );
  });

  it('throws an error if the API call fails', async () => {
    vi.spyOn(globalAxios, 'request').mockRejectedValue(new Error('API error'));

    await expect(service.getProcessEngines()).rejects.toThrow('API error');
  });
});
