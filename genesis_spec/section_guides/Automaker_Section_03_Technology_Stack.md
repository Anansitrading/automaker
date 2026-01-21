# Automaker Genesis Specification - Section 03: Technology Stack

**Version**: 1.0.0
**Last Updated**: 2026-01-20
**Status**: Active Development

---

## 3.1 Core Technologies

| Technology | Version | Purpose                       |
| ---------- | ------- | ----------------------------- |
| TypeScript | 5.9.3   | Primary language for all code |
| Node.js    | 22.x    | Runtime environment           |
| React      | 19.2.3  | Frontend UI framework         |
| Express    | 5.2.1   | Backend HTTP server           |
| Electron   | 39.2.7  | Desktop application wrapper   |
| Vite       | 7.3.0   | Frontend build tool           |

---

## 3.2 Dependencies

### Backend Production Dependencies

| Package                        | Version      | Purpose                       |
| ------------------------------ | ------------ | ----------------------------- |
| @anthropic-ai/claude-agent-sdk | 0.1.76       | Claude AI agent orchestration |
| @modelcontextprotocol/sdk      | 1.25.2       | MCP server integration        |
| @openai/codex-sdk              | 0.77.0       | Codex model access            |
| express                        | 5.2.1        | HTTP server framework         |
| ws                             | 8.18.3       | WebSocket server              |
| node-pty                       | 1.1.0-beta41 | Terminal emulation            |
| cors                           | 2.8.5        | CORS middleware               |
| cookie-parser                  | 1.4.7        | Cookie handling               |
| morgan                         | 1.10.1       | HTTP request logging          |
| dotenv                         | 17.2.3       | Environment variables         |

### Frontend Production Dependencies

| Package                | Version | Purpose                  |
| ---------------------- | ------- | ------------------------ |
| react                  | 19.2.3  | UI framework             |
| react-dom              | 19.2.3  | React DOM renderer       |
| @tanstack/react-router | 1.141.6 | Type-safe routing        |
| @tanstack/react-query  | 5.90.12 | Server state management  |
| zustand                | 5.0.9   | Client state management  |
| @xterm/xterm           | 5.5.0   | Terminal emulator        |
| @uiw/react-codemirror  | 4.25.4  | Code editor              |
| @xyflow/react          | 12.10.0 | Flow diagrams            |
| @radix-ui/\*           | Various | Accessible UI components |
| tailwind-merge         | 3.4.0   | Tailwind class merging   |
| lucide-react           | 0.562.0 | Icons                    |
| sonner                 | 2.0.7   | Toast notifications      |
| react-markdown         | 10.1.0  | Markdown rendering       |
| dagre                  | 0.8.5   | Graph layout algorithms  |

### Development Dependencies

| Package              | Version | Purpose                |
| -------------------- | ------- | ---------------------- |
| typescript           | 5.9.3   | TypeScript compiler    |
| vitest               | 4.0.16  | Unit testing framework |
| @playwright/test     | 1.57.0  | E2E testing framework  |
| eslint               | 9.39.2  | Code linting           |
| tailwindcss          | 4.1.18  | CSS framework          |
| electron-builder     | 26.0.12 | Desktop app packaging  |
| @vitejs/plugin-react | 5.1.2   | React Vite plugin      |
| tsx                  | 4.21.0  | TypeScript execution   |

### Shared Library Packages (@automaker/\*)

| Package                        | Version | Purpose                      |
| ------------------------------ | ------- | ---------------------------- |
| @automaker/types               | 1.0.0   | Shared TypeScript interfaces |
| @automaker/utils               | 1.0.0   | Common utility functions     |
| @automaker/prompts             | 1.0.0   | AI prompt templates          |
| @automaker/platform            | 1.0.0   | OS-specific abstractions     |
| @automaker/model-resolver      | 1.0.0   | AI model selection logic     |
| @automaker/dependency-resolver | 1.0.0   | Feature dependency ordering  |
| @automaker/git-utils           | 1.0.0   | Git operation helpers        |

---

## 3.3 Build Tools

| Tool             | Purpose                               |
| ---------------- | ------------------------------------- |
| npm              | Package management (workspaces)       |
| Vite             | Frontend bundling and dev server      |
| tsc              | TypeScript compilation                |
| electron-builder | Desktop app packaging                 |
| tsx              | Development-time TypeScript execution |

### Build Configuration

```
Root package.json (npm workspaces)
├── apps/server/    → tsc → dist/
├── apps/ui/        → vite → dist/
└── libs/*          → tsc → dist/
```

---

## 3.4 Runtime Requirements

### Development Environment

| Requirement | Minimum               | Recommended       |
| ----------- | --------------------- | ----------------- |
| Node.js     | 22.0.0                | 22.x (latest LTS) |
| npm         | 10.x                  | Latest            |
| OS          | macOS, Windows, Linux | Any               |
| RAM         | 4GB                   | 8GB+              |
| Disk        | 2GB                   | 5GB+              |

### Production Environment (Docker)

| Requirement        | Value        |
| ------------------ | ------------ |
| Base Image         | node:22-slim |
| Port (Server)      | 3008         |
| Port (UI)          | 80           |
| Data Directory     | /data        |
| Projects Directory | /projects    |

### Desktop Application

| Platform | Architecture | Format             |
| -------- | ------------ | ------------------ |
| macOS    | x64, arm64   | DMG, ZIP           |
| Windows  | x64          | NSIS installer     |
| Linux    | x64          | AppImage, DEB, RPM |

---

## 3.5 External Services

### AI Providers

| Service          | Authentication | Purpose               |
| ---------------- | -------------- | --------------------- |
| Anthropic Claude | API Key        | Primary AI agent      |
| OpenAI Codex     | API Key        | Alternative provider  |
| Cursor CLI       | OAuth          | IDE integration       |
| OpenCode CLI     | OAuth          | Multi-provider access |

### Development Services

| Service        | Purpose                      |
| -------------- | ---------------------------- |
| GitHub         | Version control, PRs, issues |
| GitHub Actions | CI/CD pipeline               |
| Discord        | Community support            |

### Optional Integrations

| Service             | Purpose                    |
| ------------------- | -------------------------- |
| MCP Servers         | Extended tool capabilities |
| Playwright Browsers | E2E testing                |
| Docker Registry     | Container distribution     |

---

## 3.6 Technology Decisions

### Why TypeScript?

- Type safety across frontend and backend
- Shared type definitions via monorepo
- Excellent IDE support and refactoring
- Growing ecosystem and community

### Why React 19?

- Industry standard for UI development
- Concurrent rendering for smooth UX
- Large ecosystem of compatible libraries
- Team familiarity and hiring pool

### Why Electron?

- Cross-platform desktop support
- Full Node.js API access
- Native OS integration
- Single codebase for web and desktop

### Why Express 5?

- Mature and stable HTTP framework
- Async/await support
- Large middleware ecosystem
- Easy WebSocket integration

### Why Zustand over Redux?

- Simpler API with less boilerplate
- Better TypeScript integration
- Smaller bundle size
- Easier learning curve

---

## 3.7 Quality Checklist

- [x] All dependencies documented with versions
- [x] Versions are pinned in package.json
- [x] Purpose is clear for each dependency
- [x] Runtime requirements specified
- [x] External services documented
- [x] Technology decisions explained
