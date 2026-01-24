import { WebSocket } from 'ws';
import { createLogger } from '@automaker/utils';
import { SpriteService } from '../../services/sprite-service.js';
import { IncomingMessage } from 'http';

const logger = createLogger('ConsoleWebSocket');

interface ConsoleSession {
  sessionId: string;
  sandboxName: string;
  clientWs: WebSocket;
  spriteWs: WebSocket;
  createdAt: Date;
  lastActivity: Date;
}

// Track active sessions
const activeSessions = new Map<string, ConsoleSession>();

export function createConsoleWebSocketHandler(spriteService: SpriteService) {
  return (clientWs: WebSocket, request: IncomingMessage) => {
    const url = new URL(request.url || '', `http://${request.headers.host}`);
    // Extract sandbox name from URL path: /api/sandboxes/:name/console
    const pathParts = url.pathname.split('/');
    const sandboxName = pathParts[3]; // /api/sandboxes/[name]/console
    const sessionId =
      url.searchParams.get('sessionId') ||
      `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const cols = parseInt(url.searchParams.get('cols') || '80', 10);
    const rows = parseInt(url.searchParams.get('rows') || '24', 10);

    if (!sandboxName) {
      logger.error('No sandbox name provided in URL');
      clientWs.close(1008, 'Sandbox name required');
      return;
    }

    logger.info(`New console connection for sandbox: ${sandboxName}, session: ${sessionId}`);

    // Get upstream WebSocket URL
    let spriteWsUrl: string;
    try {
      // Access the private spriteApiClient from spriteService if possible, or we need to expose a method on SpriteService
      // Since SpriteService wraps SpriteApiClient, we should add a method to SpriteService
      // For now, let's assume we modify SpriteService to expose this, or use the client directly if accessible.
      // Wait, I can't access private members. I need to update SpriteService first.
      // But purely for this file structure, I will assume the method exists on SpriteService.
      spriteWsUrl = spriteService.getConsoleWebSocketUrl(sandboxName, {
        cols,
        rows,
        sessionId: url.searchParams.get('id') || undefined, // Use provided ID if trying to reconnect to specific session
      });
    } catch (err: any) {
      logger.error(`Failed to get console URL for ${sandboxName}:`, err);
      clientWs.send(
        JSON.stringify({ type: 'error', message: err.message || 'Failed to get console URL' })
      );
      clientWs.close(1011, 'Failed to get console URL');
      return;
    }

    // Connect to Sprites.dev
    const headers = spriteService.getWebSocketHeaders();
    const spriteWs = new WebSocket(spriteWsUrl, { headers });

    const session: ConsoleSession = {
      sessionId,
      sandboxName,
      clientWs,
      spriteWs,
      createdAt: new Date(),
      lastActivity: new Date(),
    };

    activeSessions.set(sessionId, session);

    // --- Client WebSocket Handlers ---

    clientWs.on('message', (data, isBinary) => {
      session.lastActivity = new Date();

      if (spriteWs.readyState !== WebSocket.OPEN) {
        logger.warn('Sprite WebSocket not open, ignoring client message');
        return;
      }

      try {
        // If binary, it might be raw input (though our plan said JSON from client)
        // Implementation plan says: Client -> Server is JSON
        if (!isBinary) {
          const message = JSON.parse(data.toString());

          switch (message.type) {
            case 'input':
              if (typeof message.data === 'string') {
                // Forward as raw string (binary) to PTY
                spriteWs.send(message.data);
              }
              break;

            case 'resize':
              // Send resize message to sprite
              if (message.cols && message.rows) {
                const resizeMsg = {
                  type: 'resize',
                  cols: message.cols,
                  rows: message.rows,
                };
                spriteWs.send(JSON.stringify(resizeMsg));
              }
              break;

            case 'ping':
              clientWs.send(JSON.stringify({ type: 'pong' }));
              break;
          }
        }
      } catch (err) {
        logger.error('Error processing client message:', err);
      }
    });

    clientWs.on('close', () => {
      logger.info(`Client disconnected from session ${sessionId}`);
      // We might want to keep the sprite connection open for a bit or close it immediately
      // The plan says "Support multiple concurrent console sessions", so we shouldn't kill the sprite session
      // just because one client disconnected, unless we want to enforce 1:1.
      // But we should clean up our local session map.
      activeSessions.delete(sessionId);

      // Optionally close upstream if no other clients are listening to this *specific* sprite session?
      // For now, let's close upstream to avoid leaking connections on the server,
      // relying on Sprites.dev "max_run_after_disconnect" if we want persistence.
      if (spriteWs.readyState === WebSocket.OPEN) {
        spriteWs.close();
      }
    });

    clientWs.on('error', (err) => {
      logger.error(`Client WebSocket error for session ${sessionId}:`, err);
      activeSessions.delete(sessionId);
      if (spriteWs.readyState === WebSocket.OPEN) {
        spriteWs.close();
      }
    });

    // --- Sprite WebSocket Handlers ---

    spriteWs.on('open', () => {
      logger.info(`Connected to Sprites.dev for ${sandboxName}`);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(
          JSON.stringify({
            type: 'connected',
            sessionId,
            sandboxName,
          })
        );
      }
    });

    spriteWs.on('message', (data, isBinary) => {
      if (clientWs.readyState !== WebSocket.OPEN) return;

      // If it is binary, it is stdout/stderr from PTY (tty=true mode)
      if (isBinary) {
        // Provide it to client as data
        // Our client expects JSON { type: 'data', data: string }
        // We need to convert buffer to string
        // NOTE: data is Buffer | ArrayBuffer | Buffer[]
        const text = data.toString();
        clientWs.send(JSON.stringify({ type: 'data', data: text }));
      } else {
        // JSON control message from Sprites
        try {
          const msg = JSON.parse(data.toString());
          // Forward relevant control messages
          if (msg.type === 'session_info') {
            clientWs.send(JSON.stringify({ ...msg, type: 'session_info' }));
          } else if (msg.type === 'exit') {
            clientWs.send(JSON.stringify({ type: 'exit', exitCode: msg.exit_code }));
          } else if (msg.type === 'port') {
            // Forward port notifications
            clientWs.send(JSON.stringify({ type: 'port', ...msg }));
          }
        } catch (e) {
          // Fallback: treat as data if not valid JSON?
          // Or just log error. Sprites usually sends valid JSON for control.
          logger.warn('Failed to parse non-binary message from Sprite:', e);
        }
      }
    });

    spriteWs.on('close', (code, reason) => {
      logger.info(`Sprite connection closed: ${code} ${reason}`);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.close(1000, 'Upstream connection closed');
      }
      activeSessions.delete(sessionId);
    });

    spriteWs.on('error', (err) => {
      logger.error(`Sprite WebSocket error:`, err);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({ type: 'error', message: 'Upstream connection error' }));
        clientWs.close(1011, 'Upstream error');
      }
      activeSessions.delete(sessionId);
    });
  };
}
