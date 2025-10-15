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

export async function restartWebSocketServer(port?: number): Promise<{ success: boolean; message: string; port: number }> {
  const targetPort = port || parseInt(process.env.WS_PORT || '4040', 10);

  try {
    if (wss) {
      console.log(`Closing existing WebSocket server...`);
      await new Promise<void>((resolve) => {
        if (wss) {
          wss.close(() => {
            console.log('Existing WebSocket server closed');
            wss = null;
            resolve();
          });
        } else {
          resolve();
        }
      });
    }

    console.log(`Starting WebSocket server on port ${targetPort}...`);
    const server = createWebSocketServer(targetPort);

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('WebSocket server startup timeout'));
      }, 5000);

      server.once('listening', () => {
        clearTimeout(timeout);
        console.log(`WebSocket server successfully started on port ${targetPort}`);
        resolve();
      });

      server.once('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });

    return {
      success: true,
      message: `WebSocket server restarted successfully on port ${targetPort}`,
      port: targetPort
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Failed to restart WebSocket server: ${errorMessage}`);

    if ((error as any)?.code === 'EADDRINUSE') {
      return {
        success: false,
        message: `Port ${targetPort} is already in use by another process`,
        port: targetPort
      };
    }

    return {
      success: false,
      message: `Failed to restart WebSocket server: ${errorMessage}`,
      port: targetPort
    };
  }
}

export function getWebSocketServerStatus(): { running: boolean; port?: number } {
  if (wss) {
    const address = wss.address();
    if (address && typeof address === 'object') {
      return { running: true, port: address.port };
    }
    return { running: true };
  }
  return { running: false };
}
