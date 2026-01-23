import WebSocket from 'ws';

const WS_URL = 'ws://localhost:3008/api/telemetry/ws';
const API_KEY = process.env.AUTOMAKER_API_KEY || 'test-ci-api-key';

async function verify() {
  console.log(`Connecting to ${WS_URL}...`);
  // Note: Telemetry WS is currently unauthenticated in the handler, but the server upgrade handler might require auth.
  // We'll traverse the standard authMiddleware for upgrade requests in server/index.ts

  const ws = new WebSocket(`${WS_URL}?apiKey=${API_KEY}`);

  ws.on('open', () => {
    console.log('Connected!');
    ws.send(JSON.stringify({ type: 'ping' }));
  });

  ws.on('message', (data) => {
    const msg = JSON.parse(data.toString());
    console.log('Received:', msg.type);
    if (msg.type === 'initial_state') {
      console.log('✅ Initial state received with', msg.payload.length, 'entries');
    } else if (msg.type === 'pong') {
      console.log('✅ Pong received');
      ws.close();
      process.exit(0);
    }
  });

  ws.on('error', (err) => {
    console.error('❌ WebSocket error:', err);
    process.exit(1);
  });

  // Timeout
  setTimeout(() => {
    console.error('❌ Timeout waiting for messages');
    process.exit(1);
  }, 5000);
}

verify();
