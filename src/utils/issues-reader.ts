/**
 * File reader utilities for Skippr .skippr directory structure
 * Handles reading issue markdown files from reviews
 */

import { readdir, readFile, stat } from 'fs/promises';
import { join } from 'path';
import { parseIssueFrontmatter, type ParsedIssueFrontmatter } from './frontmatter-parser.js';
import { getWorkingDirectory } from './working-directory.js';

/**
 * Find all issue files in the .skippr directory
 * @param projectId - Project identifier
 * @returns Array of issue file paths relative to .skippr directory
 */
export async function findAllIssues(projectId: string): Promise<string[]> {
  const skipprDir = join(getWorkingDirectory(), '.skippr', 'projects', projectId, 'reviews');
  const issueFiles: string[] = [];

  try {
    // Check if .skippr/reviews exists
    await stat(skipprDir);
  } catch {
    // .skippr directory doesn't exist
    return [];
  }

  // Read all review directories
  const reviewDirs = await readdir(skipprDir, { withFileTypes: true });

  for (const reviewDir of reviewDirs) {
    if (!reviewDir.isDirectory()) continue;

    const issuesDir = join(skipprDir, reviewDir.name, 'issues');

    try {
      const issueFilenames = await readdir(issuesDir);

      for (const filename of issueFilenames) {
        if (filename.endsWith('.md')) {
          issueFiles.push(join('.skippr', 'projects', projectId, 'reviews', reviewDir.name, 'issues', filename));
        }
      }
    } catch {
      // issues directory doesn't exist for this review, skip
      continue;
    }
  }

  return issueFiles;
}

/**
 * Read and parse a single issue file
 * @param projectId - Project identifier
 * @param reviewId - Review UUID
 * @param issueId - Issue UUID
 * @returns Parsed issue with frontmatter and raw markdown content
 */
export async function readIssueFile(
  projectId: string,
  reviewId: string,
  issueId: string
): Promise<{ frontmatter: ParsedIssueFrontmatter; markdown: string }> {
  const filePath = join(getWorkingDirectory(), '.skippr', 'projects', projectId, 'reviews', reviewId, 'issues', `${issueId}.md`);

  const content = await readFile(filePath, 'utf-8');
  const parsed = parseIssueFrontmatter(content);

  return {
    frontmatter: parsed.frontmatter,
    markdown: parsed.content, // Raw markdown for Claude to read
  };
}

