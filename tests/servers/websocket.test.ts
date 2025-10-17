import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import WebSocket from 'ws';
import {
  createWebSocketServer,
  closeWebSocketServer,
  restartWebSocketServer,
  getWebSocketServerStatus,
  sendToExtension,
  sendMessageToProjectExtensions,
  broadcastToAllExtensions,
  getConnectedExtensions,
  disconnectExtension
} from '../../src/servers/websocket.js';
import { ClientRegistrationSchema, ServerToClientMessageSchema } from '../../src/schemas/index.js';
import { z } from 'zod';

describe('WebSocket Server', () => {
  let server: any;
  let client: WebSocket;
  const TEST_PORT = 4041;

  afterEach(async () => {
    if (client && client.readyState === WebSocket.OPEN) {
      client.close();
    }
    closeWebSocketServer();
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  describe('Server Lifecycle', () => {
    it('should create and close websocket server', async () => {
      server = createWebSocketServer(TEST_PORT);
      expect(server).toBeDefined();

      const status = getWebSocketServerStatus();
      expect(status.running).toBe(true);
      expect(status.port).toBe(TEST_PORT);

      closeWebSocketServer();
      const closedStatus = getWebSocketServerStatus();
      expect(closedStatus.running).toBe(false);
    });

    it('should restart websocket server', async () => {
      server = createWebSocketServer(TEST_PORT);
      const result = await restartWebSocketServer(TEST_PORT + 1);

      expect(result.success).toBe(true);
      expect(result.port).toBe(TEST_PORT + 1);

      const status = getWebSocketServerStatus();
      expect(status.running).toBe(true);
      expect(status.port).toBe(TEST_PORT + 1);
    });

    it('should handle port already in use error', async () => {
      server = createWebSocketServer(TEST_PORT);

      // Try to create another server on same port
      const result = await restartWebSocketServer(TEST_PORT);
      expect(result.success).toBe(false);
      expect(result.message).toContain('already in use');
    });
  });

  describe('Client Registration', () => {
    beforeEach(() => {
      server = createWebSocketServer(TEST_PORT);
    });

    it('should register new client successfully', async () => {
      client = new WebSocket(`ws://localhost:${TEST_PORT}`);

      await new Promise((resolve) => {
        client.on('open', () => {
          const registration: z.infer<typeof ClientRegistrationSchema> = {
            type: 'register',
            projectId: 'test-project',
            metadata: {
              extensionVersion: '1.0.0',
              browserInfo: 'Chrome',
              environment: 'test'
            }
          };
          client.send(JSON.stringify(registration));
        });

        client.on('message', (data) => {
          const message = JSON.parse(data.toString());
          expect(message.type).toBe('registration_success');
          expect(message.projectId).toBe('test-project');
          expect(message.clientId).toBeDefined();
          resolve(true);
        });
      });
    });

    it('should reject re-registration with different projectId', async () => {
      client = new WebSocket(`ws://localhost:${TEST_PORT}`);

      await new Promise((resolve) => {
        client.on('open', () => {
          // First registration
          const registration1: z.infer<typeof ClientRegistrationSchema> = {
            type: 'register',
            projectId: 'project-1',
          };
          client.send(JSON.stringify(registration1));
        });

        let firstRegistrationDone = false;
        client.on('message', (data) => {
          const message = JSON.parse(data.toString());

          if (!firstRegistrationDone) {
            expect(message.type).toBe('registration_success');
            firstRegistrationDone = true;

            // Attempt re-registration with different project
            const registration2: z.infer<typeof ClientRegistrationSchema> = {
              type: 'register',
              projectId: 'project-2',
            };
            client.send(JSON.stringify(registration2));
          } else {
            expect(message.type).toBe('registration_error');
            expect(message.message).toContain('already registered');
            expect(message.message).toContain('project-1');
            resolve(true);
          }
        });
      });
    });

    it('should allow re-registration with same projectId', async () => {
      client = new WebSocket(`ws://localhost:${TEST_PORT}`);

      await new Promise((resolve) => {
        client.on('open', () => {
          const registration: z.infer<typeof ClientRegistrationSchema> = {
            type: 'register',
            projectId: 'same-project',
          };
          client.send(JSON.stringify(registration));
        });

        let messageCount = 0;
        client.on('message', (data) => {
          const message = JSON.parse(data.toString());
          messageCount++;

          if (messageCount === 1) {
            expect(message.type).toBe('registration_success');
            expect(message.message).toContain('Successfully registered');

            // Send same registration again
            const registration: z.infer<typeof ClientRegistrationSchema> = {
              type: 'register',
              projectId: 'same-project',
            };
            client.send(JSON.stringify(registration));
          } else {
            expect(message.type).toBe('registration_success');
            expect(message.message).toContain('Already registered');
            resolve(true);
          }
        });
      });
    });
  });

  describe('Message Broadcasting', () => {
    let clientId: string;

    beforeEach(async () => {
      server = createWebSocketServer(TEST_PORT);
      client = new WebSocket(`ws://localhost:${TEST_PORT}`);

      // Register the client and get its ID
      clientId = await new Promise((resolve) => {
        client.on('open', () => {
          const registration: z.infer<typeof ClientRegistrationSchema> = {
            type: 'register',
            projectId: 'broadcast-test',
          };
          client.send(JSON.stringify(registration));
        });

        client.on('message', (data) => {
          const message = JSON.parse(data.toString());
          if (message.type === 'registration_success') {
            resolve(message.clientId);
          }
        });
      });
    });

    it('should send message to specific client', async () => {
      const testMessage: z.infer<typeof ServerToClientMessageSchema> = {
        type: 'notification',
        payload: {
          title: 'Test',
          message: 'Test notification'
        }
      };

      const result = sendToExtension(clientId, testMessage);
      expect(result).toBe(true);

      await new Promise((resolve) => {
        client.once('message', (data) => {
          const message = JSON.parse(data.toString());
          expect(message.type).toBe('notification');
          expect(message.payload.title).toBe('Test');
          expect(message.timestamp).toBeDefined();
          expect(message.messageId).toBeDefined();
          resolve(true);
        });
      });
    });

    it('should broadcast to project', async () => {
      const testMessage: z.infer<typeof ServerToClientMessageSchema> = {
        type: 'status',
        payload: {
          status: 'active',
          details: { test: true }
        }
      };

      const result = sendMessageToProjectExtensions('broadcast-test', testMessage);
      expect(result.sent).toBe(1);
      expect(result.failed).toBe(0);
    });

    it('should broadcast to all clients', async () => {
      const testMessage: z.infer<typeof ServerToClientMessageSchema> = {
        type: 'data',
        payload: {
          data: { test: 'value' },
          dataType: 'test'
        }
      };

      const result = broadcastToAllExtensions(testMessage);
      expect(result.sent).toBe(1);
      expect(result.failed).toBe(0);
    });
  });

  describe('Client Management', () => {
    let clientId: string;

    beforeEach(async () => {
      server = createWebSocketServer(TEST_PORT);
      client = new WebSocket(`ws://localhost:${TEST_PORT}`);

      clientId = await new Promise((resolve) => {
        client.on('open', () => {
          const registration: z.infer<typeof ClientRegistrationSchema> = {
            type: 'register',
            projectId: 'management-test',
          };
          client.send(JSON.stringify(registration));
        });

        client.on('message', (data) => {
          const message = JSON.parse(data.toString());
          if (message.type === 'registration_success') {
            resolve(message.clientId);
          }
        });
      });
    });

    it('should list connected clients', () => {
      const clients = getConnectedExtensions();
      expect(clients.length).toBe(1);
      expect(clients[0].clientId).toBe(clientId);
      expect(clients[0].projectId).toBe('management-test');
    });

    it('should disconnect client', () => {
      const result = disconnectExtension(clientId);
      expect(result).toBe(true);

      const clients = getConnectedClients();
      expect(clients.length).toBe(0);
    });

    it('should return false for non-existent client', () => {
      const result = disconnectExtension('non-existent-id');
      expect(result).toBe(false);
    });
  });
});