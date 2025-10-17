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
import { ServerToClientMessageSchema } from '../schemas/index.js';

// Helper function to create MCP text responses
function createTextResponse(data: any) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
  };
}

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
    return createTextResponse(result);
  });

  mcpServer.tool('skippr_get_issue', getIssueSchema, async (args) => {
    const result = await getIssue(args as GetIssueInput);
    return createTextResponse(result);
  });

  mcpServer.tool('skippr_list_projects', {}, async () => {
    const result = await listProjects();
    return createTextResponse(result);
  });

  const restartExtensionServerSchema = z.object({
    port: z.number().optional().describe('Optional port number for the extension server (defaults to WS_PORT env var or 4040)'),
  }).shape;

  mcpServer.tool('skippr_restart_extension_server', restartExtensionServerSchema, async (args) => {
    const result = await restartWebSocketServer(args.port);
    return createTextResponse(result);
  });

  mcpServer.tool('skippr_extension_server_status', {}, async () => {
    const result = getWebSocketServerStatus();
    return createTextResponse(result);
  });

  // Extension communication tools
  const sendToExtensionSchema = z.object({
    extensionId: z.string().describe('The extension ID to send the message to'),
    type: z.enum(['notification', 'command', 'data', 'status']).describe('Message type'),
    payload: z.any().describe('The message payload'),
  }).shape;

  mcpServer.tool('skippr_send_to_extension', sendToExtensionSchema, async (args) => {
    const message: z.infer<typeof ServerToClientMessageSchema> = {
      type: args.type,
      payload: args.payload
    };
    const success = sendToClient(args.extensionId, message);
    return createTextResponse({
      success,
      extensionId: args.extensionId,
      message: success ? 'Message sent successfully' : 'Failed to send message (extension may be disconnected)'
    });
  });

  const notifyProjectExtensionsSchema = z.object({
    projectId: z.string().describe('The project ID to notify'),
    type: z.enum(['notification', 'command', 'data', 'status']).describe('Message type'),
    payload: z.any().describe('The message payload'),
  }).shape;

  mcpServer.tool('skippr_notify_project_extensions', notifyProjectExtensionsSchema, async (args) => {
    const message: z.infer<typeof ServerToClientMessageSchema> = {
      type: args.type,
      payload: args.payload
    };
    const result = sendToProject(args.projectId, message);
    return createTextResponse({
      projectId: args.projectId,
      ...result,
      message: `Notification sent to ${result.sent} extensions, ${result.failed} failed`
    });
  });

  const notifyAllExtensionsSchema = z.object({
    type: z.enum(['notification', 'command', 'data', 'status']).describe('Message type'),
    payload: z.any().describe('The message payload'),
  }).shape;

  mcpServer.tool('skippr_notify_all_extensions', notifyAllExtensionsSchema, async (args) => {
    const message: z.infer<typeof ServerToClientMessageSchema> = {
      type: args.type,
      payload: args.payload
    };
    const result = broadcastToAll(message);
    return createTextResponse({
      ...result,
      message: `Notification sent to ${result.sent} extensions, ${result.failed} failed`
    });
  });

  mcpServer.tool('skippr_list_connected_extensions', {}, async () => {
    const extensions = getConnectedClients();
    return createTextResponse({
      totalExtensions: extensions.length,
      extensions
    });
  });

  const disconnectExtensionSchema = z.object({
    extensionId: z.string().describe('The extension ID to disconnect'),
  }).shape;

  mcpServer.tool('skippr_disconnect_extension', disconnectExtensionSchema, async (args) => {
    const success = disconnectClient(args.extensionId);
    return createTextResponse({
      success,
      extensionId: args.extensionId,
      message: success ? 'Extension disconnected successfully' : 'Extension not found'
    });
  });

  // Verify issue fix tool
  const verifyIssueFixSchema = z.object({
    projectId: z.string().describe('The project ID containing the issue'),
    issueId: z.string().describe('The issue ID to verify'),
    reviewId: z.string().describe('Review ID for the issue'),
    timeout: z.number().optional().describe('Timeout in milliseconds (default: 300000)'),
  }).shape;

  mcpServer.tool('skippr_verify_issue_fix', verifyIssueFixSchema, async (args) => {
    try {
      const response = await verifyIssueFix(
        args.projectId,
        args.issueId,
        args.reviewId,
        args.timeout || 300000
      );

      return createTextResponse({
        success: true,
        projectId: args.projectId,
        issueId: args.issueId,
        verified: response.verified,
        error: response.error,
        message: response.message,
        details: response.details
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return createTextResponse({
        success: false,
        projectId: args.projectId,
        issueId: args.issueId,
        error: errorMessage,
        message: `Failed to verify issue fix: ${errorMessage}`
      });
    }
  });

  return mcpServer;
}
