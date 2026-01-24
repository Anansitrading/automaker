import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SpriteMCPServer } from '../../../src/mcp/sprite-mcp-server.js';
import { SpriteService } from '../../../src/services/sprite-service.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

// Mock Server class from SDK
vi.mock('@modelcontextprotocol/sdk/server/index.js', () => {
  return {
    Server: class MockServer {
      connect = vi.fn();
      setRequestHandler = vi.fn();
    },
  };
});

describe('SpriteMCPServer', () => {
  let mcpServer: SpriteMCPServer;
  let mockSpriteService: Partial<SpriteService>;
  let mockSdkServer: any;

  beforeEach(() => {
    mockSpriteService = {
      createSprite: vi.fn(),
      execCommand: vi.fn(),
      listSprites: vi.fn(),
      createCheckpoint: vi.fn(),
      restoreCheckpoint: vi.fn(),
      shutdownSprite: vi.fn(),
      wakeSprite: vi.fn(),
    };

    mcpServer = new SpriteMCPServer(mockSpriteService as SpriteService);
    // access private server instance for testing handlers (in a real test we might spy on the handlers passed to setRequestHandler)
    // Since we mocked the constructor, we can get the instance from the mock implementation or just spy on the methods if we expose them.
    // However, setRequestHandler is called in constructor.
    // We can spy on setRequestHandler to capture the handlers.
    mockSdkServer = (mcpServer as any).server;
  });

  it('should register handlers on initialization', () => {
    expect(mockSdkServer.setRequestHandler).toHaveBeenCalledWith(
      ListToolsRequestSchema,
      expect.any(Function)
    );
    expect(mockSdkServer.setRequestHandler).toHaveBeenCalledWith(
      CallToolRequestSchema,
      expect.any(Function)
    );
  });

  it('should list all tools', async () => {
    // Extract the ListTools handler
    const listToolsHandler = vi
      .mocked(mockSdkServer.setRequestHandler)
      .mock.calls.find((call: any) => call[0] === ListToolsRequestSchema)?.[1];

    expect(listToolsHandler).toBeDefined();

    const result = await listToolsHandler!({} as any);
    expect(result.tools).toHaveLength(7);
    expect(result.tools.map((t: any) => t.name)).toContain('sprite_create');
    expect(result.tools.map((t: any) => t.name)).toContain('sprite_exec');
  });

  it('should handle sprite_create tool call', async () => {
    // Extract CallTool handler
    const callToolHandler = vi
      .mocked(mockSdkServer.setRequestHandler)
      .mock.calls.find((call: any) => call[0] === CallToolRequestSchema)?.[1];

    const sprite = { id: 's1', name: 'test' };
    vi.mocked(mockSpriteService.createSprite).mockResolvedValue(sprite as any);

    const request = {
      params: {
        name: 'sprite_create',
        arguments: { name: 'test', repoUrl: 'http://repo' },
      },
    };

    const result = await callToolHandler!(request as any);

    expect(mockSpriteService.createSprite).toHaveBeenCalledWith({
      name: 'test',
      repoUrl: 'http://repo',
    });
    expect(JSON.parse(result.content[0].text)).toEqual(sprite);
  });
});
