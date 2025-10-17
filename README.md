# @skippr/mcp-x-ray

MCP server for Skippr integration with AI coding agents.

[![npm version](https://img.shields.io/npm/v/@skippr/mcp-x-ray.svg)](https://www.npmjs.com/package/@skippr/mcp-x-ray)
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](LICENSE.md)

## ⚠️ Important: AI Coding Agents Only

This package is licensed exclusively for use with AI coding agents:

✅ **Supported**:
- Claude Code (Anthropic)
- Cursor
- Windsurf
- Continue
- Codeium
- Other MCP-compatible coding assistants

❌ **NOT Supported**:
- Claude Desktop
- ChatGPT Desktop
- General AI chat interfaces
- Web-based AI assistants

## Prerequisites

1. **Skippr Chrome Extension** (Required)
   - Install from: [Chrome Web Store](https://chrome.google.com/webstore/detail/dmbmdnppaoabphpkafbkdcbinkfnjpmh)
   - Must be running for issue synchronization
   - Enable the extension and log in to your Skippr account

2. **MCP-compatible coding agent**
   - Claude Code, Cursor, Windsurf, or similar
   - NOT compatible with general AI chat applications

## Installation

```bash
npm install -g @skippr/mcp-x-ray
```

Or use directly with `npx`:
```bash
npx @skippr/mcp-x-ray
```

## Configuration

### Claude Code (CLI)

After global installation:
```bash
claude mcp add skippr --transport stdio -- skippr-mcp-x-ray
```

Or using npx:
```bash
claude mcp add skippr --transport stdio -- npx @skippr/mcp-x-ray
```

With custom WebSocket port:
```bash
claude mcp add skippr --transport stdio -e WS_PORT="5050" -- skippr-mcp-x-ray
```

Verify installation:
```bash
claude mcp list
# Should show: skippr: skippr-mcp-x-ray - ✓ Connected
```

### Cursor

Add to your Cursor MCP settings:

```json
{
  "mcpServers": {
    "skippr": {
      "command": "skippr-mcp-x-ray",
      "env": {
        "WS_PORT": "4040"
      }
    }
  }
}
```

If installed locally in a project:
```json
{
  "mcpServers": {
    "skippr": {
      "command": "npx",
      "args": ["@skippr/mcp-x-ray"],
      "env": {
        "WS_PORT": "4040"
      }
    }
  }
}
```

### Windsurf

Similar to Cursor configuration. Add to your Windsurf MCP settings:

```json
{
  "mcpServers": {
    "skippr": {
      "command": "skippr-mcp-x-ray",
      "env": {
        "WS_PORT": "4040"
      }
    }
  }
}
```

## Available Tools

### `skippr_list_projects`

Lists all available project IDs from the .skippr/projects directory.

**Parameters:** None

**Returns:**
```json
{
  "projects": ["project-1", "project-2"],
  "totalCount": 2
}
```

### `skippr_list_issues`

Lists all available Skippr issues with optional filtering.

**Parameters:**
- `projectId` (required): Project identifier
- `reviewId` (optional): Filter by review UUID
- `severity` (optional): Filter by severity level (`critical`, `high`, `medium`, `low`, `info`)
- `agentType` (optional): Filter by agent type (`ux`, `a11y`, `pm`, `pmm`, `legal`, `content`, `users`)
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
- `projectId` (required): Project identifier
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
    └── projects/
        └── {projectId}/
            └── reviews/
                └── {review-uuid}/
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


## Environment Variables

- `WS_PORT` (optional): WebSocket server port for browser extension communication
  - Default: `4040`
  - Set to different port if 4040 is in use

## How It Works

The MCP server uses a dual-transport architecture:

1. **Stdio Transport**: Communicates with AI coding agents (Claude Code, Cursor, Windsurf)
2. **WebSocket Server**: Receives issues from the Skippr Chrome extension

**Data Flow:**
```
Skippr Extension → WebSocket → writes to .skippr/
Coding Agent     → Stdio MCP → reads from .skippr/
```

## Troubleshooting

### Extension Not Connecting

1. Ensure the Skippr Chrome extension is installed and enabled
2. Check that you're logged into your Skippr account in the extension
3. Verify the WebSocket port (default 4040) is not blocked by firewall
4. Try a different port by setting `WS_PORT` environment variable

### MCP Server Not Found

1. Verify global installation: `which skippr-mcp-x-ray`
2. If using npx, ensure @skippr/mcp-x-ray is installed
3. Check Node.js version: `node --version` (requires 18+)
4. Restart your coding agent after configuration changes

### Issues Not Appearing

1. Push issues from the Skippr extension first
2. Check `.skippr/` directory exists in your project root
3. Verify the MCP server is running: check your agent's MCP status
4. Look for errors in your coding agent's logs

## Support

For questions or technical support:
- Email: contact@skippr.ai
- Website: https://skippr.ai

## License

See [LICENSE.md](LICENSE.md) for full terms.

© 2025 Skippr - All Rights Reserved