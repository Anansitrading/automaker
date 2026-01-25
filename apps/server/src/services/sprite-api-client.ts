import { EventEmitter } from 'events';
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { createLogger } from '@automaker/utils';
import { spritesConfig } from '../config/sprites.js';

const logger = createLogger('SpriteApiClient');

export interface Sprite {
  id: string;
  name: string;
  status: 'running' | 'warm' | 'cold' | 'shutdown' | 'provisioning' | 'error';
  lastActivityAt: string;
  createdAt: string;
  resourceLimits?: {
    cpu: number;
    memory: number;
  };
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

import { SpriteProvider } from '../interfaces/sprite-provider.js';

/**
 * SpriteApiClient - Client for interacting with the Sprites.dev REST API
 *
 * Handles sprite lifecycle, command execution, and state management.
 * Uses axios for communication.
 */
export class SpriteApiClient extends EventEmitter implements SpriteProvider {
  private axiosInstance: AxiosInstance;
  private statusCache: Map<string, Sprite> = new Map();
  private token: string;

  constructor() {
    super();
    const apiBase = spritesConfig.SPRITES_API_BASE || 'https://api.sprites.dev/v1';
    this.token = spritesConfig.SPRITES_TOKEN || '';

    // In test mode, we don't need a token
    const isTestMode = process.env.TEST_MODE === 'true';

    if (!this.token && !isTestMode) {
      logger.warn('SPRITES_TOKEN is not configured. API calls will fail.');
    }

    this.axiosInstance = axios.create({
      baseURL: apiBase,
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Helper to perform authenticated requests using axios
   */
  private async request<T>(url: string, options: any = {}): Promise<T> {
    // Mock response for tests to avoid external API calls
    if (process.env.TEST_MODE === 'true') {
      logger.info(`[Test Mode] Mocking request to ${url}`);
      return this.getMockResponse<T>(url, options);
    }

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

  private getMockResponse<T>(url: string, options: any): T {
    if (url === '/sprites' && options.method === 'POST') {
      const data = JSON.parse(options.data || '{}');
      const mockSprite: Sprite = {
        id: `mock-sprite-${Date.now()}`,
        name: data.name || 'mock-sprite',
        status: 'running',
        lastActivityAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      // Cache the mock sprite for subsequent gets
      this.statusCache.set(mockSprite.id, mockSprite);
      return mockSprite as T;
    }

    if (url === '/sprites' && (options.method === 'GET' || !options.method)) {
      return Array.from(this.statusCache.values()) as T;
    }

    if (url.match(/^\/sprites\/[\w-]+$/) && options.method === 'DELETE') {
      return {} as T;
    }

    if (url.match(/^\/sprites\/[\w-]+$/) && (options.method === 'GET' || !options.method)) {
      // Return a default mock if not in cache, or the cached one
      return {
        id: 'mock-sprite-default',
        name: 'mock-sprite',
        status: 'running',
        lastActivityAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      } as T;
    }

    if (url.match(/^\/sprites\/[\w-]+\/exec$/)) {
      return {
        stdout: '/home/user/app',
        stderr: '',
        exitCode: 0,
        durationMs: 10,
      } as T;
    }

    if (url.match(/^\/sprites\/[\w-]+\/(shutdown|wake)$/)) {
      return {} as T;
    }

    if (url.match(/^\/sprites\/[\w-]+\/checkpoint$/)) {
      return {
        id: `ckpt-${Date.now()}`,
        spriteId: 'mock-sprite',
        name: 'mock-checkpoint',
        createdAt: new Date().toISOString(),
      } as T;
    }

    if (url.match(/^\/sprites\/[\w-]+\/checkpoints\/[\w-]+\/restore$/)) {
      return {} as T;
    }

    if (
      url.match(/^\/sprites\/[\w-]+\/checkpoints$/) &&
      (options.method === 'GET' || !options.method)
    ) {
      return [
        {
          id: `ckpt-${Date.now()}`,
          spriteId: 'mock-sprite',
          name: 'mock-checkpoint-1',
          createdAt: new Date().toISOString(),
        },
      ] as T;
    }

    return {} as T;
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
   * API: POST /sprites/{name}/checkpoint
   */
  async createCheckpoint(spriteId: string, comment?: string): Promise<Checkpoint> {
    logger.info(`Creating checkpoint for sprite ${spriteId} with comment: ${comment}`);
    return this.request<Checkpoint>(`/sprites/${spriteId}/checkpoint`, {
      method: 'POST',
      data: JSON.stringify({ comment }),
    });
  }

  /**
   * Restore a sprite to a specified checkpoint
   * API: POST /sprites/{name}/checkpoints/{id}/restore
   */
  async restoreCheckpoint(spriteId: string, checkpointId: string): Promise<void> {
    logger.info(`Restoring sprite ${spriteId} to checkpoint ${checkpointId}`);
    await this.request(`/sprites/${spriteId}/checkpoints/${checkpointId}/restore`, {
      method: 'POST',
    });
    this.emit('spriteRestored', { spriteId, checkpointId });
  }

  /**
   * List checkpoints for a sprite
   * API: GET /sprites/{id}/checkpoints
   */
  async listCheckpoints(spriteId: string): Promise<Checkpoint[]> {
    logger.debug(`Listing checkpoints for sprite ${spriteId}`);
    return this.request<Checkpoint[]>(`/sprites/${spriteId}/checkpoints`);
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
      sprite.status = 'shutdown';
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
   * Get WebSocket URL for console connection
   */
  getConsoleWebSocketUrl(
    spriteName: string,
    options?: {
      cols?: number;
      rows?: number;
      sessionId?: string;
    }
  ): string {
    const baseUrl =
      this.axiosInstance.defaults.baseURL?.replace('https://', 'wss://') || 'wss://api.sprites.dev';

    // In test mode, route to local mock console
    if (process.env.TEST_MODE === 'true') {
      const port = process.env.PORT || '3008';
      return `ws://localhost:${port}/api/mock-console`;
    }

    const url = new URL(`${baseUrl}/v1/sprites/${spriteName}/exec`);

    url.searchParams.set('tty', 'true');
    url.searchParams.set('stdin', 'true');
    url.searchParams.set('cols', String(options?.cols || 80));
    url.searchParams.set('rows', String(options?.rows || 24));

    if (options?.sessionId) {
      url.searchParams.set('id', options.sessionId);
    }

    return url.toString();
  }

  /**
   * Get WebSocket headers for authentication
   */
  getWebSocketHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.token}`,
    };
  }

  /**
   * Clear local status cache
   */
  clearCache(): void {
    this.statusCache.clear();
  }
}
