import { describe, it, expect, beforeEach } from 'vitest';
import { EventStore } from '../../../src/services/telemetry/event-store.js';

describe('EventStore', () => {
  let store: EventStore;

  beforeEach(() => {
    store = new EventStore();
  });

  it('should add events', () => {
    store.addEvent('sprite-1', 'user_prompt', { text: 'Hello' });
    const events = store.getEvents('sprite-1');
    expect(events.length).toBe(1);
    expect(events[0].eventType).toBe('user_prompt');
    expect(events[0].attributes.text).toBe('Hello');
  });

  it('should filter events by type', () => {
    store.addEvent('sprite-1', 'user_prompt', {});
    store.addEvent('sprite-1', 'api_request', {});

    const events = store.getEvents('sprite-1', 100, ['api_request']);
    expect(events.length).toBe(1);
    expect(events[0].eventType).toBe('api_request');
  });

  it('should enforce max events limit', () => {
    // Add 510 events
    for (let i = 0; i < 510; i++) {
      store.addEvent('sprite-1', 'user_prompt', { i });
    }

    const events = store.getEvents('sprite-1', 1000);
    expect(events.length).toBe(500);
    // Should be the last 500, so first element i=10
    expect(events[0].attributes.i).toBe(10);
  });

  it('should aggregate API stats', () => {
    store.addEvent('sprite-1', 'api_request', { durationMs: 100 });
    store.addEvent('sprite-1', 'api_request', { durationMs: 200 });
    store.addEvent('sprite-1', 'api_error', { error: '500' });

    const stats = store.getApiStats('sprite-1');
    expect(stats.totalRequests).toBe(2);
    expect(stats.errors).toBe(1);
    expect(stats.totalDurationMs).toBe(300);
  });

  it('should aggregate Tool stats', () => {
    store.addEvent('sprite-1', 'tool_decision', { toolName: 'read_file' });
    store.addEvent('sprite-1', 'tool_result', { toolName: 'read_file' });
    store.addEvent('sprite-1', 'tool_decision', { toolName: 'write_file' });
    store.addEvent('sprite-1', 'tool_decision', { toolName: 'read_file' });

    const stats = store.getToolStats('sprite-1');
    expect(stats['read_file'].uses).toBe(2);
    expect(stats['write_file'].uses).toBe(1);
  });
});
