/**
 * MCP Server - Exposes Skippr tools for AI coding agents
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { listIssues, ListIssuesInputSchema } from '../tools/list-issues.js';
import { getIssue, GetIssueInputSchema } from '../tools/get-issue.js';

export function createMcpServer(rootDir: string): McpServer {
  const mcpServer = new McpServer({
    name: 'skippr-mcp',
    version: '1.0.0',
  });

  // Remove rootDir from the tool input schemas since it's provided by server config
  const listIssuesSchema = ListIssuesInputSchema.omit({ rootDir: true }).shape;
  const getIssueSchema = GetIssueInputSchema.omit({ rootDir: true }).shape;

  // Register MCP Tools
  mcpServer.tool('skippr_list_issues', listIssuesSchema, async (args) => {
    const result = await listIssues({ ...args, rootDir } as any);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  });

  mcpServer.tool('skippr_get_issue', getIssueSchema, async (args) => {
    const result = await getIssue({ ...args, rootDir } as any);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  });

  return mcpServer;
}
