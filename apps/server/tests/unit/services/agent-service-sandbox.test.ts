import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AgentService } from '../../../src/services/agent-service';
import { SpriteService } from '../../../src/services/sprite-service';
import { createEventEmitter, EventEmitter } from '../../../src/lib/events';
import * as secureFs from '../../../src/lib/secure-fs';

import path from 'path';

// Mock dependencies
vi.mock('../../../src/services/sprite-service', () => ({
  SpriteService: vi.fn(),
}));
vi.mock('../../../src/lib/secure-fs');
vi.mock('../../../src/providers/provider-factory');

vi.mock('@automaker/utils', () => ({
  createLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  }),
  classifyError: () => ({ type: 'unknown', message: 'error' }),
  readImageAsBase64: vi.fn(),
  buildPromptWithImages: vi.fn(),
  isAbortError: () => false,
  loadContextFiles: vi.fn().mockResolvedValue({ formattedPrompt: '', memoryFiles: [] }),
  getUserFriendlyErrorMessage: (e: any) => e.message,
}));

vi.mock('../../../src/lib/settings-helpers', () => ({
  getAutoLoadClaudeMdSetting: vi.fn().mockResolvedValue(false),
  filterClaudeMdFromContext: vi.fn(),
  getMCPServersFromSettings: vi.fn().mockResolvedValue({}),
  getPromptCustomization: vi.fn().mockResolvedValue({}),
  getSkillsConfiguration: vi.fn().mockResolvedValue({ enabled: false, sources: [] }),
  getSubagentsConfiguration: vi.fn().mockResolvedValue({ enabled: false, sources: [] }),
  getCustomSubagents: vi.fn().mockResolvedValue({}),
}));

describe('AgentService Sandbox', () => {
  let agentService: AgentService;
  let spriteServiceMock: any;
  let events: EventEmitter;
  const dataDir = '/tmp/test-data';

  beforeEach(() => {
    vi.clearAllMocks();
    events = createEventEmitter();

    // Setup SpriteService mock
    spriteServiceMock = {
      createSprite: vi.fn().mockResolvedValue({ id: 'sprite-123', name: 'agent-session-1' }),
      createCheckpoint: vi.fn().mockResolvedValue({ id: 'ckpt-1', name: 'auto-stop' }),
      deleteSprite: vi.fn().mockResolvedValue(undefined),
    };

    // Hack: Replace the internal spriteService instance
    (SpriteService as any).mockImplementation(function () {
      return spriteServiceMock;
    });

    // Mock fs
    (secureFs.mkdir as any).mockResolvedValue(undefined);
    (secureFs.readFile as any).mockImplementation((p: string) => {
      if (p.endsWith('sessions-metadata.json')) {
        return JSON.stringify({
          'session-sandbox-del': { id: 'session-sandbox-del' },
          'session-1': {},
        });
      }
      return JSON.stringify([]);
    });
    (secureFs.writeFile as any).mockResolvedValue(undefined);
    (secureFs.unlink as any).mockResolvedValue(undefined);

    agentService = new AgentService(dataDir, events);
  });

  describe('spawnAgent', () => {
    it('should create a sprite when useSandbox is true', async () => {
      const sessionId = 'session-1';

      // We need to spy on startConversation too since spawnAgent calls it
      const startConvSpy = vi.spyOn(agentService, 'startConversation').mockResolvedValue({
        success: true,
        messages: [],
        sessionId,
      });

      // Inject session into map manually because startConversation mock bypasses logic
      // But spawnAgent logic depends on session existing?
      // Actually spawnAgent calls startConversation first which (in real impl) creates the session.
      // Since we mock startConversation, we must manually ensure session exists OR let startConversation run real logic.
      // Let's attempt to run real logic for startConversation but mock dependencies.
      startConvSpy.mockRestore(); // Use real implementation

      await agentService.initialize();

      await agentService.spawnAgent({
        sessionId,
        useSandbox: true,
      });

      expect(spriteServiceMock.createSprite).toHaveBeenCalledWith(
        expect.objectContaining({
          name: `agent-${sessionId}`,
        })
      );

      // Verify session has spriteId
      const session = (agentService as any).sessions.get(sessionId);
      expect(session).toBeDefined();
      expect(session.spriteId).toBe('sprite-123');
    });

    it('should NOT create a sprite when useSandbox is false', async () => {
      const sessionId = 'session-2';

      await agentService.spawnAgent({
        sessionId,
        useSandbox: false,
      });

      expect(spriteServiceMock.createSprite).not.toHaveBeenCalled();

      const session = (agentService as any).sessions.get(sessionId);
      expect(session).toBeDefined();
      expect(session.spriteId).toBeUndefined();
    });
  });

  describe('stopExecution', () => {
    it('should auto-checkpoint if session has spriteId', async () => {
      const sessionId = 'session-sandbox';

      // Manually set up a session with spriteId
      (agentService as any).sessions.set(sessionId, {
        messages: [],
        isRunning: true,
        abortController: new AbortController(),
        workingDirectory: '/tmp',
        promptQueue: [],
        spriteId: 'sprite-123',
      });

      await agentService.stopExecution(sessionId);

      expect(spriteServiceMock.createCheckpoint).toHaveBeenCalledWith(
        'sprite-123',
        expect.stringMatching(/^auto-stop-/)
      );
    });

    it('should NOT checkpoint if session has no spriteId', async () => {
      const sessionId = 'session-local';

      (agentService as any).sessions.set(sessionId, {
        messages: [],
        isRunning: true,
        abortController: new AbortController(),
        workingDirectory: '/tmp',
        promptQueue: [],
      });

      await agentService.stopExecution(sessionId);

      expect(spriteServiceMock.createCheckpoint).not.toHaveBeenCalled();
    });
  });

  describe('deleteSession', () => {
    it('should delete sprite if session has spriteId', async () => {
      const sessionId = 'session-sandbox-del';

      (agentService as any).sessions.set(sessionId, {
        messages: [],
        isRunning: false,
        abortController: null,
        workingDirectory: '/tmp',
        promptQueue: [],
        spriteId: 'sprite-to-delete',
      });

      await agentService.deleteSession(sessionId);

      expect(spriteServiceMock.deleteSprite).toHaveBeenCalledWith('sprite-to-delete');
      expect((agentService as any).sessions.has(sessionId)).toBe(false);
    });
  });
});
