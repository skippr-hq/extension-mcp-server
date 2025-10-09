/**
 * Issues Writer - Receives issues from Skippr extension via WebSocket
 * and writes them to .skippr/reviews/{reviewId}/issues/{issueId}.md
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import matter from 'gray-matter';

interface WriteIssueMessage {
  type: string;
  reviewId: string;
  issueId: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved?: boolean;
  agentTypes: string[];
  elementMetadata?: {
    selector: string;
    bounding_box?: number[];
  };
  details: string;
  agentPrompt: string;
  ticket?: string;
  timestamp: number;
}

export function getSkipprRootDir(): string {
  const skipprRoot = process.env.SKIPPR_ROOT_DIR;
  if (skipprRoot && skipprRoot.trim() !== '') {
    return skipprRoot;
  }
  return process.cwd();
}

export async function writeIssue(message: WriteIssueMessage): Promise<void> {
  const rootDir = getSkipprRootDir();
  const skipprDir = path.join(rootDir, '.skippr');
  const reviewDir = path.join(skipprDir, 'reviews', message.reviewId);
  const issuesDir = path.join(reviewDir, 'issues');
  const issueFile = path.join(issuesDir, `${message.issueId}.md`);

  try {
    // Create directories if they don't exist
    await fs.promises.mkdir(issuesDir, { recursive: true });

    // Create frontmatter
    const frontmatter: any = {
      id: message.issueId,
      reviewId: message.reviewId,
      title: message.title,
      severity: message.severity,
      resolved: message.resolved ?? false,
      agentTypes: message.agentTypes,
    };

    if (message.elementMetadata) {
      frontmatter.elementMetadata = message.elementMetadata;
    }

    // Create markdown sections
    const sections = [
      '## Details',
      '',
      message.details,
      '',
      '## Agent Prompt',
      '',
      message.agentPrompt,
    ];

    if (message.ticket) {
      sections.push('', '## Ticket', '', message.ticket);
    }

    const markdown = sections.join('\n');

    // Create full file content with frontmatter
    const fileContent = matter.stringify(markdown, frontmatter);

    // Write to file
    await fs.promises.writeFile(issueFile, fileContent, 'utf8');
    console.log(`Issue saved to: ${issueFile}`);
  } catch (error) {
    console.error(`Failed to save issue ${message.issueId}:`, error);
    throw error;
  }
}

export function validateWriteIssueMessage(data: any): data is WriteIssueMessage {
  return (
    data &&
    typeof data === 'object' &&
    typeof data.type === 'string' &&
    typeof data.reviewId === 'string' &&
    typeof data.issueId === 'string' &&
    typeof data.title === 'string' &&
    typeof data.severity === 'string' &&
    Array.isArray(data.agentTypes) &&
    typeof data.details === 'string' &&
    typeof data.agentPrompt === 'string' &&
    typeof data.timestamp === 'number'
  );
}
