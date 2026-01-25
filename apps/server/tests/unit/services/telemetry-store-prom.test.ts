import { describe, it, expect } from 'vitest';
import { TelemetryStore } from '../../../src/services/telemetry-store.js';

describe('TelemetryStore (Prometheus)', () => {
  it('should be a singleton', () => {
    const instance1 = TelemetryStore.getInstance();
    const instance2 = TelemetryStore.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should export metrics in Prometheus format', async () => {
    const store = TelemetryStore.getInstance();

    // Record some metrics
    store.recordCounter('sprites.created');
    store.recordGauge('sandboxes.active', 5);
    store.recordHistogram('sprites.checkpoint.duration', 1500); // 1.5s

    const metrics = await store.getMetrics();

    expect(metrics).toContain('automaker_sandboxes_total 1');
    expect(metrics).toContain('automaker_sandboxes_active 5');
    expect(metrics).toContain('automaker_checkpoint_duration_seconds_bucket');
    expect(metrics).toContain('automaker_checkpoint_duration_seconds_sum 1.5');
  });
});
