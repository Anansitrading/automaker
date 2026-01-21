# Automaker Genesis Specification - Section 05: Architecture Design

**Version**: 1.0.0
**Last Updated**: 2026-01-20
**Status**: Active Development

---

## 5.1 High-Level Architecture

```
+-------------------------------------------------------------------------+
|                              Automaker                                   |
+-------------------------------------------------------------------------+
|                                                                         |
|  +---------------------------+    +----------------------------------+  |
|  |       Frontend (UI)       |    |         Backend (Server)         |  |
|  |  +---------------------+  |    |  +----------------------------+  |  |
|  |  |    React 19 App     |  |    |  |     Express 5 Server       |  |  |
|  |  |  - TanStack Router  |  |    |  |  - REST API Routes         |  |  |
|  |  |  - Zustand Stores   |  |    |  |  - WebSocket Events        |  |  |
|  |  |  - xterm.js         |  |    |  |  - Auth Middleware         |  |  |
|  |  |  - CodeMirror       |  |    |  +----------------------------+  |  |
|  |  +---------------------+  |    |               |                  |  |
|  |           |               |    |               v                  |  |
|  |  +---------------------+  |    |  +----------------------------+  |  |
|  |  |   Electron Main     |  |    |  |     Services Layer         |  |  |
|  |  |  - IPC Bridge       |  |    |  |  - AgentService            |  |  |
|  |  |  - Native APIs      |  |    |  |  - AutoModeService         |  |  |
|  |  +---------------------+  |    |  |  - TerminalService         |  |  |
|  +---------------------------+    |  |  - SettingsService         |  |  |
|                                   |  |  - FeatureLoader           |  |  |
|  +---------------------------+    |  +----------------------------+  |  |
|  |     Shared Libraries      |    |               |                  |  |
|  |  - @automaker/types      |    |               v                  |  |
|  |  - @automaker/utils      |    |  +----------------------------+  |  |
|  |  - @automaker/prompts    |    |  |     Provider Layer          |  |  |
|  |  - @automaker/platform   |    |  |  - Claude Provider          |  |  |
|  |  - @automaker/git-utils  |    |  |  - Codex Provider           |  |  |
|  +---------------------------+    |  |  - Cursor Provider          |  |  |
|                                   |  +----------------------------+  |  |
+-------------------------------------------------------------------------+
```

---

## 5.2 Module Structure

### Backend Module Structure

```
apps/server/src/
+-- index.ts                 # Entry point, server initialization
+-- lib/                     # Shared utilities
|   +-- auth.ts              # Authentication helpers
|   +-- events.ts            # Event emitter
|   +-- secure-fs.ts         # Secure file operations
|   +-- sdk-options.ts       # SDK configuration builder
|   +-- settings-helpers.ts  # Settings utilities
|
+-- middleware/              # Express middleware
|   +-- require-json-content-type.ts
|
+-- providers/               # AI provider implementations
|   +-- provider-factory.ts  # Provider selection
|   +-- claude-provider.ts   # Claude Agent SDK
|   +-- codex-provider.ts    # Codex integration
|   +-- cursor-provider.ts   # Cursor CLI
|   +-- opencode-provider.ts # OpenCode CLI
|
+-- routes/                  # REST API endpoints
|   +-- agent/               # Agent management
|   +-- auto-mode/           # Autonomous development
|   +-- sessions/            # Session CRUD
|   +-- terminal/            # Terminal access
|   +-- settings/            # Configuration
|   +-- git/                 # Git operations
|   +-- github/              # GitHub integration
|   +-- features/            # Feature management
|   +-- worktree/            # Git worktrees
|   ... (25+ route modules)
|
+-- services/                # Business logic
    +-- agent-service.ts     # Agent orchestration
    +-- auto-mode-service.ts # Auto-mode workflows
    +-- terminal-service.ts  # PTY management
    +-- settings-service.ts  # Settings persistence
    +-- feature-loader.ts    # Feature loading
    +-- pipeline-service.ts  # Pipeline execution
    +-- ideation-service.ts  # Feature brainstorming
    ... (18+ service modules)
```

### Frontend Module Structure

```
apps/ui/src/
+-- main.tsx                 # React entry point
+-- App.tsx                  # Root component
+-- index.css                # Global styles
|
+-- components/              # Reusable components
|   +-- ui/                  # Base UI (Radix-based)
|   |   +-- button.tsx
|   |   +-- dialog.tsx
|   |   +-- input.tsx
|   |   ...
|   +-- layout/              # Layout components
|   +-- session/             # Session components
|   +-- agent/               # Agent components
|   +-- terminal/            # Terminal components
|   +-- editor/              # Code editor
|   +-- auto-mode/           # Auto-mode UI
|
+-- routes/                  # Page components
|   +-- __root.tsx           # Root layout
|   +-- index.tsx            # Home page
|   +-- sessions.tsx         # Sessions view
|   +-- settings.tsx         # Settings page
|   ...
|
+-- stores/                  # Zustand state
|   +-- session-store.ts
|   +-- agent-store.ts
|   +-- settings-store.ts
|   +-- feature-store.ts
|
+-- hooks/                   # Custom React hooks
|   +-- useWebSocket.ts
|   +-- useAgent.ts
|   +-- useTerminal.ts
|
+-- lib/                     # Utilities
    +-- api.ts               # API client
    +-- utils.ts             # Helpers
```

---

## 5.3 Design Patterns

| Pattern           | Location                    | Purpose                                       |
| ----------------- | --------------------------- | --------------------------------------------- |
| **Factory**       | `provider-factory.ts`       | Create appropriate AI provider based on model |
| **Service Layer** | `services/`                 | Encapsulate business logic from routes        |
| **Event Emitter** | `lib/events.ts`             | Decouple components via pub/sub               |
| **Repository**    | `SettingsService`           | Abstract data persistence                     |
| **Adapter**       | Provider classes            | Unified interface for AI providers            |
| **Strategy**      | Planning modes              | Interchangeable planning algorithms           |
| **Observer**      | WebSocket events            | Real-time UI updates                          |
| **Singleton**     | Terminal/DevServer services | Shared stateful resources                     |
| **Builder**       | `sdk-options.ts`            | Construct complex SDK options                 |
| **Middleware**    | Express middleware          | Request processing pipeline                   |

### Pattern Examples

**Factory Pattern - Provider Selection:**

```typescript
// provider-factory.ts
class ProviderFactory {
  static getProviderForModel(model: string): Provider {
    if (model.startsWith('claude-')) {
      return new ClaudeProvider();
    } else if (model.startsWith('codex-')) {
      return new CodexProvider();
    }
    throw new Error(`Unknown model: ${model}`);
  }
}
```

**Event Emitter Pattern:**

```typescript
// lib/events.ts
interface EventEmitter {
  emit(type: string, payload: unknown): void;
  subscribe(callback: EventCallback): () => void;
}
```

---

## 5.4 API Design

### REST API Structure

| Method        | Endpoint                    | Purpose                |
| ------------- | --------------------------- | ---------------------- |
| **Sessions**  |
| POST          | /api/sessions               | Create session         |
| GET           | /api/sessions               | List sessions          |
| PUT           | /api/sessions/:id           | Update session         |
| DELETE        | /api/sessions/:id           | Delete session         |
| **Agent**     |
| POST          | /api/agent/start            | Start conversation     |
| POST          | /api/agent/send             | Send message           |
| POST          | /api/agent/stop             | Stop agent             |
| GET           | /api/agent/history          | Get history            |
| **Auto-Mode** |
| POST          | /api/auto-mode/run-feature  | Start feature          |
| POST          | /api/auto-mode/approve-plan | Approve plan           |
| POST          | /api/auto-mode/verify       | Verify feature         |
| POST          | /api/auto-mode/commit       | Commit changes         |
| **Terminal**  |
| POST          | /api/terminal/sessions      | Create terminal        |
| DELETE        | /api/terminal/sessions/:id  | Kill terminal          |
| **Settings**  |
| GET           | /api/settings/global        | Get global settings    |
| POST          | /api/settings/global        | Update global settings |
| GET           | /api/settings/project       | Get project settings   |

### WebSocket API

| Endpoint           | Events                                                    |
| ------------------ | --------------------------------------------------------- |
| `/api/events`      | agent:stream, agent:complete, agent:error, feature:status |
| `/api/terminal/ws` | connected, scrollback, data, exit                         |

---

## 5.5 Integration Points

### External Integrations

| Integration   | Protocol   | Purpose                |
| ------------- | ---------- | ---------------------- |
| Anthropic API | HTTPS      | Claude model inference |
| OpenAI API    | HTTPS      | Codex model inference  |
| GitHub API    | HTTPS      | PRs, issues, repos     |
| MCP Servers   | stdio/HTTP | Extended tools         |
| Cursor CLI    | subprocess | Cursor model access    |

### Internal Integrations

| From     | To        | Method        |
| -------- | --------- | ------------- |
| Routes   | Services  | Direct call   |
| Services | Events    | Event emitter |
| Events   | WebSocket | Broadcast     |
| UI       | Backend   | HTTP/WS       |
| Electron | Backend   | localhost     |

---

## 5.6 Architectural Decisions

### ADR-001: Monorepo Structure

**Context:** Need to share code between frontend and backend.

**Decision:** Use npm workspaces with `libs/` for shared packages.

**Rationale:**

- Single repository for all code
- Shared TypeScript types
- Atomic commits across packages
- Simplified dependency management

### ADR-002: Service Layer Pattern

**Context:** Business logic was mixed into route handlers.

**Decision:** Extract all business logic into dedicated service classes.

**Rationale:**

- Separation of concerns
- Easier testing (mock services)
- Reusable logic across routes
- Clear ownership of functionality

### ADR-003: Provider Abstraction

**Context:** Need to support multiple AI providers with different APIs.

**Decision:** Create provider interface with factory pattern.

**Rationale:**

- Unified interface for all providers
- Easy to add new providers
- Swap providers at runtime
- Consistent error handling

### ADR-004: Event-Driven Architecture

**Context:** UI needs real-time updates from backend operations.

**Decision:** Use WebSocket with event emitter pattern.

**Rationale:**

- Low latency updates
- Decoupled components
- Scalable to multiple clients
- Works with existing React patterns

### ADR-005: Git Worktree Isolation

**Context:** Features developed concurrently could conflict.

**Decision:** Each feature runs in its own git worktree.

**Rationale:**

- Complete isolation between features
- No merge conflicts during development
- Easy cleanup after completion
- Supports parallel development

---

## 5.7 Quality Checklist

- [x] Architecture is clearly diagrammed
- [x] Modules have defined responsibilities
- [x] Design patterns are documented
- [x] API contracts are specified
- [x] Integration points are mapped
- [x] Architectural decisions have rationale (ADR style)
