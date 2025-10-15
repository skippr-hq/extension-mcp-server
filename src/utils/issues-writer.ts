/**
 * Issues Writer - Receives issues from Skippr extension via WebSocket
 * and writes them to .skippr/reviews/{reviewId}/issues/{issueId}.md
 */

import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import matter from 'gray-matter';
import type { WriteIssueMessage } from '../types/index.js';
import { getWorkingDirectory } from './working-directory.js';

export async function writeIssue(projectId: string, message: WriteIssueMessage): Promise<void> {
  const skipprDir = join(getWorkingDirectory(), '.skippr', 'projects', projectId);
  const reviewDir = join(skipprDir, 'reviews', message.reviewId);
  const issuesDir = join(reviewDir, 'issues');
  const issueFile = join(issuesDir, `${message.issueId}.md`);

  try {
    // Create directories if they don't exist
    await mkdir(issuesDir, { recursive: true });

    // Create frontmatter with timestamps
    const now = new Date().toISOString();
    const frontmatter: any = {
      id: message.issueId,
      reviewId: message.reviewId,
      title: message.title,
      severity: message.severity,
      resolved: message.resolved ?? false,
      agentTypes: message.agentTypes,
      createdAt: now,
      updatedAt: now,
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
    await writeFile(issueFile, fileContent, 'utf8');
    console.log(`Issue saved to: ${issueFile}`);
  } catch (error) {
    console.error(`Failed to save issue ${message.issueId}:`, error);
    throw error;
  }
}
