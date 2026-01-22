import { Router } from 'express';
import { createLogger } from '@automaker/utils';
import { OnboardingService, OnboardingManifest } from '../../services/onboarding-service.js';

const logger = createLogger('OnboardingRoutes');

export function createOnboardingRoutes(onboardingService: OnboardingService): Router {
  const router = Router();

  router.post('/:spriteId/start', async (req, res) => {
    try {
      const { spriteId } = req.params;
      const manifest = req.body as OnboardingManifest;

      // Basic validation
      if (!manifest || !manifest.systemPrompt) {
        res.status(400).json({ error: 'Invalid manifest: systemPrompt is required' });
        return;
      }

      logger.info(`Received onboarding request for sprite ${spriteId}`);

      // Start onboarding asynchronously
      onboardingService.startOnboarding(spriteId, manifest).catch((err) => {
        logger.error(`Async onboarding failed for ${spriteId}`, err);
      });

      res.status(202).json({
        message: 'Onboarding started',
        spriteId,
      });
    } catch (error: any) {
      logger.error('Error starting onboarding', error);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
