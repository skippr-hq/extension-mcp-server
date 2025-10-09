/**
 * Zod validation schemas for Skippr MCP server
 * Used for parsing and validating markdown frontmatter and data structures
 */

import { z } from 'zod';

// Enums
export const ReviewStateSchema = z.enum(['queued', 'processing', 'completed', 'failed']);

export const IssueSeveritySchema = z.enum(['critical', 'high', 'medium', 'low', 'info']);

export const AgentTypeSchema = z.enum(['ux', 'a11y', 'pm', 'pmm', 'legal', 'content', 'users']);

// Element metadata schema
export const ElementMetadataSchema = z.object({
  selector: z.string(),
  bounding_box: z.array(z.number()).length(4).optional(), // [x, y, width, height]
});

// Issue actions schema
export const IssueActionsSchema = z.object({
  ticket: z.string().optional(),
  agent_prompt: z.string().optional(),
});

// Agent progress schema
export const AgentProgressSchema = z.object({
  total: z.number(),
  completed: z.number().optional(),
});

// Review schema
export const ReviewSchema = z.object({
  id: z.string().uuid(),
  url: z.string().url(),
  state: ReviewStateSchema,
  projectId: z.string().uuid().optional(),
  workspaceId: z.string().uuid(),
  agentProgress: AgentProgressSchema.optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Issue schema (full)
export const IssueSchema = z.object({
  id: z.string().uuid(),
  reviewId: z.string().uuid(),
  title: z.string(),
  severity: IssueSeveritySchema,
  details: z.string(),
  elementMetadata: ElementMetadataSchema.optional(),
  actions: IssueActionsSchema.optional(),
  userFeedback: z.record(z.any()).optional(),
  resolved: z.boolean(),
  agentTypes: z.array(AgentTypeSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Issue summary schema (lightweight)
export const IssueSummarySchema = z.object({
  id: z.string().uuid(),
  reviewId: z.string().uuid(),
  title: z.string(),
  severity: IssueSeveritySchema,
  resolved: z.boolean(),
  agentTypes: z.array(AgentTypeSchema),
});

// List issues options schema
export const ListIssuesOptionsSchema = z.object({
  reviewId: z.string().uuid().optional(),
  severity: IssueSeveritySchema.optional(),
  agentType: AgentTypeSchema.optional(),
  resolved: z.boolean().optional(),
});

// Markdown frontmatter schema (for parsing issue files)
export const IssueFrontmatterSchema = z.object({
  id: z.string().uuid(),
  reviewId: z.string().uuid(),
  title: z.string(),
  severity: IssueSeveritySchema,
  resolved: z.boolean().default(false),
  agentTypes: z.array(AgentTypeSchema),
  elementMetadata: ElementMetadataSchema.optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

// Review metadata file schema (for metadata.json)
export const ReviewMetadataSchema = z.object({
  id: z.string().uuid(),
  url: z.string().url(),
  state: ReviewStateSchema,
  projectId: z.string().uuid().optional(),
  workspaceId: z.string().uuid(),
  agentProgress: AgentProgressSchema.optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
