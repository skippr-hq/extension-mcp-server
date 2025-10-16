/**
 * MCP Server - Exposes Skippr tools for AI coding agents
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { listIssues, ListIssuesInput, ListIssuesInputSchema } from '../tools/list-issues.js';
import { getIssue, GetIssueInput, GetIssueInputSchema } from '../tools/get-issue.js';
import { listProjects } from '../tools/list-projects.js';
import {
  restartWebSocketServer,
  getWebSocketServerStatus,
  sendToClient,
  sendToProject,
  broadcastToAll,
  getConnectedClients,
  disconnectClient,
  verifyIssueFix
} from './websocket.js';
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

  // Client communication tools
  const sendToClientSchema = z.object({
    clientId: z.string().describe('The client ID to send the message to'),
    message: z.any().describe('The message to send to the client'),
  }).shape;

  mcpServer.tool('skippr_send_to_client', sendToClientSchema, async (args) => {
    const success = sendToClient(args.clientId, args.message);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success,
          clientId: args.clientId,
          message: success ? 'Message sent successfully' : 'Failed to send message (client may be disconnected)'
        }, null, 2)
      }],
    };
  });

  const sendToProjectSchema = z.object({
    projectId: z.string().describe('The project ID to broadcast to'),
    message: z.any().describe('The message to broadcast to all clients in the project'),
  }).shape;

  mcpServer.tool('skippr_broadcast_to_project', sendToProjectSchema, async (args) => {
    const result = sendToProject(args.projectId, args.message);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          projectId: args.projectId,
          ...result,
          message: `Broadcast sent to ${result.sent} clients, ${result.failed} failed`
        }, null, 2)
      }],
    };
  });

  const broadcastSchema = z.object({
    message: z.any().describe('The message to broadcast to all connected clients'),
  }).shape;

  mcpServer.tool('skippr_broadcast_to_all', broadcastSchema, async (args) => {
    const result = broadcastToAll(args.message);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          ...result,
          message: `Broadcast sent to ${result.sent} clients, ${result.failed} failed`
        }, null, 2)
      }],
    };
  });

  mcpServer.tool('skippr_list_clients', {}, async () => {
    const clients = getConnectedClients();
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          totalClients: clients.length,
          clients
        }, null, 2)
      }],
    };
  });

  const disconnectClientSchema = z.object({
    clientId: z.string().describe('The client ID to disconnect'),
  }).shape;

  mcpServer.tool('skippr_disconnect_client', disconnectClientSchema, async (args) => {
    const success = disconnectClient(args.clientId);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success,
          clientId: args.clientId,
          message: success ? 'Client disconnected successfully' : 'Client not found'
        }, null, 2)
      }],
    };
  });

  // Verify issue fix tool
  const verifyIssueFixSchema = z.object({
    projectId: z.string().describe('The project ID containing the issue'),
    issueId: z.string().describe('The issue ID to verify'),
    reviewId: z.string().describe('Review ID for the issue'),
    timeout: z.number().optional().describe('Timeout in milliseconds (default: 600000)'),
  }).shape;

  mcpServer.tool('skippr_verify_issue_fix', verifyIssueFixSchema, async (args) => {
    try {
      const response = await verifyIssueFix(
        args.projectId,
        args.issueId,
        args.reviewId,
        args.timeout
      );

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            projectId: args.projectId,
            issueId: args.issueId,
            verified: response.verified,
            error: response.error,
            message: response.message,
            details: response.details
          }, null, 2)
        }],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            projectId: args.projectId,
            issueId: args.issueId,
            error: errorMessage,
            message: `Failed to verify issue fix: ${errorMessage}`
          }, null, 2)
        }],
      };
    }
  });

  return mcpServer;
}
