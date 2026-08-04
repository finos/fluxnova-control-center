import { beforeAll, describe, expect, it } from 'vitest';
import { BatchProgressRendererComponent } from './batch-progress-renderer.component';

describe('batch-progress-renderer.component', () => {
  let component: BatchProgressRendererComponent;
  beforeAll(() => {
    component = new BatchProgressRendererComponent();
  });

  it('sets progress bar label correctly', () => {
    component.agInit({ data: { completedJobs: 3, totalJobs: 4 } } as any);
    expect(component.getPercentage()).toEqual('75%');
    component.refresh({ data: { completedJobs: 1, totalJobs: 3 } } as any);
    expect(component.getPercentage()).toEqual('33%');
    component.refresh({ data: { completedJobs: 2, totalJobs: 3 } } as any);
    expect(component.getPercentage()).toEqual('67%');
  });
  it('sets the tooltip correctly', () => {
    component.agInit({ data: { completedJobs: 1, totalJobs: 3 } } as any);
    expect(component.getRatio()).toEqual('1 / 3');
  });
});
