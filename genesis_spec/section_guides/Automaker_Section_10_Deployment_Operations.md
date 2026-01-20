# Automaker Genesis Specification - Section 10: Deployment & Operations

**Version**: 1.0.0
**Last Updated**: 2026-01-20
**Status**: Active Development

---

## 10.1 Build System

### Build Commands

| Command | Description |
|---------|-------------|
| `npm run build` | Build all packages and apps |
| `npm run build:packages` | Build shared libraries only |
| `npm run build --workspace=apps/server` | Build server only |
| `npm run build --workspace=apps/ui` | Build UI only |
| `npm run build:electron` | Build desktop app |

### Build Process Flow

```
npm run build
     |
     v
+------------------+
| build:packages   |   libs/types, libs/utils, libs/prompts,
|                  |   libs/platform, libs/git-utils, etc.
+--------+---------+
         |
         v
+--------+---------+     +------------------+
| apps/server/     |     | apps/ui/         |
| tsc -> dist/     |     | vite -> dist/    |
+------------------+     +------------------+
```

### TypeScript Configuration

```json
// tsconfig.json (root)
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "paths": {
      "@automaker/*": ["./libs/*/src"]
    }
  }
}
```

---

## 10.2 Installation Methods

### Development Setup

```bash
# Clone repository
git clone https://github.com/AutoMaker-Org/automaker.git
cd automaker

# Install dependencies
npm install

# Build shared packages
npm run build:packages

# Start development servers
npm run dev          # Interactive launcher
npm run dev:web      # Browser mode
npm run dev:electron # Desktop mode
```

### Docker Deployment

```bash
# Build server image
docker build --target server -t automaker-server .

# Build UI image
docker build --target ui -t automaker-ui .

# Run with docker-compose
docker-compose up -d
```

### Desktop Application

```bash
# Build for current platform
npm run build:electron

# Platform-specific builds
npm run build:electron:mac      # macOS DMG
npm run build:electron:win      # Windows NSIS
npm run build:electron:linux    # Linux AppImage

# Output in apps/ui/release/
```

---

## 10.3 Configuration

### Configuration Hierarchy

```
1. Environment Variables (highest priority)
2. Global Settings (~/.automaker/settings.json)
3. Project Settings ({project}/.automaker/settings.json)
4. Default Values (lowest priority)
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3008 | Server HTTP port |
| `HOST` | 0.0.0.0 | Server bind address |
| `HOSTNAME` | localhost | Display hostname |
| `DATA_DIR` | ./data | Data storage directory |
| `ANTHROPIC_API_KEY` | - | Claude API authentication |
| `CORS_ORIGIN` | - | Allowed CORS origins |
| `ENABLE_REQUEST_LOGGING` | true | HTTP request logging |

### Docker Environment

```yaml
# docker-compose.yml
services:
  server:
    image: automaker-server
    environment:
      - PORT=3008
      - DATA_DIR=/data
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - GH_TOKEN=${GH_TOKEN}
    volumes:
      - automaker-data:/data
      - ./projects:/projects
    ports:
      - "3008:3008"
```

---

## 10.4 Runtime Requirements

### System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 2 cores | 4+ cores |
| RAM | 4 GB | 8+ GB |
| Disk | 2 GB | 10+ GB |
| Node.js | 22.0.0 | 22.x LTS |

### Required Software

| Software | Purpose |
|----------|---------|
| Node.js 22+ | Runtime |
| Git | Version control |
| npm | Package management |

### Optional Software

| Software | Purpose |
|----------|---------|
| Docker | Containerized deployment |
| Claude CLI | Claude agent access |
| Cursor CLI | Cursor model access |
| GitHub CLI | Git operations |

---

## 10.5 Operational Procedures

### Start Server

```bash
# Development
npm run dev:server

# Production (built)
node apps/server/dist/index.js

# Docker
docker-compose up -d server
```

### Stop Server

```bash
# Graceful shutdown (SIGTERM/SIGINT)
Ctrl+C (interactive)
kill -15 <pid>

# Docker
docker-compose down
```

### Restart

```bash
# Docker
docker-compose restart server

# Process manager (if using PM2)
pm2 restart automaker-server
```

### Upgrade

```bash
# Pull latest changes
git pull origin main

# Install new dependencies
npm install

# Rebuild packages
npm run build:packages
npm run build

# Restart server
npm run dev
```

---

## 10.6 Maintenance

### Cleanup Tasks

```bash
# Clear old session data (manual)
rm -rf ~/.automaker/data/agent-sessions/*

# Clean node_modules and reinstall
rm -rf node_modules
npm install

# Clear build artifacts
rm -rf apps/*/dist libs/*/dist
```

### Backup

```bash
# Backup user data
cp -r ~/.automaker ~/automaker-backup-$(date +%Y%m%d)

# Backup project settings
cp -r {project}/.automaker {project}/.automaker-backup
```

### Restore

```bash
# Restore from backup
cp -r ~/automaker-backup-20260120 ~/.automaker
```

---

## 10.7 Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Port already in use | Previous process | `lsof -ti:3008 \| xargs kill -9` |
| WebSocket disconnects | Timeout | Check firewall settings |
| Agent won't start | Missing API key | Set ANTHROPIC_API_KEY |
| Terminal not working | node-pty issue | `npm rebuild node-pty` |
| Session not persisting | Write permissions | Check DATA_DIR permissions |

### Debug Mode

```bash
# Enable debug logging
DEBUG=automaker:* npm run dev

# Set log level in settings
# ~/.automaker/settings.json
{
  "serverLogLevel": "debug"
}
```

### Log Locations

| Location | Content |
|----------|---------|
| Console (stdout) | Server logs |
| ~/.automaker/logs/ | Persistent logs (Electron) |
| Docker logs | `docker logs automaker-server` |

### Port Conflict Resolution

```bash
# Find process using port
lsof -i :3008

# Kill process
kill -9 <PID>

# Or use different port
PORT=3009 npm run dev
```

---

## 10.8 Scaling

### Horizontal Scaling

Not currently supported - single-instance architecture. Future considerations:
- Session state externalization (Redis)
- Load balancer for UI
- Separate agent worker processes

### Vertical Scaling

| Resource | Impact |
|----------|--------|
| More CPU | Faster builds, more concurrent terminals |
| More RAM | More concurrent sessions, larger contexts |
| SSD | Faster file operations, session loading |

### Performance Tuning

```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm run dev

# Disable request logging for performance
ENABLE_REQUEST_LOGGING=false npm run dev
```

---

## 10.9 Quality Checklist

- [x] Build system documented
- [x] All installation methods covered
- [x] Configuration options listed
- [x] Runtime requirements specified
- [x] Operational procedures complete
- [x] Maintenance procedures documented
- [x] Troubleshooting guide provided
- [x] Scaling considerations noted
