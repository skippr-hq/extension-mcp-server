import { describe, it, expect, vi } from 'vitest';
import { join } from 'path';

const FIXTURES_DIR = join(__dirname, '..', 'fixtures');

// Mock getWorkingDirectory to return fixtures path
vi.mock('../../src/utils/working-directory.js', () => ({
  getWorkingDirectory: () => FIXTURES_DIR
}));

// Import after mocking
const { listIssues } = await import('../../src/tools/list-issues.js');

const PROJECT_ID = 'test-project';

describe('list-issues tool', () => {
  it('should list all issues without filters', async () => {
    const result = await listIssues({ projectId: PROJECT_ID });

    expect(result.totalCount).toBe(3);
    expect(result.issues).toHaveLength(3);

    // Check first issue
    const issue1 = result.issues.find((i) => i.id === '7b8efc72-0122-4589-bbaa-07fb53ec0e26');
    expect(issue1).toBeDefined();
    expect(issue1?.title).toBe('Button Color Inconsistency');
    expect(issue1?.severity).toBe('medium');
    expect(issue1?.resolved).toBe(false);
    expect(issue1?.agentTypes).toEqual(['ux']);
  });

  it('should filter by reviewId', async () => {
    const result = await listIssues({
      projectId: PROJECT_ID,
      reviewId: '223e4567-e89b-12d3-a456-426614174001',
    });

    expect(result.totalCount).toBe(2);
    expect(result.issues.every((i) => i.reviewId === '223e4567-e89b-12d3-a456-426614174001')).toBe(true);
  });

  it('should filter by severity', async () => {
    const result = await listIssues({
      projectId: PROJECT_ID,
      severity: 'high',
    });

    expect(result.totalCount).toBe(1);
    expect(result.issues[0].severity).toBe('high');
    expect(result.issues[0].title).toBe('Missing Alt Text');
  });

  it('should filter by agentType', async () => {
    const result = await listIssues({
      projectId: PROJECT_ID,
      agentType: 'a11y',
    });

    expect(result.totalCount).toBe(1);
    expect(result.issues[0].agentTypes).toContain('a11y');
  });

  it('should filter by resolved status', async () => {
    const resultResolved = await listIssues({
      projectId: PROJECT_ID,
      resolved: true,
    });

    expect(resultResolved.totalCount).toBe(1);
    expect(resultResolved.issues[0].resolved).toBe(true);

    const resultUnresolved = await listIssues({
      projectId: PROJECT_ID,
      resolved: false,
    });

    expect(resultUnresolved.totalCount).toBe(2);
    expect(resultUnresolved.issues.every((i) => !i.resolved)).toBe(true);
  });

  it('should apply multiple filters', async () => {
    const result = await listIssues({
      projectId: PROJECT_ID,
      reviewId: '223e4567-e89b-12d3-a456-426614174001',
      resolved: false,
    });

    expect(result.totalCount).toBe(2);
    expect(result.issues.every((i) => i.reviewId === '223e4567-e89b-12d3-a456-426614174001')).toBe(
      true
    );
    expect(result.issues.every((i) => !i.resolved)).toBe(true);
  });

  it('should return empty array if no .skippr directory exists', async () => {
    const result = await listIssues({ projectId: 'nonexistent-project' });

    expect(result.totalCount).toBe(0);
    expect(result.issues).toEqual([]);
  });

  it('should return empty array if no issues match filters', async () => {
    const result = await listIssues({
      projectId: PROJECT_ID,
      severity: 'critical',
    });

    expect(result.totalCount).toBe(0);
    expect(result.issues).toEqual([]);
  });

  it('should handle issues with multiple agent types', async () => {
    const result = await listIssues({
      projectId: PROJECT_ID,
      agentType: 'content',
    });

    expect(result.totalCount).toBe(1);
    const issue = result.issues[0];
    expect(issue.agentTypes).toEqual(['content', 'pmm']);
    expect(issue.title).toBe('Headline Needs Improvement');
  });

  it('should validate input schema', async () => {
    await expect(
      listIssues({
        projectId: PROJECT_ID,
        reviewId: 'not-a-uuid',
      } as any)
    ).rejects.toThrow();

    await expect(
      listIssues({
        projectId: PROJECT_ID,
        severity: 'invalid',
      } as any)
    ).rejects.toThrow();
  });
});
