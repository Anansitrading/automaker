# Automaker Genesis Specification - Section 02: Product Requirements

**Version**: 1.0.0
**Last Updated**: 2026-01-20
**Status**: Active Development

---

## 2.1 Functional Requirements

### Core Agent Features

| ID     | Requirement                                            | Priority | Status      |
| ------ | ------------------------------------------------------ | -------- | ----------- |
| FR-001 | System shall spawn and manage Claude-based AI agents   | P0       | Implemented |
| FR-002 | System shall support conversation session persistence  | P0       | Implemented |
| FR-003 | System shall stream agent responses via WebSocket      | P0       | Implemented |
| FR-004 | System shall support agent interruption/abortion       | P0       | Implemented |
| FR-005 | System shall maintain conversation history per session | P0       | Implemented |
| FR-006 | System shall support image input to agents             | P1       | Implemented |
| FR-007 | System shall queue prompts for sequential execution    | P1       | Implemented |
| FR-008 | System shall support custom system prompts             | P1       | Implemented |

### Auto-Mode Features

| ID     | Requirement                                                           | Priority | Status      |
| ------ | --------------------------------------------------------------------- | -------- | ----------- |
| FR-010 | System shall support autonomous feature development                   | P0       | Implemented |
| FR-011 | System shall provide multiple planning modes (skip, lite, spec, full) | P0       | Implemented |
| FR-012 | System shall isolate features in git worktrees                        | P0       | Implemented |
| FR-013 | System shall support feature verification workflow                    | P0       | Implemented |
| FR-014 | System shall support plan approval workflow                           | P0       | Implemented |
| FR-015 | System shall track feature status through pipeline stages             | P1       | Implemented |
| FR-016 | System shall support feature dependency resolution                    | P1       | Implemented |
| FR-017 | System shall generate feature specifications                          | P1       | Implemented |

### Session Management

| ID     | Requirement                                          | Priority | Status      |
| ------ | ---------------------------------------------------- | -------- | ----------- |
| FR-020 | System shall create named agent sessions             | P0       | Implemented |
| FR-021 | System shall list all sessions with metadata         | P0       | Implemented |
| FR-022 | System shall archive/unarchive sessions              | P1       | Implemented |
| FR-023 | System shall delete sessions permanently             | P1       | Implemented |
| FR-024 | System shall associate sessions with project paths   | P1       | Implemented |
| FR-025 | System shall persist sessions across server restarts | P0       | Implemented |

### Terminal Features

| ID     | Requirement                                        | Priority | Status      |
| ------ | -------------------------------------------------- | -------- | ----------- |
| FR-030 | System shall provide PTY-based terminal sessions   | P0       | Implemented |
| FR-031 | System shall support multiple concurrent terminals | P1       | Implemented |
| FR-032 | System shall maintain terminal scrollback buffer   | P1       | Implemented |
| FR-033 | System shall support terminal resize operations    | P1       | Implemented |
| FR-034 | System shall optionally require terminal password  | P2       | Implemented |

### Git Integration

| ID     | Requirement                               | Priority | Status      |
| ------ | ----------------------------------------- | -------- | ----------- |
| FR-040 | System shall create/remove git worktrees  | P0       | Implemented |
| FR-041 | System shall display file diffs           | P1       | Implemented |
| FR-042 | System shall commit changes with messages | P1       | Implemented |
| FR-043 | System shall list GitHub PRs and issues   | P2       | Implemented |
| FR-044 | System shall validate GitHub issues       | P2       | Implemented |

### Settings & Configuration

| ID     | Requirement                                  | Priority | Status      |
| ------ | -------------------------------------------- | -------- | ----------- |
| FR-050 | System shall support global settings         | P0       | Implemented |
| FR-051 | System shall support per-project settings    | P0       | Implemented |
| FR-052 | System shall store API credentials securely  | P0       | Implemented |
| FR-053 | System shall support theme customization     | P2       | Implemented |
| FR-054 | System shall support keyboard shortcuts      | P2       | Implemented |
| FR-055 | System shall support custom prompt templates | P1       | Implemented |

### Multi-Provider Support

| ID     | Requirement                        | Priority | Status      |
| ------ | ---------------------------------- | -------- | ----------- |
| FR-060 | System shall support Claude models | P0       | Implemented |
| FR-061 | System shall support Codex models  | P1       | Implemented |
| FR-062 | System shall support Cursor CLI    | P1       | Implemented |
| FR-063 | System shall support OpenCode CLI  | P2       | Implemented |
| FR-064 | System shall cache model responses | P2       | Implemented |

---

## 2.2 Non-Functional Requirements

### Performance

| ID      | Category    | Requirement               | Target |
| ------- | ----------- | ------------------------- | ------ |
| NFR-001 | Performance | Initial page load time    | <3s    |
| NFR-002 | Performance | Agent first response      | <5s    |
| NFR-003 | Performance | WebSocket message latency | <100ms |
| NFR-004 | Performance | Terminal input latency    | <50ms  |
| NFR-005 | Performance | Session restore time      | <2s    |

### Security

| ID      | Category | Requirement                       | Target   |
| ------- | -------- | --------------------------------- | -------- |
| NFR-010 | Security | API key encryption at rest        | Required |
| NFR-011 | Security | WebSocket authentication          | Required |
| NFR-012 | Security | CORS policy enforcement           | Required |
| NFR-013 | Security | Path traversal prevention         | Required |
| NFR-014 | Security | Input validation on all endpoints | Required |

### Scalability

| ID      | Category    | Requirement               | Target         |
| ------- | ----------- | ------------------------- | -------------- |
| NFR-020 | Scalability | Concurrent agent sessions | 10+            |
| NFR-021 | Scalability | Terminal sessions         | 20+            |
| NFR-022 | Scalability | Session history storage   | 1000+ messages |
| NFR-023 | Scalability | Feature queue depth       | 100+           |

### Reliability

| ID      | Category    | Requirement                | Target         |
| ------- | ----------- | -------------------------- | -------------- |
| NFR-030 | Reliability | Server uptime              | 99.9%          |
| NFR-031 | Reliability | Graceful shutdown handling | Required       |
| NFR-032 | Reliability | Session data persistence   | Atomic writes  |
| NFR-033 | Reliability | Error recovery             | Auto-reconnect |

### Usability

| ID      | Category  | Requirement              | Target       |
| ------- | --------- | ------------------------ | ------------ |
| NFR-040 | Usability | Keyboard navigation      | Full support |
| NFR-041 | Usability | Responsive design        | 1024px+      |
| NFR-042 | Usability | Dark/Light theme         | Both         |
| NFR-043 | Usability | Real-time status updates | Required     |

### Maintainability

| ID      | Category        | Requirement             | Target        |
| ------- | --------------- | ----------------------- | ------------- |
| NFR-050 | Maintainability | TypeScript coverage     | 100%          |
| NFR-051 | Maintainability | Shared type definitions | Monorepo libs |
| NFR-052 | Maintainability | Code documentation      | Public APIs   |
| NFR-053 | Maintainability | Test coverage           | >80% server   |

---

## 2.3 User Stories

### As a Developer

1. **US-001**: As a developer, I want to start an AI agent session so I can get help with coding tasks.
2. **US-002**: As a developer, I want to queue multiple features so the AI can work through them autonomously.
3. **US-003**: As a developer, I want to see real-time progress of agent work so I can monitor development.
4. **US-004**: As a developer, I want to review and approve implementation plans before coding begins.
5. **US-005**: As a developer, I want features developed in isolated branches so my main codebase stays clean.

### As a Team Lead

6. **US-010**: As a team lead, I want to track feature completion status across multiple sessions.
7. **US-011**: As a team lead, I want to configure AI behavior per project for consistency.
8. **US-012**: As a team lead, I want audit trails of all AI agent actions for review.

### As an Administrator

13. **US-020**: As an admin, I want to securely store API credentials so they're not exposed.
14. **US-021**: As an admin, I want to configure which AI providers are available.
15. **US-022**: As an admin, I want to enable/disable terminal access for security.

---

## 2.4 Acceptance Criteria

### Agent Session (FR-001)

- [ ] Agent starts within 5 seconds of request
- [ ] Agent responds to prompts with streaming output
- [ ] Agent can be stopped mid-execution
- [ ] Session persists after server restart
- [ ] Multiple sessions can run concurrently

### Auto-Mode (FR-010)

- [ ] Features can be queued for autonomous execution
- [ ] Each feature runs in isolated git worktree
- [ ] Planning mode is configurable per feature
- [ ] Plan approval is required before implementation
- [ ] Feature status updates in real-time

### Terminal (FR-030)

- [ ] Terminal connects via WebSocket
- [ ] Input is echoed with <50ms latency
- [ ] Scrollback buffer preserves history
- [ ] Resize events propagate correctly
- [ ] Multiple terminals can run simultaneously

---

## 2.5 Quality Checklist

- [x] All major features have functional requirements
- [x] NFRs cover all quality attributes (performance, security, etc.)
- [x] Priorities are assigned (P0 = critical, P1 = important, P2 = nice-to-have)
- [x] Acceptance criteria are testable
- [x] User stories cover primary personas
