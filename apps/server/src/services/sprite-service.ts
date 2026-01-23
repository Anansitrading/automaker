import { EventEmitter } from 'events';
import { createLogger } from '@automaker/utils';
import { SpriteApiClient } from './sprite-api-client.js';
import type { Sprite, SpriteConfig, Checkpoint, ExecResult } from './sprite-api-client.js';
import { TelemetryStore } from './telemetry-store.js';

const logger = createLogger('SpriteService');

// Re-export types for consumers
export { Sprite, SpriteConfig, Checkpoint, ExecResult };

/**
 * Events emitted by SpriteService
 */
export const SpriteEvents = {
  CREATED: 'sprite:created',
  DELETED: 'sprite:deleted',
  SHUTDOWN: 'sprite:shutdown',
  WOKEN: 'sprite:woken',
  STATUS_CHANGED: 'sprite:status_changed',
  RESTORED: 'sprite:restored',
  ERROR: 'sprite:error',
};

/**
 * SpriteService
 *
 * High-level service for managing Sprites.
 * Wraps SpriteApiClient with additional logging, telemetry, and event handling.
 */
export class SpriteService extends EventEmitter {
  private client: SpriteApiClient;
  private telemetry: TelemetryStore;

  constructor() {
    super();
    this.client = new SpriteApiClient();
    this.telemetry = TelemetryStore.getInstance();

    // Re-emit client events with standardized names if needed,
    // or just listen to modify internal state/telemetry.
    this.setupClientListeners();
  }

  private setupClientListeners() {
    this.client.on('spriteCreated', (sprite: Sprite) => {
      this.telemetry.recordCounter('sprites.created');
      this.emit(SpriteEvents.CREATED, sprite);
    });

    this.client.on('spriteDeleted', (spriteId: string) => {
      this.telemetry.recordCounter('sprites.deleted');
      this.emit(SpriteEvents.DELETED, spriteId);
    });

    this.client.on('spriteRestored', (data: any) => {
      this.telemetry.recordCounter('sprites.restored');
      this.emit(SpriteEvents.RESTORED, data);
    });

    this.client.on('spriteStatusChanged', (sprite: Sprite) => {
      this.emit(SpriteEvents.STATUS_CHANGED, sprite);
      if (sprite.status === 'hibernating') {
        this.emit(SpriteEvents.SHUTDOWN, sprite.id);
      } else if (sprite.status === 'running') {
        this.emit(SpriteEvents.WOKEN, sprite.id);
      }
    });
  }

  /**
   * List all sprites
   */
  async listSprites(): Promise<Sprite[]> {
    const start = Date.now();
    try {
      const sprites = await this.client.listSprites();
      this.telemetry.recordHistogram('sprites.list.duration', Date.now() - start);
      return sprites;
    } catch (error: any) {
      this.handleError('listSprites', error);
      throw error;
    }
  }

  /**
   * Get a sprite by ID
   */
  async getSprite(id: string): Promise<Sprite> {
    try {
      return await this.client.getSprite(id);
    } catch (error: any) {
      this.handleError('getSprite', error);
      throw error;
    }
  }

  /**
   * Create a new sprite
   */
  async createSprite(config: SpriteConfig): Promise<Sprite> {
    const start = Date.now();
    try {
      logger.info(`Creating sprite '${config.name}'...`);
      const sprite = await this.client.createSprite(config);

      const duration = Date.now() - start;
      logger.info(`Sprite '${config.name}' created in ${duration}ms`);
      this.telemetry.recordHistogram('sprites.create.duration', duration);

      return sprite;
    } catch (error: any) {
      this.handleError('createSprite', error);
      throw error;
    }
  }

  /**
   * Delete a sprite
   */
  async deleteSprite(id: string): Promise<void> {
    try {
      await this.client.deleteSprite(id);
    } catch (error: any) {
      this.handleError('deleteSprite', error);
      throw error;
    }
  }

  /**
   * Shutdown a sprite
   */
  async shutdownSprite(id: string): Promise<void> {
    try {
      await this.client.shutdownSprite(id);
      this.telemetry.recordCounter('sprites.shutdown');
    } catch (error: any) {
      this.handleError('shutdownSprite', error);
      throw error;
    }
  }

  /**
   * Wake a sprite
   */
  async wakeSprite(id: string): Promise<void> {
    try {
      await this.client.wakeSprite(id);
      this.telemetry.recordCounter('sprites.woken');
    } catch (error: any) {
      this.handleError('wakeSprite', error);
      throw error;
    }
  }

  /**
   * Execute command on sprite
   */
  async execCommand(id: string, command: string, timeout?: number): Promise<ExecResult> {
    const start = Date.now();
    try {
      const result = await this.client.execCommand(id, command, timeout);
      this.telemetry.recordHistogram('sprites.exec.duration', Date.now() - start);
      return result;
    } catch (error: any) {
      this.handleError('execCommand', error);
      throw error;
    }
  }

  /**
   * Get console URL for a sprite
   */
  getConsoleUrl(name: string): string {
    return this.client.getConsoleUrl(name);
  }

  private handleError(operation: string, error: Error) {
    logger.error(`Error in ${operation}:`, error);
    this.telemetry.recordError(`sprites.${operation}.error`, error);
    this.emit(SpriteEvents.ERROR, { operation, error });
  }
}
