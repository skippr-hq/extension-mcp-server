/**
 * File reader utilities for Skippr .skippr directory structure
 * Handles reading issue markdown files from reviews
 */

import { readdir, readFile, stat } from 'fs/promises';
import { join } from 'path';
import { parseIssueFrontmatter, type ParsedIssueFrontmatter } from './frontmatter-parser.js';

/**
 * Find all issue files in the .skippr directory
 * @param rootDir - Project root directory containing .skippr folder
 * @returns Array of issue file paths relative to rootDir
 */
export async function findAllIssues(rootDir: string): Promise<string[]> {
  const skipprDir = join(rootDir, '.skippr', 'reviews');
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
 * @param rootDir - Project root directory
 * @param reviewId - Review UUID
 * @param issueId - Issue UUID
 * @returns Parsed issue with frontmatter and raw markdown content
 */
export async function readIssueFile(
  rootDir: string,
  reviewId: string,
  issueId: string
): Promise<{ frontmatter: ParsedIssueFrontmatter; markdown: string }> {
  const filePath = join(rootDir, '.skippr', 'reviews', reviewId, 'issues', `${issueId}.md`);

  const content = await readFile(filePath, 'utf-8');
  const parsed = parseIssueFrontmatter(content);

  return {
    frontmatter: parsed.frontmatter,
    markdown: parsed.content, // Raw markdown for Claude to read
  };
}

