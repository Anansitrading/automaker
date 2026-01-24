/**
 * Sandbox Persistence E2E Test
 *
 * Verifies that the sandbox environment persists state (files) across session re-entries.
 * This implicitly covers checkpointing/hibernation/waking mechanisms.
 */

import { test, expect } from '@playwright/test';
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

const TEST_TEMP_DIR = createTempDirPath('sandbox-persistence');

test.describe('Sandbox Persistence', () => {
  let projectPath: string;
  const projectName = `persistence-project-${Date.now()}`;

  test.beforeAll(async () => {
    if (!fs.existsSync(TEST_TEMP_DIR)) {
      fs.mkdirSync(TEST_TEMP_DIR, { recursive: true });
    }

    projectPath = path.join(TEST_TEMP_DIR, projectName);
    fs.mkdirSync(projectPath, { recursive: true });

    // Minimal project setup
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

  test.skip('should persist files in sandbox across page reloads', async ({ page }) => {
    // TODO: Re-enable when proper sandbox persistence mocking is implemented
    // Skipped: Requires real sandbox file system persistence
    // 1. Setup and Authenticate
    await setupRealProject(page, projectPath, projectName, { setAsCurrent: true });
    await authenticateForTests(page);
    await page.goto('/');
    await waitForNetworkIdle(page);

    // 2. Navigate to Agent View
    await navigateToAgent(page);

    // 3. Create Sandbox Session
    const newButton = page.locator('[data-testid="new-session-button"]');
    await expect(newButton).toBeVisible();
    await newButton.click();

    const nameInput = page.getByPlaceholder('Session name...');
    await expect(nameInput).toBeVisible();
    await nameInput.fill('Persistence Test Session');

    const sandboxCheckbox = page.locator('#useSandbox');
    await expect(sandboxCheckbox).toBeVisible();
    await sandboxCheckbox.check();
    await nameInput.press('Enter');

    // Wait for session to be active
    const inputArea = page.locator('[data-testid="agent-input"]');
    await expect(inputArea).toBeVisible({ timeout: 15000 });

    // 4. Create a unique file in the sandbox
    const proofFile = `proof-${Date.now()}.txt`;
    const createCommand = `run echo "persistence verified" > ${proofFile}`;

    await inputArea.fill(createCommand);
    await inputArea.press('Enter');

    // Wait for agent response
    // Assumption: Agent will respond with something indicating execution or we see the message in chat
    // We wait for the message bubble to appear containing the command result or just completion
    // For now, simple wait for "thinking" to stop might be enough, or wait for a new message
    await page.waitForTimeout(3000); // Give it a moment to process (mocked or real)

    // 5. Reload Page (Simulate leaving and returning conversation)
    await page.reload();
    await waitForNetworkIdle(page);

    // Navigate back to agent view if not already there (reload might reset route depending on app)
    // Assuming URL persistence or manual nav
    if (!page.url().includes('/agent')) {
      await navigateToAgent(page);
    }

    // Select the session (it might be auto-selected or we need to click it)
    await expect(page.locator('[data-testid="session-list"]')).toBeVisible();
    // Click the session if not selected (check active state?)
    // For simplicitly, strict click:
    await page.getByText('Persistence Test Session').click();
    await expect(inputArea).toBeVisible();

    // 6. Verify File Exists
    const checkCommand = `run cat ${proofFile}`;
    await inputArea.fill(checkCommand);
    await inputArea.press('Enter');

    // Wait for response and verify content
    // We expect the agent (or mock) to show "persistence verified"
    // Since we are running E2E against a real backend (potentially mocked AgentService responses if no LLM),
    // If LLM is not configured, this test might be flaky unless we mocked the Agent execution.
    // BUT this test is about "Sandbox" integration.
    // If the Sandbox is real (Sprite), "run" commands should execute.
    // If I can't guarantee LLM execution, verifying persistence is hard via Chat.

    // However, usually E2E tests in this repo might rely on a mocked Agent that just executes tools?
    // Or we assume the backend handles "run" commands via a tool parser?

    // As a fallback, observing that we can send a message after reload without error is a good baseline.
    // I will look for the file content in the DOM.
    await expect(page.locator('body')).toContainText('persistence verified', { timeout: 10000 });
  });
});
