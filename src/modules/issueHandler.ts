import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

interface ApplyFixMessage {
  type: string;
  issueId: string;
  agentPrompt: string;
  timestamp: number;
}

export function getSkipprRootDir(): string {
  const skipprRoot = process.env.SKIPPR_ROOT_DIR;
  if (skipprRoot && skipprRoot.trim() !== '') {
    return path.join(skipprRoot, '.skippr');
  }
  return path.join(os.homedir(), '.skippr');
}

export async function handleIssueMessage(message: ApplyFixMessage): Promise<void> {
  const rootDir = getSkipprRootDir();
  console.log("got skippr root dir: ", rootDir)
  const issuesDir = path.join(rootDir, 'issues', message.issueId);
  const issueFile = path.join(issuesDir, 'issue.md');

  try {
    // Create directory if it doesn't exist
    await fs.promises.mkdir(issuesDir, { recursive: true });

    // Format timestamp
    const date = new Date(message.timestamp);
    const formattedTimestamp = date.toISOString();

    // Create markdown content
    const markdownContent = `# Issue: ${message.issueId}

**Type**: ${message.type}
**Timestamp**: ${formattedTimestamp}

## Agent Prompt

${message.agentPrompt}
`;

    // Write to file
    await fs.promises.writeFile(issueFile, markdownContent, 'utf8');
    console.log(`Issue saved to: ${issueFile}`);
  } catch (error) {
    console.error(`Failed to save issue ${message.issueId}:`, error);
    throw error;
  }
}

export function validateMessage(data: any): data is ApplyFixMessage {
  return (
    data &&
    typeof data === 'object' &&
    typeof data.type === 'string' &&
    typeof data.issueId === 'string' &&
    typeof data.agentPrompt === 'string' &&
    typeof data.timestamp === 'number'
  );
}