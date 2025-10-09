/**
 * MCP Server - Exposes Skippr tools via SSE transport for AI coding agents
 */

import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Request, Response, Express } from 'express';

import { listIssues, ListIssuesInputSchema } from '../tools/list-issues.js';
import { getIssue, GetIssueInputSchema } from '../tools/get-issue.js';

const transports: { [sessionId: string]: SSEServerTransport } = {};

export function createMcpServer(): McpServer {
  const mcpServer = new McpServer({
    name: 'skippr-mcp',
    version: '1.0.0',
  });

  // Register MCP Tools
  mcpServer.tool('skippr_list_issues', ListIssuesInputSchema.shape, async (args) => {
    const result = await listIssues(args as any);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  });

  mcpServer.tool('skippr_get_issue', GetIssueInputSchema.shape, async (args) => {
    const result = await getIssue(args as any);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  });

  return mcpServer;
}

export function setupMcpEndpoints(app: Express, mcpServer: McpServer): void {
  // SSE Endpoint for MCP clients
  app.get('/sse', async (_: Request, res: Response) => {
    const transport = new SSEServerTransport('/messages', res);
    transports[transport.sessionId] = transport;

    console.log(`SSE connection established. Session ID: ${transport.sessionId}`);

    res.on('close', () => {
      console.log(`SSE connection closed. Session ID: ${transport.sessionId}`);
      delete transports[transport.sessionId];
    });

    try {
      await mcpServer.connect(transport);
      console.log(`Transport connected to MCP server. Session ID: ${transport.sessionId}`);
    } catch (error) {
      console.error(`Error connecting transport to MCP server. Session ID: ${transport.sessionId}`, error);
    }
  });

  // Message endpoint for MCP clients
  app.post('/messages', async (req: Request, res: Response) => {
    const sessionId = req.query.sessionId as string;
    const transport = transports[sessionId] ?? Object.values(transports)[0];

    if (transport) {
      console.log(`Handling message for Session ID: ${sessionId}`);
      try {
        await transport.handlePostMessage(req, res);
      } catch (error) {
        console.error(`Error handling message for Session ID: ${sessionId}`, error);
        res.status(500).send('Internal Server Error');
      }
    } else {
      console.error(`No transport found for Session ID: ${sessionId}`);
      res.status(400).send('No transport found for sessionId');
    }
  });
}
