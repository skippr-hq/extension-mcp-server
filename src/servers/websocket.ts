/**
 * WebSocket Server - Receives issues from Skippr browser extension
 */

import { WebSocketServer, WebSocket } from 'ws';
import { writeIssue } from '../utils/issues-writer.js';
import { WriteIssueMessageSchema } from '../schemas/index.js';

let wss: WebSocketServer | null = null;

export function createWebSocketServer(port: number): WebSocketServer {
  if (wss) {
    return wss;
  }

  wss = new WebSocketServer({ port });

  wss.on('connection', (ws: WebSocket) => {
    ws.on('message', async (data: Buffer) => {
      const messageStr = data.toString();

      try {
        const parsedMessage = JSON.parse(messageStr);

        if (parsedMessage.type === 'write_issue') {
          try {
            const validatedMessage = WriteIssueMessageSchema.parse(parsedMessage);
            await writeIssue(validatedMessage.projectId, validatedMessage);
            ws.send(
              JSON.stringify({
                status: 'success',
                issueId: validatedMessage.issueId,
                message: 'Issue saved successfully',
              })
            );
          } catch (validationError) {
            ws.send(
              JSON.stringify({
                status: 'error',
                message: validationError instanceof Error ? validationError.message : 'Invalid message format',
              })
            );
          }
        } else {
          ws.send(
            JSON.stringify({
              status: 'received',
              type: parsedMessage.type,
              message: 'Message received',
            })
          );
        }
      } catch (error) {
        console.error('Error processing message:', error);
        ws.send(
          JSON.stringify({
            status: 'error',
            message: error instanceof Error ? error.message : 'Failed to process message',
          })
        );
      }
    });

    ws.on('error', (error: Error) => {
      console.error('WebSocket error:', error);
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed');
    });

    ws.send('Connected to Skippr MCP WebSocket server');
  });

  wss.on('error', (error: Error) => {
    console.error('WebSocket server error:', error);
  });
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
