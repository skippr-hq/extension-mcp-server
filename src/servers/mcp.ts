/**
 * MCP Server - Exposes Skippr tools for AI coding agents
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { listIssues, ListIssuesInput, ListIssuesInputSchema } from '../tools/list-issues.js';
import { getIssue, GetIssueInput, GetIssueInputSchema } from '../tools/get-issue.js';
import { listProjects } from '../tools/list-projects.js';
import { restartWebSocketServer, getWebSocketServerStatus } from './websocket.js';
import { z } from 'zod';

export function createMcpServer(): McpServer {
  const mcpServer = new McpServer({
    name: 'skippr-mcp',
    version: '1.0.0',
  });

  // Use the full schemas - projectId will be passed by the coding agent
  const listIssuesSchema = ListIssuesInputSchema.shape;
  const getIssueSchema = GetIssueInputSchema.shape;

  // Register MCP Tools
  mcpServer.tool('skippr_list_issues', listIssuesSchema, async (args) => {
    const result = await listIssues(args as ListIssuesInput);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  });

  mcpServer.tool('skippr_get_issue', getIssueSchema, async (args) => {
    const result = await getIssue(args as GetIssueInput);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  });

  mcpServer.tool('skippr_list_projects', {}, async () => {
    const result = await listProjects();
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  });

  const restartWebSocketSchema = z.object({
    port: z.number().optional().describe('Optional port number for the WebSocket server (defaults to WS_PORT env var or 4040)'),
  }).shape;

  mcpServer.tool('skippr_restart_websocket', restartWebSocketSchema, async (args) => {
    const result = await restartWebSocketServer(args.port);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  });

  mcpServer.tool('skippr_websocket_status', {}, async () => {
    const result = getWebSocketServerStatus();
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  });

  return mcpServer;
}
