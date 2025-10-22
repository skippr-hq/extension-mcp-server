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
import packageJson from '../../package.json' with { type: 'json' };

// Helper function to create MCP responses with structured content
// When outputSchema is provided, the SDK validates the structuredContent field
function createStructuredResponse(data: any) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
    structuredContent: data  // This gets validated against the outputSchema
  };
}

export function createMcpServer(): McpServer {
  const mcpServer = new McpServer({
    name: "mcp-x-ray",
    version: packageJson.version,
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
      return createStructuredResponse(result);
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
      return createStructuredResponse(result);
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
      return createStructuredResponse(result);
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
      return createStructuredResponse(result);
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
      return createStructuredResponse(result);
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
      const result = {
        success,
        extensionId: args.extensionId,
        message: success ? 'Message sent successfully' : 'Failed to send message (extension may be disconnected)'
      };
      return createStructuredResponse(result);
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
      const msgResult = sendMessageToProjectExtensions(args.projectId, message);
      const result = {
        projectId: args.projectId,
        ...msgResult,
        message: `Notification sent to ${msgResult.sent} extensions, ${msgResult.failed} failed`
      };
      return createStructuredResponse(result);
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
      const broadcastResult = broadcastToAllExtensions(message);
      const result = {
        ...broadcastResult,
        message: `Notification sent to ${broadcastResult.sent} extensions, ${broadcastResult.failed} failed`
      };
      return createStructuredResponse(result);
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
      const result = {
        totalExtensions: extensions.length,
        extensions
      };
      return createStructuredResponse(result);
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
      const result = {
        success,
        extensionId: args.extensionId,
        message: success ? 'Extension disconnected successfully' : 'Extension not found'
      };
      return createStructuredResponse(result);
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
        reasoning: z.string(),
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

        const result = {
          success: true,
          projectId: args.projectId,
          issueId: args.issueId,
          verified: response.verified,
          reasoning: response.reasoning,
          error: response.error,
          message: response.message,
          details: response.details
        };
        return createStructuredResponse(result);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        const result = {
          success: false,
          projectId: args.projectId,
          issueId: args.issueId,
          error: errorMessage,
          message: `Failed to verify issue fix: ${errorMessage}`
        };
        return createStructuredResponse(result);
      }
    }
  );

  return mcpServer;
}
