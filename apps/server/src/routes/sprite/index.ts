import { Router } from 'express';
import { SpriteService } from '../../services/sprite-service.js';
import { createLogger } from '@automaker/utils';
import { createLogError } from '../common.js';

const logger = createLogger('SpriteRoutes');
const logError = createLogError(logger);

export function createSpriteRoutes(spriteService: SpriteService): Router {
  const router = Router();

  // Create sprite
  router.post('/', async (req, res) => {
    try {
      const config = req.body;
      const sprite = await spriteService.createSprite(config);
      res.json(sprite);
    } catch (error) {
      logError(error, 'Failed to create sprite');
      res.status(500).json({ error: 'Failed to create sprite' });
    }
  });

  // List sprites
  router.get('/', async (req, res) => {
    try {
      const sprites = await spriteService.listSprites();
      res.json(sprites);
    } catch (error) {
      logError(error, 'Failed to list sprites');
      res.status(500).json({ error: 'Failed to list sprites' });
    }
  });

  // Get sprite
  // Note: The user request specified :name, but the service expects ID.
  // We'll treat the parameter as an ID for get/delete but simple name for URL.
  // If the upstream API supports name lookup, this will work naturally.
  router.get('/:name', async (req, res) => {
    try {
      const { name } = req.params;
      const sprite = await spriteService.getSprite(name);
      res.json(sprite);
    } catch (error) {
      logError(error, 'Failed to get sprite');
      res.status(500).json({ error: 'Failed to get sprite' });
    }
  });

  // Delete sprite
  router.delete('/:name', async (req, res) => {
    try {
      const { name } = req.params;
      await spriteService.deleteSprite(name);
      res.status(204).send();
    } catch (error) {
      logError(error, 'Failed to delete sprite');
      res.status(500).json({ error: 'Failed to delete sprite' });
    }
  });

  // Execute command
  router.post('/:name/exec', async (req, res) => {
    try {
      const { name } = req.params;
      const { command, timeout } = req.body;

      if (!command) {
        res.status(400).json({ error: 'Command is required' });
        return;
      }

      const result = await spriteService.execCommand(name, command, timeout);
      res.json(result);
    } catch (error) {
      logError(error, 'Failed to execute command');
      res.status(500).json({ error: 'Failed to execute command' });
    }
  });

  // Shutdown sprite
  router.post('/:name/shutdown', async (req, res) => {
    try {
      const { name } = req.params;
      await spriteService.shutdownSprite(name);
      res.status(200).json({ status: 'shutdown_initiated' });
    } catch (error) {
      logError(error, 'Failed to shutdown sprite');
      res.status(500).json({ error: 'Failed to shutdown sprite' });
    }
  });

  // Wake sprite
  router.post('/:name/wake', async (req, res) => {
    try {
      const { name } = req.params;
      await spriteService.wakeSprite(name);
      res.status(200).json({ status: 'wake_initiated' });
    } catch (error) {
      logError(error, 'Failed to wake sprite');
      res.status(500).json({ error: 'Failed to wake sprite' });
    }
  });

  // Get console URL
  router.get('/:name/url', (req, res) => {
    try {
      const { name } = req.params;
      const url = spriteService.getConsoleUrl(name);
      res.json({ url });
    } catch (error) {
      logError(error, 'Failed to get console URL');
      res.status(500).json({ error: 'Failed to get console URL' });
    }
  });

  // Create Checkpoint
  router.post('/:name/checkpoints', async (req, res) => {
    try {
      const { name } = req.params;
      const { name: checkpointName } = req.body; // optional comment/name
      const checkpoint = await spriteService.createCheckpoint(name, checkpointName);
      res.json(checkpoint);
    } catch (error) {
      logError(error, 'Failed to create checkpoint');
      res.status(500).json({ error: 'Failed to create checkpoint' });
    }
  });

  // List Checkpoints
  router.get('/:name/checkpoints', async (req, res) => {
    try {
      const { name } = req.params;
      const checkpoints = await spriteService.listCheckpoints(name);
      res.json(checkpoints);
    } catch (error) {
      logError(error, 'Failed to list checkpoints');
      res.status(500).json({ error: 'Failed to list checkpoints' });
    }
  });

  // Restore Checkpoint
  router.post('/:name/checkpoints/:id/restore', async (req, res) => {
    try {
      const { name, id } = req.params;
      await spriteService.restoreCheckpoint(name, id);
      res.status(200).json({ status: 'restored' });
    } catch (error) {
      logError(error, 'Failed to restore checkpoint');
      res.status(500).json({ error: 'Failed to restore checkpoint' });
    }
  });

  return router;
}
