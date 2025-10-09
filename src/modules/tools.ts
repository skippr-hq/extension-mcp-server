import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";
import { getSkipprRootDir } from "./issueHandler";

export function registerTools(server: McpServer) {
  // Get all issues tool
  server.tool(
    "get-issues",
    {},
    async () => {
      try {
        const rootDir = getSkipprRootDir();
        const issuesDir = path.join(rootDir, "issues");

        // Check if issues directory exists
        if (!fs.existsSync(issuesDir)) {
          return {
            content: [{ type: "text", text: JSON.stringify({ issues: [] }) }],
          };
        }

        // Read all directories in issues folder
        const entries = await fs.promises.readdir(issuesDir, { withFileTypes: true });
        const issueIds = entries
          .filter(entry => entry.isDirectory())
          .map(entry => entry.name);

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              issues: issueIds,
              count: issueIds.length,
              rootDir: rootDir
            })
          }],
        };
      } catch (error) {
        console.error("Error fetching issues:", error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              error: error instanceof Error ? error.message : "Failed to fetch issues",
              issues: []
            })
          }],
        };
      }
    }
  );

  // Get specific issue details tool
  server.tool(
    "get-issue-details",
    {
      issueId: z.string().describe("The ID of the issue to retrieve details for"),
    },
    async ({ issueId }) => {
      try {
        const rootDir = getSkipprRootDir();
        const issueFile = path.join(rootDir, "issues", issueId, "issue.md");

        // Check if issue file exists
        if (!fs.existsSync(issueFile)) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                error: `Issue with ID '${issueId}' not found`,
                issueId: issueId
              })
            }],
          };
        }

        // Read the issue file content
        const content = await fs.promises.readFile(issueFile, "utf8");

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              issueId: issueId,
              content: content,
              filePath: issueFile
            })
          }],
        };
      } catch (error) {
        console.error(`Error fetching issue ${issueId}:`, error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              error: error instanceof Error ? error.message : `Failed to fetch issue ${issueId}`,
              issueId: issueId
            })
          }],
        };
      }
    }
  );
}