/**
 * Frontmatter parser for Skippr issue files
 * Parses only the YAML frontmatter, returns raw markdown content
 */

import matter from 'gray-matter';
import { IssueFrontmatterSchema } from '../schemas/index.js';

export interface ParsedIssueFrontmatter {
  id: string;
  reviewId: string;
  title: string;
  severity: string;
  resolved: boolean;
  category?: string;
  elementMetadata?: {
    selector: string;
    bounding_box?: number[];
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface ParsedIssueFile {
  frontmatter: ParsedIssueFrontmatter;
  content: string; // Raw markdown content after frontmatter
}

/**
 * Parse a markdown file with frontmatter
 * Returns validated frontmatter and raw markdown content
 * @param markdownString - Raw markdown content with YAML frontmatter
 * @returns Parsed frontmatter and raw content
 * @throws Error if frontmatter is invalid
 */
export function parseIssueFrontmatter(markdownString: string): ParsedIssueFile {
  // Parse frontmatter and content using gray-matter
  const { data, content } = matter(markdownString);

  // Validate frontmatter against schema
  const frontmatter = IssueFrontmatterSchema.parse(data);

  return {
    frontmatter,
    content, // Return raw markdown - Claude will read it naturally
  };
}
