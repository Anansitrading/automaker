import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { SpriteApiClient } from '../../../src/services/sprite-api-client.js';

// Mock the config
vi.mock('../../../src/config/sprites.js', () => ({
  spritesConfig: {
    SPRITES_TOKEN: 'test-token',
    SPRITES_API_BASE: 'https://api.test.dev/v1',
    DEFAULT_REPO_URL: 'https://github.com/test/repo',
    DEFAULT_BRANCH: 'main',
  },
}));

// Mock axios
vi.mock('axios', () => {
  return {
    default: {
      create: vi.fn(),
    },
  };
});

describe('SpriteApiClient', () => {
  let client: SpriteApiClient;
  let mockAxiosInstance: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockAxiosInstance = vi.fn();
    mockAxiosInstance.defaults = { baseURL: 'https://api.test.dev/v1' };

    // Setup the create mock to return our instance mock
    vi.mocked(axios.create).mockReturnValue(mockAxiosInstance);

    client = new SpriteApiClient();
  });

  describe('Sprite CRUD', () => {
    it('should list sprites and update cache', async () => {
      const mockSprites = [
        { id: 's1', name: 'sprite1', status: 'running' as const },
        { id: 's2', name: 'sprite2', status: 'shutdown' as const },
      ];

      mockAxiosInstance.mockResolvedValueOnce({
        data: mockSprites,
        status: 200,
      });

      const sprites = await client.listSprites();

      expect(axios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://api.test.dev/v1',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );

      expect(mockAxiosInstance).toHaveBeenCalledWith(
        expect.objectContaining({
          url: '/sprites',
        })
      );

      expect(sprites).toEqual(mockSprites);

      // Verify second call for getSprite
      mockAxiosInstance.mockResolvedValueOnce({
        data: mockSprites[0],
        status: 200,
      });

      const sprite = await client.getSprite('s1');
      expect(sprite).toEqual(mockSprites[0]);
    });

    it('should create a sprite and emit event', async () => {
      const mockSprite = { id: 's3', name: 'new-sprite', status: 'provisioning' };
      const config = { name: 'new-sprite' };

      mockAxiosInstance.mockResolvedValueOnce({
        data: mockSprite,
        status: 201,
      });

      const spy = vi.fn();
      client.on('spriteCreated', spy);

      const sprite = await client.createSprite(config);

      expect(sprite).toEqual(mockSprite);
      expect(mockAxiosInstance).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          url: '/sprites',
          data: JSON.stringify({
            name: 'new-sprite',
            repoUrl: 'https://github.com/test/repo',
            branch: 'main',
          }),
        })
      );
      expect(spy).toHaveBeenCalledWith(mockSprite);
    });

    it('should restore checkpoint and emit event', async () => {
      mockAxiosInstance.mockResolvedValueOnce({
        data: {},
        status: 204,
      });

      const spy = vi.fn();
      client.on('spriteRestored', spy);

      await client.restoreCheckpoint('s1', 'ckpt-1');

      expect(mockAxiosInstance).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          url: '/sprites/s1/checkpoints/ckpt-1/restore',
        })
      );

      expect(spy).toHaveBeenCalledWith({ spriteId: 's1', checkpointId: 'ckpt-1' });
    });

    it('should delete a sprite and emit event', async () => {
      mockAxiosInstance.mockResolvedValueOnce({
        data: {},
        status: 204,
      });

      const spy = vi.fn();
      client.on('spriteDeleted', spy);

      await client.deleteSprite('s1');

      expect(mockAxiosInstance).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'DELETE',
          url: '/sprites/s1',
        })
      );
      expect(spy).toHaveBeenCalledWith('s1');
    });
  });

  describe('Checkpointing', () => {
    it('should create checkpoint', async () => {
      const mockCheckpoint = {
        id: 'ckpt-1',
        spriteId: 's1',
        name: 'test-checkpoint',
        createdAt: new Date().toISOString(),
      };

      mockAxiosInstance.mockResolvedValueOnce({
        data: mockCheckpoint,
        status: 201,
      });

      const checkpoint = await client.createCheckpoint('s1', 'test comment');

      expect(checkpoint).toEqual(mockCheckpoint);
      expect(mockAxiosInstance).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          url: '/sprites/s1/checkpoint',
          data: JSON.stringify({ comment: 'test comment' }),
        })
      );
    });
  });

  describe('Command Execution', () => {
    it('should execute command', async () => {
      const mockResult = { stdout: 'hello', stderr: '', exitCode: 0, durationMs: 100 };

      mockAxiosInstance.mockResolvedValueOnce({
        data: mockResult,
        status: 200,
      });

      const result = await client.execCommand('s1', 'echo hello');

      expect(result).toEqual(mockResult);
      expect(mockAxiosInstance).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          url: '/sprites/s1/exec',
          data: JSON.stringify({ command: 'echo hello', timeout: 60000 }),
        })
      );
    });
  });

  describe('Lifecycle Management', () => {
    it('should shutdown sprite', async () => {
      mockAxiosInstance.mockResolvedValueOnce({
        data: {},
        status: 204,
      });

      const spy = vi.fn();
      client.on('spriteStatusChanged', spy);

      await client.shutdownSprite('s1');

      expect(mockAxiosInstance).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          url: '/sprites/s1/shutdown',
        })
      );
    });

    it('should wake up sprite', async () => {
      mockAxiosInstance.mockResolvedValueOnce({
        data: {},
        status: 204,
      });

      await client.wakeSprite('s1');

      expect(mockAxiosInstance).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          url: '/sprites/s1/wake',
        })
      );
    });
  });

  describe('Utilities', () => {
    it('should generate correct console URL', () => {
      const url = client.getConsoleUrl('test-sprite');
      expect(url).toBe('https://test.dev/dashboard/sprites/test-sprite');
    });
  });
});
