import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { vol } from 'memfs';
import type { WriteIssueMessage } from '../../src/types/index.js';

// Mock fs/promises module BEFORE imports
vi.mock('fs/promises', async () => {
  const { vol } = await import('memfs');
  return vol.promises;
});

// Import after mocking
const { writeIssue } = await import('../../src/utils/issues-writer.js');
const { readIssueFile } = await import('../../src/utils/issues-reader.js');

describe('issues-writer', () => {
  const testRootDir = '/test/project';

  beforeEach(() => {
    vol.reset();
    vol.mkdirSync(testRootDir, { recursive: true });
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
        severity: 'medium',
        resolved: false,
        agentTypes: ['ux'],
        elementMetadata: {
          selector: 'button.secondary-cta',
          bounding_box: [100, 200, 150, 40],
        },
        details: 'The secondary CTA buttons use a pink color scheme.',
        agentPrompt: '**Task**: Update the CSS for the `.secondary-cta` class.',
        ticket: '## User Story\n\nAs a user, I want consistent button colors.',
        timestamp: Date.now(),
      };

      await writeIssue(testRootDir, message);

      // Verify file was created
      const issueFile = `${testRootDir}/.skippr/reviews/${message.reviewId}/issues/${message.issueId}.md`;
      expect(vol.existsSync(issueFile)).toBe(true);

      // Read and verify content using issues-reader
      const result = await readIssueFile(testRootDir, message.reviewId, message.issueId);

      expect(result.frontmatter.id).toBe(message.issueId);
      expect(result.frontmatter.reviewId).toBe(message.reviewId);
      expect(result.frontmatter.title).toBe(message.title);
      expect(result.frontmatter.severity).toBe(message.severity);
      expect(result.frontmatter.resolved).toBe(false);
      expect(result.frontmatter.agentTypes).toEqual(['ux']);
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
        agentTypes: ['a11y'],
        details: 'Simple issue details.',
        agentPrompt: 'Simple instructions.',
        timestamp: Date.now(),
      };

      await writeIssue(testRootDir, message);

      const result = await readIssueFile(testRootDir, message.reviewId, message.issueId);

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
        severity: 'info',
        agentTypes: ['pm'],
        details: 'Test details',
        agentPrompt: 'Test prompt',
        timestamp: Date.now(),
      };

      await writeIssue(testRootDir, message);

      // Verify directory structure was created
      expect(vol.existsSync(`${testRootDir}/.skippr/reviews/${message.reviewId}/issues`)).toBe(true);
    });

    it('should add timestamps to frontmatter', async () => {
      const beforeWrite = new Date().toISOString();

      const message: WriteIssueMessage = {
        type: 'write_issue',
        reviewId: '223e4567-e89b-12d3-a456-426614174001',
        issueId: '7b8efc72-0122-4589-bbaa-07fb53ec0e26',
        title: 'Test',
        severity: 'low',
        agentTypes: ['ux'],
        details: 'Test',
        agentPrompt: 'Test',
        timestamp: Date.now(),
      };

      await writeIssue(testRootDir, message);

      const afterWrite = new Date().toISOString();
      const result = await readIssueFile(testRootDir, message.reviewId, message.issueId);

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
        severity: 'medium',
        agentTypes: ['ux'],
        details: 'Details with **bold** and *italic*.\n\n- Bullet 1\n- Bullet 2',
        agentPrompt: '**Task**: Fix it\n\nSteps:\n1. Step one\n2. Step two',
        timestamp: Date.now(),
      };

      await writeIssue(testRootDir, message);

      const result = await readIssueFile(testRootDir, message.reviewId, message.issueId);

      expect(result.markdown).toContain('**bold**');
      expect(result.markdown).toContain('*italic*');
      expect(result.markdown).toContain('- Bullet 1');
      expect(result.markdown).toContain('1. Step one');
    });

    it('should handle multiple agent types', async () => {
      const message: WriteIssueMessage = {
        type: 'write_issue',
        reviewId: '223e4567-e89b-12d3-a456-426614174001',
        issueId: '7b8efc72-0122-4589-bbaa-07fb53ec0e26',
        title: 'Multi-agent Issue',
        severity: 'high',
        agentTypes: ['ux', 'a11y', 'content'],
        details: 'Issue found by multiple agents.',
        agentPrompt: 'Instructions for multiple agents.',
        timestamp: Date.now(),
      };

      await writeIssue(testRootDir, message);

      const result = await readIssueFile(testRootDir, message.reviewId, message.issueId);

      expect(result.frontmatter.agentTypes).toEqual(['ux', 'a11y', 'content']);
    });

    it('should throw error on write failure', async () => {
      // Make directory read-only to cause write failure
      const message: WriteIssueMessage = {
        type: 'write_issue',
        reviewId: '223e4567-e89b-12d3-a456-426614174001',
        issueId: '7b8efc72-0122-4589-bbaa-07fb53ec0e26',
        title: 'Test',
        severity: 'low',
        agentTypes: ['ux'],
        details: 'Test',
        agentPrompt: 'Test',
        timestamp: Date.now(),
      };

      // Create directory first
      await writeIssue(testRootDir, message);

      // Mock writeFile to throw error
      const originalWriteFile = vol.promises.writeFile;
      vol.promises.writeFile = vi.fn().mockRejectedValue(new Error('Write failed'));

      await expect(writeIssue(testRootDir, message)).rejects.toThrow('Write failed');

      // Restore
      vol.promises.writeFile = originalWriteFile;
    });
  });

});
