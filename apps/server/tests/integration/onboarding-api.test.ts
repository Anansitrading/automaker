/**
 * Integration Test: Onboarding API
 *
 * Tests the complete onboarding flow:
 * 1. POST /api/onboarding/:spriteId/start
 * 2. WebSocket events (step, completed, failed)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import WebSocket from 'ws';

const SERVER_URL = 'http://localhost:3008';
const WS_URL = 'ws://localhost:3008';

describe('Onboarding API Integration', () => {
  let ws: WebSocket;
  const events: any[] = [];

  beforeAll(async () => {
    // Connect to WebSocket
    ws = new WebSocket(`${WS_URL}/api/events`);

    await new Promise((resolve, reject) => {
      ws.on('open', resolve);
      ws.on('error', reject);
    });

    ws.on('message', (data) => {
      const event = JSON.parse(data.toString());
      if (event.type?.startsWith('onboarding:')) {
        events.push(event);
      }
    });
  });

  afterAll(() => {
    ws.close();
  });

  it('should start onboarding and emit progress events', async () => {
    const manifest = {
      claudeCodeInstalled: true,
      mcpServers: [],
      skillsRepos: [],
      systemPrompt: 'Test prompt',
    };

    // Start onboarding
    const response = await fetch(`${SERVER_URL}/api/onboarding/test-sprite-123/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.AUTOMAKER_API_KEY || 'test-ci-api-key',
      },
      body: JSON.stringify(manifest),
    });

    expect(response.status).toBe(202);
    const data = await response.json();
    expect(data.message).toBe('Onboarding started');
    expect(data.spriteId).toBe('test-sprite-123');

    // Wait for events
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Verify events were received
    expect(events.length).toBeGreaterThan(0);

    // Check for step events
    const stepEvents = events.filter((e) => e.type === 'onboarding:step');
    expect(stepEvents.length).toBeGreaterThan(0);

    // Check for completion or failure
    const finalEvents = events.filter(
      (e) => e.type === 'onboarding:completed' || e.type === 'onboarding:failed'
    );
    expect(finalEvents.length).toBeGreaterThan(0);
  }, 10000);
});
