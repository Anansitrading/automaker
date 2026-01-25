import type {
  Sprite,
  SpriteConfig,
  Checkpoint,
  ExecResult,
} from '../services/sprite-api-client.js';

export interface SpriteProvider {
  on(event: string | symbol, listener: (...args: any[]) => void): this;
  emit(event: string | symbol, ...args: any[]): boolean;

  listSprites(): Promise<Sprite[]>;
  getSprite(id: string): Promise<Sprite>;
  createSprite(config: SpriteConfig): Promise<Sprite>;
  deleteSprite(id: string): Promise<void>;

  execCommand(id: string, command: string, timeout?: number): Promise<ExecResult>;

  createCheckpoint(id: string, comment?: string): Promise<Checkpoint>;
  restoreCheckpoint(id: string, checkpointId: string): Promise<void>;
  listCheckpoints(id: string): Promise<Checkpoint[]>;

  shutdownSprite(id: string): Promise<void>;
  wakeSprite(id: string): Promise<void>;

  getConsoleUrl(name: string): string;
  getConsoleWebSocketUrl(name: string, options?: any): string;
  getWebSocketHeaders(): Record<string, string>;
}
