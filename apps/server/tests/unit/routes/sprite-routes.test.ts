import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { createSpriteRoutes } from '../../../src/routes/sprite/index.js';
import { SpriteService, SpriteEvents } from '../../../src/services/sprite-service.js';

describe('SpriteRoutes (Sandbox API)', () => {
  let app: express.Application;
  let mockSpriteService: Partial<SpriteService>;

  beforeEach(() => {
    mockSpriteService = {
      createSprite: vi.fn(),
      listSprites: vi.fn(),
      getSprite: vi.fn(),
      deleteSprite: vi.fn(),
      execCommand: vi.fn(),
      createCheckpoint: vi.fn(),
      restoreCheckpoint: vi.fn(),
      listCheckpoints: vi.fn(),
      getConsoleUrl: vi.fn(),
      shutdownSprite: vi.fn(),
      wakeSprite: vi.fn(),
    };

    app = express();
    app.use(express.json());
    app.use('/sprites', createSpriteRoutes(mockSpriteService as SpriteService));
  });

  describe('POST /sprites', () => {
    it('should create a sprite (sandbox) successfully', async () => {
      const config = { name: 'test-sandbox' };
      const expectedSprite = { id: 's1', name: 'test-sandbox', status: 'running' };

      vi.mocked(mockSpriteService.createSprite).mockResolvedValue(expectedSprite as any);

      const res = await request(app).post('/sprites').send(config);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(expectedSprite);
      expect(mockSpriteService.createSprite).toHaveBeenCalledWith(config);
    });

    it('should handle creation errors', async () => {
      vi.mocked(mockSpriteService.createSprite).mockRejectedValue(new Error('Failed'));

      const res = await request(app).post('/sprites').send({ name: 'fail' });

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('GET /sprites', () => {
    it('should list all sprites', async () => {
      const sprites = [{ id: 's1', name: 'test' }];
      vi.mocked(mockSpriteService.listSprites).mockResolvedValue(sprites as any);

      const res = await request(app).get('/sprites');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(sprites);
    });
  });

  describe('DELETE /sprites/:name', () => {
    it('should delete a sprite', async () => {
      vi.mocked(mockSpriteService.deleteSprite).mockResolvedValue(undefined);

      const res = await request(app).delete('/sprites/test-sandbox');

      expect(res.status).toBe(204);
      expect(mockSpriteService.deleteSprite).toHaveBeenCalledWith('test-sandbox');
    });
  });

  describe('POST /sprites/:name/exec', () => {
    it('should execute a command', async () => {
      const output = { stdout: 'hello', stderr: '', exitCode: 0, durationMs: 10 };
      vi.mocked(mockSpriteService.execCommand).mockResolvedValue(output);

      const res = await request(app)
        .post('/sprites/test-sandbox/exec')
        .send({ command: 'echo hello' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(output);
      expect(mockSpriteService.execCommand).toHaveBeenCalledWith(
        'test-sandbox',
        'echo hello',
        undefined
      );
    });
  });

  describe('POST /sprites/:name/checkpoints', () => {
    it('should create a checkpoint', async () => {
      const checkpoint = { id: 'bk1', name: 'backup', createdAt: '2023-01-01' };
      vi.mocked(mockSpriteService.createCheckpoint).mockResolvedValue(checkpoint as any);

      const res = await request(app)
        .post('/sprites/test-sandbox/checkpoints')
        .send({ name: 'backup' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(checkpoint);
      expect(mockSpriteService.createCheckpoint).toHaveBeenCalledWith('test-sandbox', 'backup');
    });
  });

  describe('GET /sprites/:name/checkpoints', () => {
    it('should list checkpoints', async () => {
      const checkpoints = [{ id: 'bk1', name: 'backup' }];
      vi.mocked(mockSpriteService.listCheckpoints).mockResolvedValue(checkpoints as any);

      const res = await request(app).get('/sprites/test-sandbox/checkpoints');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(checkpoints);
      expect(mockSpriteService.listCheckpoints).toHaveBeenCalledWith('test-sandbox');
    });
  });

  describe('POST /sprites/:name/checkpoints/:id/restore', () => {
    it('should restore a checkpoint', async () => {
      vi.mocked(mockSpriteService.restoreCheckpoint).mockResolvedValue(undefined);

      const res = await request(app).post('/sprites/test-sandbox/checkpoints/bk1/restore');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'restored' });
      expect(mockSpriteService.restoreCheckpoint).toHaveBeenCalledWith('test-sandbox', 'bk1');
    });
  });
});
