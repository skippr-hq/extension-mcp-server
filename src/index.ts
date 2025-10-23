#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import dotenv from 'dotenv';
import { createMcpServer } from './servers/mcp.js';
import { createWebSocketServer, closeWebSocketServer } from './servers/websocket.js';

console.error('[Skippr2Code] Starting server...');

try {
  dotenv.config();
  console.error('[Skippr2Code] Environment loaded');

  // Create and connect MCP server with stdio transport
  console.error('[Skippr2Code] Creating MCP server...');
  const mcpServer = createMcpServer();

  console.error('[Skippr2Code] Initializing stdio transport...');
  const stdioTransport = new StdioServerTransport();

  console.error('[Skippr2Code] Connecting MCP server...');
  await mcpServer.connect(stdioTransport);
  console.error('[Skippr2Code] MCP server connected successfully');

  // Start WebSocket server (for Skippr extension)
  const wsPort = parseInt(process.env.WS_PORT || '4040', 10);
  console.error(`[Skippr2Code] Starting WebSocket server on port ${wsPort}...`);
  createWebSocketServer(wsPort);
  console.error('[Skippr2Code] WebSocket server started');

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.error('\n[Skippr2Code] Shutting down servers...');
    closeWebSocketServer();
    process.exit(0);
  });
} catch (error) {
  console.error('[Skippr2Code] Fatal error during startup:', error);
  process.exit(1);
}
