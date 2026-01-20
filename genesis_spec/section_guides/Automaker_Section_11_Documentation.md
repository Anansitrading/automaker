# Automaker Genesis Specification - Section 11: Documentation & Knowledge Management

**Version**: 1.0.0
**Last Updated**: 2026-01-20
**Status**: Active Development

---

## 11.1 Documentation Structure

### Documentation Hierarchy

```
automaker/
+-- README.md                    # Project overview and quick start
+-- CONTRIBUTING.md              # Contribution guidelines
+-- ARCHITECTURE.md              # Technical architecture
+-- CLAUDE.md                    # AI agent context
+-- LICENSE                      # License terms
+-- CHANGELOG.md                 # Version history
|
+-- docs/                        # Extended documentation
|   +-- getting-started.md
|   +-- api-reference.md
|   +-- troubleshooting.md
|
+-- genesis_spec/                # Genesis documentation
    +-- section_guides/
        +-- Automaker_Section_01_Introduction.md
        +-- Automaker_Section_02_Product_Requirements.md
        +-- ... (12 sections total)
```

### Documentation Types

| Type | Location | Purpose | Audience |
|------|----------|---------|----------|
| README | Root | Quick start, overview | New users |
| CONTRIBUTING | Root | How to contribute | Contributors |
| ARCHITECTURE | Root | Technical overview | Developers |
| CLAUDE.md | Root | AI agent instructions | AI agents |
| Genesis Spec | genesis_spec/ | Comprehensive reference | All |
| API Docs | Inline | Endpoint documentation | Integrators |
| Code Comments | Source | Implementation details | Maintainers |

---

## 11.2 Code Documentation

### TypeScript/JSDoc Standards

```typescript
/**
 * Agent Service - Manages AI agent sessions and conversations
 *
 * Handles spawning, messaging, and lifecycle of Claude-based agents.
 * Sessions are persisted to disk and can be resumed across restarts.
 *
 * @example
 * const agentService = new AgentService(dataDir, events, settings);
 * await agentService.initialize();
 * const session = await agentService.createSession('My Session');
 */
export class AgentService {
  /**
   * Send a message to an active agent session
   *
   * @param params - Message parameters
   * @param params.sessionId - Target session ID
   * @param params.message - User message content
   * @param params.imagePaths - Optional image attachments
   * @param params.model - Override model for this message
   * @returns Promise resolving to message result
   * @throws Error if session not found or agent already running
   */
  async sendMessage(params: SendMessageParams): Promise<MessageResult> {
    // Implementation
  }
}
```

### Comment Guidelines

1. **File Headers**: Purpose and module overview
2. **Class Comments**: Responsibility and usage examples
3. **Method Comments**: Parameters, return values, exceptions
4. **Complex Logic**: Explain why, not what
5. **TODO/FIXME**: Include issue reference

```typescript
// Good: Explains reasoning
// Rate limit resize operations to prevent storm during panel splits
const RESIZE_MIN_INTERVAL_MS = 100;

// Bad: States the obvious
// Set interval to 100
const RESIZE_MIN_INTERVAL_MS = 100;
```

---

## 11.3 API Documentation

### REST API Documentation Pattern

```typescript
/**
 * @route POST /api/sessions
 * @group Sessions - Session management operations
 * @param {CreateSessionParams} body.required - Session creation parameters
 * @returns {SessionResponse} 200 - Session created successfully
 * @returns {ErrorResponse} 400 - Invalid parameters
 * @returns {ErrorResponse} 401 - Unauthorized
 *
 * @example request
 * {
 *   "name": "My Development Session",
 *   "projectPath": "/home/user/myproject"
 * }
 *
 * @example response - 200
 * {
 *   "success": true,
 *   "session": {
 *     "id": "session_123",
 *     "name": "My Development Session",
 *     "createdAt": "2026-01-20T10:00:00Z"
 *   }
 * }
 */
```

### WebSocket Event Documentation

```typescript
/**
 * WebSocket Events - /api/events
 *
 * Events:
 * - agent:stream    - Streaming response content
 * - agent:tool_use  - Agent using a tool
 * - agent:complete  - Message completed
 * - agent:error     - Error occurred
 * - feature:status  - Feature status changed
 *
 * @example agent:stream
 * {
 *   "type": "agent:stream",
 *   "sessionId": "session_123",
 *   "messageId": "msg_456",
 *   "content": "Here's the refactored code...",
 *   "isComplete": false
 * }
 */
```

---

## 11.4 Architecture Documentation

### Architecture Decision Records (ADRs)

Location: Inline in ARCHITECTURE.md or separate `docs/adrs/`

```markdown
# ADR-001: Monorepo Structure

## Status
Accepted

## Context
Need to share TypeScript types and utilities between frontend and backend.

## Decision
Use npm workspaces with `libs/` directory for shared packages.

## Consequences
- Single repository for all code
- Shared TypeScript types via @automaker/*
- Atomic commits across packages
- Build order dependency management required
```

### Component Documentation

Each major component should document:
- Purpose and responsibility
- Dependencies (internal and external)
- Configuration options
- Public API surface
- Error handling behavior

---

## 11.5 User Documentation

### Getting Started Guide

```markdown
# Getting Started with Automaker

## Prerequisites
- Node.js 22+
- Git
- Anthropic API key

## Installation
1. Clone the repository
2. Run `npm install`
3. Set `ANTHROPIC_API_KEY` environment variable
4. Run `npm run dev`

## First Session
1. Click "New Session"
2. Enter a name for your session
3. Type a message to the AI agent
4. Watch the response stream in real-time
```

### Feature Tutorials

- Creating and managing sessions
- Using auto-mode for feature development
- Configuring settings
- Working with terminals
- Git workflow integration

---

## 11.6 Contributing Guidelines

### Document Updates Required

| Change Type | Documentation Required |
|-------------|----------------------|
| New feature | README, user guide, API docs |
| API change | API reference, CHANGELOG |
| Bug fix | CHANGELOG |
| Refactoring | ARCHITECTURE (if significant) |
| Configuration | Settings documentation |

### Documentation Review Checklist

- [ ] Code comments for public APIs
- [ ] README updated if user-facing change
- [ ] CHANGELOG entry added
- [ ] API documentation updated
- [ ] Architecture docs updated (if applicable)

---

## 11.7 Changelog Management

### Changelog Format (Keep a Changelog)

```markdown
# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- New feature description

### Changed
- Changed behavior description

### Deprecated
- Soon-to-be removed features

### Removed
- Removed features

### Fixed
- Bug fix description

### Security
- Security fix description

## [0.12.0] - 2026-01-15

### Added
- Multi-provider support (Codex, Cursor, OpenCode)
- Event hook system for custom automation
```

### Version Numbering

```
MAJOR.MINOR.PATCH

MAJOR: Breaking changes
MINOR: New features (backward compatible)
PATCH: Bug fixes (backward compatible)

Examples:
0.12.0 -> 0.12.1 (bug fix)
0.12.0 -> 0.13.0 (new feature)
0.12.0 -> 1.0.0  (breaking change / stable release)
```

---

## 11.8 Quality Checklist

- [x] Documentation structure defined
- [x] Code documentation standards set
- [x] API documentation pattern established
- [x] Architecture documentation guidelines
- [x] User documentation structure
- [x] Contributing guidelines for docs
- [x] Changelog format specified
- [x] Version numbering explained
