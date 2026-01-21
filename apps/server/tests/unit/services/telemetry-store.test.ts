import { describe, it, expect, beforeEach } from 'vitest';
import { TelemetryStore } from '../../../src/services/telemetry/telemetry-store.js';

describe('TelemetryStore', () => {
  let store: TelemetryStore;

  beforeEach(() => {
    store = new TelemetryStore();
  });

  it('should initialize with default state', () => {
    const telemetry = store.get('test-sprite');
    expect(telemetry.spriteName).toBe('test-sprite');
    expect(telemetry.inputTokens).toBe(0);
    expect(telemetry.status).toBe('active');
  });

  it('should handle token usage metrics', () => {
    store.handleMetric('sprite-1', 'claude_code.token.usage', 100, { type: 'input' });
    store.handleMetric('sprite-1', 'claude_code.token.usage', 50, { type: 'output' });
    store.handleMetric('sprite-1', 'claude_code.token.usage', 20, { type: 'cacheread' });
    store.handleMetric('sprite-1', 'claude_code.token.usage', 10, { type: 'cachecreation' });

    const data = store.get('sprite-1');
    expect(data.inputTokens).toBe(100);
    expect(data.outputTokens).toBe(50);
    expect(data.cacheReadTokens).toBe(20);
    expect(data.cacheCreationTokens).toBe(10);
  });

  it('should handle cost metrics', () => {
    store.handleMetric('sprite-1', 'claude_code.cost.usage', 0.5);
    store.handleMetric('sprite-1', 'claude_code.cost.usage', 0.2);

    expect(store.get('sprite-1').costUsd).toBe(0.7);
  });

  it('should handle count metrics', () => {
    store.handleMetric('sprite-1', 'claude_code.session.count', 1);
    store.handleMetric('sprite-1', 'claude_code.commit.count', 2);
    store.handleMetric('sprite-1', 'claude_code.pull_request.count', 3);

    const data = store.get('sprite-1');
    expect(data.sessions).toBe(1);
    expect(data.commits).toBe(2);
    expect(data.pullRequests).toBe(3);
  });

  it('should handle lines of code metrics', () => {
    store.handleMetric('sprite-1', 'claude_code.lines_of_code.count', 50, { type: 'added' });
    store.handleMetric('sprite-1', 'claude_code.lines_of_code.count', 20, { type: 'removed' });

    const data = store.get('sprite-1');
    expect(data.linesAdded).toBe(50);
    expect(data.linesRemoved).toBe(20);
  });

  it('should emit update events', () => {
    let lastUpdate: any = null;
    store.on('update', (data) => {
      lastUpdate = data;
    });

    store.handleMetric('sprite-event', 'claude_code.cost.usage', 1);
    expect(lastUpdate).toBeDefined();
    expect(lastUpdate.spriteName).toBe('sprite-event');
    expect(lastUpdate.costUsd).toBe(1);
  });
});
