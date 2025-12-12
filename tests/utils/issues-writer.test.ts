import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { vol } from 'memfs';
import type { WriteIssueMessage } from '../../src/types/index.js';

// Mock fs/promises module BEFORE imports
vi.mock('fs/promises', async () => {
  const { vol } = await import('memfs');
  return vol.promises;
});

// Mock getWorkingDirectory to return test path
vi.mock('../../src/utils/working-directory.js', () => ({
  getWorkingDirectory: () => '/test'
}));

// Import after mocking
const { writeIssue } = await import('../../src/utils/issues-writer.js');
const { readIssueFile } = await import('../../src/utils/issues-reader.js');

describe('issues-writer', () => {
  const testProjectId = 'test-project';
  const testWorkingDir = '/test';

  beforeEach(() => {
    vol.reset();
    vol.mkdirSync(testWorkingDir, { recursive: true });
  });

  afterEach(() => {
    vol.reset();
  });

  describe('writeIssue', () => {
    it('should write issue with all fields', async () => {
      const message: WriteIssueMessage = {
        type: 'write_issue',
        reviewId: '223e4567-e89b-12d3-a456-426614174001',
        issueId: '7b8efc72-0122-4589-bbaa-07fb53ec0e26',
        title: 'Button Color Inconsistency',
        severity: 'moderate',
        resolved: false,
        category: 'product_design',
        elementMetadata: {
          selector: 'button.secondary-cta',
          bounding_box: [100, 200, 150, 40],
        },
        details: 'The secondary CTA buttons use a pink color scheme.',
        agentPrompt: '**Task**: Update the CSS for the `.secondary-cta` class.',
        ticket: '## User Story\n\nAs a user, I want consistent button colors.',
        timestamp: Date.now(),
      };

      await writeIssue(testProjectId, message);

      // Verify file was created
      const issueFile = `${testWorkingDir}/.skippr/projects/${testProjectId}/reviews/${message.reviewId}/issues/${message.issueId}.md`;
      expect(vol.existsSync(issueFile)).toBe(true);

      // Read and verify content using issues-reader
      const result = await readIssueFile(testProjectId, message.reviewId, message.issueId);

      expect(result.frontmatter.id).toBe(message.issueId);
      expect(result.frontmatter.reviewId).toBe(message.reviewId);
      expect(result.frontmatter.title).toBe(message.title);
      expect(result.frontmatter.severity).toBe(message.severity);
      expect(result.frontmatter.resolved).toBe(false);
      expect(result.frontmatter.category).toBe('product_design');
      expect(result.frontmatter.elementMetadata).toEqual(message.elementMetadata);
      expect(result.frontmatter.createdAt).toBeDefined();
      expect(result.frontmatter.updatedAt).toBeDefined();

      // Verify markdown sections
      expect(result.markdown).toContain('## Details');
      expect(result.markdown).toContain(message.details);
      expect(result.markdown).toContain('## Agent Prompt');
      expect(result.markdown).toContain(message.agentPrompt);
      expect(result.markdown).toContain('## Ticket');
      expect(result.markdown).toContain(message.ticket);
    });

    it('should write issue without optional fields', async () => {
      const message: WriteIssueMessage = {
        type: 'write_issue',
        reviewId: '223e4567-e89b-12d3-a456-426614174001',
        issueId: '7b8efc72-0122-4589-bbaa-07fb53ec0e26',
        title: 'Simple Issue',
        severity: 'low',
        category: 'accessibility',
        details: 'Simple issue details.',
        agentPrompt: 'Simple instructions.',
        timestamp: Date.now(),
      };

      await writeIssue(testProjectId, message);

      const result = await readIssueFile(testProjectId, message.reviewId, message.issueId);

      expect(result.frontmatter.id).toBe(message.issueId);
      expect(result.frontmatter.resolved).toBe(false); // default value
      expect(result.frontmatter.elementMetadata).toBeUndefined();

      // Should not contain Ticket section
      expect(result.markdown).not.toContain('## Ticket');
    });

    it('should create nested directories recursively', async () => {
      const message: WriteIssueMessage = {
        type: 'write_issue',
        reviewId: 'new-review-uuid',
        issueId: 'new-issue-uuid',
        title: 'Test',
        severity: 'low',
        category: 'product_management',
        details: 'Test details',
        agentPrompt: 'Test prompt',
        timestamp: Date.now(),
      };

      await writeIssue(testProjectId, message);

      // Verify directory structure was created
      expect(vol.existsSync(`${testWorkingDir}/.skippr/projects/${testProjectId}/reviews/${message.reviewId}/issues`)).toBe(true);
    });

    it('should add timestamps to frontmatter', async () => {
      const beforeWrite = new Date().toISOString();

      const message: WriteIssueMessage = {
        type: 'write_issue',
        reviewId: '223e4567-e89b-12d3-a456-426614174001',
        issueId: '7b8efc72-0122-4589-bbaa-07fb53ec0e26',
        title: 'Test',
        severity: 'low',
        category: 'product_design',
        details: 'Test',
        agentPrompt: 'Test',
        timestamp: Date.now(),
      };

      await writeIssue(testProjectId, message);

      const afterWrite = new Date().toISOString();
      const result = await readIssueFile(testProjectId, message.reviewId, message.issueId);

      expect(result.frontmatter.createdAt).toBeDefined();
      expect(result.frontmatter.updatedAt).toBeDefined();

      // Timestamps should be within reasonable range
      expect(result.frontmatter.createdAt! >= beforeWrite).toBe(true);
      expect(result.frontmatter.createdAt! <= afterWrite).toBe(true);
      expect(result.frontmatter.updatedAt).toBe(result.frontmatter.createdAt);
    });

    it('should preserve exact markdown formatting', async () => {
      const message: WriteIssueMessage = {
        type: 'write_issue',
        reviewId: '223e4567-e89b-12d3-a456-426614174001',
        issueId: '7b8efc72-0122-4589-bbaa-07fb53ec0e26',
        title: 'Test',
        severity: 'moderate',
        category: 'product_design',
        details: 'Details with **bold** and *italic*.\n\n- Bullet 1\n- Bullet 2',
        agentPrompt: '**Task**: Fix it\n\nSteps:\n1. Step one\n2. Step two',
        timestamp: Date.now(),
      };

      await writeIssue(testProjectId, message);

      const result = await readIssueFile(testProjectId, message.reviewId, message.issueId);

      expect(result.markdown).toContain('**bold**');
      expect(result.markdown).toContain('*italic*');
      expect(result.markdown).toContain('- Bullet 1');
      expect(result.markdown).toContain('1. Step one');
    });

    it('should handle category field', async () => {
      const message: WriteIssueMessage = {
        type: 'write_issue',
        reviewId: '223e4567-e89b-12d3-a456-426614174001',
        issueId: '7b8efc72-0122-4589-bbaa-07fb53ec0e26',
        title: 'Product Design Issue',
        severity: 'critical',
        category: 'product_design',
        details: 'Issue found by product design analysis.',
        agentPrompt: 'Instructions for fixing the issue.',
        timestamp: Date.now(),
      };

      await writeIssue(testProjectId, message);

      const result = await readIssueFile(testProjectId, message.reviewId, message.issueId);

      expect(result.frontmatter.category).toBe('product_design');
    });

    it('should throw error on write failure', async () => {
      // Make directory read-only to cause write failure
      const message: WriteIssueMessage = {
        type: 'write_issue',
        reviewId: '223e4567-e89b-12d3-a456-426614174001',
        issueId: '7b8efc72-0122-4589-bbaa-07fb53ec0e26',
        title: 'Test',
        severity: 'low',
        category: 'product_design',
        details: 'Test',
        agentPrompt: 'Test',
        timestamp: Date.now(),
      };

      // Create directory first
      await writeIssue(testProjectId, message);

      // Mock writeFile to throw error
      const originalWriteFile = vol.promises.writeFile;
      vol.promises.writeFile = vi.fn().mockRejectedValue(new Error('Write failed'));

      await expect(writeIssue(testProjectId, message)).rejects.toThrow('Write failed');

      // Restore
      vol.promises.writeFile = originalWriteFile;
    });
  });

});
