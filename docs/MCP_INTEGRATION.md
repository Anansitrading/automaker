# Claude Code / MCP Integration

Automaker includes an internal MCP (Model Context Protocol) server called `automaker-sandbox` that provides agents with direct control over Sprites (sandboxes).

You can configure Claude Desktop or Claude Code CLI to use this MCP server.

## Configuration

Add the following configuration to your `claude_desktop_config.json`:

### macOS / Linux

Default path: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "automaker-sandbox": {
      "command": "node",
      "args": ["/absolute/path/to/automaker/apps/server/src/mcp/index.ts"],
      "env": {
        "AUTOMAKER_API_KEY": "your-api-key-if-configured"
      }
    }
  }
}
```

### Windows

Default path: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "automaker-sandbox": {
      "command": "node",
      "args": ["C:\\path\\to\\automaker\\apps\\server\\src\\mcp\\index.ts"],
      "env": {
        "AUTOMAKER_API_KEY": "your-api-key-if-configured"
      }
    }
  }
}
```

## Available Tools

Once configured, Claude can use the following tools:

- `sprite_create` - Create a new sandbox environment
- `sprite_list` - List active sandboxes
- `sprite_exec` - Execute commands in a sandbox
- `sprite_checkpoint` - Create a snapshot
- `sprite_restore` - Restore from snapshot
- `sprite_shutdown` - Hibernate a sandbox
- `sprite_wake` - Wake a sandbox

## Troubleshooting

- Ensure you have run `npm install` and `npm run build` in the Automaker directory.
- Verify the absolute path to `apps/server/src/mcp/index.ts`.
- If using `ts-node` explicitly, update `command` to `npx` and args to `['ts-node', '...']`.
