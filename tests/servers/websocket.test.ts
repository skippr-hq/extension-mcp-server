import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock the ws module before importing websocket module
vi.mock('ws', () => {
  const EventEmitter = require('events');

  class MockWebSocket extends EventEmitter {
    readyState = 1; // OPEN
    send = vi.fn();
    close = vi.fn();
  }

  class MockWebSocketServer extends EventEmitter {
    clients = new Set();
    _port = 4041;

    constructor(options?: { port?: number }) {
      super();
      if (options?.port) {
        this._port = options.port;
      }
      // Emit 'listening' event on next tick to simulate async server startup
      process.nextTick(() => {
        this.emit('listening');
      });
    }

    address = vi.fn(function(this: any) {
      return { port: this._port };
    });

    close = vi.fn((callback?: () => void) => {
      if (callback) callback();
    });
  }

  return {
    WebSocketServer: MockWebSocketServer,
    WebSocket: MockWebSocket,
    default: {
      WebSocketServer: MockWebSocketServer,
      WebSocket: MockWebSocket,
      OPEN: 1
    }
  };
});

// Import after mocking
import * as websocketModule from '../../src/servers/websocket.js';

describe('WebSocket Server', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Ensure server is closed before each test
    websocketModule.closeWebSocketServer();
  });

  afterEach(() => {
    websocketModule.closeWebSocketServer();
  });

  describe('Server Lifecycle', () => {
    it('should create and close websocket server', () => {
      const server = websocketModule.createWebSocketServer(4041);
      expect(server).toBeDefined();

      const status = websocketModule.getWebSocketServerStatus();
      expect(status.running).toBe(true);
      expect(status.port).toBe(4041);

      websocketModule.closeWebSocketServer();
      const closedStatus = websocketModule.getWebSocketServerStatus();
      expect(closedStatus.running).toBe(false);
    });

    it('should restart websocket server', async () => {
      websocketModule.createWebSocketServer(4041);
      const result = await websocketModule.restartWebSocketServer(4042);

      expect(result.success).toBe(true);
      expect(result.port).toBe(4042);

      const status = websocketModule.getWebSocketServerStatus();
      expect(status.running).toBe(true);
      expect(status.port).toBe(4042);
    });

    it('should return server status', () => {
      const status1 = websocketModule.getWebSocketServerStatus();
      expect(status1.running).toBe(false);

      websocketModule.createWebSocketServer(4041);

      const status2 = websocketModule.getWebSocketServerStatus();
      expect(status2.running).toBe(true);
      expect(status2.port).toBe(4041);
    });
  });

  describe('Client Management', () => {
    it('should return empty extensions list initially', () => {
      websocketModule.createWebSocketServer(4041);
      const extensions = websocketModule.getConnectedExtensions();
      expect(extensions).toEqual([]);
    });

    it('should return false when disconnecting non-existent extension', () => {
      websocketModule.createWebSocketServer(4041);
      const result = websocketModule.disconnectExtension('non-existent-id');
      expect(result).toBe(false);
    });
  });

  describe('Message Broadcasting', () => {
    it('should return false when sending to non-existent extension', () => {
      websocketModule.createWebSocketServer(4041);

      const result = websocketModule.sendToExtension('non-existent-id', {
        type: 'notification',
        payload: { title: 'Test', message: 'Test notification' }
      });

      expect(result).toBe(false);
    });

    it('should return 0 sent when broadcasting to project with no extensions', () => {
      websocketModule.createWebSocketServer(4041);

      const result = websocketModule.sendMessageToProjectExtensions('test-project', {
        type: 'status',
        payload: { status: 'active' }
      });

      expect(result.sent).toBe(0);
      expect(result.failed).toBe(0);
    });

    it('should return 0 sent when broadcasting to all with no extensions', () => {
      websocketModule.createWebSocketServer(4041);

      const result = websocketModule.broadcastToAllExtensions({
        type: 'data',
        payload: { data: 'test' }
      });

      expect(result.sent).toBe(0);
      expect(result.failed).toBe(0);
    });
  });

  describe('Issue Verification', () => {
    it('should reject verification when no clients are connected', async () => {
      websocketModule.createWebSocketServer(4041);

      await expect(
        websocketModule.verifyIssueFix('test-project', 'issue-123', 'review-123', 1000)
      ).rejects.toThrow('No clients connected for project test-project');
    });
  });
});
