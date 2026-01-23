import { createLogger } from '@automaker/utils';
import { TelemetryStore } from './telemetry-store.js';
import { EventStore } from './event-store.js';
import { OtelReceiver } from './otel-receiver.js';
import { SpriteTelemetry, ClaudeEvent, ApiStats, ToolStats } from './types.js';

const logger = createLogger('TelemetryService');

export class TelemetryService {
  private telemetryStore: TelemetryStore;
  private eventStore: EventStore;
  private otelReceiver: OtelReceiver;
  private isStarted: boolean = false;

  constructor() {
    this.telemetryStore = new TelemetryStore();
    this.eventStore = new EventStore();

    // Potentially configurable port via env var in future
    const otelPort = parseInt(process.env.OTEL_GRPC_PORT || '4317', 10);
    this.otelReceiver = new OtelReceiver(this.telemetryStore, this.eventStore, otelPort);

    this.setupLogging();
  }

  private setupLogging() {
    this.telemetryStore.on('update', (telemetry: SpriteTelemetry) => {
      logger.debug(`Telemetry update for ${telemetry.spriteName}`, {
        tokens: telemetry.inputTokens + telemetry.outputTokens,
        cost: telemetry.costUsd,
      });
    });

    this.eventStore.on('event', (event: ClaudeEvent) => {
      // Don't log full event details at INFO level to avoid noise, just debug
      logger.debug(`Event received: ${event.eventType} for ${event.spriteName}`);
    });
  }

  /**
   * Start the OpenTelemetry receiver
   */
  public async start(): Promise<void> {
    if (this.isStarted) return;

    try {
      logger.info('Starting TelemetryService...');
      await this.otelReceiver.start();
      this.isStarted = true;
      logger.info('TelemetryService started successfully');
    } catch (error) {
      logger.error('Failed to start TelemetryService', error);
      // We don't throw here to avoid crashing the whole server if just OTEL fails
    }
  }

  /**
   * Stop the service
   */
  public stop(): void {
    if (!this.isStarted) return;

    this.otelReceiver.stop();
    this.isStarted = false;
    logger.info('TelemetryService stopped');
  }

  // --- Public Data Access Methods ---

  public getSpriteTelemetry(spriteName: string): SpriteTelemetry {
    return this.telemetryStore.get(spriteName);
  }

  public getAllTelemetry(): SpriteTelemetry[] {
    return this.telemetryStore.getAll();
  }

  public getSpriteEvents(
    spriteName: string,
    limit?: number,
    types?: ClaudeEvent['eventType'][]
  ): ClaudeEvent[] {
    return this.eventStore.getEvents(spriteName, limit, types);
  }

  public getSpriteTimeline(spriteName: string, minutes: number): ClaudeEvent[] {
    return this.eventStore.getTimeline(spriteName, minutes);
  }

  public getApiStats(spriteName: string): ApiStats {
    return this.eventStore.getApiStats(spriteName);
  }

  public getToolStats(spriteName: string): ToolStats {
    return this.eventStore.getToolStats(spriteName);
  }

  public getStore(): TelemetryStore {
    return this.telemetryStore;
  }
}

// Singleton instance
let instance: TelemetryService | null = null;

export function getTelemetryService(): TelemetryService {
  if (!instance) {
    instance = new TelemetryService();
  }
  return instance;
}
