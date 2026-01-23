import { WebSocket } from 'ws';
import { createLogger } from '@automaker/utils';
import { TelemetryService } from '../../services/telemetry/telemetry-service.js';
import { SpriteService, SpriteEvents } from '../../services/sprite-service.js';
import { SpriteTelemetry } from '../../services/telemetry/types.js';

const logger = createLogger('TelemetryWebSocket');

type TelemetryMessageType =
  | 'initial_state'
  | 'telemetry_updated'
  | 'sprite_created'
  | 'sprite_deleted'
  | 'sprite_shutdown'
  | 'sprite_woken'
  | 'checkpoint_restored'
  | 'pong';

interface TelemetryMessage {
  type: TelemetryMessageType;
  payload?: any;
}

export function createTelemetryWebSocketHandler(
  telemetryService: TelemetryService,
  spriteService: SpriteService
) {
  const clients = new Set<WebSocket>();

  // Subscribe to TelemetryStore updates
  const telemetryStore = telemetryService.getStore();
  telemetryStore.on('update', (telemetry: SpriteTelemetry) => {
    broadcast({
      type: 'telemetry_updated',
      payload: telemetry,
    });
  });

  // Subscribe to SpriteService events
  spriteService.on(SpriteEvents.CREATED, (sprite) => {
    broadcast({ type: 'sprite_created', payload: sprite });
  });

  spriteService.on(SpriteEvents.DELETED, (spriteId) => {
    broadcast({ type: 'sprite_deleted', payload: { id: spriteId } });
  });

  spriteService.on(SpriteEvents.SHUTDOWN, (spriteId) => {
    broadcast({ type: 'sprite_shutdown', payload: { id: spriteId } });
  });

  spriteService.on(SpriteEvents.WOKEN, (spriteId) => {
    broadcast({ type: 'sprite_woken', payload: { id: spriteId } });
  });

  // Note: 'checkpoint_restored' is not yet exposed by SpriteService events directly
  // We can add it later when SpriteService exposes it.
  spriteService.on(SpriteEvents.RESTORED, (data) => {
    broadcast({ type: 'checkpoint_restored', payload: data });
  });

  function broadcast(message: TelemetryMessage) {
    const data = JSON.stringify(message);
    for (const client of clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    }
  }

  return (ws: WebSocket) => {
    logger.info('Telemetry WebSocket client connected');
    clients.add(ws);

    // Send initial state
    const allTelemetry = telemetryService.getAllTelemetry();
    ws.send(
      JSON.stringify({
        type: 'initial_state',
        payload: allTelemetry,
      })
    );

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        if (message.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
        }
      } catch (err) {
        logger.warn('Invalid message received', err);
      }
    });

    ws.on('close', () => {
      logger.info('Telemetry WebSocket client disconnected');
      clients.delete(ws);
    });

    ws.on('error', (err) => {
      logger.error('Telemetry WebSocket error', err);
      clients.delete(ws);
    });
  };
}
