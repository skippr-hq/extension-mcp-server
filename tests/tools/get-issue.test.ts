import { describe, it, expect, vi } from 'vitest';
import { join } from 'path';

const FIXTURES_DIR = join(__dirname, '..', 'fixtures');

// Mock getWorkingDirectory to return fixtures path
vi.mock('../../src/utils/working-directory.js', () => ({
  getWorkingDirectory: () => FIXTURES_DIR
}));

// Import after mocking
const { getIssue } = await import('../../src/tools/get-issue.js');

const PROJECT_ID = 'test-project';

describe('get-issue tool', () => {
  it('should get full issue details with markdown', async () => {
    const result = await getIssue({
      projectId: PROJECT_ID,
      reviewId: '223e4567-e89b-12d3-a456-426614174001',
      issueId: '7b8efc72-0122-4589-bbaa-07fb53ec0e26',
    });

    expect(result.id).toBe('7b8efc72-0122-4589-bbaa-07fb53ec0e26');
    expect(result.reviewId).toBe('223e4567-e89b-12d3-a456-426614174001');
    expect(result.title).toBe('Button Color Inconsistency');
    expect(result.severity).toBe('medium');
    expect(result.resolved).toBe(false);
    expect(result.agentTypes).toEqual(['ux']);
    expect(result.elementMetadata).toEqual({
      selector: 'button.secondary-cta',
      bounding_box: [100, 200, 150, 40],
    });

    // Check markdown content is included
    expect(result.markdown).toContain('## Details');
    expect(result.markdown).toContain('secondary CTA buttons');
    expect(result.markdown).toContain('## Agent Prompt');
    expect(result.markdown).toContain('**Task**:');
  });

  it('should get issue without element metadata', async () => {
    const result = await getIssue({
      projectId: PROJECT_ID,
      reviewId: '223e4567-e89b-12d3-a456-426614174002',
      issueId: '00e2a583-dd11-4d19-ba94-67c536fbb554',
    });

    expect(result.id).toBe('00e2a583-dd11-4d19-ba94-67c536fbb554');
    expect(result.title).toBe('Headline Needs Improvement');
    expect(result.elementMetadata).toBeUndefined();
    expect(result.markdown).toContain('## Details');
  });

  it('should get issue with multiple agent types', async () => {
    const result = await getIssue({
      projectId: PROJECT_ID,
      reviewId: '223e4567-e89b-12d3-a456-426614174002',
      issueId: '00e2a583-dd11-4d19-ba94-67c536fbb554',
    });

    expect(result.agentTypes).toEqual(['content', 'pmm']);
  });

  it('should get resolved issue', async () => {
    const result = await getIssue({
      projectId: PROJECT_ID,
      reviewId: '223e4567-e89b-12d3-a456-426614174002',
      issueId: '00e2a583-dd11-4d19-ba94-67c536fbb554',
    });

    expect(result.resolved).toBe(true);
  });

  it('should throw error if issue file does not exist', async () => {
    await expect(
      getIssue({
        projectId: PROJECT_ID,
        reviewId: '223e4567-e89b-12d3-a456-426614174001',
        issueId: 'nonexistent-uuid-1234-5678-9012-123456789012',
      })
    ).rejects.toThrow();
  });

  it('should throw error if review does not exist', async () => {
    await expect(
      getIssue({
        projectId: PROJECT_ID,
        reviewId: 'nonexistent-uuid-1234-5678-9012-123456789012',
        issueId: '7b8efc72-0122-4589-bbaa-07fb53ec0e26',
      })
    ).rejects.toThrow();
  });

  it('should validate input schema', async () => {
    await expect(
      getIssue({
        projectId: PROJECT_ID,
        reviewId: 'not-a-uuid',
        issueId: '7b8efc72-0122-4589-bbaa-07fb53ec0e26',
      } as any)
    ).rejects.toThrow();

    await expect(
      getIssue({
        projectId: PROJECT_ID,
        reviewId: '223e4567-e89b-12d3-a456-426614174001',
        issueId: 'not-a-uuid',
      } as any)
    ).rejects.toThrow();
  });

  it('should preserve exact markdown formatting', async () => {
    const result = await getIssue({
      projectId: PROJECT_ID,
      reviewId: '223e4567-e89b-12d3-a456-426614174001',
      issueId: '7b8efc72-0122-4589-bbaa-07fb53ec0e26',
    });

    // Markdown should preserve bullet points and formatting
    expect(result.markdown).toContain('- Change the `border-color`');
    expect(result.markdown).toContain('- Change the `color`');
  });
});
