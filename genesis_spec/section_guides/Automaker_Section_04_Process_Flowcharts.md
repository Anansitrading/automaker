# Automaker Genesis Specification - Section 04: Process Flowcharts

**Version**: 1.0.0
**Last Updated**: 2026-01-20
**Status**: Active Development

---

## 4.1 System Overview Flow

```
+------------------+     +------------------+     +------------------+
|    Electron      |     |    Browser       |     |    Docker        |
|    Desktop       |     |    Client        |     |    Container     |
+--------+---------+     +--------+---------+     +--------+---------+
         |                        |                        |
         +------------------------+------------------------+
                                  |
                                  v
                    +-------------+--------------+
                    |     React UI (Vite)        |
                    |  - TanStack Router         |
                    |  - Zustand State           |
                    |  - xterm.js Terminal       |
                    +-------------+--------------+
                                  |
                                  | HTTP/WebSocket
                                  v
                    +-------------+--------------+
                    |   Express Backend (3008)   |
                    |  - REST API Routes         |
                    |  - WebSocket Events        |
                    |  - Service Layer           |
                    +-------------+--------------+
                                  |
         +------------------------+------------------------+
         |                        |                        |
         v                        v                        v
+--------+---------+   +----------+----------+   +---------+--------+
|  Agent Service   |   | Terminal Service    |   | Settings Service |
|  - Claude SDK    |   | - node-pty          |   | - JSON storage   |
|  - Codex SDK     |   | - PTY sessions      |   | - Credentials    |
+--------+---------+   +----------+----------+   +---------+--------+
         |                        |                        |
         v                        v                        v
+--------+---------+   +----------+----------+   +---------+--------+
|   AI Providers   |   |   Shell Process     |   |   File System    |
|  (Anthropic API) |   |   (bash/zsh/cmd)    |   |   (~/.automaker) |
+------------------+   +---------------------+   +------------------+
```

---

## 4.2 Core Process Flows

### 4.2.1 Agent Session Flow

```
+-------------+     +---------------+     +----------------+
|   Client    |     |   Backend     |     |  Agent Service |
+------+------+     +-------+-------+     +--------+-------+
       |                    |                      |
       |  POST /sessions    |                      |
       +------------------->|                      |
       |                    |  createSession()     |
       |                    +--------------------->|
       |                    |                      |
       |                    |   sessionId          |
       |<-------------------+<---------------------+
       |                    |                      |
       |  WS Connect        |                      |
       |  /api/events       |                      |
       +------------------->|                      |
       |                    |                      |
       |  POST /agent/start |                      |
       +------------------->|                      |
       |                    |  startConversation() |
       |                    +--------------------->|
       |                    |                      |
       |  POST /agent/send  |                      |
       +------------------->|                      |
       |                    |  sendMessage()       |
       |                    +--------------------->|
       |                    |                      |
       |   WS: stream       |     Claude API       |
       |<-------------------+<---------------------+
       |                    |                      |
       |   WS: tool_use     |                      |
       |<-------------------+                      |
       |                    |                      |
       |   WS: complete     |                      |
       |<-------------------+                      |
       |                    |                      |
```

### 4.2.2 Auto-Mode Feature Development Flow

```
+-------------+     +---------------+     +----------------+     +-------------+
|   Client    |     |  Auto-Mode    |     |  Agent Service |     |  Git Utils  |
+------+------+     +-------+-------+     +--------+-------+     +------+------+
       |                    |                      |                    |
       |  Run Feature       |                      |                    |
       +------------------->|                      |                    |
       |                    |  Create Worktree     |                    |
       |                    +--------------------------------------------->
       |                    |                      |                    |
       |                    |<---------------------------------------------+
       |                    |                      |                    |
       |                    |  Start Planning      |                    |
       |                    +--------------------->|                    |
       |                    |                      |                    |
       |   WS: planning     |     Generate Plan    |                    |
       |<-------------------+<---------------------+                    |
       |                    |                      |                    |
       |  Approve Plan      |                      |                    |
       +------------------->|                      |                    |
       |                    |                      |                    |
       |                    |  Start Implementing  |                    |
       |                    +--------------------->|                    |
       |                    |                      |                    |
       |   WS: implementing |     Execute Code     |                    |
       |<-------------------+<---------------------+                    |
       |                    |                      |                    |
       |  Verify Feature    |                      |                    |
       +------------------->|                      |                    |
       |                    |                      |                    |
       |  Commit Feature    |                      |                    |
       +------------------->|                      |                    |
       |                    |  Git Commit          |                    |
       |                    +--------------------------------------------->
       |                    |                      |                    |
       |   WS: committed    |                      |                    |
       |<-------------------+                      |                    |
```

### 4.2.3 Terminal Session Flow

```
+-------------+     +---------------+     +----------------+     +-------------+
|   Client    |     |   Backend     |     |Terminal Service|     |   node-pty  |
+------+------+     +-------+-------+     +--------+-------+     +------+------+
       |                    |                      |                    |
       |  POST /terminal    |                      |                    |
       |  /sessions         |                      |                    |
       +------------------->|                      |                    |
       |                    |  createSession()     |                    |
       |                    +--------------------->|                    |
       |                    |                      |  spawn()           |
       |                    |                      +-------------------->
       |                    |                      |                    |
       |                    |    sessionId         |                    |
       |<-------------------+<---------------------+                    |
       |                    |                      |                    |
       |  WS Connect        |                      |                    |
       |  /api/terminal/ws  |                      |                    |
       +------------------->|                      |                    |
       |                    |                      |                    |
       |   WS: connected    |                      |                    |
       |<-------------------+                      |                    |
       |                    |                      |                    |
       |   WS: scrollback   |                      |                    |
       |<-------------------+                      |                    |
       |                    |                      |                    |
       |  WS: {type:"input"}|                      |                    |
       +------------------->|                      |                    |
       |                    |  write()             |                    |
       |                    +--------------------->|                    |
       |                    |                      |  write()           |
       |                    |                      +-------------------->
       |                    |                      |                    |
       |                    |                      |  onData            |
       |                    |                      |<--------------------+
       |   WS: {type:"data"}|                      |                    |
       |<-------------------+<---------------------+                    |
```

---

## 4.3 Data Flow Diagrams

### 4.3.1 Settings Data Flow

```
+------------------+     +------------------+     +------------------+
|   UI Settings    |     |  Settings Service|     |   File System    |
|   Component      |     |                  |     |                  |
+--------+---------+     +--------+---------+     +--------+---------+
         |                        |                        |
         |  GET /settings/global  |                        |
         +----------------------->|                        |
         |                        |  readFile()            |
         |                        +----------------------->|
         |                        |                        |
         |                        |  settings.json         |
         |                        |<-----------------------+
         |                        |                        |
         |   GlobalSettings       |                        |
         |<-----------------------+                        |
         |                        |                        |
         |  POST /settings/global |                        |
         +----------------------->|                        |
         |                        |  writeFile()           |
         |                        +----------------------->|
         |                        |                        |
         |   { success: true }    |                        |
         |<-----------------------+                        |

Storage Locations:
  ~/.automaker/settings.json      (Global settings)
  ~/.automaker/credentials.json   (API keys - encrypted)
  {project}/.automaker/settings.json (Project settings)
```

### 4.3.2 Event Stream Data Flow

```
+------------------+                              +------------------+
|   React Client   |                              |   Express Server |
+--------+---------+                              +--------+---------+
         |                                                 |
         |  WebSocket Connect: ws://localhost:3008/api/events
         +------------------------------------------------>|
         |                                                 |
         |           { type: "agent:stream",               |
         |             sessionId: "...",                   |
         |             content: "..." }                    |
         |<------------------------------------------------+
         |                                                 |
         |           { type: "agent:tool_use",             |
         |             sessionId: "...",                   |
         |             tool: { name, input } }             |
         |<------------------------------------------------+
         |                                                 |
         |           { type: "agent:complete",             |
         |             sessionId: "...",                   |
         |             content: "..." }                    |
         |<------------------------------------------------+
         |                                                 |
         |           { type: "feature:status",             |
         |             featureId: "...",                   |
         |             status: "implementing" }            |
         |<------------------------------------------------+
```

---

## 4.4 State Machines

### 4.4.1 Feature Status State Machine

```
                          +----------+
                          |  pending |
                          +----+-----+
                               |
                     runFeature()
                               |
                               v
                          +----------+
               +--------->| planning |<--------+
               |          +----+-----+         |
               |               |               |
               |      approvePlan()      rejectPlan()
               |               |               |
               |               v               |
               |          +----------+         |
               +----------| approved |         |
                          +----+-----+         |
                               |               |
                    startImplementation()      |
                               |               |
                               v               |
                      +--------------+         |
               +----->| implementing +---------+
               |      +------+-------+    error
               |             |
               |      completeImplementation()
               |             |
               |             v
               |      +-----------+
               +------+ verifying |
                error +-----+-----+
                            |
                    verifyFeature()
                            |
                            v
                      +-----------+
                      | committing|
                      +-----+-----+
                            |
                    commitFeature()
                            |
                            v
                      +----------+
                      |   done   |
                      +----------+
```

### 4.4.2 Agent Session State Machine

```
                      +----------+
                      |   idle   |
                      +----+-----+
                           |
                  sendMessage()
                           |
                           v
                      +----------+
                      | running  |<----+
                      +----+-----+     |
                           |           |
          +----------------+------+    |
          |                       |    |
    completion              abort()   error (retry)
          |                       |    |
          v                       v    |
    +----------+            +----------+
    |   idle   |            | stopped  +----+
    +----------+            +----------+
```

---

## 4.5 Sequence Diagrams

### 4.5.1 Authentication Flow

```
+--------+     +--------+     +----------+     +---------+
| Client |     | Server |     | AuthLib  |     | KeyStore|
+---+----+     +---+----+     +----+-----+     +----+----+
    |              |               |                |
    |  Login       |               |                |
    +------------->|               |                |
    |              |  validateKey  |                |
    |              +-------------->|                |
    |              |               | getPassword    |
    |              |               +--------------->|
    |              |               |                |
    |              |               |  API key       |
    |              |               |<---------------+
    |              |               |                |
    |              |  isValid      |                |
    |              |<--------------+                |
    |              |               |                |
    |  Set Cookie  |               |                |
    |<-------------+               |                |
    |              |               |                |
```

---

## 4.6 Quality Checklist

- [x] Main system flow is documented
- [x] All major features have process flows
- [x] Error paths are shown in state machines
- [x] Diagrams use ASCII art (not Unicode)
- [x] Data flows show storage locations
- [x] Sequence diagrams show inter-component communication
