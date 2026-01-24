import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { createLogger } from '@automaker/utils';
import { SpriteService } from '../services/sprite-service.js';

const logger = createLogger('SpriteMCPServer');

/**
 * SpriteMCPServer
 *
 * Exposes SpriteService capabilities as an MCP Server.
 * Allows Claude/agents to manage sandboxes directly.
 */
export class SpriteMCPServer {
  private server: Server;
  private spriteService: SpriteService;

  constructor(spriteService: SpriteService) {
    this.spriteService = spriteService;

    this.server = new Server(
      {
        name: 'automaker-sprites',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  /**
   * Start the MCP server using Stdio transport
   */
  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    logger.info('Sprite MCP Server started on stdio');
  }

  private setupHandlers() {
    // List Tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          this.getCreateSpriteTool(),
          this.getExecCommandTool(),
          this.getListSpritesTool(),
          this.getCreateCheckpointTool(),
          this.getRestoreCheckpointTool(),
          this.getShutdownSpriteTool(),
          this.getWakeSpriteTool(),
        ],
      };
    });

    // Call Tool
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'sprite_create':
            return await this.handleCreateSprite(args);
          case 'sprite_exec':
            return await this.handleExecCommand(args);
          case 'sprite_list':
            return await this.handleListSprites();
          case 'sprite_checkpoint':
            return await this.handleCreateCheckpoint(args);
          case 'sprite_restore':
            return await this.handleRestoreCheckpoint(args);
          case 'sprite_shutdown':
            return await this.handleShutdownSprite(args);
          case 'sprite_wake':
            return await this.handleWakeSprite(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error: any) {
        logger.error(`Error executing tool ${name}:`, error);
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  // --- Tool Definitions ---

  private getCreateSpriteTool(): Tool {
    return {
      name: 'sprite_create',
      description: 'Create a new sprite (sandbox environment)',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name of the sprite',
          },
          repoUrl: {
            type: 'string',
            description: 'Optional Git repository URL to clone',
          },
        },
        required: ['name'],
      },
    };
  }

  private getExecCommandTool(): Tool {
    return {
      name: 'sprite_exec',
      description: 'Execute a command inside a sprite',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name or ID of the sprite',
          },
          command: {
            type: 'string',
            description: 'Command to execute',
          },
          timeout: {
            type: 'number',
            description: 'Timeout in milliseconds (default: 30000)',
          },
        },
        required: ['name', 'command'],
      },
    };
  }

  private getListSpritesTool(): Tool {
    return {
      name: 'sprite_list',
      description: 'List all active sprites',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    };
  }

  private getCreateCheckpointTool(): Tool {
    return {
      name: 'sprite_checkpoint',
      description: 'Create a checkpoint (snapshot) of a sprite',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name or ID of the sprite',
          },
          checkpointName: {
            type: 'string',
            description: 'Optional name/comment for the checkpoint',
          },
        },
        required: ['name'],
      },
    };
  }

  private getRestoreCheckpointTool(): Tool {
    return {
      name: 'sprite_restore',
      description: 'Restore a sprite to a previous checkpoint',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name or ID of the sprite',
          },
          checkpointId: {
            type: 'string',
            description: 'ID of the checkpoint to restore',
          },
        },
        required: ['name', 'checkpointId'],
      },
    };
  }

  private getShutdownSpriteTool(): Tool {
    return {
      name: 'sprite_shutdown',
      description: 'Shutdown (hibernate) a sprite',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name or ID of the sprite',
          },
        },
        required: ['name'],
      },
    };
  }

  private getWakeSpriteTool(): Tool {
    return {
      name: 'sprite_wake',
      description: 'Wake (start) a hibernated sprite',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name or ID of the sprite',
          },
        },
        required: ['name'],
      },
    };
  }

  // --- Handlers ---

  private async handleCreateSprite(args: any) {
    const { name, repoUrl } = args;
    const sprite = await this.spriteService.createSprite({
      name,
      repoUrl,
    });
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(sprite, null, 2),
        },
      ],
    };
  }

  private async handleExecCommand(args: any) {
    const { name, command, timeout } = args;
    const result = await this.spriteService.execCommand(name, command, timeout);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async handleListSprites() {
    const sprites = await this.spriteService.listSprites();
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(sprites, null, 2),
        },
      ],
    };
  }

  private async handleCreateCheckpoint(args: any) {
    const { name, checkpointName } = args;
    const checkpoint = await this.spriteService.createCheckpoint(name, checkpointName);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(checkpoint, null, 2),
        },
      ],
    };
  }

  private async handleRestoreCheckpoint(args: any) {
    const { name, checkpointId } = args;
    await this.spriteService.restoreCheckpoint(name, checkpointId);
    return {
      content: [
        {
          type: 'text',
          text: `Successfully restored sprite '${name}' to checkpoint '${checkpointId}'`,
        },
      ],
    };
  }

  private async handleShutdownSprite(args: any) {
    const { name } = args;
    await this.spriteService.shutdownSprite(name);
    return {
      content: [
        {
          type: 'text',
          text: `Shutdown initiated for sprite '${name}'`,
        },
      ],
    };
  }

  private async handleWakeSprite(args: any) {
    const { name } = args;
    await this.spriteService.wakeSprite(name);
    return {
      content: [
        {
          type: 'text',
          text: `Wake initiated for sprite '${name}'`,
        },
      ],
    };
  }
}
