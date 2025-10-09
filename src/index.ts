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
    version: "0.0.1",
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

async function main() {
  const transport = new StdioServerTransport();

  await server.connect(transport);

  console.error("Skippr MCP server started");
}

main().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});