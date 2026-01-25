import { SpriteProvider } from '../interfaces/sprite-provider.js';
import type { Sprite, SpriteConfig, Checkpoint, ExecResult } from './sprite-api-client.js';
import { FirecrackerManager } from '../lib/firecracker-manager.js';
import { createLogger } from '@automaker/utils';
import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';

const logger = createLogger('LocalSpriteProvider');

export class LocalSpriteProvider extends EventEmitter implements SpriteProvider {
  private managers: Map<string, FirecrackerManager> = new Map();
  private sprites: Map<string, Sprite> = new Map();

  async listSprites(): Promise<Sprite[]> {
    return Array.from(this.sprites.values());
  }

  async getSprite(id: string): Promise<Sprite> {
    const sprite = this.sprites.get(id);
    if (!sprite) throw new Error(`Sprite ${id} not found`);
    return sprite;
  }

  async createSprite(config: SpriteConfig): Promise<Sprite> {
    const id = uuidv4();
    const sprite: Sprite = {
      id,
      name: config.name,
      status: 'provisioning',
      lastActivityAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    this.sprites.set(id, sprite);

    const manager = new FirecrackerManager(id, {
      kernelPath: '/var/lib/firecracker/kernel',
      rootfsPath: '/var/lib/firecracker/rootfs',
    });
    this.managers.set(id, manager);

    // Start VM in background
    manager
      .start()
      .then(() => {
        sprite.status = 'running';
        logger.info(`Sprite ${id} started successfully`);
      })
      .catch((err) => {
        sprite.status = 'error';
        logger.error(`Failed to start sprite ${id}`, err);
      });

    return sprite;
  }

  async deleteSprite(id: string): Promise<void> {
    const manager = this.managers.get(id);
    if (manager) {
      await manager.stop();
      this.managers.delete(id);
    }
    this.sprites.delete(id);
  }

  async execCommand(id: string, command: string, timeout: number = 60000): Promise<ExecResult> {
    // Basic mock implementation for now since FirecrackerManager exec is not fully implemented
    return {
      stdout: '',
      stderr: 'Local execution not fully implemented yet',
      exitCode: 1,
      durationMs: 0,
    };
  }

  async createCheckpoint(id: string, comment?: string): Promise<Checkpoint> {
    throw new Error('Checkpoints not supported in local mode yet');
  }

  async restoreCheckpoint(id: string, checkpointId: string): Promise<void> {
    throw new Error('Checkpoints not supported in local mode yet');
  }

  async listCheckpoints(id: string): Promise<Checkpoint[]> {
    return [];
  }

  async shutdownSprite(id: string): Promise<void> {
    const manager = this.managers.get(id);
    if (manager) {
      await manager.stop();
      const sprite = this.sprites.get(id);
      if (sprite) sprite.status = 'shutdown';
    }
  }

  async wakeSprite(id: string): Promise<void> {
    const manager = this.managers.get(id);
    if (manager) {
      await manager.start();
      const sprite = this.sprites.get(id);
      if (sprite) sprite.status = 'running';
    }
  }

  getConsoleUrl(name: string): string {
    return ''; // No console URL for local
  }

  getConsoleWebSocketUrl(name: string, options?: any): string {
    return ''; // No WS URL for local
  }

  getWebSocketHeaders(): Record<string, string> {
    return {};
  }
}
