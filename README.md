# Skippr MCP Server

A Model Context Protocol (MCP) server that provides read-only access to Skippr product review issues stored in `.skippr` directories. This enables AI coding agents (Claude, Cursor, Windsurf) to read and analyze Skippr issues from your local project.

## Features

- **Read-Only MCP Tools**: List and retrieve Skippr issues via stdio transport
- **Local File Access**: Issues stored as markdown files in `.skippr` directory
- **Filtering Support**: Filter issues by review, severity, agent type, or resolved status
- **Type Safe**: Full TypeScript with Zod runtime validation
- **Test Coverage**: Comprehensive test suite with Vitest

## Installation

### Prerequisites
- Node.js 18 or higher
- npm or yarn

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd skippr-mcp
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

## Development

Run tests:
```bash
npm test
```

Type checking:
```bash
npm run typecheck
```

## Adding to MCP Clients

### Claude Desktop

Add to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**Linux**: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "skippr-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/skippr-mcp/dist/index.js"],
      "env": {}
    }
  }
}
```

### Other MCP Clients

Most MCP clients follow a similar configuration pattern:

```json
{
  "servers": [{
    "name": "skippr-mcp",
    "command": "node",
    "args": ["/absolute/path/to/skippr-mcp/dist/index.js"]
  }]
}
```

## Available Tools

### `skippr_list_issues`

Lists all available Skippr issues with optional filtering.

**Parameters:**
- `rootDir` (required): Project root directory containing `.skippr` folder
- `reviewId` (optional): Filter by review UUID
- `severity` (optional): Filter by severity level (`low`, `medium`, `high`, `critical`)
- `agentType` (optional): Filter by agent type (`ux`, `a11y`, `content`, `pmm`, `performance`, `seo`, `security`)
- `resolved` (optional): Filter by resolved status (boolean)

**Returns:**
```json
{
  "issues": [
    {
      "id": "uuid",
      "reviewId": "uuid",
      "title": "Issue title",
      "severity": "medium",
      "resolved": false,
      "agentTypes": ["ux"]
    }
  ],
  "totalCount": 1
}
```

### `skippr_get_issue`

Gets full details for a specific issue including raw markdown content.

**Parameters:**
- `rootDir` (required): Project root directory containing `.skippr` folder
- `reviewId` (required): Review UUID
- `issueId` (required): Issue UUID

**Returns:**
```json
{
  "id": "uuid",
  "reviewId": "uuid",
  "title": "Issue title",
  "severity": "medium",
  "resolved": false,
  "agentTypes": ["ux"],
  "elementMetadata": {
    "selector": "button.primary",
    "bounding_box": [100, 200, 150, 40]
  },
  "markdown": "## Details\n\nThe issue description...\n\n## Agent Prompt\n\nActionable instructions..."
}
```

## File Structure

```
project-root/
└── .skippr/
    └── reviews/
        └── {review-uuid}/
            ├── metadata.json
            └── issues/
                ├── {issue-uuid}.md
                └── ...
```

## Issue Markdown Format

Each issue file contains YAML frontmatter followed by markdown content:

```markdown
---
id: 7b8efc72-0122-4589-bbaa-07fb53ec0e26
reviewId: 223e4567-e89b-12d3-a456-426614174001
title: Button Color Inconsistency
severity: medium
resolved: false
agentTypes:
  - ux
elementMetadata:
  selector: button.secondary-cta
  bounding_box: [100, 200, 150, 40]
---

## Details

Description of the issue...

## Agent Prompt

**Task**: Actionable instructions for fixing the issue...

## Ticket

Optional rich user story format...
```


## Architecture

- **Transport**: stdio (standard MCP transport for local AI assistants)
- **Tools**: Read-only MCP tools for listing and retrieving issues
- **Storage**: Local filesystem (`.skippr` directory)
- **Validation**: Zod schemas for runtime type safety
- **Testing**: Vitest with comprehensive unit tests

## Testing

Run the test suite:
```bash
npm test
```

Run tests with coverage:
```bash
npm test -- --coverage
```

Test using MCP Inspector:
```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

## Troubleshooting

### Server won't start
- Ensure Node.js 18+ is installed: `node --version`
- Check that all dependencies are installed: `npm install`
- Verify the build completed: `npm run build`

### Client can't connect
- Verify the absolute path in your configuration
- Check file permissions on the dist directory
- Look for errors in the MCP client logs
- Restart your MCP client after configuration changes

## License

ISC