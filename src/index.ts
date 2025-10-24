#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import dotenv from 'dotenv';
import { createMcpServer } from './servers/mcp.js';
import { createWebSocketServer, closeWebSocketServer } from './servers/websocket.js';

const LOG_PREFIX = '[Skippr2Code]'
console.error('${LOG_PREFIX} Starting server...');

try {
  dotenv.config();
  console.error(`${LOG_PREFIX} Environment loaded`);

  // Create and connect MCP server with stdio transport
  console.error(`${LOG_PREFIX} Creating MCP server...`);
  const mcpServer = createMcpServer();

  console.error(`${LOG_PREFIX} Initializing stdio transport...`);
  const stdioTransport = new StdioServerTransport();

  console.error(`${LOG_PREFIX} Connecting MCP server...`);
  await mcpServer.connect(stdioTransport);
  console.error(`${LOG_PREFIX} MCP server connected successfully`);

  // Start WebSocket server (for Skippr extension)
  const wsPort = parseInt(process.env.WS_PORT || '4040', 10);
  console.error(`${LOG_PREFIX} Starting WebSocket server on port ${wsPort}...`);
  createWebSocketServer(wsPort);
  console.error(`${LOG_PREFIX} WebSocket server started`);

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.error(`\n${LOG_PREFIX} Shutting down servers...`);
    closeWebSocketServer();
    process.exit(0);
  });
} catch (error) {
  console.error(`${LOG_PREFIX} Fatal error during startup:`, error);
  process.exit(1);
}
