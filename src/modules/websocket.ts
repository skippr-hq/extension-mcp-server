import { WebSocketServer, WebSocket } from 'ws';

let wss: WebSocketServer | null = null;

export function createWebSocketServer(port: number): WebSocketServer {
  if (wss) {
    console.log('WebSocket server already running');
    return wss;
  }

  wss = new WebSocketServer({ port });

  wss.on('connection', (ws: WebSocket) => {
    console.log('New WebSocket connection established');

    ws.on('message', (data: Buffer) => {
      const message = data.toString();
      console.log('Received WebSocket message:', message);

      // Simple echo for now - can be extended later
      ws.send(`Echo: ${message}`);
    });

    ws.on('error', (error: Error) => {
      console.error('WebSocket error:', error);
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed');
    });

    // Send a welcome message
    ws.send('Connected to Skippr MCP WebSocket server');
  });

  wss.on('error', (error: Error) => {
    console.error('WebSocket server error:', error);
  });

  console.log(`WebSocket server listening on port ${port}`);
  return wss;
}

export function closeWebSocketServer(): void {
  if (wss) {
    wss.close(() => {
      console.log('WebSocket server closed');
    });
    wss = null;
  }
}