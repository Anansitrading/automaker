import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SpriteService, SpriteEvents } from '../../../src/services/sprite-service.js';
import { TelemetryStore } from '../../../src/services/telemetry-store.js';

// Mock SpriteApiClient constructor
vi.mock('../../../src/services/sprite-api-client.js', () => {
  return {
    SpriteApiClient: class {
      on = vi.fn();
      listSprites = vi.fn();
      getSprite = vi.fn();
      createSprite = vi.fn();
      deleteSprite = vi.fn();
      shutdownSprite = vi.fn();
      wakeSprite = vi.fn();
      execCommand = vi.fn();
      createCheckpoint = vi.fn();
      restoreCheckpoint = vi.fn();
      getConsoleUrl = vi.fn();
    },
  };
});

describe('SpriteService', () => {
  let service: SpriteService;
  let telemetry: TelemetryStore;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new SpriteService();
    telemetry = TelemetryStore.getInstance();

    // Spy on telemetry methods
    vi.spyOn(telemetry, 'recordCounter');
    vi.spyOn(telemetry, 'recordHistogram');
    vi.spyOn(telemetry, 'recordError');
  });

  it('should initialize and setup listeners', () => {
    expect(service).toBeDefined();
    const client = (service as any).client;
    expect(client.on).toHaveBeenCalledWith('spriteCreated', expect.any(Function));
    expect(client.on).toHaveBeenCalledWith('spriteDeleted', expect.any(Function));
    expect(client.on).toHaveBeenCalledWith('spriteStatusChanged', expect.any(Function));
  });

  it('should create a sprite and record telemetry', async () => {
    const mockSprite = { id: '1', name: 'test-sprite', status: 'running' };
    const client = (service as any).client;
    client.createSprite.mockResolvedValue(mockSprite);

    const result = await service.createSprite({ name: 'test-sprite' });

    expect(result).toEqual(mockSprite);
    expect(client.createSprite).toHaveBeenCalledWith({ name: 'test-sprite' });
    expect(telemetry.recordHistogram).toHaveBeenCalledWith(
      'sprites.create.duration',
      expect.any(Number)
    );
  });

  it('should emit standard events when client emits events', () => {
    const emitSpy = vi.spyOn(service, 'emit');
    const client = (service as any).client;

    // Extract the listener passed to SpriteApiClient
    const calls = client.on.mock.calls;
    const createdListener = calls.find((call: any[]) => call[0] === 'spriteCreated')?.[1];

    expect(createdListener).toBeDefined();

    // Simulate client event
    const mockSprite = { id: '1', name: 'test' };
    createdListener(mockSprite);

    expect(emitSpy).toHaveBeenCalledWith(SpriteEvents.CREATED, mockSprite);
    expect(telemetry.recordCounter).toHaveBeenCalledWith('sprites.created');
  });

  it('should handle errors and record telemetry', async () => {
    const error = new Error('API Error');
    const client = (service as any).client;
    client.listSprites.mockRejectedValue(error);

    await expect(service.listSprites()).rejects.toThrow('API Error');

    expect(telemetry.recordError).toHaveBeenCalledWith('sprites.listSprites.error', error);
  });

  it('should emit RESTORED event when client emits spriteRestored', () => {
    const emitSpy = vi.spyOn(service, 'emit');
    const client = (service as any).client;

    // Extract the listener passed to SpriteApiClient
    const calls = client.on.mock.calls;
    const restoredListener = calls.find((call: any[]) => call[0] === 'spriteRestored')?.[1];

    expect(restoredListener).toBeDefined();

    // Simulate client event
    const mockData = { spriteId: 's1', checkpointId: 'cp1' };
    restoredListener(mockData);

    expect(emitSpy).toHaveBeenCalledWith(SpriteEvents.RESTORED, mockData);
    expect(telemetry.recordCounter).toHaveBeenCalledWith('sprites.restored');
  });

  it('should create checkpoint and record telemetry', async () => {
    const mockCheckpoint = { id: 'cp1', name: 'test-ckpt' };
    const client = (service as any).client;
    client.createCheckpoint.mockResolvedValue(mockCheckpoint);

    const result = await service.createCheckpoint('s1', 'test comment');

    expect(result).toEqual(mockCheckpoint);
    expect(client.createCheckpoint).toHaveBeenCalledWith('s1', 'test comment');
    expect(telemetry.recordHistogram).toHaveBeenCalledWith(
      'sprites.checkpoint.duration',
      expect.any(Number)
    );
  });

  it('should restore checkpoint and record telemetry', async () => {
    const client = (service as any).client;
    client.restoreCheckpoint.mockResolvedValue(undefined);

    await service.restoreCheckpoint('s1', 'cp1');

    expect(client.restoreCheckpoint).toHaveBeenCalledWith('s1', 'cp1');
    expect(telemetry.recordHistogram).toHaveBeenCalledWith(
      'sprites.restore.duration',
      expect.any(Number)
    );
  });
});
