# Automaker Genesis Specification - Section 09: Monitoring & Observability

**Version**: 1.0.0
**Last Updated**: 2026-01-20
**Status**: Active Development

---

## 9.1 Observability Architecture

### Three Pillars

```
+-------------------------------------------------------------------------+
|                      Observability Stack                                 |
+-------------------------------------------------------------------------+
|                                                                         |
|  +---------------------+  +---------------------+  +------------------+ |
|  |       LOGS          |  |      METRICS        |  |     TRACES       | |
|  |                     |  |                     |  |                  | |
|  | - Request logs      |  | - HTTP status codes |  | - WebSocket      | |
|  | - Error logs        |  | - Session counts    |  |   connections    | |
|  | - Event history     |  | - Agent usage       |  | - API latency    | |
|  | - Agent activity    |  | - Terminal sessions |  | - Event flow     | |
|  |                     |  |                     |  |                  | |
|  | Morgan + Custom     |  | Event-based         |  | Event History    | |
|  +---------------------+  +---------------------+  +------------------+ |
|                                                                         |
+-------------------------------------------------------------------------+
```

---

## 9.2 Logging

### Log Levels

| Level | Use Case           | Example                                |
| ----- | ------------------ | -------------------------------------- |
| ERROR | System failures    | `Failed to save session: ENOENT`       |
| WARN  | Recoverable issues | `No ANTHROPIC_API_KEY configured`      |
| INFO  | Normal operations  | `Agent service initialized`            |
| DEBUG | Detailed tracing   | `Event received: { type, hasPayload }` |

### Logger Implementation

```typescript
// @automaker/utils - createLogger
import { createLogger, setLogLevel, LogLevel } from '@automaker/utils';

const logger = createLogger('AgentService');

// Configure log level from settings
const LOG_LEVEL_MAP: Record<string, LogLevel> = {
  error: LogLevel.ERROR,
  warn: LogLevel.WARN,
  info: LogLevel.INFO,
  debug: LogLevel.DEBUG,
};

// Set level at startup
const settings = await settingsService.getGlobalSettings();
if (settings.serverLogLevel) {
  setLogLevel(LOG_LEVEL_MAP[settings.serverLogLevel]);
}
```

### Request Logging

```typescript
// Morgan middleware with colored status codes
morgan.token('status-colored', (_req, res) => {
  const status = res.statusCode;
  if (status >= 500) return `\x1b[31m${status}\x1b[0m`; // Red
  if (status >= 400) return `\x1b[33m${status}\x1b[0m`; // Yellow
  if (status >= 300) return `\x1b[36m${status}\x1b[0m`; // Cyan
  return `\x1b[32m${status}\x1b[0m`; // Green
});

app.use(
  morgan(':method :url :status-colored', {
    skip: (req) => !requestLoggingEnabled || req.url === '/api/health',
  })
);
```

### Log Output Locations

| Environment | Output                              |
| ----------- | ----------------------------------- |
| Development | Console (stdout)                    |
| Docker      | Container logs (stdout)             |
| Electron    | Console + file (~/.automaker/logs/) |

### Structured Logging Format

```typescript
// Error logging with context
logger.error('Error processing message:', {
  sessionId,
  messageType: msg.type,
  error: error.message,
  stack: error.stack,
});

// Info logging with metrics
logger.info('Event received:', {
  type,
  hasPayload: !!payload,
  payloadKeys: payload ? Object.keys(payload) : [],
  wsReadyState: ws.readyState,
});
```

---

## 9.3 Metrics

### Application Metrics

| Metric                     | Type    | Description                       |
| -------------------------- | ------- | --------------------------------- |
| `agent_sessions_active`    | Gauge   | Currently active sessions         |
| `agent_messages_total`     | Counter | Total messages sent               |
| `agent_errors_total`       | Counter | Total agent errors                |
| `terminal_sessions_active` | Gauge   | Active terminal sessions          |
| `websocket_connections`    | Gauge   | Connected WebSocket clients       |
| `feature_completions`      | Counter | Completed feature implementations |

### Collection Points

```typescript
// Session metrics (implicit via Map size)
const sessions = new Map<string, Session>();
// sessions.size = active session count

// Terminal connections tracking
const terminalConnections: Map<string, Set<WebSocket>> = new Map();
// terminalConnections.size = active terminal sessions

// WebSocket client count
wss.clients.size; // Connected event clients
```

### Usage Tracking Services

```typescript
// Claude API usage
const claudeUsageService = new ClaudeUsageService();
// Tracks token usage, request counts, costs

// Codex API usage
const codexUsageService = new CodexUsageService(codexAppServerService);
// Tracks model usage, rate limits
```

---

## 9.4 Distributed Tracing

### Event Flow Tracing

```typescript
// Event History Service provides trace-like capability
interface StoredEvent {
  id: string; // Unique event ID
  type: string; // Event type
  timestamp: string; // ISO timestamp
  sessionId?: string; // Correlation ID
  payload: unknown; // Event data
}

// All events stored for replay
eventHistoryService.store({
  id: generateId(),
  type: 'agent:tool_use',
  timestamp: new Date().toISOString(),
  sessionId,
  payload: { tool: toolName, input },
});
```

### Session-Based Correlation

```typescript
// All events include sessionId for correlation
this.emitAgentEvent(sessionId, {
  type: 'stream',
  messageId: currentAssistantMessage.id,
  content: responseText,
  isComplete: false,
});

// Query events by session
const events = await eventHistoryService.getBySession(sessionId);
```

---

## 9.5 Health Checks

### Basic Health Endpoint

```typescript
// GET /api/health - Unauthenticated
app.use('/api/health', createHealthRoutes());

// Response
{
  "status": "ok",
  "timestamp": "2026-01-20T12:00:00Z"
}
```

### Detailed Health Endpoint

```typescript
// GET /api/health/detailed - Authenticated
app.get('/api/health/detailed', authMiddleware, createDetailedHandler());

// Response
{
  "status": "ok",
  "timestamp": "2026-01-20T12:00:00Z",
  "uptime": 3600,
  "memory": {
    "heapUsed": 150000000,
    "heapTotal": 200000000,
    "rss": 250000000
  },
  "services": {
    "agent": "healthy",
    "terminal": "healthy",
    "settings": "healthy"
  }
}
```

### Docker Health Check

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3008/api/health || exit 1
```

---

## 9.6 Alerting

### Error Conditions

| Condition              | Severity | Action         |
| ---------------------- | -------- | -------------- |
| Uncaught Exception     | Critical | Log + Exit     |
| Unhandled Rejection    | Warning  | Log + Continue |
| WebSocket Disconnect   | Info     | Log + Cleanup  |
| Auth Failure           | Warning  | Log + Reject   |
| Path Traversal Attempt | Warning  | Log + Reject   |

### Global Error Handlers

```typescript
// Unhandled Promise Rejection
process.on('unhandledRejection', (reason: unknown) => {
  logger.error('Unhandled Promise Rejection:', {
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
  });
  // Continue running - don't crash
});

// Uncaught Exception
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', {
    message: error.message,
    stack: error.stack,
  });
  // Exit - process state is unknown
  process.exit(1);
});
```

---

## 9.7 Dashboards

### Console Dashboard (Startup)

```
+===========================================================+
|           Automaker Backend Server                        |
+===========================================================+
|  Listening:   0.0.0.0:3008                                |
|  HTTP API:    http://localhost:3008                       |
|  WebSocket:   ws://localhost:3008/api/events              |
|  Terminal:    ws://localhost:3008/api/terminal/ws         |
|  Health:      http://localhost:3008/api/health            |
|  Terminal:    enabled (password protected)                |
+===========================================================+
```

### Status Information

```typescript
// Runtime status (via API)
GET / api / running - agents; // List active agents
GET / api / auto - mode / status; // Auto-mode status
GET / api / terminal / sessions; // Terminal status
```

---

## 9.8 Quality Checklist

- [x] Logging strategy defined with levels
- [x] Key metrics identified
- [x] Health checks documented
- [x] Error handling and alerting specified
- [x] Event tracing via EventHistoryService
- [x] Dashboard/status endpoints listed
- [x] Structured logging format shown
