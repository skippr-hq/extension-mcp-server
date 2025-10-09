#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

const SkipperToolSchema = z.object({
  action: z.string().describe("The action to perform"),
  params: z.record(z.any()).optional().describe("Optional parameters for the action"),
});

const server = new Server(
  {
    name: "skippr-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "skipper_action",
        description: "Execute a Skippr action",
        inputSchema: {
          type: "object",
          properties: {
            action: {
              type: "string",
              description: "The action to perform",
            },
            params: {
              type: "object",
              description: "Optional parameters for the action",
              additionalProperties: true,
            },
          },
          required: ["action"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "skipper_action") {
    const args = SkipperToolSchema.parse(request.params.arguments);

    try {
      const result = await handleSkipperAction(args.action, args.params);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to execute action: ${errorMessage}`
      );
    }
  }

  throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
});

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: "skippr://status",
        name: "Skippr Status",
        description: "Get the current status of Skippr",
        mimeType: "application/json",
      },
    ],
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  if (uri === "skippr://status") {
    return {
      contents: [
        {
          uri: "skippr://status",
          mimeType: "application/json",
          text: JSON.stringify({
            status: "ready",
            version: "1.0.0",
            timestamp: new Date().toISOString(),
          }, null, 2),
        },
      ],
    };
  }

  throw new McpError(ErrorCode.InvalidRequest, `Unknown resource: ${uri}`);
});

async function handleSkipperAction(action: string, params?: Record<string, any>) {
  switch (action) {
    case "ping":
      return { success: true, message: "pong", timestamp: new Date().toISOString() };

    case "echo":
      return { success: true, echo: params?.message || "No message provided" };

    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

async function main() {
  const transport = new StdioServerTransport();

  await server.connect(transport);

  console.error("Skippr MCP server started");
}

main().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});