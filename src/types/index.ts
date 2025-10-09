/**
 * TypeScript types for Skippr MCP server
 * Based on Supabase database schema
 */

export type ReviewState = 'queued' | 'processing' | 'completed' | 'failed';

export type IssueSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type AgentType = 'ux' | 'a11y' | 'pm' | 'pmm' | 'legal' | 'content' | 'users';

/**
 * Review metadata from database
 */
export interface Review {
  id: string;
  url: string;
  state: ReviewState;
  projectId?: string;
  workspaceId: string;
  agentProgress?: AgentProgress;
  createdAt: string;
  updatedAt: string;
}

/**
 * Agent progress and scoring data
 */
export interface AgentProgress {
  total: number;
  completed?: number;
}

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
