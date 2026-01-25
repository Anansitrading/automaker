# MCP Sandbox Tools Documentation

This document describes the Model Context Protocol (MCP) tools available for managing sandboxes in Automaker.

**MCP Server**: `automaker-sprites` (v1.0.0)

---

## Table of Contents

- [Overview](#overview)
- [Tool Definitions](#tool-definitions)
  - [sandbox_create](#sandbox_create)
  - [sandbox_exec](#sandbox_exec)
  - [sandbox_checkpoint](#sandbox_checkpoint)
  - [sandbox_restore](#sandbox_restore)
  - [sandbox_list_checkpoints](#sandbox_list_checkpoints)
  - [sandbox_list](#sandbox_list)
  - [sandbox_shutdown](#sandbox_shutdown)
  - [sandbox_wake](#sandbox_wake)
- [Common Patterns](#common-patterns)

---

## Overview

The Automaker Sprites MCP server exposes sandbox management capabilities through the Model Context Protocol. This allows AI assistants and agents to create, manage, and interact with isolated development environments.

**Connection**: The MCP server uses stdio transport and is available when Automaker is running.

---

## Tool Definitions

### sandbox_create

Create a new sandbox environment (sprite).

**Tool Name**: `sprite_create`

#### Input Schema

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "Name of the sprite"
    },
    "repoUrl": {
      "type": "string",
      "description": "Optional Git repository URL to clone"
    }
  },
  "required": ["name"]
}
```

#### Parameters

| Parameter | Type   | Required | Description                                  |
| --------- | ------ | -------- | -------------------------------------------- |
| `name`    | string | Yes      | Unique name for the sandbox                  |
| `repoUrl` | string | No       | Git repository URL to clone into the sandbox |

#### Response Format

```json
{
  "content": [
    {
      "type": "text",
      "text": "{\"id\":\"sprite-abc123\",\"name\":\"my-sandbox\",\"status\":\"running\",\"lastActivityAt\":\"2026-01-25T02:00:00Z\",\"createdAt\":\"2026-01-25T02:00:00Z\"}"
    }
  ]
}
```

**Response Content**:
The `text` field contains a JSON string with the created sprite details:

| Field            | Type   | Description                                      |
| ---------------- | ------ | ------------------------------------------------ |
| `id`             | string | Unique sprite ID                                 |
| `name`           | string | Sprite name                                      |
| `status`         | string | Current status (`running`, `provisioning`, etc.) |
| `lastActivityAt` | string | ISO 8601 timestamp                               |
| `createdAt`      | string | ISO 8601 timestamp                               |

#### Usage Example

```json
{
  "name": "sprite_create",
  "arguments": {
    "name": "dev-environment",
    "repoUrl": "https://github.com/user/my-app.git"
  }
}
```

#### Example Response

```json
{
  "content": [
    {
      "type": "text",
      "text": "{\n  \"id\": \"sprite-1737768000\",\n  \"name\": \"dev-environment\",\n  \"status\": \"running\",\n  \"lastActivityAt\": \"2026-01-25T02:00:00.000Z\",\n  \"createdAt\": \"2026-01-25T02:00:00.000Z\",\n  \"resourceLimits\": {\n    \"cpu\": 2,\n    \"memory\": 2048\n  }\n}"
    }
  ]
}
```

---

### sandbox_exec

Execute a shell command inside a sandbox.

**Tool Name**: `sprite_exec`

#### Input Schema

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "Name or ID of the sprite"
    },
    "command": {
      "type": "string",
      "description": "Command to execute"
    },
    "timeout": {
      "type": "number",
      "description": "Timeout in milliseconds (default: 30000)"
    }
  },
  "required": ["name", "command"]
}
```

#### Parameters

| Parameter | Type   | Required | Default | Description              |
| --------- | ------ | -------- | ------- | ------------------------ |
| `name`    | string | Yes      | -       | Sandbox name or ID       |
| `command` | string | Yes      | -       | Shell command to execute |
| `timeout` | number | No       | 30000   | Timeout in milliseconds  |

#### Response Format

```json
{
  "content": [
    {
      "type": "text",
      "text": "{\"stdout\":\"output here\",\"stderr\":\"\",\"exitCode\":0,\"durationMs\":125}"
    }
  ]
}
```

**Response Content**:
The `text` field contains a JSON string with execution results:

| Field        | Type   | Description                      |
| ------------ | ------ | -------------------------------- |
| `stdout`     | string | Standard output from the command |
| `stderr`     | string | Standard error from the command  |
| `exitCode`   | number | Exit code (0 = success)          |
| `durationMs` | number | Execution time in milliseconds   |

#### Usage Example

```json
{
  "name": "sprite_exec",
  "arguments": {
    "name": "dev-environment",
    "command": "npm install",
    "timeout": 60000
  }
}
```

#### Example Response

```json
{
  "content": [
    {
      "type": "text",
      "text": "{\n  \"stdout\": \"added 245 packages in 5.2s\\n\",\n  \"stderr\": \"\",\n  \"exitCode\": 0,\n  \"durationMs\": 5234\n}"
    }
  ]
}
```

---

### sandbox_checkpoint

Create a checkpoint (snapshot) of a sandbox's current state.

**Tool Name**: `sprite_checkpoint`

#### Input Schema

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "Name or ID of the sprite"
    },
    "checkpointName": {
      "type": "string",
      "description": "Optional name/comment for the checkpoint"
    }
  },
  "required": ["name"]
}
```

#### Parameters

| Parameter        | Type   | Required | Description                              |
| ---------------- | ------ | -------- | ---------------------------------------- |
| `name`           | string | Yes      | Sandbox name or ID                       |
| `checkpointName` | string | No       | Optional name/comment for the checkpoint |

#### Response Format

```json
{
  "content": [
    {
      "type": "text",
      "text": "{\"id\":\"ckpt-xyz789\",\"spriteId\":\"sprite-abc123\",\"name\":\"before-deploy\",\"createdAt\":\"2026-01-25T02:00:00Z\",\"sizeBytes\":1048576}"
    }
  ]
}
```

**Response Content**:
The `text` field contains a JSON string with checkpoint details:

| Field       | Type   | Description                                |
| ----------- | ------ | ------------------------------------------ |
| `id`        | string | Unique checkpoint ID                       |
| `spriteId`  | string | ID of the sprite                           |
| `name`      | string | Checkpoint name/comment                    |
| `createdAt` | string | ISO 8601 timestamp                         |
| `sizeBytes` | number | Size of the checkpoint in bytes (optional) |

#### Usage Example

```json
{
  "name": "sprite_checkpoint",
  "arguments": {
    "name": "dev-environment",
    "checkpointName": "before-deployment"
  }
}
```

#### Example Response

```json
{
  "content": [
    {
      "type": "text",
      "text": "{\n  \"id\": \"ckpt-1737768100\",\n  \"spriteId\": \"sprite-1737768000\",\n  \"name\": \"before-deployment\",\n  \"createdAt\": \"2026-01-25T02:01:40.000Z\",\n  \"sizeBytes\": 1048576\n}"
    }
  ]
}
```

---

### sandbox_restore

Restore a sandbox to a previous checkpoint.

**Tool Name**: `sprite_restore`

#### Input Schema

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "Name or ID of the sprite"
    },
    "checkpointId": {
      "type": "string",
      "description": "ID of the checkpoint to restore"
    }
  },
  "required": ["name", "checkpointId"]
}
```

#### Parameters

| Parameter      | Type   | Required | Description                     |
| -------------- | ------ | -------- | ------------------------------- |
| `name`         | string | Yes      | Sandbox name or ID              |
| `checkpointId` | string | Yes      | ID of the checkpoint to restore |

#### Response Format

```json
{
  "content": [
    {
      "type": "text",
      "text": "Successfully restored sprite 'dev-environment' to checkpoint 'ckpt-xyz789'"
    }
  ]
}
```

**Response Content**:
A success message confirming the restore operation.

#### Usage Example

```json
{
  "name": "sprite_restore",
  "arguments": {
    "name": "dev-environment",
    "checkpointId": "ckpt-1737768100"
  }
}
```

#### Example Response

```json
{
  "content": [
    {
      "type": "text",
      "text": "Successfully restored sprite 'dev-environment' to checkpoint 'ckpt-1737768100'"
    }
  ]
}
```

---

### sandbox_list_checkpoints

List all checkpoints for a sandbox.

> **Note**: This tool is implemented via the `sprite_list` tool, which lists all sprites. To list checkpoints, you would need to use the REST API endpoint `GET /api/sandboxes/:name/checkpoints`. The MCP server does not currently expose a dedicated `sandbox_list_checkpoints` tool.

**Alternative**: Use the REST API:

```bash
curl http://localhost:3008/api/sandboxes/dev-environment/checkpoints
```

---

### sandbox_list

List all active sandboxes.

**Tool Name**: `sprite_list`

#### Input Schema

```json
{
  "type": "object",
  "properties": {}
}
```

#### Parameters

No parameters required.

#### Response Format

```json
{
  "content": [
    {
      "type": "text",
      "text": "[{\"id\":\"sprite-abc123\",\"name\":\"sandbox1\",\"status\":\"running\",...},{...}]"
    }
  ]
}
```

**Response Content**:
The `text` field contains a JSON array of sprites, each with:

| Field            | Type   | Description        |
| ---------------- | ------ | ------------------ |
| `id`             | string | Unique sprite ID   |
| `name`           | string | Sprite name        |
| `status`         | string | Current status     |
| `lastActivityAt` | string | ISO 8601 timestamp |
| `createdAt`      | string | ISO 8601 timestamp |

#### Usage Example

```json
{
  "name": "sprite_list",
  "arguments": {}
}
```

#### Example Response

```json
{
  "content": [
    {
      "type": "text",
      "text": "[\n  {\n    \"id\": \"sprite-1737768000\",\n    \"name\": \"dev-environment\",\n    \"status\": \"running\",\n    \"lastActivityAt\": \"2026-01-25T02:05:00.000Z\",\n    \"createdAt\": \"2026-01-25T02:00:00.000Z\"\n  },\n  {\n    \"id\": \"sprite-1737768200\",\n    \"name\": \"test-env\",\n    \"status\": \"shutdown\",\n    \"lastActivityAt\": \"2026-01-25T01:30:00.000Z\",\n    \"createdAt\": \"2026-01-25T01:00:00.000Z\"\n  }\n]"
    }
  ]
}
```

---

### sandbox_shutdown

Shutdown (hibernate) a running sandbox to save resources.

**Tool Name**: `sprite_shutdown`

#### Input Schema

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "Name or ID of the sprite"
    }
  },
  "required": ["name"]
}
```

#### Parameters

| Parameter | Type   | Required | Description        |
| --------- | ------ | -------- | ------------------ |
| `name`    | string | Yes      | Sandbox name or ID |

#### Response Format

```json
{
  "content": [
    {
      "type": "text",
      "text": "Shutdown initiated for sprite 'dev-environment'"
    }
  ]
}
```

**Response Content**:
A confirmation message that shutdown has been initiated.

#### Usage Example

```json
{
  "name": "sprite_shutdown",
  "arguments": {
    "name": "dev-environment"
  }
}
```

#### Example Response

```json
{
  "content": [
    {
      "type": "text",
      "text": "Shutdown initiated for sprite 'dev-environment'"
    }
  ]
}
```

---

### sandbox_wake

Wake (start) a hibernated sandbox.

**Tool Name**: `sprite_wake`

#### Input Schema

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "Name or ID of the sprite"
    }
  },
  "required": ["name"]
}
```

#### Parameters

| Parameter | Type   | Required | Description        |
| --------- | ------ | -------- | ------------------ |
| `name`    | string | Yes      | Sandbox name or ID |

#### Response Format

```json
{
  "content": [
    {
      "type": "text",
      "text": "Wake initiated for sprite 'dev-environment'"
    }
  ]
}
```

**Response Content**:
A confirmation message that wake has been initiated.

#### Usage Example

```json
{
  "name": "sprite_wake",
  "arguments": {
    "name": "dev-environment"
  }
}
```

#### Example Response

```json
{
  "content": [
    {
      "type": "text",
      "text": "Wake initiated for sprite 'dev-environment'"
    }
  ]
}
```

---

## Common Patterns

### Workflow: Create and Test in Sandbox

```javascript
// 1. Create a new sandbox
{
  "name": "sprite_create",
  "arguments": {
    "name": "test-app",
    "repoUrl": "https://github.com/user/app.git"
  }
}

// 2. Install dependencies
{
  "name": "sprite_exec",
  "arguments": {
    "name": "test-app",
    "command": "npm install"
  }
}

// 3. Create a checkpoint before running tests
{
  "name": "sprite_checkpoint",
  "arguments": {
    "name": "test-app",
    "checkpointName": "pre-test"
  }
}

// 4. Run tests
{
  "name": "sprite_exec",
  "arguments": {
    "name": "test-app",
    "command": "npm test"
  }
}

// 5. If tests fail, restore to checkpoint
{
  "name": "sprite_restore",
  "arguments": {
    "name": "test-app",
    "checkpointId": "ckpt-xyz789"
  }
}

// 6. Shutdown when done
{
  "name": "sprite_shutdown",
  "arguments": {
    "name": "test-app"
  }
}
```

### Error Handling

All tools return errors in the following format:

```json
{
  "content": [
    {
      "type": "text",
      "text": "Error: <error message>"
    }
  ],
  "isError": true
}
```

### Best Practices

1. **Naming**: Use descriptive, unique names for sandboxes
2. **Checkpoints**: Create checkpoints before risky operations
3. **Cleanup**: Shutdown or delete sandboxes when not in use
4. **Timeouts**: Set appropriate timeouts for long-running commands
5. **Error Handling**: Always check `isError` flag in responses

---

## Status Values

Sandbox status can be one of:

- `provisioning` - Sandbox is being created
- `running` - Sandbox is active and ready
- `warm` - Sandbox is ready but not actively running
- `cold` - Sandbox is hibernated
- `shutdown` - Sandbox is shut down
- `error` - An error occurred

---

## Additional Resources

- [REST API Documentation](./api-sandbox.md) - HTTP endpoints for sandbox management
- [MCP Specification](https://spec.modelcontextprotocol.io/) - Model Context Protocol documentation
- [Source Code](file:///C:/Users/justus/.gemini/antigravity/scratch/automaker/apps/server/src/mcp/sprite-mcp-server.ts) - MCP server implementation
