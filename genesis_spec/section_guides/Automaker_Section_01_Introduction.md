# Automaker Genesis Specification - Section 01: Introduction & Executive Summary

**Version**: 1.0.0
**Last Updated**: 2026-01-20
**Status**: Active Development (v0.12.0)

---

## 1.1 Executive Summary

Automaker is an **autonomous AI development studio** that revolutionizes software development by orchestrating AI agents to implement features, fix bugs, and manage code in isolated git worktrees. Built as a desktop application using Electron with a React frontend and Express backend, Automaker provides a Kanban-based workflow where Claude-based AI agents autonomously execute development tasks.

The platform bridges the gap between human-guided development and fully autonomous AI coding, providing:
- **Multi-agent orchestration** via Claude Agent SDK
- **Isolated feature development** using git worktrees
- **Real-time collaboration** through WebSocket streaming
- **Multi-provider AI support** (Claude, Codex, Cursor, OpenCode)
- **Enterprise-ready security** with encrypted credential storage

**Key Metrics:**
- ~195,000 lines of TypeScript code
- ~1,001 TypeScript source files
- 7 shared library packages
- 18+ backend services
- Multi-platform support (macOS, Windows, Linux)

---

## 1.2 Project Vision

Automaker aims to be the **definitive autonomous development environment** where AI agents handle the full software development lifecycle - from ideation and planning to implementation, testing, and deployment - while developers maintain strategic oversight and control.

**Long-term Goals:**
1. Enable fully autonomous feature development with minimal human intervention
2. Support multiple AI providers for flexibility and cost optimization
3. Integrate seamlessly with existing development workflows (GitHub, CI/CD)
4. Provide enterprise-grade security and auditability
5. Build a community-driven ecosystem of plugins and extensions

---

## 1.3 Scope Definition

### In Scope

| Category | Included |
|----------|----------|
| **AI Agent Management** | Spawning, monitoring, and stopping Claude-based agents |
| **Session Management** | Creating, persisting, archiving, and resuming agent sessions |
| **Feature Development** | Autonomous implementation with planning modes (skip, lite, spec, full) |
| **Git Integration** | Worktree isolation, branching, committing, PR creation |
| **Terminal Access** | PTY-based terminal with xterm.js for command execution |
| **Multi-Provider Support** | Claude, Codex, Cursor CLI, OpenCode providers |
| **Real-time Communication** | WebSocket streaming for live updates |
| **Desktop & Web Modes** | Electron app and browser-based UI |
| **Configuration Management** | Global and per-project settings |
| **MCP Server Integration** | Model Context Protocol server support |

### Out of Scope

| Category | Excluded |
|----------|----------|
| **Direct Code Editing** | Not a replacement for VS Code/IDEs |
| **CI/CD Pipeline Execution** | Relies on external CI systems |
| **Cloud Hosting** | Self-hosted or local deployment only |
| **Team Collaboration** | Single-user focus (multi-user planned) |
| **Mobile Applications** | Desktop and web only |

---

## 1.4 Success Criteria

| Criterion | Metric | Target |
|-----------|--------|--------|
| Feature Completion Rate | Successfully implemented features | >85% |
| Agent Reliability | Sessions without crashes | >99% |
| Build Success | CI pipeline pass rate | >95% |
| Test Coverage | Server-side code coverage | >80% |
| User Adoption | Active installations | Growth metric |
| Performance | Agent response latency | <5s for initial response |

---

## 1.5 Document Purpose

This Genesis Specification serves as the **single source of truth** for understanding Automaker's architecture, requirements, and implementation. It is intended for:

- **New Contributors**: Onboarding and understanding codebase
- **Architects**: System design decisions and patterns
- **AI Agents**: Context for autonomous development tasks
- **Maintainers**: Reference for troubleshooting and enhancement
- **Security Auditors**: Security model and compliance review

**How to Use This Document:**
1. Start with Section 01 (Introduction) for overview
2. Review Section 03 (Technology Stack) for dependencies
3. Consult Section 05 (Architecture) for design decisions
4. Reference Section 10 (Deployment) for operational procedures

---

## 1.6 Quality Checklist

- [x] Executive summary captures essence of Automaker
- [x] Vision is clear and inspiring
- [x] Scope boundaries are explicitly defined
- [x] Success criteria are measurable
- [x] Document purpose explains usage

---

## 1.7 Document Index

| Section | Title | Purpose |
|---------|-------|---------|
| 01 | Introduction & Executive Summary | Project overview and scope |
| 02 | Product Requirements | Functional and non-functional requirements |
| 03 | Technology Stack | Dependencies and tools |
| 04 | Process Flowcharts | System and data flows |
| 05 | Architecture Design | Module structure and patterns |
| 06 | Data Models | Entity definitions and schemas |
| 07 | Security & Compliance | Security architecture and threat model |
| 08 | Testing Strategy | Test approach and coverage |
| 09 | Monitoring & Observability | Logging, metrics, and health checks |
| 10 | Deployment & Operations | Build, install, and runtime procedures |
| 11 | Documentation | Doc structure and standards |
| 12 | Reference Collections | External resources and glossary |
