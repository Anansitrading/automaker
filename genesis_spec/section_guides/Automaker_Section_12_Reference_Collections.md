# Automaker Genesis Specification - Section 12: Reference Collections

**Version**: 1.0.0
**Last Updated**: 2026-01-20
**Status**: Active Development

---

## 12.1 Official Resources

### Project Links

| Resource | URL |
|----------|-----|
| GitHub Repository | https://github.com/AutoMaker-Org/automaker |
| Issue Tracker | https://github.com/AutoMaker-Org/automaker/issues |
| Pull Requests | https://github.com/AutoMaker-Org/automaker/pulls |
| Discord Community | https://discord.gg/jjem7aEDKU |

### Documentation

| Document | Location |
|----------|----------|
| README | `/README.md` |
| Contributing Guide | `/CONTRIBUTING.md` |
| Architecture | `/ARCHITECTURE.md` |
| Claude Context | `/CLAUDE.md` |
| License | `/LICENSE` |

---

## 12.2 Technology References

### Core Technologies

| Technology | Documentation |
|------------|--------------|
| TypeScript | https://www.typescriptlang.org/docs/ |
| Node.js | https://nodejs.org/docs/ |
| React | https://react.dev/ |
| Express | https://expressjs.com/ |
| Electron | https://www.electronjs.org/docs |
| Vite | https://vitejs.dev/ |

### AI SDKs

| SDK | Documentation |
|-----|--------------|
| Claude Agent SDK | https://docs.anthropic.com/claude/docs |
| MCP Protocol | https://modelcontextprotocol.io/ |
| Codex SDK | https://platform.openai.com/docs |

### Frontend Libraries

| Library | Documentation |
|---------|--------------|
| TanStack Router | https://tanstack.com/router |
| TanStack Query | https://tanstack.com/query |
| Zustand | https://zustand-demo.pmnd.rs/ |
| Radix UI | https://www.radix-ui.com/docs |
| Tailwind CSS | https://tailwindcss.com/docs |
| xterm.js | https://xtermjs.org/ |
| CodeMirror | https://codemirror.net/docs/ |

### Backend Libraries

| Library | Documentation |
|---------|--------------|
| Express 5 | https://expressjs.com/en/5x/api.html |
| ws (WebSocket) | https://github.com/websockets/ws |
| node-pty | https://github.com/microsoft/node-pty |
| Morgan | https://github.com/expressjs/morgan |

### Testing Tools

| Tool | Documentation |
|------|--------------|
| Vitest | https://vitest.dev/ |
| Playwright | https://playwright.dev/ |

---

## 12.3 Related Projects

### Dependencies

| Project | Purpose | Repository |
|---------|---------|------------|
| Claude Code | Claude CLI tool | https://github.com/anthropics/claude-code |
| Cursor | AI-powered IDE | https://cursor.com/ |
| GitHub CLI | Git operations | https://cli.github.com/ |

### Inspiration

| Project | Relevance |
|---------|-----------|
| Devin | Autonomous AI developer concept |
| Aider | AI pair programming |
| Continue | IDE AI integration |

---

## 12.4 Architecture Patterns

### Design Patterns Used

| Pattern | Reference |
|---------|-----------|
| Factory Pattern | https://refactoring.guru/design-patterns/factory-method |
| Service Layer | https://martinfowler.com/eaaCatalog/serviceLayer.html |
| Event-Driven | https://martinfowler.com/articles/201701-event-driven.html |
| Repository Pattern | https://martinfowler.com/eaaCatalog/repository.html |

### Architecture Styles

| Style | Reference |
|-------|-----------|
| Monorepo | https://monorepo.tools/ |
| Layered Architecture | https://www.oreilly.com/library/view/software-architecture-patterns/9781491971437/ |
| Event Sourcing | https://martinfowler.com/eaaDev/EventSourcing.html |

---

## 12.5 Security Resources

### Security Guidelines

| Topic | Reference |
|-------|-----------|
| OWASP Top 10 | https://owasp.org/www-project-top-ten/ |
| Node.js Security | https://nodejs.org/en/docs/guides/security/ |
| Electron Security | https://www.electronjs.org/docs/tutorial/security |

### Authentication

| Topic | Reference |
|-------|-----------|
| API Key Best Practices | https://cloud.google.com/docs/authentication/api-keys |
| Keytar (System Keychain) | https://github.com/atom/node-keytar |

---

## 12.6 Development Tools

### IDE Support

| IDE | Extension |
|-----|-----------|
| VS Code | ESLint, Prettier, TypeScript |
| WebStorm | Built-in TypeScript support |
| Cursor | AI-powered editing |

### CLI Tools

| Tool | Purpose |
|------|---------|
| npm | Package management |
| tsx | TypeScript execution |
| electron-builder | Desktop packaging |
| gh | GitHub operations |

### Debugging

| Tool | Purpose |
|------|---------|
| Chrome DevTools | Frontend debugging |
| Node.js Inspector | Backend debugging |
| React DevTools | Component inspection |

---

## 12.7 Community Resources

### Support Channels

| Channel | URL |
|---------|-----|
| Discord | https://discord.gg/jjem7aEDKU |
| GitHub Discussions | https://github.com/AutoMaker-Org/automaker/discussions |
| Issues | https://github.com/AutoMaker-Org/automaker/issues |

### Learning Resources

| Resource | Topic |
|----------|-------|
| React Documentation | Frontend development |
| Express Guide | Backend API development |
| Electron Tutorial | Desktop app development |

---

## 12.8 Quick Reference Cards

### NPM Scripts Cheatsheet

```bash
# Development
npm run dev              # Interactive launcher
npm run dev:web          # Browser mode
npm run dev:electron     # Desktop mode

# Building
npm run build            # Build all
npm run build:packages   # Shared libs only
npm run build:electron   # Desktop app

# Testing
npm run test             # E2E tests
npm run test:server      # Unit tests
npm run test:all         # All tests

# Quality
npm run lint             # ESLint
npm run format           # Prettier
npm run typecheck        # TypeScript check
```

### Environment Variables Cheatsheet

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-...

# Optional
PORT=3008
HOST=0.0.0.0
DATA_DIR=./data
CORS_ORIGIN=http://localhost:3007
ENABLE_REQUEST_LOGGING=true

# Debug
DEBUG=automaker:*
```

### Docker Commands Cheatsheet

```bash
# Build
docker build --target server -t automaker-server .
docker build --target ui -t automaker-ui .

# Run
docker-compose up -d
docker-compose down
docker-compose logs -f server

# Health check
curl http://localhost:3008/api/health
```

---

## 12.9 Glossary

| Term | Definition |
|------|------------|
| **Agent** | AI-powered assistant that executes tasks autonomously |
| **Auto-Mode** | Autonomous feature development workflow |
| **Feature** | Unit of work to be implemented by agents |
| **MCP** | Model Context Protocol - standard for AI tool integration |
| **Planning Mode** | Strategy for feature planning (skip, lite, spec, full) |
| **Provider** | AI model backend (Claude, Codex, Cursor) |
| **Session** | Persistent conversation context with an agent |
| **Worktree** | Git worktree for isolated feature development |
| **PTY** | Pseudo-terminal for shell emulation |
| **WebSocket** | Bidirectional communication protocol for real-time updates |

---

## 12.10 Quality Checklist

- [x] Official project links listed
- [x] Technology documentation referenced
- [x] Related projects documented
- [x] Architecture pattern references provided
- [x] Security resources linked
- [x] Development tools listed
- [x] Community resources documented
- [x] Quick reference cards created
- [x] Glossary complete with all terms
