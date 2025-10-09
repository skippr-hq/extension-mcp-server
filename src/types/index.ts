/**
 * TypeScript types for Skippr MCP server
 * Based on Supabase database schema
 */

export type IssueSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type AgentType = 'ux' | 'a11y' | 'pm' | 'pmm' | 'legal' | 'content' | 'users';

/**
 * Issue from database
 */
export interface Issue {
  id: string;
  reviewId: string;
  title: string;
  severity: IssueSeverity;
  details: string;
  elementMetadata?: ElementMetadata;
  actions?: IssueActions;
  userFeedback?: Record<string, any>;
  resolved: boolean;
  agentTypes: AgentType[]; // From issue_agents junction table
  createdAt: string;
  updatedAt: string;
}

/**
 * Element metadata for DOM targeting
 */
export interface ElementMetadata {
  selector: string;
  bounding_box?: number[]; // [x, y, width, height]
}

/**
 * Issue actions (tickets and prompts)
 */
export interface IssueActions {
  ticket?: string; // Rich markdown ticket format
  agent_prompt?: string; // Instructions for AI coding agent
}

/**
 * Simplified issue summary for list operations
 */
export interface IssueSummary {
  id: string;
  reviewId: string;
  title: string;
  severity: IssueSeverity;
  resolved: boolean;
  agentTypes: AgentType[];
}

/**
 * Filter options for listing issues
 */
export interface ListIssuesOptions {
  reviewId?: string;
  severity?: IssueSeverity;
  agentType?: AgentType;
  resolved?: boolean;
}

/**
 * Write issue message from WebSocket (Skippr extension)
 */
export interface WriteIssueMessage {
  type: string;
  reviewId: string;
  issueId: string;
  title: string;
  severity: IssueSeverity;
  resolved?: boolean;
  agentTypes: AgentType[];
  elementMetadata?: ElementMetadata;
  details: string;
  agentPrompt: string;
  ticket?: string;
  timestamp: number;
}
