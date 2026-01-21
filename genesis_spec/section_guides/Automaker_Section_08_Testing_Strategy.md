# Automaker Genesis Specification - Section 08: Testing Strategy

**Version**: 1.0.0
**Last Updated**: 2026-01-20
**Status**: Active Development

---

## 8.1 Testing Philosophy

### Test Pyramid

```
                    /\
                   /  \
                  / E2E \          <- Few, slow, high confidence
                 /--------\
                /   Integ  \       <- Some, moderate speed
               /------------\
              /    Unit      \     <- Many, fast, isolated
             /________________\
```

### Guiding Principles

1. **Test Behavior, Not Implementation**: Focus on what code does, not how
2. **Fast Feedback**: Unit tests should run in milliseconds
3. **Isolation**: Tests should not depend on external services
4. **Deterministic**: Same input always produces same output
5. **Maintainable**: Tests should be easy to understand and update

---

## 8.2 Test Types

| Type        | Coverage Target | Tools      | Location                  |
| ----------- | --------------- | ---------- | ------------------------- |
| Unit        | 80%+            | Vitest     | `apps/server/tests/unit/` |
| Integration | Key flows       | Vitest     | `apps/server/tests/`      |
| E2E         | Critical paths  | Playwright | `e2e/`                    |
| Package     | Shared libs     | Vitest     | `libs/*/tests/`           |

### Unit Tests (Vitest)

- **Purpose**: Test individual functions and classes in isolation
- **Speed**: <100ms per test
- **Mocking**: External dependencies are mocked
- **Assertions**: Vitest expect API

### Integration Tests

- **Purpose**: Test service interactions and API routes
- **Speed**: <1s per test
- **Mocking**: External APIs mocked, internal services real
- **Assertions**: Response validation

### End-to-End Tests (Playwright)

- **Purpose**: Test complete user workflows
- **Speed**: 5-30s per test
- **Environment**: Full stack (UI + Server)
- **Assertions**: DOM state and network responses

---

## 8.3 Test Organization

### Directory Structure

```
apps/server/
+-- tests/
    +-- unit/
    |   +-- services/
    |   |   +-- agent-service.test.ts
    |   |   +-- auto-mode-service.test.ts
    |   |   +-- terminal-service.test.ts
    |   |   +-- settings-service.test.ts
    |   |   +-- feature-loader.test.ts
    |   |   +-- pipeline-service.test.ts
    |   |   +-- ideation-service.test.ts
    |   |   +-- claude-usage-service.test.ts
    |   |   +-- dev-server-service.test.ts
    |   |   +-- mcp-test-service.test.ts
    |   |   +-- cursor-config-service.test.ts
    |   |   +-- auto-mode-service-planning.test.ts
    |   |   +-- auto-mode-task-parsing.test.ts
    |   |
    |   +-- routes/
    |   |   +-- pipeline.test.ts
    |   |   +-- running-agents.test.ts
    |   |   +-- app-spec/
    |   |       +-- common.test.ts
    |   |       +-- parse-and-create-features.test.ts
    |   |
    |   +-- lib/
    |       +-- security.test.ts
    |       +-- prompt-builder.test.ts

apps/ui/
+-- tests/
    +-- e2e/
        +-- example.spec.ts

libs/*/
+-- tests/
    +-- *.test.ts
```

### Naming Conventions

- Test files: `*.test.ts` or `*.spec.ts`
- Describe blocks: Feature or class name
- Test names: `should <expected behavior> when <condition>`

```typescript
describe('AgentService', () => {
  describe('sendMessage', () => {
    it('should stream responses when agent is not running', async () => {
      // Test implementation
    });

    it('should throw error when session not found', async () => {
      // Test implementation
    });
  });
});
```

---

## 8.4 Test Examples

### Unit Test Example

```typescript
// apps/server/tests/unit/services/agent-service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AgentService } from '../../../src/services/agent-service.js';

describe('AgentService', () => {
  let agentService: AgentService;
  let mockEvents: EventEmitter;
  let mockSettings: SettingsService;

  beforeEach(() => {
    mockEvents = { emit: vi.fn(), subscribe: vi.fn() };
    mockSettings = { getGlobalSettings: vi.fn() };
    agentService = new AgentService('./test-data', mockEvents, mockSettings);
  });

  describe('createSession', () => {
    it('should create session with generated ID', async () => {
      const session = await agentService.createSession('Test Session');

      expect(session.id).toBeDefined();
      expect(session.name).toBe('Test Session');
      expect(session.createdAt).toBeDefined();
    });

    it('should validate working directory path', async () => {
      await expect(agentService.createSession('Test', '/etc/passwd')).rejects.toThrow(
        'Path not allowed'
      );
    });
  });
});
```

### Integration Test Example

```typescript
// apps/server/tests/integration/routes/sessions.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createTestServer } from '../../helpers/server.js';

describe('Sessions API', () => {
  let app: Express.Application;

  beforeAll(async () => {
    app = await createTestServer();
  });

  it('POST /api/sessions creates a new session', async () => {
    const response = await request(app)
      .post('/api/sessions')
      .send({ name: 'Test Session' })
      .set('X-API-Key', 'test-key')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.session.name).toBe('Test Session');
  });
});
```

### E2E Test Example

```typescript
// e2e/example.spec.ts
import { test, expect } from '@playwright/test';

test('user can create a new session', async ({ page }) => {
  await page.goto('http://localhost:3007');

  // Click create session button
  await page.click('[data-testid="create-session"]');

  // Fill in session name
  await page.fill('[data-testid="session-name-input"]', 'My Test Session');

  // Submit
  await page.click('[data-testid="create-session-submit"]');

  // Verify session appears in list
  await expect(page.locator('text=My Test Session')).toBeVisible();
});
```

---

## 8.5 CI/CD Testing

### GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  format:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: npm ci
      - run: npm run format:check

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run build

  test-packages:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run test:packages

  test-server:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run test:server
```

### CI Testing Environment

```bash
# Mock agent mode for CI (no API key required)
AUTOMAKER_MOCK_AGENT=true npm run test
```

---

## 8.6 Coverage Metrics

### Coverage Targets

| Area               | Current | Target |
| ------------------ | ------- | ------ |
| Server Unit Tests  | ~75%    | 80%    |
| Shared Packages    | ~60%    | 70%    |
| E2E Critical Paths | ~50%    | 80%    |

### Coverage Reports

```bash
# Generate coverage report
npm run test:server:coverage

# Output location
coverage/
+-- lcov-report/
|   +-- index.html      # HTML report
+-- lcov.info           # LCOV format
+-- coverage-summary.json
```

### Coverage Configuration

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      exclude: ['node_modules', 'dist', '**/*.test.ts', '**/types/**'],
      thresholds: {
        lines: 80,
        branches: 75,
        functions: 80,
        statements: 80,
      },
    },
  },
});
```

---

## 8.7 Test Commands Reference

| Command                        | Description                |
| ------------------------------ | -------------------------- |
| `npm run test`                 | Run E2E tests (Playwright) |
| `npm run test:headed`          | E2E with visible browser   |
| `npm run test:server`          | Server unit tests          |
| `npm run test:server:coverage` | Server tests with coverage |
| `npm run test:packages`        | Shared library tests       |
| `npm run test:all`             | All tests                  |
| `npm run test:watch`           | Watch mode                 |

---

## 8.8 Quality Checklist

- [x] Test strategy defined (pyramid approach)
- [x] Coverage targets set for all areas
- [x] Test examples provided for each type
- [x] CI integration documented
- [x] Coverage reporting configured
- [x] Test commands listed
- [x] Naming conventions established
