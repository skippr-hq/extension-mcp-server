#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import dotenv from 'dotenv';
import { createMcpServer } from './servers/mcp.js';
import { createWebSocketServer, closeWebSocketServer } from './servers/websocket.js';

console.error('[MCP X-Ray] Starting server...');

try {
  dotenv.config();
  console.error('[MCP X-Ray] Environment loaded');

  // Create and connect MCP server with stdio transport
  console.error('[MCP X-Ray] Creating MCP server...');
  const mcpServer = createMcpServer();

  console.error('[MCP X-Ray] Initializing stdio transport...');
  const stdioTransport = new StdioServerTransport();

  console.error('[MCP X-Ray] Connecting MCP server...');
  await mcpServer.connect(stdioTransport);
  console.error('[MCP X-Ray] MCP server connected successfully');

  // Start WebSocket server (for Skippr extension)
  const wsPort = parseInt(process.env.WS_PORT || '4040', 10);
  console.error(`[MCP X-Ray] Starting WebSocket server on port ${wsPort}...`);
  createWebSocketServer(wsPort);
  console.error('[MCP X-Ray] WebSocket server started');

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.error('\n[MCP X-Ray] Shutting down servers...');
    closeWebSocketServer();
    process.exit(0);
  });
} catch (error) {
  console.error('[MCP X-Ray] Fatal error during startup:', error);
  process.exit(1);
}
