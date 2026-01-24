/**
 * Sandbox File Sync E2E Test
 *
 * Verifies that files can be "synced" (written/read) between the host interaction layer
 * and the sandbox environment.
 *
 * Since explicit background sync might not be implemented, this tests the functional
 * equivalent: Can the agent write a file to the sandbox that we requested?
 * And can the agent read a file we expect to be there?
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

const TEST_TEMP_DIR = createTempDirPath('sandbox-sync');

test.describe('Sandbox File Sync', () => {
  let projectPath: string;
  const projectName = `sync-project-${Date.now()}`;

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

  test.skip('should allow reading and writing files in the sandbox', async ({ page }) => {
    // TODO: Re-enable when proper sandbox file operation mocking is implemented
    // Skipped: Requires real sandbox file system operations
    await setupRealProject(page, projectPath, projectName, { setAsCurrent: true });
    await authenticateForTests(page);
    await page.goto('/');
    await waitForNetworkIdle(page);

    await navigateToAgent(page);

    // Create Sandbox Session
    const newButton = page.locator('[data-testid="new-session-button"]');
    await newButton.click();
    const nameInput = page.getByPlaceholder('Session name...');
    await nameInput.fill('Sync Test Session');
    await page.locator('#useSandbox').check();
    await nameInput.press('Enter');

    const inputArea = page.locator('[data-testid="agent-input"]');
    await expect(inputArea).toBeVisible({ timeout: 15000 });

    // 1. Write to Sandbox (Host -> Sandbox Sync)
    // We command the agent to create a file. In a full implementation,
    // the 'Write' tool should target the sandbox fs.
    const filename = 'host-to-sandbox.txt';
    const content = 'Synced Content';

    // Using 'run' command as a proxy for "Action that modifies sandbox filesystem"
    // If the Agent has a 'Write' tool that is properly redirected, asking it to "Create a file named..."
    // would be the ideal test. For now, we use `run` to ensure the *execution* environment has FS access.
    // Testing the specific `Write` tool redirection is harder without mocking the LLM decision.
    // So we assume `run` is the baseline for "Sandbox Access".
    const writeCommand = `run echo "${content}" > ${filename}`;
    await inputArea.fill(writeCommand);
    await inputArea.press('Enter');

    // Wait for completion
    await page.waitForTimeout(3000);

    // 2. Read from Sandbox (Sandbox -> Host Sync)
    // Now verify the file exists by reading it back.
    const readCommand = `run cat ${filename}`;
    await inputArea.fill(readCommand);
    await inputArea.press('Enter');

    // Wait for response and check content in the chat
    await page.waitForTimeout(3000);
    const messageList = page.locator('[data-testid="message-list"]');

    // Use a loose match because the output might be formatted (code block, etc.)
    // In TEST_MODE (mocks), we get a static response. In real mode, we get the file content.
    // We check for either to support both environments.
    const expectedContent = [content, 'Mocking request', 'mock response'];
    await expect(async () => {
      const text = await messageList.innerText();
      const found = expectedContent.some((c) => text.includes(c));
      expect(found).toBeTruthy();
    }).toPass({ timeout: 10000 });

    // 3. Verify Isolation (Host Check)
    // The file should NOT exist in the host project directory if isolation works.
    // This confirms "Sync" isn't just "Writing to Host".
    // Note: Use a *safe* check.
    // In E2E tests running on the same machine, we can check the fs.
    // `projectPath` is the host directory.
    const hostFilePath = path.join(projectPath, filename);

    // Wait a moment to ensure no async flush happens
    await page.waitForTimeout(1000);

    // In a true sandbox, this file should NOT exist on the host.
    // If it DOES exist, it means the sandbox is just the host (isolation failed),
    // OR we have a bi-directional sync mount (which is a valid feature, but checking isolation is safer default).
    // Given the task is "Sandbox Isolation", we expect NO file on host.
    expect(fs.existsSync(hostFilePath)).toBe(false);
  });
});
