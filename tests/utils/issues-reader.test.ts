import { describe, it, expect } from 'vitest';
import { join } from 'path';
import { findAllIssues, readIssueFile } from '../../src/utils/issues-reader.js';

const FIXTURES_DIR = join(__dirname, '..', 'fixtures');

describe('file-reader', () => {
  describe('findAllIssues', () => {
    it('should find all issue files in .skippr directory', async () => {
      const issues = await findAllIssues(FIXTURES_DIR);

      expect(issues).toHaveLength(3);
      expect(issues).toContain('.skippr/reviews/223e4567-e89b-12d3-a456-426614174001/issues/7b8efc72-0122-4589-bbaa-07fb53ec0e26.md');
      expect(issues).toContain('.skippr/reviews/223e4567-e89b-12d3-a456-426614174001/issues/aaf21366-a1f7-4a89-81cf-6f4596565772.md');
      expect(issues).toContain('.skippr/reviews/223e4567-e89b-12d3-a456-426614174002/issues/00e2a583-dd11-4d19-ba94-67c536fbb554.md');
    });

    it('should return empty array if .skippr directory does not exist', async () => {
      const issues = await findAllIssues('/nonexistent/path');

      expect(issues).toEqual([]);
    });
  });

  describe('readIssueFile', () => {
    it('should read and parse an issue file', async () => {
      const result = await readIssueFile(FIXTURES_DIR, '223e4567-e89b-12d3-a456-426614174001', '7b8efc72-0122-4589-bbaa-07fb53ec0e26');

      expect(result.frontmatter.id).toBe('7b8efc72-0122-4589-bbaa-07fb53ec0e26');
      expect(result.frontmatter.reviewId).toBe('223e4567-e89b-12d3-a456-426614174001');
      expect(result.frontmatter.title).toBe('Button Color Inconsistency');
      expect(result.frontmatter.severity).toBe('medium');
      expect(result.frontmatter.agentTypes).toEqual(['ux']);
      expect(result.frontmatter.elementMetadata).toEqual({
        selector: 'button.secondary-cta',
        bounding_box: [100, 200, 150, 40],
      });

      expect(result.markdown).toContain('## Details');
      expect(result.markdown).toContain('secondary CTA buttons');
      expect(result.markdown).toContain('## Agent Prompt');
    });

    it('should throw error if file does not exist', async () => {
      await expect(readIssueFile(FIXTURES_DIR, '223e4567-e89b-12d3-a456-426614174001', 'nonexistent')).rejects.toThrow();
    });

    it('should read issue with multiple agent types', async () => {
      const result = await readIssueFile(FIXTURES_DIR, '223e4567-e89b-12d3-a456-426614174002', '00e2a583-dd11-4d19-ba94-67c536fbb554');

      expect(result.frontmatter.agentTypes).toEqual(['content', 'pmm']);
      expect(result.frontmatter.resolved).toBe(true);
    });
  });

});
