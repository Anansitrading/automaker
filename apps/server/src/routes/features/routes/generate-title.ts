/**
 * POST /features/generate-title endpoint - Generate a concise title from description
 *
 * Uses the provider abstraction to generate a short, descriptive title
 * from a feature description. Works with any configured provider (Claude, Cursor, etc.).
 */

import type { Request, Response } from 'express';
import { createLogger } from '@automaker/utils';
import { CLAUDE_MODEL_MAP } from '@automaker/model-resolver';
import { simpleQuery } from '../../../providers/simple-query-service.js';
import type { SettingsService } from '../../../services/settings-service.js';
import { getPromptCustomization } from '../../../lib/settings-helpers.js';

const logger = createLogger('GenerateTitle');

interface GenerateTitleRequestBody {
  description: string;
}

interface GenerateTitleSuccessResponse {
  success: true;
  title: string;
}

interface GenerateTitleErrorResponse {
  success: false;
  error: string;
}

export function createGenerateTitleHandler(
  settingsService?: SettingsService
): (req: Request, res: Response) => Promise<void> {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      const { description } = req.body as GenerateTitleRequestBody;

      if (!description || typeof description !== 'string') {
        const response: GenerateTitleErrorResponse = {
          success: false,
          error: 'description is required and must be a string',
        };
        res.status(400).json(response);
        return;
      }

      const trimmedDescription = description.trim();
      if (trimmedDescription.length === 0) {
        const response: GenerateTitleErrorResponse = {
          success: false,
          error: 'description cannot be empty',
        };
        res.status(400).json(response);
        return;
      }

      logger.info(`Generating title for description: ${trimmedDescription.substring(0, 50)}...`);

      // Get customized prompts from settings
      const prompts = await getPromptCustomization(settingsService, '[GenerateTitle]');
      const systemPrompt = prompts.titleGeneration.systemPrompt;

      let model = CLAUDE_MODEL_MAP.haiku;

      // Fallback to OpenAI if Anthropic key is missing but OpenAI key is present
      if (!process.env.ANTHROPIC_API_KEY && process.env.OPENAI_API_KEY) {
        // Use gpt-4o which is comparable/better than haiku
        model = 'codex-gpt-4o';
        logger.info(
          'Using OpenAI (codex-gpt-4o) for title generation due to missing Anthropic key'
        );
      }

      const userPrompt = `Generate a concise title for this feature:\n\n${trimmedDescription}`;

      // Use simpleQuery - provider abstraction handles all the streaming/extraction
      const result = await simpleQuery({
        prompt: `${systemPrompt}\n\n${userPrompt}`,
        model,
        cwd: process.cwd(),
        maxTurns: 1,
        allowedTools: [],
      });

      const title = result.text;

      if (!title || title.trim().length === 0) {
        logger.warn('Received empty response from AI');
        const response: GenerateTitleErrorResponse = {
          success: false,
          error: 'Failed to generate title - empty response',
        };
        res.status(500).json(response);
        return;
      }

      logger.info(`Generated title: ${title.trim()}`);

      const response: GenerateTitleSuccessResponse = {
        success: true,
        title: title.trim(),
      };
      res.json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error('Title generation failed:', errorMessage);

      const response: GenerateTitleErrorResponse = {
        success: false,
        error: errorMessage,
      };
      res.status(500).json(response);
    }
  };
}
