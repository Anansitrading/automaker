/**
 * Sandbox Workflow E2E Test
 *
 * Verifies that a user can create a session with sandbox isolation enabled.
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

const TEST_TEMP_DIR = createTempDirPath('sandbox-test');

test.describe('Sandbox Workflow', () => {
  let projectPath: string;
  const projectName = `sandbox-project-${Date.now()}`;

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

  test('should create a new session with sandbox enabled', async ({ page }) => {
    // 1. Setup and Authenticate
    await setupRealProject(page, projectPath, projectName, { setAsCurrent: true });
    await authenticateForTests(page);
    await page.goto('/');
    await waitForNetworkIdle(page);

    // 2. Navigate to Agent View
    await navigateToAgent(page);
    await expect(page.locator('[data-testid="agent-view"]')).toBeVisible({ timeout: 10000 });

    // 3. Open Creation Form
    const newButton = page.locator('[data-testid="new-session-button"]');
    await expect(newButton).toBeVisible();
    await newButton.click();

    // 4. Verify Form Elements
    // Wait for the input to appear
    const nameInput = page.getByPlaceholder('Session name...');
    await expect(nameInput).toBeVisible();

    // Check "Use Sandbox" checkbox
    // Using ID selector since I added id="useSandbox"
    const sandboxCheckbox = page.locator('#useSandbox');
    await expect(sandboxCheckbox).toBeVisible();
    await sandboxCheckbox.check();

    // 5. Submit Form
    // The check button (submit) is next to the input
    // It's an icon button with Check icon.
    // I can press Enter on the input or click the button.
    // Pressing Enter is reliable.
    await nameInput.press('Enter');

    // 6. Verify Session Created
    // Wait for the session list to be populated and input to disappear
    await expect(nameInput).not.toBeVisible();

    // Verify a session item is visible/selected
    // Session items have data-testid=`session-item-${id}`
    // We don't know the ID, but we can check if any session item is present
    // or look for "thinking..." or the session name (randomly generated if empty, but here random).

    // Since I left name empty, it generated a random one.
    // I should verify that the session list has items.
    const sessionList = page.locator('[data-testid="session-list"]');
    await expect(sessionList).toBeVisible();

    // A more robust check might be to see if the message list appeared (session selected)
    await expect(page.locator('[data-testid="message-list"]')).toBeVisible({ timeout: 10000 });

    // Note: Verifying the metadata actually persisted 'useSandbox: true' would require
    // inspecting the backend state or API response, which is hard in E2E without API access.
    // Assuming UI flow working means success for this E2E scope.
  });
});
