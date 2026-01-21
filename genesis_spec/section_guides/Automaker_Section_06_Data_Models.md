# Automaker Genesis Specification - Section 06: Data Models

**Version**: 1.0.0
**Last Updated**: 2026-01-20
**Status**: Active Development

---

## 6.1 Core Entities

### Session

```typescript
interface AgentSession {
  id: string; // Unique identifier (msg_timestamp_random)
  name: string; // User-defined session name
  projectPath?: string; // Associated project directory
  workingDirectory: string; // Current working directory
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
  archived?: boolean; // Soft delete flag
  tags?: string[]; // User-defined tags
  model?: string; // AI model (e.g., "claude-sonnet-4-20250514")
  sdkSessionId?: string; // Claude SDK session for continuity
}
```

### Message

```typescript
interface Message {
  id: string; // Unique identifier
  role: 'user' | 'assistant'; // Message sender
  content: string; // Text content
  images?: Array<{
    // Optional image attachments
    data: string; // Base64 encoded
    mimeType: string; // e.g., "image/png"
    filename: string; // Original filename
  }>;
  timestamp: string; // ISO 8601 timestamp
  isError?: boolean; // Error message flag
}
```

### Feature

```typescript
interface Feature {
  id: string; // Unique identifier
  name: string; // Feature name
  description: string; // Detailed description
  status: FeatureStatus; // Current state
  priority: number; // Execution order
  dependencies: string[]; // Feature IDs this depends on
  images?: FeatureImagePath[]; // Associated images
  textFiles?: FeatureTextFilePath[]; // Associated text files
  createdAt?: string; // ISO 8601 timestamp
  updatedAt?: string; // ISO 8601 timestamp
  descriptionHistory?: DescriptionHistoryEntry[];
}

type FeatureStatus =
  | 'pending'
  | 'planning'
  | 'approved'
  | 'implementing'
  | 'verifying'
  | 'committing'
  | 'done'
  | 'error';
```

### Settings

```typescript
interface GlobalSettings {
  theme: ThemeMode; // 'light' | 'dark' | 'system'
  defaultModel: string; // Default AI model
  maxConcurrentAgents: number; // Parallel agent limit
  telemetryEnabled: boolean; // Usage analytics
  autoUpdate: boolean; // Auto-update setting
  serverLogLevel: ServerLogLevel; // 'error' | 'warn' | 'info' | 'debug'
  enableRequestLogging: boolean; // HTTP request logging
  keyboardShortcuts: KeyboardShortcuts;
  phaseModels: PhaseModelConfig; // Model per auto-mode phase
  boardBackground: BoardBackgroundSettings;
  eventHooks: EventHook[]; // Custom event triggers
  mcpServers: Record<string, MCPServerConfig>;
  skillsEnabled: boolean;
  skillsSources: Array<'user' | 'project'>;
  subagentsEnabled: boolean;
  subagentsSources: Array<'user' | 'project'>;
}

interface ProjectSettings {
  name: string; // Project name
  model?: string; // Override model
  autoModeEnabled: boolean; // Enable auto-mode
  planningMode: PlanningMode; // 'skip' | 'lite' | 'spec' | 'full'
  autoLoadClaudeMd: boolean; // Load CLAUDE.md automatically
  gitWorkflow: {
    branchPrefix: string; // e.g., "feature/"
    commitPrefix: string; // e.g., "feat:"
    autoCommit: boolean; // Auto-commit on completion
  };
  hooks: {
    preToolUse?: string[]; // Commands before tool use
    postToolUse?: string[]; // Commands after tool use
  };
}

interface Credentials {
  anthropicApiKey?: string; // Encrypted API key
  githubToken?: string; // GitHub access token
  cursorSession?: string; // Cursor session token
  codexApiKey?: string; // Codex API key
}
```

### Provider Types

```typescript
interface ProviderConfig {
  model: string; // Model identifier
  apiKey?: string; // API authentication
  timeout?: number; // Request timeout (ms)
}

interface ExecuteOptions {
  prompt: string; // User prompt
  model: string; // Bare model ID
  originalModel: string; // Model with prefix
  cwd: string; // Working directory
  systemPrompt?: string; // System prompt
  maxTurns?: number; // Max agentic turns
  allowedTools?: string[]; // Permitted tools
  abortController: AbortController;
  conversationHistory?: ConversationMessage[];
  settingSources?: Array<'user' | 'project'>;
  sdkSessionId?: string; // Resume session
  mcpServers?: Record<string, McpServerConfig>;
  agents?: Record<string, AgentDefinition>;
  thinkingLevel?: ThinkingLevel; // Claude thinking mode
  reasoningEffort?: ReasoningEffort; // Codex reasoning
}
```

---

## 6.2 Entity Relationships

```
+----------------+       +----------------+
|    Session     |       |    Feature     |
+----------------+       +----------------+
| id             |       | id             |
| name           |       | name           |
| projectPath    |       | description    |
| messages[]     +------>+ status         |
| model          |       | priority       |
+-------+--------+       | dependencies[] |
        |                +--------+-------+
        |                         |
        v                         v
+----------------+       +----------------+
|    Message     |       |   Worktree     |
+----------------+       +----------------+
| id             |       | path           |
| role           |       | branch         |
| content        |       | featureId      |
| images[]       |       +----------------+
| timestamp      |
+----------------+

+----------------+       +----------------+
| GlobalSettings |       |ProjectSettings |
+----------------+       +----------------+
| theme          |       | name           |
| defaultModel   |       | model          |
| eventHooks[]   |       | planningMode   |
| mcpServers{}   |       | gitWorkflow{}  |
+-------+--------+       +--------+-------+
        |                         |
        +------------+------------+
                     |
                     v
              +--------------+
              |  Credentials |
              +--------------+
              | anthropicKey |
              | githubToken  |
              +--------------+
```

---

## 6.3 Database Schema

Automaker uses **file-based storage** (JSON) rather than a traditional database.

### Storage Locations

```
~/.automaker/                       # Global config directory
+-- settings.json                   # GlobalSettings
+-- credentials.json                # Credentials (encrypted)
+-- usage/                          # Usage tracking
|
+-- data/                           # Server data directory
    +-- sessions-metadata.json      # Session index
    +-- agent-sessions/             # Session data
    |   +-- {sessionId}.json        # Messages array
    |   +-- {sessionId}-queue.json  # Prompt queue
    |
    +-- notifications/              # Notification storage
        +-- notifications.json

{project}/.automaker/               # Per-project config
+-- settings.json                   # ProjectSettings
+-- features/                       # Feature data
|   +-- {featureId}/
|       +-- spec.md                 # Feature specification
|       +-- plan.json               # Implementation plan
|       +-- progress.json           # Status tracking
|
+-- agent-sessions/                 # Project-scoped sessions
    +-- {sessionId}/
        +-- messages.json
        +-- events.json
        +-- state.json
```

### File Schemas

**sessions-metadata.json:**

```json
{
  "session_123": {
    "id": "session_123",
    "name": "Feature Development",
    "projectPath": "/home/user/project",
    "workingDirectory": "/home/user/project",
    "createdAt": "2026-01-20T10:00:00Z",
    "updatedAt": "2026-01-20T12:30:00Z",
    "archived": false,
    "model": "claude-sonnet-4-20250514"
  }
}
```

**{sessionId}.json (Messages):**

```json
[
  {
    "id": "msg_1705741200_abc123",
    "role": "user",
    "content": "Help me refactor the auth module",
    "timestamp": "2026-01-20T10:00:00Z"
  },
  {
    "id": "msg_1705741260_def456",
    "role": "assistant",
    "content": "I'll help you refactor...",
    "timestamp": "2026-01-20T10:01:00Z"
  }
]
```

---

## 6.4 API Schemas

### Request Schemas

**Create Session:**

```typescript
interface CreateSessionParams {
  name: string;
  projectPath?: string;
  workingDirectory?: string;
  model?: string;
}
```

**Send Message:**

```typescript
interface SendMessageRequest {
  sessionId: string;
  message: string;
  workingDirectory?: string;
  imagePaths?: string[];
  model?: string;
  thinkingLevel?: ThinkingLevel;
  reasoningEffort?: ReasoningEffort;
}
```

**Run Feature:**

```typescript
interface RunFeatureRequest {
  featureId: string;
  projectPath: string;
  planningMode?: PlanningMode;
  model?: string;
}
```

### Response Schemas

**Session Response:**

```typescript
interface SessionResponse {
  success: boolean;
  session?: AgentSession;
  error?: string;
}
```

**Agent Stream Event:**

```typescript
interface AgentStreamEvent {
  type: 'started' | 'stream' | 'tool_use' | 'complete' | 'error';
  sessionId: string;
  messageId?: string;
  content?: string;
  tool?: { name: string; input: unknown };
  error?: string;
}
```

---

## 6.5 Configuration Schema

### Environment Variables

| Variable               | Type    | Default | Description     |
| ---------------------- | ------- | ------- | --------------- |
| PORT                   | number  | 3008    | Server port     |
| HOST                   | string  | 0.0.0.0 | Server host     |
| DATA_DIR               | string  | ./data  | Data directory  |
| ANTHROPIC_API_KEY      | string  | -       | Claude API key  |
| CORS_ORIGIN            | string  | -       | Allowed origins |
| ENABLE_REQUEST_LOGGING | boolean | true    | HTTP logging    |

### MCP Server Configuration

```typescript
interface McpServerConfig {
  type: 'stdio' | 'sse' | 'http';
  command?: string;              // stdio: executable
  args?: string[];               // stdio: arguments
  url?: string;                  // sse/http: server URL
  env?: Record<string, string>;  // Environment variables
}

// Example:
{
  "filesystem": {
    "type": "stdio",
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-filesystem", "/home"]
  }
}
```

---

## 6.6 Quality Checklist

- [x] All core entities documented with TypeScript interfaces
- [x] Field types and purposes are specified
- [x] Entity relationships are diagrammed
- [x] Storage locations are documented
- [x] API request/response schemas provided
- [x] Configuration schema includes env vars and MCP config
- [x] Validation rules implied through types
