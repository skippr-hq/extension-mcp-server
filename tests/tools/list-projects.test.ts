import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { join } from 'path';
import { mkdir, rm, writeFile, unlink } from 'fs/promises';
import { listProjects } from '../../src/tools/list-projects.js';
import { getWorkingDirectory } from '../../src/utils/working-directory.js';

describe('list-projects tool', () => {
  const testProjectsDir = join(getWorkingDirectory(), '.skippr', 'projects');
  const testProjects = ['project-1', 'project-2', 'project-3'];

  beforeEach(async () => {
    // Create test project directories
    for (const projectId of testProjects) {
      await mkdir(join(testProjectsDir, projectId), { recursive: true });
    }
  });

  afterEach(async () => {
    // Clean up test directories
    for (const projectId of testProjects) {
      try {
        await rm(join(testProjectsDir, projectId), { recursive: true, force: true });
      } catch {
        // Ignore errors if directory doesn't exist
      }
    }
  });

  it('should list all project IDs', async () => {
    const result = await listProjects();

    expect(result.totalCount).toBeGreaterThanOrEqual(3);
    expect(result.projects).toContain('project-1');
    expect(result.projects).toContain('project-2');
    expect(result.projects).toContain('project-3');
  });

  it('should return empty array if no projects exist', async () => {
    // Remove all test projects
    for (const projectId of testProjects) {
      await rm(join(testProjectsDir, projectId), { recursive: true, force: true });
    }

    const result = await listProjects();

    // May have other projects in the directory, but our test projects should be gone
    expect(result.projects).not.toContain('project-1');
    expect(result.projects).not.toContain('project-2');
    expect(result.projects).not.toContain('project-3');
  });

  it('should only return directories, not files', async () => {
    // Create a file in the projects directory (should be ignored)
    await writeFile(join(testProjectsDir, 'not-a-project.txt'), 'test content');

    const result = await listProjects();

    expect(result.projects).not.toContain('not-a-project.txt');
    expect(result.projects).toContain('project-1');

    // Clean up the test file
    await unlink(join(testProjectsDir, 'not-a-project.txt'));
  });

  it('should return empty array if .skippr/projects does not exist', async () => {
    try {
      await rm(testProjectsDir, { recursive: true, force: true });

      const result = await listProjects();

      expect(result.totalCount).toBe(0);
      expect(result.projects).toEqual([]);
    } finally {
      // Restore the directory for other tests
      await mkdir(testProjectsDir, { recursive: true });
      for (const projectId of testProjects) {
        await mkdir(join(testProjectsDir, projectId), { recursive: true });
      }
    }
  });
});