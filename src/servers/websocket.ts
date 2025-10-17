/**
 * WebSocket Server - Receives issues from Skippr browser extension
 */

import { WebSocketServer, WebSocket } from 'ws';
import { writeIssue } from '../utils/issues-writer.js';
import { deleteIssueFile } from '../utils/file-operations.js';
import {
  WriteIssueMessageSchema,
  ClientRegistrationSchema,
  ServerToClientMessageSchema,
  ClientInfoSchema,
  VerifyIssueFixRequestSchema,
  VerifyIssueFixResponseSchema,
  type ServerMessageTypeSchema
} from '../schemas/index.js';
import { z } from 'zod';
import crypto from 'crypto';

let wss: WebSocketServer | null = null;

// Client tracking
const clients = new Map<string, { ws: WebSocket; info: z.infer<typeof ClientInfoSchema> }>();
const projectClients = new Map<string, Set<string>>(); // projectId -> Set of clientIds

// Pending verification requests
interface PendingVerification {
  resolve: (response: z.infer<typeof VerifyIssueFixResponseSchema>) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
}
const pendingVerifications = new Map<string, PendingVerification>();

function generateClientId(): string {
  return crypto.randomBytes(16).toString('hex');
}

function addClient(clientId: string, ws: WebSocket, projectId: string, metadata?: any): void {
  const clientInfo: z.infer<typeof ClientInfoSchema> = {
    clientId,
    projectId,
    connectedAt: Date.now(),
    lastActivity: Date.now(),
    metadata
  };

  clients.set(clientId, { ws, info: clientInfo });

  if (!projectClients.has(projectId)) {
    projectClients.set(projectId, new Set());
  }
  projectClients.get(projectId)!.add(clientId);

  console.log(`Client ${clientId} registered for project ${projectId}`);
}

function removeClient(clientId: string): void {
  const client = clients.get(clientId);
  if (client) {
    const projectId = client.info.projectId;
    clients.delete(clientId);

    const projectSet = projectClients.get(projectId);
    if (projectSet) {
      projectSet.delete(clientId);
      if (projectSet.size === 0) {
        projectClients.delete(projectId);
      }
    }

    console.log(`Client ${clientId} removed`);
  }
}

export function createWebSocketServer(port: number): WebSocketServer {
  if (wss) {
    return wss;
  }

  wss = new WebSocketServer({ port });

  wss.on('connection', (ws: WebSocket) => {
    let clientId: string | null = null;
    ws.on('message', async (data: Buffer) => {
      const messageStr = data.toString();

      try {
        const parsedMessage = JSON.parse(messageStr);

        // Update last activity for registered clients
        if (clientId) {
          const client = clients.get(clientId);
          if (client) {
            client.info.lastActivity = Date.now();
          }
        }

        // Handle client registration
        if (parsedMessage.type === 'register') {
          try {
            const registration = ClientRegistrationSchema.parse(parsedMessage);

            // Generate new client ID or use existing
            if (!clientId) {
              clientId = generateClientId();
              addClient(clientId, ws, registration.projectId, registration.metadata);
            }

            // Send registration confirmation
            ws.send(
              JSON.stringify({
                type: 'registration_success',
                clientId,
                projectId: registration.projectId,
                message: 'Successfully registered with Skippr MCP server',
              })
            );
          } catch (validationError) {
            ws.send(
              JSON.stringify({
                type: 'registration_error',
                message: validationError instanceof Error ? validationError.message : 'Invalid registration format',
              })
            );
          }
        } else if (parsedMessage.type === 'verify_issue_response') {
          // Handle verification response from browser extension
          try {
            const response = VerifyIssueFixResponseSchema.parse(parsedMessage);
            const pending = pendingVerifications.get(response.requestId);

            if (pending) {
              clearTimeout(pending.timeout);
              pendingVerifications.delete(response.requestId);

              // Delete the issue file if verification succeeded
              if (response.verified === true && response.projectId && response.issueId && response.reviewId) {
                await deleteIssueFile(response.projectId, response.reviewId, response.issueId);
              }

              pending.resolve(response);
            }
          } catch (validationError) {
            console.error('Invalid verification response:', validationError);
          }
        } else if (parsedMessage.type === 'write_issue') {
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
      if (clientId) {
        removeClient(clientId);
      }
      console.log('WebSocket connection closed');
    });

    // Send initial connection message
    ws.send(
      JSON.stringify({
        type: 'connection',
        message: 'Connected to Skippr MCP WebSocket server',
        instruction: 'Please register by sending a message with type="register" and your projectId',
      })
    );
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

// Broadcasting functions for sending messages to clients
export function sendToClient(clientId: string, message: any): boolean {
  const client = clients.get(clientId);
  if (client && client.ws.readyState === WebSocket.OPEN) {
    try {
      const serverMessage: z.infer<typeof ServerToClientMessageSchema> = {
        type: message.type || 'data',
        payload: message.payload || message,
        timestamp: Date.now(),
        messageId: crypto.randomBytes(8).toString('hex')
      };
      client.ws.send(JSON.stringify(serverMessage));
      return true;
    } catch (error) {
      console.error(`Error sending message to client ${clientId}:`, error);
      return false;
    }
  }
  return false;
}

export function sendToProject(projectId: string, message: any): { sent: number; failed: number } {
  const clientIds = projectClients.get(projectId);
  let sent = 0;
  let failed = 0;

  if (clientIds) {
    for (const clientId of clientIds) {
      if (sendToClient(clientId, message)) {
        sent++;
      } else {
        failed++;
      }
    }
  }

  return { sent, failed };
}

export function broadcastToAll(message: any): { sent: number; failed: number } {
  let sent = 0;
  let failed = 0;

  for (const [clientId] of clients) {
    if (sendToClient(clientId, message)) {
      sent++;
    } else {
      failed++;
    }
  }

  return { sent, failed };
}

export function getConnectedClients(): Array<z.infer<typeof ClientInfoSchema>> {
  const clientList: Array<z.infer<typeof ClientInfoSchema>> = [];
  for (const [, client] of clients) {
    clientList.push(client.info);
  }
  return clientList;
}

export function disconnectClient(clientId: string): boolean {
  const client = clients.get(clientId);
  if (client) {
    client.ws.close();
    removeClient(clientId);
    return true;
  }
  return false;
}

// Verify issue fix with timeout and response handling
export async function verifyIssueFix(
  projectId: string,
  issueId: string,
  reviewId?: string,
  timeoutMs: number = 30000
): Promise<z.infer<typeof VerifyIssueFixResponseSchema>> {
  const requestId = crypto.randomBytes(16).toString('hex');

  // Create the verification request
  const request: z.infer<typeof VerifyIssueFixRequestSchema> = {
    action: 'verify_issue_fix',
    projectId,
    issueId,
    reviewId,
    requestId,
  };

  // Send to all clients in the project
  const message = {
    type: 'command',
    payload: request,
  };

  const sendResult = sendToProject(projectId, message);

  if (sendResult.sent === 0) {
    throw new Error(`No clients connected for project ${projectId}`);
  }

  // Create a promise that will resolve when we get a response
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      pendingVerifications.delete(requestId);
      reject(new Error(`Verification timeout after ${timeoutMs}ms for issue ${issueId}`));
    }, timeoutMs);

    pendingVerifications.set(requestId, {
      resolve,
      reject,
      timeout,
    });
  });
}
