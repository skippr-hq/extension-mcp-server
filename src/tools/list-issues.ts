/**
 * MCP tool: skippr_list_issues
 * Lists all available issues from .skippr directory
 */

import { z } from 'zod';
import { findAllIssues, readIssueFile } from '../utils/issues-reader.js';
import { IssueSeveritySchema, AgentTypeSchema } from '../schemas/index.js';
import type { IssueSummary } from '../types/index.js';

// Input schema for the tool
export const ListIssuesInputSchema = z.object({
  rootDir: z.string().describe('Project root directory containing .skippr folder'),
  reviewId: z.string().uuid().optional().describe('Filter by review ID'),
  severity: IssueSeveritySchema.optional().describe('Filter by severity level'),
  agentType: AgentTypeSchema.optional().describe('Filter by agent type'),
  resolved: z.boolean().optional().describe('Filter by resolved status'),
});

// Output schema for the tool
export const ListIssuesOutputSchema = z.object({
  issues: z.array(
    z.object({
      id: z.string().uuid(),
      reviewId: z.string().uuid(),
      title: z.string(),
      severity: IssueSeveritySchema,
      resolved: z.boolean(),
      agentTypes: z.array(AgentTypeSchema),
    })
  ),
  totalCount: z.number(),
});

export type ListIssuesInput = z.infer<typeof ListIssuesInputSchema>;
export type ListIssuesOutput = z.infer<typeof ListIssuesOutputSchema>;

/**
 * List all issues with optional filtering
 * Returns lightweight summaries for browsing
 */
export async function listIssues(input: ListIssuesInput): Promise<ListIssuesOutput> {
  // Validate input
  const validated = ListIssuesInputSchema.parse(input);
  const { rootDir, reviewId, severity, agentType, resolved } = validated;

  // Find all issue file paths
  const issueFiles = await findAllIssues(rootDir);

  // Read and parse each issue file
  const issues: IssueSummary[] = [];

  for (const filePath of issueFiles) {
    // Extract reviewId and issueId from path
    // Path format: .skippr/reviews/{reviewId}/issues/{issueId}.md
    const pathParts = filePath.split('/');
    const fileReviewId = pathParts[2]; // reviews/{reviewId}
    const fileName = pathParts[4]; // {issueId}.md
    const fileIssueId = fileName.replace('.md', '');

    try {
      const { frontmatter } = await readIssueFile(rootDir, fileReviewId, fileIssueId);

      // Apply filters
      if (reviewId && frontmatter.reviewId !== reviewId) continue;
      if (severity && frontmatter.severity !== severity) continue;
      if (agentType && !frontmatter.agentTypes.includes(agentType)) continue;
      if (resolved !== undefined && frontmatter.resolved !== resolved) continue;

      // Add to results
      issues.push({
        id: frontmatter.id,
        reviewId: frontmatter.reviewId,
        title: frontmatter.title,
        severity: frontmatter.severity as IssueSummary['severity'],
        resolved: frontmatter.resolved,
        agentTypes: frontmatter.agentTypes as IssueSummary['agentTypes'],
      });
    } catch (error) {
      // Skip files that can't be parsed
      console.error(`Failed to parse issue file: ${filePath}`, error);
      continue;
    }
  }

  return {
    issues,
    totalCount: issues.length,
  };
}
