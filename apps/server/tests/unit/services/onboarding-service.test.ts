import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OnboardingService, OnboardingManifest } from '../../../src/services/onboarding-service.js';
// We don't need to import SpriteApiClient for mocking if we assume dependency injection works

describe('OnboardingService', () => {
  let service: OnboardingService;
  let mockSpriteClient: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create a plain object mock
    mockSpriteClient = {
      execCommand: vi.fn().mockResolvedValue({ exitCode: 0, stdout: '', stderr: '' }),
      createCheckpoint: vi.fn().mockResolvedValue({ id: 'cp-1', name: 'onboarding-complete' }),
      on: vi.fn(),
      emit: vi.fn(),
      // Add other methods if necessary
    };

    service = new OnboardingService(mockSpriteClient as any);
  });

  it('should execute all onboarding steps successfully', async () => {
    const manifest: OnboardingManifest = {
      claudeCodeInstalled: true,
      mcpServers: [
        {
          name: 'test-server',
          transport: 'stdio',
          scope: 'project',
        },
      ],
      skillsRepos: ['https://github.com/test/skill.git'],
      systemPrompt: 'You are a test agent.',
    };

    const steps: any[] = [];
    service.on('step', (step) => steps.push(step));

    await service.startOnboarding('sprite-123', manifest);

    // Verify steps were emitted (running + completed for 11 steps = 22 events)
    expect(steps.length).toBeGreaterThan(0);

    // Check specific calls
    expect(mockSpriteClient.execCommand).toHaveBeenCalledWith(
      'sprite-123',
      expect.stringContaining('claude --version')
    );
    expect(mockSpriteClient.execCommand).toHaveBeenCalledWith(
      'sprite-123',
      expect.stringContaining('git clone https://github.com/test/skill.git')
    );
    expect(mockSpriteClient.execCommand).toHaveBeenCalledWith(
      'sprite-123',
      expect.stringContaining('echo "You are a test agent." > CLAUDE.md')
    );
    expect(mockSpriteClient.createCheckpoint).toHaveBeenCalledWith(
      'sprite-123',
      'onboarding-complete'
    );
  });

  it('should fail if a step fails', async () => {
    mockSpriteClient.execCommand
      .mockResolvedValueOnce({ exitCode: 0, stdout: '', stderr: '' }) // Step 1 OK
      .mockResolvedValueOnce({ exitCode: 1, stdout: '', stderr: 'OAuth failed' }); // Step 2 Fails

    const manifest: OnboardingManifest = {
      claudeCodeInstalled: true,
      mcpServers: [],
      skillsRepos: [],
      systemPrompt: '',
    };

    await expect(service.startOnboarding('sprite-123', manifest)).rejects.toThrow('Command failed');
  });
});
