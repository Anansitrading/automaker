# Automaker Genesis Specification - Section 07: Security & Compliance

**Version**: 1.0.0
**Last Updated**: 2026-01-20
**Status**: Active Development

---

## 7.1 Security Model

### Security Architecture Overview

```
+-------------------------------------------------------------------+
|                         Security Layers                            |
+-------------------------------------------------------------------+
|                                                                   |
|  +--------------------+  +--------------------+  +---------------+|
|  | Authentication     |  | Authorization      |  | Data Protection|
|  | - API Key auth     |  | - Path validation  |  | - Encrypted   ||
|  | - Session tokens   |  | - Tool restrictions|  |   credentials ||
|  | - WS tokens        |  | - CORS policy      |  | - Secure FS   ||
|  +--------------------+  +--------------------+  +---------------+|
|                                                                   |
|  +--------------------+  +--------------------+  +---------------+|
|  | Input Validation   |  | Network Security   |  | Audit Logging ||
|  | - JSON schema      |  | - TLS termination  |  | - Request logs||
|  | - Path traversal   |  | - Rate limiting    |  | - Event history|
|  | - Size limits      |  | - Origin checks    |  | - Error logs  ||
|  +--------------------+  +--------------------+  +---------------+|
|                                                                   |
+-------------------------------------------------------------------+
```

### Security Principles

1. **Defense in Depth**: Multiple layers of security controls
2. **Least Privilege**: Minimal permissions by default
3. **Secure by Default**: Safe configurations out of the box
4. **Fail Secure**: Deny access on errors
5. **Audit Everything**: Log security-relevant events

---

## 7.2 Threat Model

### STRIDE Analysis

| Threat | Category | Mitigation |
|--------|----------|------------|
| **Spoofing** | Identity | API key validation, session tokens |
| **Tampering** | Data | Input validation, secure file operations |
| **Repudiation** | Actions | Request logging, event history |
| **Information Disclosure** | Data | Encrypted credentials, path restrictions |
| **Denial of Service** | Availability | Rate limiting, input size limits |
| **Elevation of Privilege** | Authorization | Path validation, tool restrictions |

### Threat Scenarios

| ID | Threat | Impact | Likelihood | Mitigation |
|----|--------|--------|------------|------------|
| T-001 | API key exposure | Critical | Medium | Encrypted storage, env vars |
| T-002 | Path traversal | High | Medium | Allowlist validation |
| T-003 | Command injection | Critical | Low | No shell exec in user input |
| T-004 | CSRF attacks | Medium | Medium | JSON content-type required |
| T-005 | WebSocket hijacking | High | Low | Token authentication |
| T-006 | Terminal escape | High | Low | PTY isolation, password option |

---

## 7.3 Authentication

### API Key Authentication

```typescript
// Primary authentication method
function checkRawAuthentication(
  headers: Record<string, string | string[] | undefined>,
  query: Record<string, string | undefined>,
  cookies: Record<string, string>
): boolean {
  // 1. Check X-API-Key header
  const apiKey = headers['x-api-key'];
  if (apiKey && validateApiKey(apiKey)) return true;

  // 2. Check session token
  const sessionToken = headers['x-session-token'] || query['token'];
  if (sessionToken && validateSessionToken(sessionToken)) return true;

  // 3. Check session cookie
  const sessionCookie = cookies['automaker_session'];
  if (sessionCookie && validateSessionCookie(sessionCookie)) return true;

  return false;
}
```

### WebSocket Authentication

```typescript
// WebSocket-specific token validation
function authenticateWebSocket(request: IncomingMessage): boolean {
  // Standard auth methods
  if (checkRawAuthentication(headers, query, cookies)) return true;

  // Short-lived WebSocket connection token
  const wsToken = url.searchParams.get('wsToken');
  if (wsToken && validateWsConnectionToken(wsToken)) return true;

  return false;
}
```

### Terminal Password Protection

```typescript
// Optional password for terminal access
interface TerminalConfig {
  enabled: boolean;
  passwordRequired: boolean;
  passwordHash?: string; // bcrypt hash
}

// Token issued after password verification
function validateTerminalToken(token: string | undefined): boolean {
  if (!token) return false;
  return verifyJWT(token, TERMINAL_SECRET);
}
```

---

## 7.4 Authorization

### Path Validation

```typescript
// Centralized path security
import { initAllowedPaths, isPathAllowed } from '@automaker/platform';

// Initialize on startup
initAllowedPaths(); // Sets up home directory restrictions

// Validate before any file operation
function validateWorkingDirectory(path: string): void {
  if (!isPathAllowed(path)) {
    throw new PathNotAllowedError(path);
  }
}
```

### Secure File System Operations

```typescript
// All file operations go through secure-fs.ts
import * as secureFs from '../lib/secure-fs.js';

// Validates path before operation
async function readFile(path: string): Promise<string> {
  validatePath(path);
  return fs.readFile(path, 'utf-8');
}

async function writeFile(path: string, content: string): Promise<void> {
  validatePath(path);
  return fs.writeFile(path, content, 'utf-8');
}
```

### Tool Restrictions

```typescript
// Agent tools are explicitly allowlisted
const allowedTools = [
  'Read', 'Write', 'Edit',
  'Glob', 'Grep', 'Bash',
  'WebSearch', 'WebFetch'
];

// Additional tools require configuration
if (skillsConfig.shouldIncludeInTools) {
  allowedTools.push('Skill');
}
if (subagentsConfig.shouldIncludeInTools) {
  allowedTools.push('Task');
}
```

---

## 7.5 Data Protection

### Credential Storage

```typescript
// System keychain for sensitive data
import keytar from 'keytar';

// Store API key securely
await keytar.setPassword('automaker', 'anthropic-api-key', apiKey);

// Retrieve API key
const key = await keytar.getPassword('automaker', 'anthropic-api-key');

// Fallback to encrypted file if keychain unavailable
interface EncryptedCredentials {
  version: number;
  data: string; // AES-256-GCM encrypted
  iv: string;   // Initialization vector
  tag: string;  // Auth tag
}
```

### Data at Rest

| Data Type | Protection |
|-----------|------------|
| API Keys | System keychain / AES-256 encrypted file |
| Session Data | JSON files (user-accessible) |
| Settings | JSON files (user-accessible) |
| Logs | Plain text (user-accessible) |

### Data in Transit

| Connection | Protocol | Encryption |
|------------|----------|------------|
| API Calls | HTTPS | TLS 1.2+ |
| WebSocket | WSS | TLS 1.2+ |
| Local (Electron) | HTTP | N/A (localhost) |
| Docker Internal | HTTP | N/A (isolated network) |

---

## 7.6 Audit Logging

### Request Logging

```typescript
// Morgan middleware for HTTP requests
app.use(
  morgan(':method :url :status-colored', {
    skip: (req) => !requestLoggingEnabled || req.url === '/api/health',
  })
);
```

### Event History

```typescript
interface StoredEvent {
  id: string;
  type: string;           // Event type (e.g., 'agent:tool_use')
  timestamp: string;      // ISO 8601
  sessionId?: string;     // Associated session
  payload: unknown;       // Event data
  source: string;         // Origin (e.g., 'agent-service')
}

// Events are persisted for replay and audit
const eventHistoryService = getEventHistoryService();
eventHistoryService.store(event);
```

### Security Event Logging

```typescript
// Security-relevant events
logger.info('Client connected, ready state:', ws.readyState);
logger.info('Authentication failed, rejecting connection');
logger.warn(`Unknown message type: ${msg.type}`);
logger.error('Unhandled Promise Rejection:', reason);
```

---

## 7.7 Compliance Requirements

### Current Compliance Status

| Standard | Status | Notes |
|----------|--------|-------|
| GDPR | Partial | User data stored locally |
| SOC 2 | N/A | Not applicable (local app) |
| HIPAA | N/A | Not applicable |
| PCI DSS | N/A | No payment processing |

### Privacy Considerations

- **Local-first**: All data stored on user's machine
- **No telemetry by default**: Opt-in analytics
- **No cloud storage**: Sessions stay local unless explicitly synced
- **API key handling**: Keys sent directly to providers, not stored remotely

### Security Best Practices Checklist

- [x] CORS policy prevents cross-origin attacks
- [x] JSON content-type required for POST/PUT/PATCH
- [x] Path traversal prevention via allowlist
- [x] API keys stored in system keychain when available
- [x] WebSocket connections authenticated
- [x] Terminal access optionally password-protected
- [x] Graceful shutdown prevents data loss
- [x] Input validation on all endpoints
- [x] Rate limiting via provider SDKs

---

## 7.8 Quality Checklist

- [x] Threat model documented using STRIDE
- [x] Authentication mechanisms explained
- [x] Authorization (path validation) documented
- [x] Data protection (at rest and in transit) specified
- [x] Audit logging requirements defined
- [x] Compliance considerations addressed
- [x] Security best practices listed
