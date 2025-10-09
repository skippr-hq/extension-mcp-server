import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerPrompts(server: McpServer) {
  server.prompt(
    "fixIssue",
    { issueId: z.string() },
    ({ issueId }) => ({
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: `Please fix the issue with id: ${issueId}`
        }
      }]
    })
  );
}
