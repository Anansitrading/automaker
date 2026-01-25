# @automaker/sandbox Package Documentation

> [!NOTE]
> **Package Not Found**: The `libs/sandbox` package does not currently exist in the Automaker codebase.

## Status

The `@automaker/sandbox` package referenced in the documentation request (`libs/sandbox/src/index.ts`) has not been implemented yet.

## Current Sandbox Implementation

Automaker currently uses **Sprites.dev** as the sandbox provider, implemented through:

### SpriteService

Located at [`apps/server/src/services/sprite-service.ts`](file:///C:/Users/justus/.gemini/antigravity/scratch/automaker/apps/server/src/services/sprite-service.ts)

**Purpose**: High-level service for managing Sprites (cloud-based sandboxes)

**Key Methods**:

- `createSprite(config)` - Create new sandbox
- `deleteSprite(id, reason)` - Delete sandbox
- `execCommand(id, command, timeout)` - Execute command
- `createCheckpoint(id, comment)` - Create checkpoint
- `restoreCheckpoint(id, checkpointId)` - Restore checkpoint
- `shutdownSprite(id)` - Hibernate sandbox
- `wakeSprite(id)` - Wake sandbox

### SpriteApiClient

Located at [`apps/server/src/services/sprite-api-client.ts`](file:///C:/Users/justus/.gemini/antigravity/scratch/automaker/apps/server/src/services/sprite-api-client.ts)

**Purpose**: Low-level client for Sprites.dev REST API

**Exported Types**:

```typescript
interface Sprite {
  id: string;
  name: string;
  status: 'running' | 'warm' | 'cold' | 'shutdown' | 'provisioning' | 'error';
  lastActivityAt: string;
  createdAt: string;
  resourceLimits?: {
    cpu: number;
    memory: number;
  };
}

interface SpriteConfig {
  name: string;
  repoUrl?: string;
  branch?: string;
  env?: Record<string, string>;
}

interface Checkpoint {
  id: string;
  spriteId: string;
  name: string;
  createdAt: string;
  sizeBytes?: number;
}

interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
}
```

## Future Implementation

If a local `@automaker/sandbox` package is planned for future implementation (e.g., for local Firecracker-based sandboxes), it would likely include:

### Planned Services

#### SandboxService

- Unified interface for sandbox management
- Provider abstraction (Sprites.dev, Firecracker, etc.)

#### FirecrackerManager

- Local VM management using Firecracker
- Resource allocation and lifecycle

#### OverlayStorageManager

- Copy-on-write filesystem management
- Efficient storage for sandboxes

#### CheckpointManager

- Snapshot creation and restoration
- Checkpoint metadata management

### Planned Types

```typescript
// Example planned types (not implemented)
interface Sandbox {
  id: string;
  name: string;
  status: SandboxStatus;
  provider: 'sprites' | 'firecracker';
  createdAt: Date;
  resourceLimits: ResourceLimits;
}

type SandboxStatus = 'provisioning' | 'running' | 'hibernated' | 'stopped' | 'error';

interface SandboxConfig {
  name: string;
  provider?: 'sprites' | 'firecracker';
  resourceLimits?: Partial<ResourceLimits>;
  env?: Record<string, string>;
}

interface CheckpointMetadata {
  id: string;
  sandboxId: string;
  name: string;
  createdAt: Date;
  sizeBytes: number;
  description?: string;
}

interface ConsoleSession {
  sessionId: string;
  sandboxId: string;
  createdAt: Date;
  lastActivity: Date;
}

interface ResourceLimits {
  cpu: number; // vCPUs
  memory: number; // MB
  disk: number; // MB
}
```

### Planned Constants

```typescript
// Example planned constants (not implemented)
const SANDBOX_DEFAULTS = {
  provider: 'sprites' as const,
  resourceLimits: {
    cpu: 1,
    memory: 512,
    disk: 1024,
  },
  timeout: 60000,
};

const RESOURCE_LIMITS = {
  MIN_CPU: 1,
  MAX_CPU: 8,
  MIN_MEMORY: 512,
  MAX_MEMORY: 16384,
  MIN_DISK: 1024,
  MAX_DISK: 51200,
};
```

## See Also

- [REST API Documentation](./api-sandbox.md) - HTTP endpoints for sandbox management
- [MCP Tools Documentation](./mcp-sandbox-tools.md) - MCP tools for sandbox operations
- [SpriteService Implementation](file:///C:/Users/justus/.gemini/antigravity/scratch/automaker/apps/server/src/services/sprite-service.ts)
- [SpriteApiClient Implementation](file:///C:/Users/justus/.gemini/antigravity/scratch/automaker/apps/server/src/services/sprite-api-client.ts)

## Next Steps

To implement the `@automaker/sandbox` package:

1. Create package structure: `libs/sandbox/`
2. Define core interfaces and types
3. Implement provider abstraction
4. Add Firecracker support (optional)
5. Create comprehensive tests
6. Update documentation

---

**Last Updated**: 2026-01-25  
**Status**: Package Not Implemented
