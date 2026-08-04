import { timeDiffMs } from './time-diff';

describe('time-diff-ms', () => {
  it('should return the time diff in ms', () => {
    expect(timeDiffMs('2021-04-12T18:00:00.000Z', '2021-04-12T18:00:10.000Z')).toEqual(10000);
  });
});
