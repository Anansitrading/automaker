import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';

// Hoist mocks
const mockRouter = {
  get: vi.fn(),
  post: vi.fn(),
  delete: vi.fn(),
};

vi.mock('express', () => ({
  Router: () => mockRouter,
}));

vi.mock('../../../src/services/sprite-service.js');
vi.mock('@automaker/utils', () => ({
  createLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  }),
}));
vi.mock('../../../src/routes/common.js', () => ({
  createLogError: () => vi.fn(),
}));

import { createSpriteRoutes } from '../../../src/routes/sprite/index.js';
import { SpriteService } from '../../../src/services/sprite-service.js';

describe('Sprite Routes', () => {
  let mockSpriteService: any;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let handlers: Record<string, Function>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock service
    mockSpriteService = {
      createSprite: vi.fn(),
      listSprites: vi.fn(),
      getSprite: vi.fn(),
      deleteSprite: vi.fn(),
      shutdownSprite: vi.fn(),
      wakeSprite: vi.fn(),
      execCommand: vi.fn(),
      getConsoleUrl: vi.fn(),
    };

    // Capture handlers
    handlers = {};
    mockRouter.get.mockImplementation((path: string, handler: Function) => {
      handlers[`GET ${path}`] = handler;
    });
    mockRouter.post.mockImplementation((path: string, handler: Function) => {
      handlers[`POST ${path}`] = handler;
    });
    mockRouter.delete.mockImplementation((path: string, handler: Function) => {
      handlers[`DELETE ${path}`] = handler;
    });

    // Reset request/response
    req = {
      body: {},
      params: {},
    };
    res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
    };

    // Initialize routes
    createSpriteRoutes(mockSpriteService as unknown as SpriteService);
  });

  describe('GET /', () => {
    it('should list sprites', async () => {
      const sprites = [{ id: 's1', name: 'test' }];
      mockSpriteService.listSprites.mockResolvedValue(sprites);

      await handlers['GET /'](req, res);

      expect(mockSpriteService.listSprites).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(sprites);
    });

    it('should handle errors', async () => {
      mockSpriteService.listSprites.mockRejectedValue(new Error('Failed'));

      await handlers['GET /'](req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to list sprites' });
    });
  });

  describe('POST /', () => {
    it('should create sprite', async () => {
      const config = { name: 'new-sprite' };
      const created = { id: 's1', name: 'new-sprite' };
      req.body = config;
      mockSpriteService.createSprite.mockResolvedValue(created);

      await handlers['POST /'](req, res);

      expect(mockSpriteService.createSprite).toHaveBeenCalledWith(config);
      expect(res.json).toHaveBeenCalledWith(created);
    });
  });

  describe('GET /:name', () => {
    it('should get sprite', async () => {
      req.params = { name: 's1' };
      const sprite = { id: 's1', name: 'test' };
      mockSpriteService.getSprite.mockResolvedValue(sprite);

      await handlers['GET /:name'](req, res);

      expect(mockSpriteService.getSprite).toHaveBeenCalledWith('s1');
      expect(res.json).toHaveBeenCalledWith(sprite);
    });
  });

  describe('DELETE /:name', () => {
    it('should delete sprite', async () => {
      req.params = { name: 's1' };
      mockSpriteService.deleteSprite.mockResolvedValue(undefined);

      await handlers['DELETE /:name'](req, res);

      expect(mockSpriteService.deleteSprite).toHaveBeenCalledWith('s1');
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });
  });

  describe('POST /:name/exec', () => {
    it('should execute command', async () => {
      req.params = { name: 's1' };
      req.body = { command: 'echo hi', timeout: 1000 };
      const result = { output: 'hi', exitCode: 0 };
      mockSpriteService.execCommand.mockResolvedValue(result);

      await handlers['POST /:name/exec'](req, res);

      expect(mockSpriteService.execCommand).toHaveBeenCalledWith('s1', 'echo hi', 1000);
      expect(res.json).toHaveBeenCalledWith(result);
    });

    it('should validate command', async () => {
      req.params = { name: 's1' };
      req.body = { command: '' };

      await handlers['POST /:name/exec'](req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockSpriteService.execCommand).not.toHaveBeenCalled();
    });
  });

  describe('POST /:name/shutdown', () => {
    it('should shutdown sprite', async () => {
      req.params = { name: 's1' };
      mockSpriteService.shutdownSprite.mockResolvedValue(undefined);

      await handlers['POST /:name/shutdown'](req, res);

      expect(mockSpriteService.shutdownSprite).toHaveBeenCalledWith('s1');
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('POST /:name/wake', () => {
    it('should wake sprite', async () => {
      req.params = { name: 's1' };
      mockSpriteService.wakeSprite.mockResolvedValue(undefined);

      await handlers['POST /:name/wake'](req, res);

      expect(mockSpriteService.wakeSprite).toHaveBeenCalledWith('s1');
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('GET /:name/url', () => {
    it('should return console url', async () => {
      req.params = { name: 's1' };
      mockSpriteService.getConsoleUrl.mockReturnValue('http://console.url');

      await handlers['GET /:name/url'](req, res);

      expect(mockSpriteService.getConsoleUrl).toHaveBeenCalledWith('s1');
      expect(res.json).toHaveBeenCalledWith({ url: 'http://console.url' });
    });
  });
});
