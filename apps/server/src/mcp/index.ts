#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SpriteService } from '../services/sprite-service.js';
import { SpriteMCPServer } from './sprite-mcp-server.js';
import { createLogger } from '@automaker/utils';

const logger = createLogger('MCPServer');

async function main() {
  try {
    // 1. Initialize dependencies
    const spriteService = new SpriteService();

    // 2. Initialize MCP Server
    const mcpServer = new SpriteMCPServer(spriteService);

    // 3. Connect to Stdio Transport
    await mcpServer.start();

    logger.info('Sprite MCP Server started on stdio');
  } catch (error) {
    logger.error('Failed to start MCP Server:', error);
    process.exit(1);
  }
}

main();
