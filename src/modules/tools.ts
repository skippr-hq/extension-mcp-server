import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerTools(server: McpServer) {
  // Math tool
  server.tool(
    "fetch-issues",
    {
      path: z.string(),
    },
    async ({ path }) => {
      console.log(`Received request: path=${path}`);

      return {
        content: [{ type: "text", text: `No Issues found at: ${path}` }],
      };
    }
  );
}