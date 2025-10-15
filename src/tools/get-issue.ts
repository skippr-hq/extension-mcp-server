/**
 * MCP tool: skippr_get_issue
 * Gets full details for a specific issue including raw markdown content
 */

import { z } from 'zod';
import { readIssueFile } from '../utils/issues-reader.js';

// Input schema for the tool
export const GetIssueInputSchema = z.object({
  projectId: z.string().describe('Project identifier'),
  reviewId: z.string().uuid().describe('Review ID'),
  issueId: z.string().uuid().describe('Issue ID'),
});

// Output schema for the tool
export const GetIssueOutputSchema = z.object({
  id: z.string().uuid(),
  reviewId: z.string().uuid(),
  title: z.string(),
  severity: z.string(),
  resolved: z.boolean(),
  agentTypes: z.array(z.string()),
  elementMetadata: z
    .object({
      selector: z.string(),
      bounding_box: z.array(z.number()).optional(),
    })
    .optional(),
  markdown: z.string().describe('Raw markdown content for Claude to read'),
});

export type GetIssueInput = z.infer<typeof GetIssueInputSchema>;
export type GetIssueOutput = z.infer<typeof GetIssueOutputSchema>;

/**
 * Get full issue details including raw markdown content
 * Claude will read the markdown naturally to understand:
 * - Details section
 * - Agent Prompt section (actionable instructions)
 * - Ticket section (optional, rich user story format)
 */
export async function getIssue(input: GetIssueInput): Promise<GetIssueOutput> {
  // Validate input
  const validated = GetIssueInputSchema.parse(input);
  const { projectId, reviewId, issueId } = validated;

  // Read and parse the issue file
  const { frontmatter, markdown } = await readIssueFile(projectId, reviewId, issueId);

  return {
    id: frontmatter.id,
    reviewId: frontmatter.reviewId,
    title: frontmatter.title,
    severity: frontmatter.severity,
    resolved: frontmatter.resolved,
    agentTypes: frontmatter.agentTypes,
    elementMetadata: frontmatter.elementMetadata,
    markdown, // Raw markdown for Claude to read
  };
}
