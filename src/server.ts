/**
 * Main Server - Combines MCP Server (Stdio) and WebSocket Server
 *
 * Architecture (following BrowserMCP pattern):
 * - Stdio Transport: MCP tools for AI coding agents (Claude Code, Cursor, etc.)
 * - WebSocket: Receives issues from Skippr browser extension
 * - Both run in the same Node.js process
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import dotenv from 'dotenv';
import { homedir } from 'os';
import { resolve } from 'path';
import { createMcpServer } from './servers/mcp.js';
import { createWebSocketServer, closeWebSocketServer } from './servers/websocket.js';

dotenv.config();

// Create and connect MCP server with stdio transport
const mcpServer = createMcpServer();
const stdioTransport = new StdioServerTransport();
await mcpServer.connect(stdioTransport);

// console.error('MCP server connected via stdio');

// Start WebSocket server (for Skippr extension)
const wsPort = parseInt(process.env.WS_PORT || '4040', 10);
createWebSocketServer(wsPort);
// console.error(`WebSocket server listening on port ${wsPort}`);

// Graceful shutdown
process.on('SIGINT', () => {
  console.error('\nShutting down servers...');
  closeWebSocketServer();
  process.exit(0);
});
