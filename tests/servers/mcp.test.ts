import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createMcpServer } from '../../src/servers/mcp.js';
import * as websocketModule from '../../src/servers/websocket.js';
import * as listIssuesModule from '../../src/tools/list-issues.js';
import * as getIssueModule from '../../src/tools/get-issue.js';
import * as listProjectsModule from '../../src/tools/list-projects.js';

// Mock the modules
vi.mock('../../src/servers/websocket.js');
vi.mock('../../src/tools/list-issues.js');
vi.mock('../../src/tools/get-issue.js');
vi.mock('../../src/tools/list-projects.js');

describe('MCP Server', () => {
  let mcpServer: any;

  beforeEach(() => {
    mcpServer = createMcpServer();
    vi.clearAllMocks();
  });

  describe('Issue Management Tools', () => {
    it('should register skippr_list_issues tool', () => {
      const tool = mcpServer.tools.get('skippr_list_issues');
      expect(tool).toBeDefined();
      expect(tool.name).toBe('skippr_list_issues');
    });

    it('should register skippr_get_issue tool', () => {
      const tool = mcpServer.tools.get('skippr_get_issue');
      expect(tool).toBeDefined();
      expect(tool.name).toBe('skippr_get_issue');
    });

    it('should register skippr_list_projects tool', () => {
      const tool = mcpServer.tools.get('skippr_list_projects');
      expect(tool).toBeDefined();
      expect(tool.name).toBe('skippr_list_projects');
    });

    it('should handle list issues call', async () => {
      const mockResult = { issues: [{ id: '1', title: 'Test Issue' }] };
      vi.mocked(listIssuesModule.listIssues).mockResolvedValue(mockResult);

      const tool = mcpServer.tools.get('skippr_list_issues');
      const result = await tool.handler({ projectId: 'test-project' }, {});

      expect(listIssuesModule.listIssues).toHaveBeenCalledWith({ projectId: 'test-project' });
      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('Test Issue');
    });
  });

  describe('Extension Server Management Tools', () => {
    it('should register skippr_restart_extension_server tool', () => {
      const tool = mcpServer.tools.get('skippr_restart_extension_server');
      expect(tool).toBeDefined();
      expect(tool.name).toBe('skippr_restart_extension_server');
    });

    it('should register skippr_extension_server_status tool', () => {
      const tool = mcpServer.tools.get('skippr_extension_server_status');
      expect(tool).toBeDefined();
      expect(tool.name).toBe('skippr_extension_server_status');
    });

    it('should handle restart extension server call', async () => {
      const mockResult = { success: true, message: 'Server restarted', port: 4040 };
      vi.mocked(websocketModule.restartWebSocketServer).mockResolvedValue(mockResult);

      const tool = mcpServer.tools.get('skippr_restart_extension_server');
      const result = await tool.handler({ port: 4040 }, {});

      expect(websocketModule.restartWebSocketServer).toHaveBeenCalledWith(4040);
      expect(result.content[0].text).toContain('Server restarted');
    });

    it('should handle extension server status call', async () => {
      const mockStatus = { running: true, port: 4040 };
      vi.mocked(websocketModule.getWebSocketServerStatus).mockReturnValue(mockStatus);

      const tool = mcpServer.tools.get('skippr_extension_server_status');
      const result = await tool.handler({}, {});

      expect(websocketModule.getWebSocketServerStatus).toHaveBeenCalled();
      expect(result.content[0].text).toContain('4040');
    });
  });

  describe('Extension Communication Tools', () => {
    it('should register skippr_send_to_extension tool', () => {
      const tool = mcpServer.tools.get('skippr_send_to_extension');
      expect(tool).toBeDefined();
      expect(tool.name).toBe('skippr_send_to_extension');
    });

    it('should register skippr_notify_project_extensions tool', () => {
      const tool = mcpServer.tools.get('skippr_notify_project_extensions');
      expect(tool).toBeDefined();
      expect(tool.name).toBe('skippr_notify_project_extensions');
    });

    it('should register skippr_notify_all_extensions tool', () => {
      const tool = mcpServer.tools.get('skippr_notify_all_extensions');
      expect(tool).toBeDefined();
      expect(tool.name).toBe('skippr_notify_all_extensions');
    });

    it('should handle send to extension call', async () => {
      vi.mocked(websocketModule.sendToClient).mockReturnValue(true);

      const tool = mcpServer.tools.get('skippr_send_to_extension');
      const result = await tool.handler({
        extensionId: 'ext-123',
        type: 'notification',
        payload: { title: 'Test', message: 'Test message' }
      }, {});

      expect(websocketModule.sendToClient).toHaveBeenCalled();
      expect(result.content[0].text).toContain('success');
      expect(result.content[0].text).toContain('true');
    });

    it('should handle notify project extensions call', async () => {
      const mockResult = { sent: 3, failed: 1 };
      vi.mocked(websocketModule.sendToProject).mockReturnValue(mockResult);

      const tool = mcpServer.tools.get('skippr_notify_project_extensions');
      const result = await tool.handler({
        projectId: 'test-project',
        type: 'status',
        payload: { status: 'active' }
      }, {});

      expect(websocketModule.sendToProject).toHaveBeenCalled();
      expect(result.content[0].text).toContain('sent');
      expect(result.content[0].text).toContain('3');
    });

    it('should handle notify all extensions call', async () => {
      const mockResult = { sent: 5, failed: 0 };
      vi.mocked(websocketModule.broadcastToAll).mockReturnValue(mockResult);

      const tool = mcpServer.tools.get('skippr_notify_all_extensions');
      const result = await tool.handler({
        type: 'data',
        payload: { data: 'test' }
      }, {});

      expect(websocketModule.broadcastToAll).toHaveBeenCalled();
      expect(result.content[0].text).toContain('5');
    });
  });

  describe('Extension Management Tools', () => {
    it('should register skippr_list_connected_extensions tool', () => {
      const tool = mcpServer.tools.get('skippr_list_connected_extensions');
      expect(tool).toBeDefined();
      expect(tool.name).toBe('skippr_list_connected_extensions');
    });

    it('should register skippr_disconnect_extension tool', () => {
      const tool = mcpServer.tools.get('skippr_disconnect_extension');
      expect(tool).toBeDefined();
      expect(tool.name).toBe('skippr_disconnect_extension');
    });

    it('should handle list connected extensions call', async () => {
      const mockClients = [
        { clientId: '1', projectId: 'proj-1', connectedAt: Date.now(), lastActivity: Date.now() },
        { clientId: '2', projectId: 'proj-2', connectedAt: Date.now(), lastActivity: Date.now() }
      ];
      vi.mocked(websocketModule.getConnectedClients).mockReturnValue(mockClients);

      const tool = mcpServer.tools.get('skippr_list_connected_extensions');
      const result = await tool.handler({}, {});

      expect(websocketModule.getConnectedClients).toHaveBeenCalled();
      expect(result.content[0].text).toContain('totalExtensions');
      expect(result.content[0].text).toContain('2');
    });

    it('should handle disconnect extension call', async () => {
      vi.mocked(websocketModule.disconnectClient).mockReturnValue(true);

      const tool = mcpServer.tools.get('skippr_disconnect_extension');
      const result = await tool.handler({ extensionId: 'ext-123' }, {});

      expect(websocketModule.disconnectClient).toHaveBeenCalledWith('ext-123');
      expect(result.content[0].text).toContain('success');
      expect(result.content[0].text).toContain('true');
    });
  });

  describe('Issue Verification Tool', () => {
    it('should register skippr_verify_issue_fix tool', () => {
      const tool = mcpServer.tools.get('skippr_verify_issue_fix');
      expect(tool).toBeDefined();
      expect(tool.name).toBe('skippr_verify_issue_fix');
    });

    it('should handle verify issue fix call', async () => {
      const mockResponse = {
        type: 'verify_issue_response' as const,
        requestId: 'req-123',
        projectId: 'test-project',
        issueId: 'issue-123',
        reviewId: 'review-123',
        success: true,
        verified: true,
        message: 'Issue verified'
      };
      vi.mocked(websocketModule.verifyIssueFix).mockResolvedValue(mockResponse);

      const tool = mcpServer.tools.get('skippr_verify_issue_fix');
      const result = await tool.handler({
        projectId: 'test-project',
        issueId: 'issue-123',
        reviewId: 'review-123'
      }, {});

      expect(websocketModule.verifyIssueFix).toHaveBeenCalledWith(
        'test-project',
        'issue-123',
        'review-123',
        300000
      );
      expect(result.content[0].text).toContain('verified');
      expect(result.content[0].text).toContain('true');
    });

    it('should handle verify issue fix with custom timeout', async () => {
      const mockResponse = {
        type: 'verify_issue_response' as const,
        requestId: 'req-123',
        projectId: 'test-project',
        issueId: 'issue-123',
        reviewId: 'review-123',
        success: true,
        verified: false,
        message: 'Issue not fixed'
      };
      vi.mocked(websocketModule.verifyIssueFix).mockResolvedValue(mockResponse);

      const tool = mcpServer.tools.get('skippr_verify_issue_fix');
      const result = await tool.handler({
        projectId: 'test-project',
        issueId: 'issue-123',
        reviewId: 'review-123',
        timeout: 120000
      }, {});

      expect(websocketModule.verifyIssueFix).toHaveBeenCalledWith(
        'test-project',
        'issue-123',
        'review-123',
        120000
      );
      expect(result.content[0].text).toContain('verified');
      expect(result.content[0].text).toContain('false');
    });

    it('should handle verify issue fix error', async () => {
      vi.mocked(websocketModule.verifyIssueFix).mockRejectedValue(new Error('Timeout'));

      const tool = mcpServer.tools.get('skippr_verify_issue_fix');
      const result = await tool.handler({
        projectId: 'test-project',
        issueId: 'issue-123',
        reviewId: 'review-123'
      }, {});

      expect(result.content[0].text).toContain('success');
      expect(result.content[0].text).toContain('false');
      expect(result.content[0].text).toContain('Timeout');
    });
  });
});