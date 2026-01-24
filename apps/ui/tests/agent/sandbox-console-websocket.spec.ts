import { test, expect } from '@playwright/test';
import { WebSocket } from 'ws';

// Skip if we can't run backend tests
const skipTests = process.env.CI || process.env.TEST_MODE === 'true';

test.describe('Sandbox Console WebSocket', () => {
  // We need to unconditionally skip these in CI/Test Mode because they require real Sprites.dev connection
  // and real PTY interaction which our simple mocks don't support yet.
  if (skipTests) {
    test.skip('Skipping sandbox console tests in CI/Test Mode', () => {});
    return;
  }

  test('should establish WebSocket console connection', async ({ page, request }) => {
    // 1. Create a sandbox via API (faster than UI)
    const sandboxName = `console-test-${Date.now()}`;
    const createRes = await request.post('/api/sprites', {
      data: { name: sandboxName },
    });
    // expect(createRes.ok()).toBeTruthy(); // This might fail if no token/internet, handle gracefully
    if (!createRes.ok()) {
      console.log('Skipping test: Failed to create sandbox (likely no SPRITES_TOKEN)');
      test.skip();
      return;
    }

    // Allow some time for provisioning
    // In a real test we'd poll status, but for now fixed wait
    await page.waitForTimeout(5000);

    // 2. Connect to Console WebSocket
    // We use page.evaluate to run WebSocket code in the browser context
    // This connects to our local server proxy
    const wsUrl = `ws://localhost:3008/api/sandboxes/${sandboxName}/console`;

    // We can't easily use node 'ws' here because of auth cookies/headers managed by browser
    // But we CAN use the browser's native WebSocket via page.evaluate

    await page.goto('/dashboard/sandboxes'); // Ensure we are on a page to have context

    const connectionPromise = page.evaluate((url) => {
      return new Promise((resolve, reject) => {
        const ws = new WebSocket(url);
        ws.onopen = () => resolve('connected');
        ws.onerror = (e) => reject('error');
        // Keep it open for a bit
        setTimeout(() => ws.close(), 2000);
      });
    }, wsUrl);

    await expect(connectionPromise).resolves.toBe('connected');

    // Clean up
    await request.delete(`/api/sprites/${sandboxName}`);
  });
});
