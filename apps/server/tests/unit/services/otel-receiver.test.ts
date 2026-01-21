import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { OtelReceiver } from '../../../src/services/telemetry/otel-receiver.js';
import { TelemetryStore } from '../../../src/services/telemetry/telemetry-store.js';
import { EventStore } from '../../../src/services/telemetry/event-store.js';

describe('OtelReceiver', () => {
  let receiver: OtelReceiver;
  let telemetryStore: TelemetryStore;
  let eventStore: EventStore;

  beforeEach(() => {
    telemetryStore = new TelemetryStore();
    eventStore = new EventStore();
    // Use a random high port to avoid conflicts during testing
    const port = Math.floor(Math.random() * 1000) + 50000;
    receiver = new OtelReceiver(telemetryStore, eventStore, port);
  });

  afterEach(() => {
    receiver.stop();
  });

  it('should start and load protos without error', async () => {
    await expect(receiver.start()).resolves.toBeUndefined();
  }, 10000);
});
