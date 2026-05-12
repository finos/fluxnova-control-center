import { TabsViewNameFormatterPipe } from './tabs-view-name-formatter.pipe';

describe('TabsViewNameFormatterPipe', () => {
  let pipe: TabsViewNameFormatterPipe;

  beforeEach(() => {
    pipe = new TabsViewNameFormatterPipe();
  });

  it('should replace dashes with spaces', () => {
    expect(pipe.transform('test-string-with-dashes', false, undefined)).toBe('test string with dashes');
  });

  it('should transform to title case if enforceCapitalCase is true', () => {
    expect(pipe.transform('test string with dashes', true, undefined)).toBe('Test String With Dashes');
  });

  it('should not transform to title case if enforceCapitalCase is false', () => {
    expect(pipe.transform('test string with dashes', false, undefined)).toBe('test string with dashes');
  });

  it('should append count if countInstances is provided', () => {
    expect(pipe.transform('test string with dashes', false, 5)).toBe('test string with dashes (5)');
  });

  it('should append 999 if countInstances is 1 less than 1000', () => {
    expect(pipe.transform('test string with dashes', false, 999)).toBe('test string with dashes (999)');
  });

  it('should append 1000+ if countInstances is 1000', () => {
    expect(pipe.transform('test string with dashes', false, 1000)).toBe('test string with dashes (1000+)');
  });

  it('should append 1000+ if countInstances is greater than 1000 ', () => {
    expect(pipe.transform('test string with dashes', false, 1001)).toBe('test string with dashes (1000+)');
  });

  it('should handle all transformations together', () => {
    expect(pipe.transform('test-string-with-dashes', true, 5)).toBe('Test String With Dashes (5)');
  });
});
