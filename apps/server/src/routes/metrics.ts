import { Router, Request, Response } from 'express';
import { TelemetryStore } from '../services/telemetry/telemetry-store.js';
import { createLogger } from '@automaker/utils';

const router = Router();
const logger = createLogger('MetricsRoute');

router.get('/', async (req: Request, res: Response) => {
  try {
    const telemetry = TelemetryStore.getInstance();
    const metrics = await telemetry.getMetrics();
    res.set('Content-Type', 'text/plain');
    res.send(metrics);
  } catch (error) {
    logger.error('Error serving metrics:', error);
    res.status(500).send('Internal Server Error');
  }
});

export default router;
