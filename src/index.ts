#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import dotenv from 'dotenv';
import { createMcpServer } from './servers/mcp.js';
import { createWebSocketServer, closeWebSocketServer } from './servers/websocket.js';

dotenv.config();

// Create and connect MCP server with stdio transport
const mcpServer = createMcpServer();
const stdioTransport = new StdioServerTransport();
await mcpServer.connect(stdioTransport);

// Start WebSocket server (for Skippr extension)
const wsPort = parseInt(process.env.WS_PORT || '4040', 10);
createWebSocketServer(wsPort);

// Graceful shutdown
process.on('SIGINT', () => {
  console.error('\nShutting down servers...');
  closeWebSocketServer();
  process.exit(0);
});
