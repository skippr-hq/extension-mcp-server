/**
 * MCP tool: skippr_list_projects
 * Lists all available projects from .skippr/projects directory
 */

import { z } from 'zod';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import { getWorkingDirectory } from '../utils/working-directory.js';

// Output schema for the tool
export const ListProjectsOutputSchema = z.object({
  projects: z.array(z.string()),
  totalCount: z.number(),
});

export type ListProjectsOutput = z.infer<typeof ListProjectsOutputSchema>;

/**
 * List all project IDs
 * Returns array of project identifiers
 */
export async function listProjects(): Promise<ListProjectsOutput> {
  const skipprProjectsDir = join(getWorkingDirectory(), '.skippr', 'projects');
  const projects: string[] = [];

  try {
    // Check if .skippr/projects exists
    await stat(skipprProjectsDir);
  } catch {
    // .skippr/projects directory doesn't exist
    return {
      projects: [],
      totalCount: 0,
    };
  }

  // Read all project directories
  const projectDirs = await readdir(skipprProjectsDir, { withFileTypes: true });

  for (const projectDir of projectDirs) {
    if (projectDir.isDirectory()) {
      projects.push(projectDir.name);
    }
  }

  return {
    projects,
    totalCount: projects.length,
  };
}