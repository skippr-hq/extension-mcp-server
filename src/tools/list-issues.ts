/**
 * MCP tool: skippr_list_issues
 * Lists all available issues from .skippr directory
 */

import { z } from 'zod';
import { findAllIssues, readIssueFile } from '../utils/issues-reader.js';
import { IssueSeveritySchema, CategorySchema } from '../schemas/index.js';
import type { IssueSummary } from '../types/index.js';

// Input schema for the tool
export const ListIssuesInputSchema = z.object({
  projectId: z.string().describe('Project identifier'),
  reviewId: z.string().uuid().optional().describe('Filter by review ID'),
  severity: IssueSeveritySchema.optional().describe('Filter by severity level'),
  category: CategorySchema.optional().describe('Filter by category'),
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
      category: CategorySchema.optional(),
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
  const { projectId, reviewId, severity, category, resolved } = validated;

  // Find all issue file paths
  const issueFiles = await findAllIssues(projectId);

  // Read and parse each issue file
  const issues: IssueSummary[] = [];

  for (const filePath of issueFiles) {
    // Extract reviewId and issueId from path
    // Path format: .skippr/projects/{projectId}/reviews/{reviewId}/issues/{issueId}.md
    const pathParts = filePath.split('/');
    const fileReviewId = pathParts[4]; // reviews/{reviewId}
    const fileName = pathParts[6]; // {issueId}.md
    const fileIssueId = fileName.replace('.md', '');

    try {
      const { frontmatter } = await readIssueFile(projectId, fileReviewId, fileIssueId);

      // Apply filters
      if (reviewId && frontmatter.reviewId !== reviewId) continue;
      if (severity && frontmatter.severity !== severity) continue;
      if (category && frontmatter.category !== category) continue;
      if (resolved !== undefined && frontmatter.resolved !== resolved) continue;

      // Add to results
      issues.push({
        id: frontmatter.id,
        reviewId: frontmatter.reviewId,
        title: frontmatter.title,
        severity: frontmatter.severity as IssueSummary['severity'],
        resolved: frontmatter.resolved,
        category: frontmatter.category as IssueSummary['category'],
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
