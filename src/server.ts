/**
 * Main Server - Combines MCP Server (SSE) and WebSocket Server
 *
 * Architecture:
 * - Express + SSE: MCP tools for AI coding agents (Claude, Cursor, etc.)
 * - WebSocket: Receives issues from Skippr browser extension
 */

import express from 'express';
import dotenv from 'dotenv';
import { createMcpServer, setupMcpEndpoints } from './servers/mcp.js';
import { createWebSocketServer, closeWebSocketServer } from './servers/websocket.js';

dotenv.config();

// Create Express app
const app = express();

// Create and setup MCP server
const mcpServer = createMcpServer();
setupMcpEndpoints(app, mcpServer);

// Start Express server (for SSE/MCP)
const port = parseInt(process.env.PORT || '4000', 10);
app.listen(port, () => {
  console.log(`MCP server (SSE) running on http://localhost:${port}`);
});

// Start WebSocket server (for Skippr extension)
const wsPort = parseInt(process.env.WS_PORT || '4040', 10);
createWebSocketServer(wsPort);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down servers...');
  closeWebSocketServer();
  process.exit(0);
});
