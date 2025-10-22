/**
 * Zod validation schemas for Skippr MCP server
 * Used for parsing and validating markdown frontmatter and data structures
 */

import { z } from 'zod';

// Enums
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

// Write issue message schema (from WebSocket)
export const WriteIssueMessageSchema = z.object({
  type: z.string(),
  projectId: z.string(),
  reviewId: z.string().uuid(),
  issueId: z.string().uuid(),
  title: z.string(),
  severity: IssueSeveritySchema,
  resolved: z.boolean().optional(),
  agentTypes: z.array(AgentTypeSchema),
  elementMetadata: ElementMetadataSchema.optional(),
  details: z.string(),
  agentPrompt: z.string(),
  ticket: z.string().optional(),
  timestamp: z.number(),
});

// Metadata schema shared across client-related schemas
export const ClientMetadataSchema = z.object({
  extensionVersion: z.string().optional(),
  browserInfo: z.string().optional(),
  environment: z.string().optional(),
});

// Client registration message schema
export const ClientRegistrationSchema = z.object({
  type: z.literal('register'),
  projectId: z.string(),
  metadata: ClientMetadataSchema.optional(),
});

// Server to client message types
export const ServerMessageTypeSchema = z.enum(['notification', 'command', 'data', 'status']);

// Payload schemas for different message types
export const NotificationPayloadSchema = z.object({
  title: z.string(),
  message: z.string(),
  level: z.enum(['info', 'warning', 'error']).optional(),
});

export const CommandPayloadSchema = z.object({
  action: z.string(),
  parameters: z.record(z.any()).optional(),
});

export const DataPayloadSchema = z.object({
  data: z.any(),
  dataType: z.string().optional(),
});

export const StatusPayloadSchema = z.object({
  status: z.string(),
  details: z.record(z.any()).optional(),
});

// Server to client message schema with discriminated union
export const ServerToClientMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('notification'),
    payload: NotificationPayloadSchema,
    timestamp: z.number().optional(),
    messageId: z.string().optional(),
  }),
  z.object({
    type: z.literal('command'),
    payload: CommandPayloadSchema,
    timestamp: z.number().optional(),
    messageId: z.string().optional(),
  }),
  z.object({
    type: z.literal('data'),
    payload: DataPayloadSchema,
    timestamp: z.number().optional(),
    messageId: z.string().optional(),
  }),
  z.object({
    type: z.literal('status'),
    payload: StatusPayloadSchema,
    timestamp: z.number().optional(),
    messageId: z.string().optional(),
  }),
]);

// Client info schema (for tracking connected clients)
export const ClientInfoSchema = z.object({
  clientId: z.string(),
  projectId: z.string(),
  connectedAt: z.number(),
  lastActivity: z.number(),
  metadata: ClientMetadataSchema.optional(),
});

// Verify issue fix request schema (MCP to WebSocket)
export const VerifyIssueFixRequestSchema = z.object({
  action: z.literal('verify_issue_fix'),
  projectId: z.string(),
  issueId: z.string().uuid(),
  reviewId: z.string().uuid().optional(),
  requestId: z.string(),
});

// Verify issue fix response schema (WebSocket to MCP)
export const VerifyIssueFixResponseSchema = z.object({
  type: z.literal('verify_issue_response'),
  requestId: z.string(),
  projectId: z.string(),
  issueId: z.string().uuid(),
  reviewId: z.string().uuid().optional(),
  success: z.boolean(),
  verified: z.boolean().optional(),
  message: z.string().optional(),
    message: z.string().optional(),
    reasoning: z.string().optional(),
    error: z.string().optional(),
  error: z.string().optional(),
  details: z.record(z.any()).optional(),
});

