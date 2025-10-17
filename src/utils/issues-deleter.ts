/**
 * File operations utilities for managing issue files
 */

import { unlink } from 'fs/promises';
import { join } from 'path';
import { getWorkingDirectory } from './working-directory.js';

/**
 * Delete an issue file from the filesystem (best effort)
 * Silently handles errors to avoid disrupting the flow
 */
export async function deleteIssueFile(
  projectId: string,
  reviewId: string,
  issueId: string
): Promise<void> {
  try {
    const filePath = join(
      getWorkingDirectory(),
      '.skippr',
      'projects',
      projectId,
      'reviews',
      reviewId,
      'issues',
      `${issueId}.md`
    );

    await unlink(filePath);
    console.log(`Deleted issue file: ${issueId}.md`);
  } catch (error) {
    // Log for debugging but don't throw - this is best effort
    console.log(`Could not delete issue file ${issueId}.md:`, error instanceof Error ? error.message : 'Unknown error');
  }
}