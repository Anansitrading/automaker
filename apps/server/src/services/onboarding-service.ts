import { EventEmitter } from 'events';
import { createLogger } from '@automaker/utils';
import { SpriteApiClient } from './sprite-api-client.js';

const logger = createLogger('OnboardingService');

export interface OnboardingManifest {
  claudeCodeInstalled: boolean;
  mcpServers: Array<{
    name: string;
    transport: 'stdio' | 'http' | 'sse';
    command?: string;
    args?: string[];
    url?: string;
    scope: 'user' | 'project';
    env?: Record<string, string>;
  }>;
  skillsRepos: string[];
  systemPrompt: string;
}

export interface OnboardingStep {
  id: number;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error?: string;
}

export class OnboardingService extends EventEmitter {
  private spriteClient: SpriteApiClient;

  constructor(spriteClient: SpriteApiClient) {
    super();
    this.spriteClient = spriteClient;
  }

  async startOnboarding(spriteId: string, manifest: OnboardingManifest): Promise<void> {
    logger.info(`Starting onboarding for sprite ${spriteId}`);

    try {
      // Step 1: Check Claude Code availability
      await this.runStep(1, 'Check Claude Code availability', async () => {
        if (!manifest.claudeCodeInstalled) {
          logger.info('Skipping Claude Code check as per manifest');
          return;
        }
        await this.exec(spriteId, 'claude --version');
      });

      // Step 2: Configure OAuth credentials
      await this.runStep(2, 'Configure OAuth credentials', async () => {
        // TODO: Implement credential injection
        // This might involve writing a config file or setting env vars
        // For now, assuming env vars are handled via SpriteConfig or similar
        await this.exec(spriteId, 'echo "Configuring OAuth..."');
      });

      // Step 3: Install OpenTelemetry SDK
      await this.runStep(3, 'Install OpenTelemetry SDK', async () => {
        // Assuming Node.js environment for now, or maybe this is a system-wide install?
        // "Install OpenTelemetry SDK" -> likely npm install in the workspace or global
        await this.exec(
          spriteId,
          'npm install -g @opentelemetry/api @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node'
        );
      });

      // Step 4: Install MCP servers
      await this.runStep(4, 'Install MCP servers', async () => {
        for (const server of manifest.mcpServers) {
          logger.info(`Installing MCP server: ${server.name}`);
          // Logic to install/configure MCP server
          // e.g. writing to specific config files
        }
      });

      // Step 5: Install skills repositories
      await this.runStep(5, 'Install skills repositories', async () => {
        for (const repo of manifest.skillsRepos) {
          await this.exec(
            spriteId,
            `git clone ${repo} skills/${repo.split('/').pop()?.replace('.git', '')}`
          );
        }
      });

      // Step 6: Setup git config + auth
      await this.runStep(6, 'Setup git config + auth', async () => {
        await this.exec(spriteId, 'git config --global user.name "Claude Agent"');
        await this.exec(spriteId, 'git config --global user.email "agent@automaker.dev"');
        // Auth would likely be pre-configured or injected via env vars
      });

      // Step 7: Clone main repository
      await this.runStep(7, 'Clone main repository', async () => {
        // This usually requires knowledge of WHAT repo to clone.
        // Assuming it's part of the sprite request or manifest?
        // For now, placeholder.
        await this.exec(spriteId, 'echo "Cloning main repo..."');
      });

      // Step 8: Create git worktree
      await this.runStep(8, 'Create git worktree', async () => {
        // Logic to create worktree
        await this.exec(spriteId, 'echo "Creating worktree..."');
      });

      // Step 9: Install dependencies
      await this.runStep(9, 'Install dependencies', async () => {
        // Detection logic: package.json vs requirements.txt
        await this.exec(spriteId, 'if [ -f package.json ]; then npm install; fi');
        await this.exec(
          spriteId,
          'if [ -f requirements.txt ]; then pip install -r requirements.txt; fi'
        );
      });

      // Step 10: Create CLAUDE.md system prompt
      await this.runStep(10, 'Create CLAUDE.md system prompt', async () => {
        const content = manifest.systemPrompt.replace(/"/g, '\\"'); // Simple escaping
        await this.exec(spriteId, `echo "${content}" > CLAUDE.md`);
      });

      // Step 11: Create checkpoint
      await this.runStep(11, 'Create checkpoint', async () => {
        await this.spriteClient.createCheckpoint(spriteId, 'onboarding-complete');
      });

      logger.info(`Onboarding completed for sprite ${spriteId}`);
      this.emit('completed', { spriteId });
    } catch (error) {
      logger.error(`Onboarding failed for sprite ${spriteId}`, error);
      this.emit('failed', { spriteId, error });
      throw error;
    }
  }

  private async runStep(id: number, name: string, action: () => Promise<void>) {
    this.emit('step', { id, name, status: 'running' });
    try {
      await action();
      this.emit('step', { id, name, status: 'completed' });
    } catch (err: any) {
      this.emit('step', { id, name, status: 'failed', error: err.message });
      throw err;
    }
  }

  private async exec(spriteId: string, command: string) {
    const result = await this.spriteClient.execCommand(spriteId, command);
    if (result.exitCode !== 0) {
      throw new Error(`Command failed: ${command}\nStderr: ${result.stderr}`);
    }
    return result;
  }
}
