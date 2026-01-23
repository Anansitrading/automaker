/**
 * Sandbox Lifecycle E2E Test
 *
 * Verifies that the sandbox can be hibernated (shutdown) and automatically woken up
 * when the user interacts with the agent.
 */

import { test, expect, request } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import {
  createTempDirPath,
  cleanupTempDir,
  setupRealProject,
  waitForNetworkIdle,
  navigateToAgent,
  authenticateForTests,
} from '../utils';

const TEST_TEMP_DIR = createTempDirPath('sandbox-lifecycle');

test.describe('Sandbox Lifecycle', () => {
  let projectPath: string;
  const projectName = `lifecycle-project-${Date.now()}`;

  test.beforeAll(async () => {
    if (!fs.existsSync(TEST_TEMP_DIR)) {
      fs.mkdirSync(TEST_TEMP_DIR, { recursive: true });
    }

    projectPath = path.join(TEST_TEMP_DIR, projectName);
    fs.mkdirSync(projectPath, { recursive: true });

    const automakerDir = path.join(projectPath, '.automaker');
    fs.mkdirSync(automakerDir, { recursive: true });
    fs.writeFileSync(
      path.join(projectPath, 'package.json'),
      JSON.stringify({ name: projectName }, null, 2)
    );
  });

  test.afterAll(async () => {
    cleanupTempDir(TEST_TEMP_DIR);
  });

  test('should wake up a hibernating sprite upon user interaction', async ({ page, request }) => {
    // 1. Setup and Authenticate
    await setupRealProject(page, projectPath, projectName, { setAsCurrent: true });
    await authenticateForTests(page);
    await page.goto('/');
    await waitForNetworkIdle(page);

    await navigateToAgent(page);

    // 2. Create Sandbox Session
    const newButton = page.locator('[data-testid="new-session-button"]');
    await newButton.click();

    const nameInput = page.getByPlaceholder('Session name...');
    await nameInput.fill('Lifecycle Test Session');

    // Enable Sandbox
    const sandboxCheckbox = page.locator('#useSandbox');
    await sandboxCheckbox.check();
    await nameInput.press('Enter');

    const inputArea = page.locator('[data-testid="agent-input"]');
    await expect(inputArea).toBeVisible({ timeout: 15000 });

    // 3. Verify Sprite Exists & Get ID
    // We need to find the sprite associated with this session.
    // The session ID is in the URL: /agent/:sessionId (or we can get it from session list)

    // Wait for URL to update
    await page.waitForURL(/\/agent\/.+/);
    const sessionId = page.url().split('/').pop();
    expect(sessionId).toBeTruthy();

    // Check sprites list via direct API
    // We need to use the same auth cookies/headers as the page if possible,
    // or just assume local dev server has lax auth or we can use the 'request' fixture provided by Playwright
    // which shares context if configured, or we just rely on standard fetching.
    // Note: 'request' fixture in Playwright *doesn't* automatically share page cookie jar context unless configured with storageState.
    // However, if we run locally without rigorous auth on the API port, might be fine.
    // AgentService uses "agent-{sessionId}" as sprite name.

    // Let's rely on `page.evaluate` to use the browser's authenticated context to fetch.
    const spriteName = `agent-${sessionId}`;

    // Poll API until sprite appears (it might take a moment to provision in BG,
    // though createSession usually initiates it or startConversation does).
    // Actually `spawnAgent` called startConversation then sprite creation.
    // Adding a small delay to allow async provisioning start.
    await page.waitForTimeout(1000);

    // Get Sprite info via browser context
    let spriteId: string | null = await page.evaluate(async (name) => {
      const res = await fetch('/api/sprites');
      const data = await res.json();
      // The API returns { sprites: [...] } or just array?
      // Typically SpriteService returns array.
      // But verifying SpriteApiClient... it returns `Sprite[]`.
      // Let's assume array.
      // We look for name `agent-${sessionId}`
      const sprite = Array.isArray(data) ? data.find((s: any) => s.name === name) : null;
      return sprite ? sprite.id : null;
    }, spriteName);

    // If not found yet (maybe provisioning), verify we can run a command (triggers creation)
    if (!spriteId) {
      await inputArea.fill('run echo "init"');
      await inputArea.press('Enter');
      await page.waitForTimeout(2000); // Wait for processing

      // Try getting ID again
      spriteId = await page.evaluate(async (name) => {
        const res = await fetch('/api/sprites');
        const data = await res.json();
        const sprite = Array.isArray(data) ? data.find((s: any) => s.name === name) : null;
        return sprite ? sprite.id : null;
      }, spriteName);
    }

    // Pass only if we found the sprite (proving it was created)
    expect(spriteId).toBeTruthy();

    if (!spriteId) return; // Should fail by expect above

    // 4. Force Hibernate
    console.log(`Forcing hibernate for sprite ${spriteId}...`);
    // Using page.evaluate to call shutdown endpoint
    const shutdownResult = await page.evaluate(async (id) => {
      const res = await fetch(`/api/sprites/${id}/shutdown`, { method: 'POST' });
      return res.ok;
    }, spriteId);

    expect(shutdownResult).toBe(true);

    // Verify it is hibernating/stopped
    // Polling status
    await expect(async () => {
      const status = await page.evaluate(async (id) => {
        const res = await fetch(`/api/sprites/${id}`);
        const data = await res.json();
        return data.status;
      }, spriteId);
      expect(status).toBe('hibernating'); // or 'stopped' depending on impl details
    }).toPass({ timeout: 10000 });

    // 5. Wake via UI Interaction
    console.log('Interacting to wake sprite...');
    const wakeCommand = 'run echo "I am awake"';
    await inputArea.fill(wakeCommand);
    await inputArea.press('Enter');

    // 6. Verify Woken
    // Check status again
    await expect(async () => {
      const status = await page.evaluate(async (id) => {
        const res = await fetch(`/api/sprites/${id}`);
        const data = await res.json();
        return data.status;
      }, spriteId);
      expect(status).toBe('running');
    }).toPass({ timeout: 15000 });

    // Verify response message appears (indicating successful execution)
    // In TEST_MODE, we get mock response. In real mode, we get "I am awake".
    // Checking for either proves the wake cycle completed.
    const expectedTexts = ['I am awake', 'mock response', 'This is a mock'];
    await expect(async () => {
      const bodyText = await page.locator('body').innerText();
      const found = expectedTexts.some((text) => bodyText.includes(text));
      expect(found).toBeTruthy();
    }).toPass({ timeout: 15000 });
  });
});
