#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import dotenv from 'dotenv';
import { createMcpServer } from './servers/mcp.js';
import { createWebSocketServer, closeWebSocketServer } from './servers/websocket.js';

console.error('${LOG_PREFIX} Starting server...');

try {
  dotenv.config();
  console.error(`Environment loaded`);

  // Create and connect MCP server with stdio transport
  console.error(`Creating MCP server...`);
  const mcpServer = createMcpServer();

  console.error(`Initializing stdio transport...`);
  const stdioTransport = new StdioServerTransport();

  console.error(`Connecting MCP server...`);
  await mcpServer.connect(stdioTransport);
  console.error(`MCP server connected successfully`);

  // Start WebSocket server (for Skippr extension)
  const wsPort = parseInt(process.env.WS_PORT || '4040', 10);
  console.error(`Starting WebSocket server on port ${wsPort}...`);
  createWebSocketServer(wsPort);
  console.error(`WebSocket server started`);

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.error(`\nShutting down servers...`);
    closeWebSocketServer();
    process.exit(0);
  });
} catch (error) {
  console.error(`Fatal error during startup:`, error);
  process.exit(1);
}
