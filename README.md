# Skippr MCP Server

A Model Context Protocol (MCP) server that bridges Skippr's product review insights with AI coding agents. Receive issues from the Skippr browser extension via WebSocket and access them through MCP tools in your IDE.

## Features

- **Dual Transport Architecture**: Stdio MCP transport + WebSocket server in one process
- **Browser Extension Integration**: Receives issues from Skippr extension via WebSocket
- **MCP Tools**: List and retrieve Skippr issues in Claude Code, Cursor, Windsurf
- **Local File Storage**: Issues stored as markdown files in `.skippr` directory
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

### Claude Code (Recommended)

The easiest way to install in Claude Code:

```bash
# Install for local development
claude mcp add skippr \
  -e SKIPPR_ROOT_DIR="$(pwd)" \
  -e WS_PORT="4040" \
  -- npx -y tsx /absolute/path/to/skippr-mcp/src/server.ts

# Or use the built version
claude mcp add skippr \
  -e SKIPPR_ROOT_DIR="/path/to/your/project" \
  -e WS_PORT="4040" \
  -- node /absolute/path/to/skippr-mcp/dist/server.js
```

**Environment Variables:**
- `SKIPPR_ROOT_DIR` (required): Your project root directory where `.skippr/` folder will be created
- `WS_PORT` (optional): WebSocket server port, defaults to 4040

**Verify installation:**
```bash
claude mcp list
# Should show: skippr: npx - ✓ Connected
```

### Claude Desktop

Add to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**Linux**: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "skippr": {
      "command": "node",
      "args": ["/absolute/path/to/skippr-mcp/dist/server.js"],
      "env": {
        "SKIPPR_ROOT_DIR": "/path/to/your/project",
        "WS_PORT": "4040"
      }
    }
  }
}
```

### Cursor / Windsurf

Similar stdio-based configuration. Check your IDE's MCP documentation for the specific config file location.

## Available Tools

### `skippr_list_issues`

Lists all available Skippr issues with optional filtering.

**Parameters:**
- `reviewId` (optional): Filter by review UUID
- `severity` (optional): Filter by severity level (`critical`, `high`, `medium`, `low`, `info`)
- `agentType` (optional): Filter by agent type (`ux`, `a11y`, `pm`, `pmm`, `legal`, `content`, `users`)
- `resolved` (optional): Filter by resolved status (boolean)

> **Note**: `rootDir` is configured once via environment variable, not passed per tool call

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
- `reviewId` (required): Review UUID
- `issueId` (required): Issue UUID

> **Note**: `rootDir` is configured once via environment variable, not passed per tool call

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

Following the [BrowserMCP](https://github.com/BrowserMCP/mcp) pattern, this server runs two transports in a single Node.js process:

1. **Stdio Transport** (MCP): Communicates with AI coding agents (Claude Code, Cursor, etc.)
2. **WebSocket Server** (Port 4040): Receives issues from Skippr browser extension

**Data Flow:**
```
Skippr Extension → WebSocket → writes to .skippr/
Claude Code      → Stdio MCP → reads from .skippr/
```

Both transports share the same `.skippr/` directory via the filesystem, enabling seamless integration between issue discovery (extension) and issue resolution (AI agent).

**Key Components:**
- **Transport**: Stdio for MCP, WebSocket for extension
- **Tools**: MCP tools for listing and retrieving issues
- **Storage**: Local filesystem (`.skippr/reviews/{uuid}/issues/{uuid}.md`)
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