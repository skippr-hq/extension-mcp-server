/**
 * MCP Server - Exposes Skippr tools for AI coding agents
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { listIssues, ListIssuesInput, ListIssuesInputSchema, ListIssuesOutputSchema } from '../tools/list-issues.js';
import { getIssue, GetIssueInput, GetIssueInputSchema } from '../tools/get-issue.js';
import { listProjects } from '../tools/list-projects.js';
import {
  restartWebSocketServer,
  getWebSocketServerStatus,
  sendToExtension,
  sendMessageToProjectExtensions,
  broadcastToAllExtensions,
  getConnectedExtensions,
  disconnectExtension,
  verifyIssueFix
} from './websocket.js';
import { z } from 'zod';
import { ServerToClientMessageSchema, ClientInfoSchema } from '../schemas/index.js';

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

  // Register MCP Tools using the recommended registerTool() method
  mcpServer.registerTool(
    'skippr_list_issues',
    {
      title: 'List Skippr Issues',
      description: 'Lists all available Skippr issues with optional filtering by project, review, severity, agent type, and resolution status',
      inputSchema: ListIssuesInputSchema.shape,
      outputSchema: ListIssuesOutputSchema.shape
    },
    async (args) => {
      const result = await listIssues(args as ListIssuesInput);
      return createTextResponse(result);
    }
  );

  mcpServer.registerTool(
    'skippr_get_issue',
    {
      title: 'Get Skippr Issue Details',
      description: 'Gets full details for a specific Skippr issue including raw markdown content',
      inputSchema: GetIssueInputSchema.shape,
      outputSchema: z.object({
        id: z.string(),
        reviewId: z.string(),
        title: z.string(),
        severity: z.string(),
        resolved: z.boolean(),
        agentTypes: z.array(z.string()),
        markdown: z.string()
      }).shape
    },
    async (args) => {
      const result = await getIssue(args as GetIssueInput);
      return createTextResponse(result);
    }
  );

  mcpServer.registerTool(
    'skippr_list_projects',
    {
      title: 'List Skippr Projects',
      description: 'Lists all available project IDs from the .skippr/projects directory',
      inputSchema: {},
      outputSchema: z.object({
        projects: z.array(z.string()),
        totalCount: z.number()
      }).shape
    },
    async () => {
      const result = await listProjects();
      return createTextResponse(result);
    }
  );

  mcpServer.registerTool(
    'skippr_restart_extension_server',
    {
      title: 'Restart Extension Server',
      description: 'Restarts the WebSocket server that communicates with browser extensions',
      inputSchema: z.object({
        port: z.number().optional().describe('Optional port number for the extension server (defaults to WS_PORT env var or 4040)')
      }).shape,
      outputSchema: z.object({
        success: z.boolean(),
        message: z.string(),
        port: z.number()
      }).shape
    },
    async (args) => {
      const result = await restartWebSocketServer(args.port);
      return createTextResponse(result);
    }
  );

  mcpServer.registerTool(
    'skippr_extension_server_status',
    {
      title: 'Extension Server Status',
      description: 'Gets the current status of the WebSocket server for browser extensions',
      inputSchema: {},
      outputSchema: z.object({
        running: z.boolean(),
        port: z.number().optional()
      }).shape
    },
    async () => {
      const result = getWebSocketServerStatus();
      return createTextResponse(result);
    }
  );

  // Extension communication tools
  mcpServer.registerTool(
    'skippr_send_to_extension',
    {
      title: 'Send Message to Extension',
      description: 'Sends a message to a specific browser extension by its ID',
      inputSchema: z.object({
        extensionId: z.string().describe('The extension ID to send the message to'),
        type: z.enum(['notification', 'command', 'data', 'status']).describe('Message type'),
        payload: z.any().describe('The message payload')
      }).shape,
      outputSchema: z.object({
        success: z.boolean(),
        extensionId: z.string(),
        message: z.string()
      }).shape
    },
    async (args) => {
      const message: z.infer<typeof ServerToClientMessageSchema> = {
        type: args.type,
        payload: args.payload
      };
      const success = sendToExtension(args.extensionId, message);
      return createTextResponse({
        success,
        extensionId: args.extensionId,
        message: success ? 'Message sent successfully' : 'Failed to send message (extension may be disconnected)'
      });
    }
  );

  mcpServer.registerTool(
    'skippr_notify_project_extensions',
    {
      title: 'Notify Project Extensions',
      description: 'Sends a message to all browser extensions connected to a specific project',
      inputSchema: z.object({
        projectId: z.string().describe('The project ID to notify'),
        type: z.enum(['notification', 'command', 'data', 'status']).describe('Message type'),
        payload: z.any().describe('The message payload')
      }).shape,
      outputSchema: z.object({
        projectId: z.string(),
        sent: z.number(),
        failed: z.number(),
        message: z.string()
      }).shape
    },
    async (args) => {
      const message: z.infer<typeof ServerToClientMessageSchema> = {
        type: args.type,
        payload: args.payload
      };
      const result = sendMessageToProjectExtensions(args.projectId, message);
      return createTextResponse({
        projectId: args.projectId,
        ...result,
        message: `Notification sent to ${result.sent} extensions, ${result.failed} failed`
      });
    }
  );

  mcpServer.registerTool(
    'skippr_notify_all_extensions',
    {
      title: 'Notify All Extensions',
      description: 'Broadcasts a message to all connected browser extensions',
      inputSchema: z.object({
        type: z.enum(['notification', 'command', 'data', 'status']).describe('Message type'),
        payload: z.any().describe('The message payload')
      }).shape,
      outputSchema: z.object({
        sent: z.number(),
        failed: z.number(),
        message: z.string()
      }).shape
    },
    async (args) => {
      const message: z.infer<typeof ServerToClientMessageSchema> = {
        type: args.type,
        payload: args.payload
      };
      const result = broadcastToAllExtensions(message);
      return createTextResponse({
        ...result,
        message: `Notification sent to ${result.sent} extensions, ${result.failed} failed`
      });
    }
  );

  mcpServer.registerTool(
    'skippr_list_connected_extensions',
    {
      title: 'List Connected Extensions',
      description: 'Lists all currently connected browser extensions',
      inputSchema: {},
      outputSchema: z.object({
        totalExtensions: z.number(),
        extensions: z.array(ClientInfoSchema)
      }).shape
    },
    async () => {
      const extensions = getConnectedExtensions();
      return createTextResponse({
        totalExtensions: extensions.length,
        extensions
      });
    }
  );

  mcpServer.registerTool(
    'skippr_disconnect_extension',
    {
      title: 'Disconnect Extension',
      description: 'Disconnects a specific browser extension by its ID',
      inputSchema: z.object({
        extensionId: z.string().describe('The extension ID to disconnect')
      }).shape,
      outputSchema: z.object({
        success: z.boolean(),
        extensionId: z.string(),
        message: z.string()
      }).shape
    },
    async (args) => {
      const success = disconnectExtension(args.extensionId);
      return createTextResponse({
        success,
        extensionId: args.extensionId,
        message: success ? 'Extension disconnected successfully' : 'Extension not found'
      });
    }
  );

  // Verify issue fix tool
  mcpServer.registerTool(
    'skippr_verify_issue_fix',
    {
      title: 'Verify Issue Fix',
      description: 'Requests verification from the browser extension to check if an issue has been fixed',
      inputSchema: z.object({
        projectId: z.string().describe('The project ID containing the issue'),
        issueId: z.string().describe('The issue ID to verify'),
        reviewId: z.string().describe('Review ID for the issue'),
        timeout: z.number().optional().describe('Timeout in milliseconds (default: 300000)')
      }).shape,
      outputSchema: z.object({
        success: z.boolean(),
        projectId: z.string(),
        issueId: z.string(),
        verified: z.boolean().optional(),
        error: z.string().optional(),
        message: z.string(),
        details: z.any().optional()
      }).shape
    },
    async (args) => {
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
    }
  );

  return mcpServer;
}
