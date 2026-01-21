import { EventEmitter } from 'events';
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { createLogger } from '@automaker/utils';
import { spritesConfig } from '../config/sprites.js';

const logger = createLogger('SpriteApiClient');

export interface Sprite {
  id: string;
  name: string;
  status: 'running' | 'hibernating' | 'provisioning' | 'error';
  lastActivityAt: string;
  createdAt: string;
}

export interface Checkpoint {
  id: string;
  spriteId: string;
  name: string;
  createdAt: string;
}

export interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
}

export interface SpriteConfig {
  name: string;
  repoUrl?: string;
  branch?: string;
  env?: Record<string, string>;
}

/**
 * SpriteApiClient - Client for interacting with the Sprites.dev REST API
 *
 * Handles sprite lifecycle, command execution, and state management.
 * Uses axios for communication.
 */
export class SpriteApiClient extends EventEmitter {
  private axiosInstance: AxiosInstance;
  private statusCache: Map<string, Sprite> = new Map();

  constructor() {
    super();
    const apiBase = spritesConfig.SPRITES_API_BASE || 'https://api.sprites.dev/v1';
    const token = spritesConfig.SPRITES_TOKEN || '';

    if (!token) {
      logger.warn('SPRITES_TOKEN is not configured. API calls will fail.');
    }

    this.axiosInstance = axios.create({
      baseURL: apiBase,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Helper to perform authenticated requests using axios
   */
  private async request<T>(url: string, options: any = {}): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.axiosInstance({
        url,
        ...options,
      });

      return response.data;
    } catch (error: any) {
      const status = error.response?.status;
      const errorText = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      logger.error(`Request to ${url} failed (${status}):`, errorText);
      throw new Error(`Sprites API Error (${status || 'Unknown'}): ${errorText}`);
    }
  }

  // ============================================================================
  // Sprite CRUD
  // ============================================================================

  /**
   * List all sprites associated with the account
   */
  async listSprites(): Promise<Sprite[]> {
    const sprites = await this.request<Sprite[]>('/sprites');
    sprites.forEach((s) => this.statusCache.set(s.id, s));
    return sprites;
  }

  /**
   * Get details for a specific sprite
   */
  async getSprite(id: string): Promise<Sprite> {
    const sprite = await this.request<Sprite>(`/sprites/${id}`);
    this.statusCache.set(sprite.id, sprite);
    return sprite;
  }

  /**
   * Provision a new sprite
   */
  async createSprite(config: SpriteConfig): Promise<Sprite> {
    logger.info(`Creating sprite: ${config.name}`);
    const sprite = await this.request<Sprite>('/sprites', {
      method: 'POST',
      data: JSON.stringify({
        ...config,
        repoUrl: config.repoUrl || spritesConfig.DEFAULT_REPO_URL,
        branch: config.branch || spritesConfig.DEFAULT_BRANCH,
      }),
    });

    this.statusCache.set(sprite.id, sprite);
    this.emit('spriteCreated', sprite);
    return sprite;
  }

  /**
   * Delete a sprite
   */
  async deleteSprite(id: string): Promise<void> {
    logger.info(`Deleting sprite: ${id}`);
    await this.request(`/sprites/${id}`, { method: 'DELETE' });
    this.statusCache.delete(id);
    this.emit('spriteDeleted', id);
  }

  // ============================================================================
  // Command Execution
  // ============================================================================

  /**
   * Execute a shell command on a sprite
   */
  async execCommand(
    spriteId: string,
    command: string,
    timeout: number = 60000
  ): Promise<ExecResult> {
    logger.debug(`Executing on sprite ${spriteId}: ${command}`);

    const result = await this.request<ExecResult>(`/sprites/${spriteId}/exec`, {
      method: 'POST',
      data: JSON.stringify({ command, timeout }),
    });

    return result;
  }

  // ============================================================================
  // Checkpointing
  // ============================================================================

  /**
   * Create a checkpoint of the current sprite state
   */
  async createCheckpoint(spriteId: string, name: string): Promise<Checkpoint> {
    logger.info(`Creating checkpoint '${name}' for sprite ${spriteId}`);
    return this.request<Checkpoint>(`/sprites/${spriteId}/checkpoints`, {
      method: 'POST',
      data: JSON.stringify({ name }),
    });
  }

  /**
   * Restore a sprite to a specified checkpoint
   */
  async restoreCheckpoint(spriteId: string, checkpointId: string): Promise<void> {
    logger.info(`Restoring sprite ${spriteId} to checkpoint ${checkpointId}`);
    await this.request(`/sprites/${spriteId}/restore`, {
      method: 'POST',
      data: JSON.stringify({ checkpointId }),
    });
    this.emit('spriteRestored', { spriteId, checkpointId });
  }

  // ============================================================================
  // Lifecycle Management
  // ============================================================================

  /**
   * Shut down (hibernate) a running sprite
   */
  async shutdownSprite(spriteId: string): Promise<void> {
    logger.info(`Shutting down sprite ${spriteId}`);
    await this.request(`/sprites/${spriteId}/shutdown`, { method: 'POST' });

    const sprite = this.statusCache.get(spriteId);
    if (sprite) {
      sprite.status = 'hibernating';
      this.emit('spriteStatusChanged', sprite);
    }
  }

  /**
   * Wake up a hibernating sprite
   */
  async wakeSprite(spriteId: string): Promise<void> {
    logger.info(`Waking up sprite ${spriteId}`);
    await this.request(`/sprites/${spriteId}/wake`, { method: 'POST' });

    const sprite = this.statusCache.get(spriteId);
    if (sprite) {
      sprite.status = 'running';
      this.emit('spriteStatusChanged', sprite);
    }
  }

  // ============================================================================
  // Utilities
  // ============================================================================

  /**
   * Get the console URL for a sprite in the Sprites dashboard
   */
  getConsoleUrl(spriteName: string): string {
    const apiBase = this.axiosInstance.defaults.baseURL || '';
    const baseUrl = apiBase.replace('/v1', '').replace('api.', '');
    return `${baseUrl}/dashboard/sprites/${spriteName}`;
  }

  /**
   * Clear local status cache
   */
  clearCache(): void {
    this.statusCache.clear();
  }
}
