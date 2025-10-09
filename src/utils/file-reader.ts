/**
 * File reader utilities for Skippr .skippr directory structure
 * Handles reading review metadata and issue markdown files
 */

import { readdir, readFile, stat } from 'fs/promises';
import { join } from 'path';
import { parseIssueFrontmatter, type ParsedIssueFrontmatter } from './frontmatter-parser.js';
import { ReviewMetadataSchema } from '../schemas/index.js';
import type { Review } from '../types/index.js';

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

/**
 * Read review metadata from metadata.json
 * @param rootDir - Project root directory
 * @param reviewId - Review UUID
 * @returns Parsed review metadata
 */
export async function readReviewMetadata(rootDir: string, reviewId: string): Promise<Review> {
  const filePath = join(rootDir, '.skippr', 'reviews', reviewId, 'metadata.json');

  const content = await readFile(filePath, 'utf-8');
  const data = JSON.parse(content);

  // Validate against schema
  return ReviewMetadataSchema.parse(data);
}

/**
 * List all review IDs in the .skippr directory
 * @param rootDir - Project root directory
 * @returns Array of review UUIDs
 */
export async function listReviews(rootDir: string): Promise<string[]> {
  const skipprDir = join(rootDir, '.skippr', 'reviews');

  try {
    await stat(skipprDir);
  } catch {
    return [];
  }

  const entries = await readdir(skipprDir, { withFileTypes: true });

  return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
}
