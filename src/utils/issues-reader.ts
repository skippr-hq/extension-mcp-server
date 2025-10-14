/**
 * File reader utilities for Skippr .skippr directory structure
 * Handles reading issue markdown files from reviews
 */

import { readdir, readFile, stat } from 'fs/promises';
import { join } from 'path';
import { parseIssueFrontmatter, type ParsedIssueFrontmatter } from './frontmatter-parser.js';

/**
 * Find all issue files in the .skippr directory
 * @param workingDir - Working directory of the coding agent (project root containing .skippr folder)
 * @returns Array of issue file paths relative to workingDir
 */
export async function findAllIssues(workingDir: string): Promise<string[]> {
  const skipprDir = join(workingDir, '.skippr', 'reviews');
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
          issueFiles.push(join('.skippr', 'reviews', reviewDir.name, 'issues', filename));
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
 * @param workingDir - Working directory of the coding agent
 * @param reviewId - Review UUID
 * @param issueId - Issue UUID
 * @returns Parsed issue with frontmatter and raw markdown content
 */
export async function readIssueFile(
  workingDir: string,
  reviewId: string,
  issueId: string
): Promise<{ frontmatter: ParsedIssueFrontmatter; markdown: string }> {
  const filePath = join(workingDir, '.skippr', 'reviews', reviewId, 'issues', `${issueId}.md`);

  const content = await readFile(filePath, 'utf-8');
  const parsed = parseIssueFrontmatter(content);

  return {
    frontmatter: parsed.frontmatter,
    markdown: parsed.content, // Raw markdown for Claude to read
  };
}

