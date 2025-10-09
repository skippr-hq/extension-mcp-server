import { WebSocketServer, WebSocket } from 'ws';
import { handleIssueMessage, validateMessage } from './issueHandler';

let wss: WebSocketServer | null = null;

export function createWebSocketServer(port: number): WebSocketServer {
  if (wss) {
    // console.log('WebSocket server already running');
    return wss;
  }

  wss = new WebSocketServer({ port });

  wss.on('connection', (ws: WebSocket) => {
    // console.log('New WebSocket connection established');

    ws.on('message', async (data: Buffer) => {
      const messageStr = data.toString();
      // console.log('Received WebSocket message:', messageStr);

      try {
        const parsedMessage = JSON.parse(messageStr);

        // Handle apply_fix messages
        if (parsedMessage.type === 'apply_fix') {
          if (validateMessage(parsedMessage)) {
            await handleIssueMessage(parsedMessage);
            ws.send(JSON.stringify({
              status: 'success',
              issueId: parsedMessage.issueId,
              message: 'Issue saved successfully'
            }));
          } else {
            ws.send(JSON.stringify({
              status: 'error',
              message: 'Invalid message format'
            }));
          }
        } else {
          // Handle other message types
          ws.send(JSON.stringify({
            status: 'received',
            type: parsedMessage.type,
            message: 'Message received'
          }));
        }
      } catch (error) {
        console.error('Error processing message:', error);
        ws.send(JSON.stringify({
          status: 'error',
          message: error instanceof Error ? error.message : 'Failed to process message'
        }));
      }
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

  // console.log(`WebSocket server listening on port ${port}`);
  return wss;
}

export function closeWebSocketServer(): void {
  if (wss) {
    wss.close(() => {
      // console.log('WebSocket server closed');
    });
    wss = null;
  }
}