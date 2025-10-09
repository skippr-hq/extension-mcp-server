#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { listIssues, ListIssuesInputSchema } from './tools/list-issues.js';
import { getIssue, GetIssueInputSchema } from './tools/get-issue.js';

const server = new Server(
  {
    name: "skippr-mcp",
    version: "0.0.1",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'skippr_list_issues',
        description: 'List all Skippr issues from .skippr directory with optional filtering by reviewId, severity, agentType, or resolved status',
        inputSchema: {
          type: 'object',
          properties: {
            rootDir: {
              type: 'string',
              description: 'Project root directory containing .skippr folder',
            },
            reviewId: {
              type: 'string',
              description: 'Filter by review ID (UUID)',
            },
            severity: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'critical'],
              description: 'Filter by severity level',
            },
            agentType: {
              type: 'string',
              enum: ['ux', 'a11y', 'content', 'pmm', 'performance', 'seo', 'security'],
              description: 'Filter by agent type',
            },
            resolved: {
              type: 'boolean',
              description: 'Filter by resolved status',
            },
          },
          required: ['rootDir'],
        },
      },
      {
        name: 'skippr_get_issue',
        description: 'Get full details for a specific Skippr issue including metadata and raw markdown content',
        inputSchema: {
          type: 'object',
          properties: {
            rootDir: {
              type: 'string',
              description: 'Project root directory containing .skippr folder',
            },
            reviewId: {
              type: 'string',
              description: 'Review ID (UUID)',
            },
            issueId: {
              type: 'string',
              description: 'Issue ID (UUID)',
            },
          },
          required: ['rootDir', 'reviewId', 'issueId'],
        },
      },
    ],
  };
});

// Register tool handlers
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === 'skippr_list_issues') {
      const input = ListIssuesInputSchema.parse(args);
      const result = await listIssues(input);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } else if (name === 'skippr_get_issue') {
      const input = GetIssueInputSchema.parse(args);
      const result = await getIssue(input);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } else {
      throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    throw new McpError(
      ErrorCode.InternalError,
      `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
});

async function main() {
  const transport = new StdioServerTransport();

  await server.connect(transport);

  console.error("Skippr MCP server started");
}

main().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});