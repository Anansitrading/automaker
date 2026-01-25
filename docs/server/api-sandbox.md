# Sandbox REST API Documentation

This document describes the REST API endpoints for managing sandboxes (sprites) in Automaker.

**Base URL**: `/api/sandboxes`

---

## Table of Contents

- [Create Sandbox](#create-sandbox)
- [List Sandboxes](#list-sandboxes)
- [Get Sandbox](#get-sandbox)
- [Delete Sandbox](#delete-sandbox)
- [Execute Command](#execute-command)
- [Interactive Console (WebSocket)](#interactive-console-websocket)
- [Hibernate Sandbox](#hibernate-sandbox)
- [Wake Sandbox](#wake-sandbox)
- [Checkpoint Management](#checkpoint-management)

---

## Create Sandbox

Create a new sandbox instance.

**Endpoint**: `POST /api/sandboxes`

### Request

**Headers**:

```
Content-Type: application/json
```

**Body**:

```json
{
  "name": "my-sandbox",
  "repoUrl": "https://github.com/user/repo.git",
  "branch": "main",
  "env": {
    "NODE_ENV": "development",
    "API_KEY": "secret"
  }
}
```

**Parameters**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Unique name for the sandbox |
| `repoUrl` | string | No | Git repository URL (uses default if not provided) |
| `branch` | string | No | Git branch (defaults to 'main') |
| `env` | object | No | Environment variables |

### Response

**Status**: `200 OK`

```json
{
  "id": "sprite-abc123",
  "name": "my-sandbox",
  "status": "running",
  "lastActivityAt": "2026-01-25T02:00:00Z",
  "createdAt": "2026-01-25T02:00:00Z",
  "resourceLimits": {
    "cpu": 2,
    "memory": 2048
  }
}
```

**Sprite Status Values**:

- `provisioning` - Sandbox is being created
- `running` - Sandbox is active and ready
- `warm` - Sandbox is ready but not actively running
- `cold` - Sandbox is hibernated
- `shutdown` - Sandbox is shut down
- `error` - An error occurred

### Errors

| Status | Error                 | Description              |
| ------ | --------------------- | ------------------------ |
| `500`  | Internal Server Error | Failed to create sandbox |

---

## List Sandboxes

Retrieve all sandboxes for the current account.

**Endpoint**: `GET /api/sandboxes`

### Request

No parameters required.

### Response

**Status**: `200 OK`

```json
[
  {
    "id": "sprite-abc123",
    "name": "my-sandbox",
    "status": "running",
    "lastActivityAt": "2026-01-25T02:00:00Z",
    "createdAt": "2026-01-25T02:00:00Z"
  },
  {
    "id": "sprite-def456",
    "name": "another-sandbox",
    "status": "shutdown",
    "lastActivityAt": "2026-01-24T12:00:00Z",
    "createdAt": "2026-01-24T12:00:00Z"
  }
]
```

### Errors

| Status | Error                 | Description              |
| ------ | --------------------- | ------------------------ |
| `500`  | Internal Server Error | Failed to list sandboxes |

---

## Get Sandbox

Retrieve details for a specific sandbox.

**Endpoint**: `GET /api/sandboxes/:name`

### Request

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | string | Sandbox name or ID |

### Response

**Status**: `200 OK`

```json
{
  "id": "sprite-abc123",
  "name": "my-sandbox",
  "status": "running",
  "lastActivityAt": "2026-01-25T02:00:00Z",
  "createdAt": "2026-01-25T02:00:00Z",
  "resourceLimits": {
    "cpu": 2,
    "memory": 2048
  }
}
```

### Errors

| Status | Error                 | Description           |
| ------ | --------------------- | --------------------- |
| `500`  | Internal Server Error | Failed to get sandbox |

---

## Delete Sandbox

Permanently delete a sandbox.

**Endpoint**: `DELETE /api/sandboxes/:name`

### Request

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | string | Sandbox name or ID |

### Response

**Status**: `204 No Content`

No response body.

### Errors

| Status | Error                 | Description              |
| ------ | --------------------- | ------------------------ |
| `500`  | Internal Server Error | Failed to delete sandbox |

---

## Execute Command

Execute a shell command in a sandbox.

**Endpoint**: `POST /api/sandboxes/:name/exec`

### Request

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | string | Sandbox name or ID |

**Headers**:

```
Content-Type: application/json
```

**Body**:

```json
{
  "command": "ls -la",
  "timeout": 30000
}
```

**Parameters**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `command` | string | Yes | Shell command to execute |
| `timeout` | number | No | Timeout in milliseconds (default: 60000) |

### Response

**Status**: `200 OK`

```json
{
  "stdout": "/home/user/app\ntotal 48\ndrwxr-xr-x 6 user user 4096 Jan 25 02:00 .\n",
  "stderr": "",
  "exitCode": 0,
  "durationMs": 125
}
```

**Fields**:
| Field | Type | Description |
|-------|------|-------------|
| `stdout` | string | Standard output from the command |
| `stderr` | string | Standard error from the command |
| `exitCode` | number | Exit code (0 = success) |
| `durationMs` | number | Execution time in milliseconds |

### Errors

| Status | Error                 | Description               |
| ------ | --------------------- | ------------------------- |
| `400`  | Bad Request           | Command is required       |
| `500`  | Internal Server Error | Failed to execute command |

---

## Interactive Console (WebSocket)

Open an interactive terminal session with a sandbox via WebSocket.

**Endpoint**: `WS /api/sandboxes/:name/console`

### Connection

**URL**: `ws://localhost:3008/api/sandboxes/:name/console?cols=80&rows=24`

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | string | Sandbox name or ID |

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `cols` | number | 80 | Terminal width in columns |
| `rows` | number | 24 | Terminal height in rows |
| `sessionId` | string | auto | Session ID for reconnection |
| `id` | string | - | Reconnect to specific sprite session |

### Messages

#### Client → Server

**Input Message**:

```json
{
  "type": "input",
  "data": "ls -la\n"
}
```

**Resize Message**:

```json
{
  "type": "resize",
  "cols": 120,
  "rows": 30
}
```

**Ping Message**:

```json
{
  "type": "ping"
}
```

#### Server → Client

**Connected Message**:

```json
{
  "type": "connected",
  "sessionId": "session-1737768000-abc123",
  "sandboxName": "my-sandbox"
}
```

**Data Message** (terminal output):

```json
{
  "type": "data",
  "data": "$ ls -la\ntotal 48\ndrwxr-xr-x 6 user user 4096\n"
}
```

**Pong Message**:

```json
{
  "type": "pong"
}
```

**Exit Message**:

```json
{
  "type": "exit",
  "exitCode": 0
}
```

**Error Message**:

```json
{
  "type": "error",
  "message": "Upstream connection error"
}
```

### WebSocket Close Codes

| Code   | Reason           | Description                      |
| ------ | ---------------- | -------------------------------- |
| `1000` | Normal Closure   | Session ended normally           |
| `1008` | Policy Violation | Sandbox name required            |
| `1011` | Internal Error   | Server error or upstream failure |

---

## Hibernate Sandbox

Shut down a sandbox to save resources (can be woken later).

**Endpoint**: `POST /api/sandboxes/:name/shutdown`

### Request

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | string | Sandbox name or ID |

### Response

**Status**: `200 OK`

```json
{
  "status": "shutdown_initiated"
}
```

### Errors

| Status | Error                 | Description                |
| ------ | --------------------- | -------------------------- |
| `500`  | Internal Server Error | Failed to shutdown sandbox |

---

## Wake Sandbox

Wake a hibernated sandbox.

**Endpoint**: `POST /api/sandboxes/:name/wake`

### Request

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | string | Sandbox name or ID |

### Response

**Status**: `200 OK`

```json
{
  "status": "wake_initiated"
}
```

### Errors

| Status | Error                 | Description            |
| ------ | --------------------- | ---------------------- |
| `500`  | Internal Server Error | Failed to wake sandbox |

---

## Checkpoint Management

### Create Checkpoint

Create a snapshot of the current sandbox state.

**Endpoint**: `POST /api/sandboxes/:name/checkpoints`

#### Request

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | string | Sandbox name or ID |

**Headers**:

```
Content-Type: application/json
```

**Body** (optional):

```json
{
  "name": "before-deployment"
}
```

**Parameters**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | No | Checkpoint name/comment |

#### Response

**Status**: `200 OK`

```json
{
  "id": "ckpt-xyz789",
  "spriteId": "sprite-abc123",
  "name": "before-deployment",
  "createdAt": "2026-01-25T02:00:00Z",
  "sizeBytes": 1048576
}
```

#### Errors

| Status | Error                 | Description                 |
| ------ | --------------------- | --------------------------- |
| `500`  | Internal Server Error | Failed to create checkpoint |

---

### List Checkpoints

List all checkpoints for a sandbox.

**Endpoint**: `GET /api/sandboxes/:name/checkpoints`

#### Request

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | string | Sandbox name or ID |

#### Response

**Status**: `200 OK`

```json
[
  {
    "id": "ckpt-xyz789",
    "spriteId": "sprite-abc123",
    "name": "before-deployment",
    "createdAt": "2026-01-25T02:00:00Z",
    "sizeBytes": 1048576
  },
  {
    "id": "ckpt-abc123",
    "spriteId": "sprite-abc123",
    "name": "initial-state",
    "createdAt": "2026-01-25T01:00:00Z",
    "sizeBytes": 524288
  }
]
```

#### Errors

| Status | Error                 | Description                |
| ------ | --------------------- | -------------------------- |
| `500`  | Internal Server Error | Failed to list checkpoints |

---

### Restore Checkpoint

Restore a sandbox to a previous checkpoint.

**Endpoint**: `POST /api/sandboxes/:name/checkpoints/:id/restore`

#### Request

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | string | Sandbox name or ID |
| `id` | string | Checkpoint ID |

#### Response

**Status**: `200 OK`

```json
{
  "status": "restored"
}
```

#### Errors

| Status | Error                 | Description                  |
| ------ | --------------------- | ---------------------------- |
| `500`  | Internal Server Error | Failed to restore checkpoint |

---

## Additional Endpoints

### Get Console URL

Get the web dashboard URL for a sandbox.

**Endpoint**: `GET /api/sandboxes/:name/url`

#### Request

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | string | Sandbox name or ID |

#### Response

**Status**: `200 OK`

```json
{
  "url": "https://sprites.dev/dashboard/sprites/my-sandbox"
}
```

#### Errors

| Status | Error                 | Description               |
| ------ | --------------------- | ------------------------- |
| `500`  | Internal Server Error | Failed to get console URL |
