/**
 * Utility to get the working directory for Skippr files
 */

import { homedir } from 'os';

/**
 * Get the working directory where .skippr files should be stored
 * Currently defaults to user's home directory
 * @returns The working directory path
 */
export function getWorkingDirectory(): string {
  return homedir();
}