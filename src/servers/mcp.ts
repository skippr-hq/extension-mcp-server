/**
 * MCP Server - Exposes Skippr tools for AI coding agents
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { listIssues, ListIssuesInputSchema } from '../tools/list-issues.js';
import { getIssue, GetIssueInputSchema } from '../tools/get-issue.js';
import { listProjects } from '../tools/list-projects.js';

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
    const result = await listIssues(args as any);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  });

  mcpServer.tool('skippr_get_issue', getIssueSchema, async (args) => {
    const result = await getIssue(args as any);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  });

  mcpServer.tool('skippr_list_projects', {}, async () => {
    const result = await listProjects();
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  });

  return mcpServer;
}
