import { describe, expect, it } from 'vitest';
import { ProcessDefinitionFilter } from './process-definition';

describe('ProcessDefinitionFilter', () => {
  it('should create a single key with multiple values when converting an array into a query string', () => {
    const ids = ['001aa23f-d22d-11ed-827e-026e0c7bf9dd', '00223e57-b828-11ed-a215-0a49376ac6d1'];
    const filter = <ProcessDefinitionFilter>{
      processDefinitionIdIn: ids,
    };
    const result: URLSearchParams = ProcessDefinitionFilter.toUrlSearchParams(filter);

    expect(result.get('processDefinitionIdIn')).toEqual(ids.join(','));
  });

  it('should create a key value pair from a single value filter', () => {
    const name = 'someName';
    const filter = <ProcessDefinitionFilter>{
      name,
    };
    const result: URLSearchParams = ProcessDefinitionFilter.toUrlSearchParams(filter);

    expect(result.get('name')).toEqual('someName');
  });
});
