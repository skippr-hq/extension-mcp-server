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
import { existsSync } from 'fs';
import { resolve } from 'path';
import { createMcpServer } from './servers/mcp.js';
import { createWebSocketServer, closeWebSocketServer } from './servers/websocket.js';

dotenv.config();

// Validate and get rootDir from environment
const rootDir = process.env.SKIPPR_ROOT_DIR;
if (!rootDir || rootDir.trim() === '') {
  console.error('ERROR: SKIPPR_ROOT_DIR environment variable is required');
  console.error('Please set it in your MCP client configuration to your project root directory');
  process.exit(1);
}

const resolvedRootDir = resolve(rootDir);
if (!existsSync(resolvedRootDir)) {
  console.error(`ERROR: SKIPPR_ROOT_DIR path does not exist: ${resolvedRootDir}`);
  process.exit(1);
}

console.error(`Using root directory: ${resolvedRootDir}`);

// Create and connect MCP server with stdio transport
const mcpServer = createMcpServer(resolvedRootDir);
const stdioTransport = new StdioServerTransport();
await mcpServer.connect(stdioTransport);

console.error('MCP server connected via stdio');

// Start WebSocket server (for Skippr extension)
const wsPort = parseInt(process.env.WS_PORT || '4040', 10);
createWebSocketServer(wsPort, resolvedRootDir);
console.error(`WebSocket server listening on port ${wsPort}`);

// Graceful shutdown
process.on('SIGINT', () => {
  console.error('\nShutting down servers...');
  closeWebSocketServer();
  process.exit(0);
});
