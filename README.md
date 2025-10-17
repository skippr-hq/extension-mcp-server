# Skippr MCP X-Ray

**Skippr MCP X-Ray** bridges product review insights with AI coding agents, enabling developers to automatically fix UX, accessibility, and product issues using **natural language**.

The Model Context Protocol (MCP) is a [new, standardized protocol](https://modelcontextprotocol.io/introduction) designed to manage context between large language models (LLMs) and external systems. This MCP server integrates [Skippr](https://skippr.ai)'s product review platform with AI coding agents.

Skippr's MCP server acts as a bridge between natural language requests and product issues identified by Skippr's browser extension. Built upon MCP, it enables you to discover, understand, and fix issues such as UX inconsistencies, accessibility violations, and product quality problems seamlessly.

[![npm version](https://img.shields.io/npm/v/@skippr/mcp-x-ray.svg)](https://www.npmjs.com/package/@skippr/mcp-x-ray)
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](LICENSE.md)

## Key Features

* **Natural language interaction**: Fix product issues using intuitive, conversational commands with your AI coding agent.
* **Seamless integration**: Works with Claude Code, Cursor, Windsurf, and other MCP-compatible coding assistants.
* **Real-time issue sync**: Automatically receives issues from Skippr's browser extension as you review your product.
* **Multi-agent insights**: Access issues identified by specialized agents (UX, Accessibility, Product, Content, Legal).
* **Context-rich details**: Each issue includes actionable prompts, element metadata, and suggested fixes.
* **Project-based organization**: Manage multiple projects with isolated issue tracking.

For example, in Claude Code, Cursor, or any MCP client, you can use natural language to accomplish things like:

* `Show me all high-severity accessibility issues in my project`
* `List all unresolved UX issues for the latest review`
* `Get details for issue abc-123 and help me fix it`
* `What product issues do I have across all my projects?`

> **⚠️ Important: AI Coding Agents Only**
>
> This MCP server is licensed exclusively for use with AI coding agents (Claude Code, Cursor, Windsurf, Continue, Codeium). It is **NOT** compatible with general AI chat interfaces like Claude Desktop or ChatGPT Desktop.
>
> **Skippr MCP X-Ray is intended for local development and IDE integrations only.** Always review and authorize actions requested by the LLM before execution.

## Prerequisites

Before setting up the Skippr MCP server, ensure you have:

* An MCP Client application (Claude Code, Cursor, Windsurf, Continue, or Codeium)
* A [Skippr account](https://skippr.ai)
* [Skippr Chrome Extension](https://chrome.google.com/webstore/detail/dmbmdnppaoabphpkafbkdcbinkfnjpmh) installed and configured
* **Node.js (>= v20.0.0) and npm**: Download from [nodejs.org](https://nodejs.org)

## Installation

### Global Installation (Recommended)

Install the MCP server globally to use across all projects:

```bash
npm install -g @skippr/mcp-x-ray
```

### NPX (No Installation)

Use directly with `npx` without installation:

```bash
npx @skippr/mcp-x-ray
```

## Setting up Skippr MCP X-Ray

### Claude Code (CLI)

Add the Skippr MCP server to your Claude Code configuration:

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

Add the following JSON configuration within the `mcpServers` section of your Cursor MCP settings:

**Global Installation:**

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

**Using NPX:**

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

Add the following configuration to your Windsurf MCP settings:

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

Or using npx:

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

### Continue, Codeium, and Other MCP Clients

Refer to your client's MCP configuration documentation and use one of the command patterns above. The server uses stdio transport and requires Node.js 20+.

## How It Works

The Skippr MCP X-Ray server uses a **dual-transport architecture**:

1. **Stdio Transport**: Communicates with AI coding agents via the Model Context Protocol
2. **WebSocket Server**: Receives real-time issue data from the Skippr browser extension

### Data Flow

```
┌─────────────────────┐         ┌──────────────────────┐
│ Skippr Extension    │         │  AI Coding Agent     │
│ (Browser)           │         │  (Claude Code, etc)  │
└──────────┬──────────┘         └──────────┬───────────┘
           │                               │
           │ WebSocket (Port 4040)         │ Stdio MCP
           │                               │
           v                               v
    ┌────────────────────────────────────────────┐
    │         Skippr MCP X-Ray Server            │
    │                                            │
    │  • Receives issues via WebSocket          │
    │  • Writes to .skippr/ directory           │
    │  • Exposes tools via MCP protocol         │
    └────────────────┬───────────────────────────┘
                     │
                     v
              ┌──────────────┐
              │  .skippr/    │
              │  projects/   │
              │  {id}/       │
              │  reviews/    │
              │  issues/     │
              └──────────────┘
```

### Workflow

1. **Review your product**: Use Skippr's browser extension to analyze your web application
2. **Push issues**: Extension sends identified issues to the local MCP server via WebSocket
3. **Server writes files**: Issues are stored as markdown files in `.skippr/projects/{id}/reviews/{id}/issues/`
4. **Ask your AI agent**: Use natural language to query, filter, and fix issues
5. **Agent uses MCP tools**: AI coding agent calls the MCP server's tools to read issue details
6. **Implement fixes**: AI agent helps you implement the suggested fixes in your codebase

## Features

### Supported Tools

The Skippr MCP X-Ray Server provides the following tools for interacting with product issues:

#### Project Management

* **`skippr_list_projects`**: Lists all available project IDs from your `.skippr/projects` directory.

#### Issue Discovery & Filtering

* **`skippr_list_issues`**: Lists all available Skippr issues with powerful filtering options:
  - Filter by `reviewId` to see issues from a specific review session
  - Filter by `severity` (critical, high, medium, low, info)
  - Filter by `agentType` (ux, a11y, pm, pmm, legal, content, users)
  - Filter by `resolved` status (true/false)

* **`skippr_get_issue`**: Retrieves full details for a specific issue including:
  - Complete markdown description with actionable prompts
  - Element metadata (CSS selectors, bounding boxes)
  - Severity level and agent classification
  - Resolution status

#### Extension Server Management

* **`skippr_extension_server_status`**: Check if the WebSocket server is running and view connection details
* **`skippr_restart_extension_server`**: Restart the WebSocket server on a different port if needed
* **`skippr_list_connected_extensions`**: View all connected browser extensions
* **`skippr_disconnect_extension`**: Disconnect a specific extension by ID

#### Real-time Communication

* **`skippr_send_to_extension`**: Send messages to a specific connected extension
* **`skippr_notify_project_extensions`**: Broadcast notifications to all extensions working on a project
* **`skippr_notify_all_extensions`**: Broadcast notifications to all connected extensions

#### Issue Verification

* **`skippr_verify_issue_fix`**: Request the browser extension to re-verify if an issue has been fixed (requires active extension connection)

## File Structure

Issues are organized in a project-based directory structure:

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

### Issue File Format

Each issue is stored as a markdown file with YAML frontmatter:

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
createdAt: 2025-01-15T10:30:00.000Z
updatedAt: 2025-01-15T10:30:00.000Z
---

## Details

The secondary CTA buttons use a pink color scheme that conflicts with the primary brand colors...

## Agent Prompt

**Task**: Update the CSS for the `.secondary-cta` class to use the correct brand color.

**Steps**:
1. Change the `background-color` from `#ff69b4` to `#2563eb`
2. Update the hover state to use `#1d4ed8`
3. Ensure contrast ratio meets WCAG AA standards

## Ticket

### User Story

As a user, I want consistent button colors throughout the application so that I can easily identify primary and secondary actions.

### Acceptance Criteria

- [ ] Secondary CTA buttons use the correct brand color (#2563eb)
- [ ] Hover states are visually distinct
- [ ] Color contrast meets accessibility standards
```

## Configuration

### Environment Variables

* **`WS_PORT`** (optional): WebSocket server port for browser extension communication
  - Default: `4040`
  - Set to a different port if 4040 is already in use
  - Example: `WS_PORT=5050 skippr-mcp-x-ray`

## Troubleshooting

### Extension Not Connecting

1. Ensure the Skippr Chrome extension is installed and enabled
2. Verify you're logged into your Skippr account in the extension
3. Check that the WebSocket port (default 4040) is not blocked by a firewall
4. Try a different port by setting the `WS_PORT` environment variable
5. Check the MCP server logs for WebSocket connection attempts

### MCP Server Not Found

1. Verify global installation: `which skippr-mcp-x-ray`
2. If using npx, ensure `@skippr/mcp-x-ray` is accessible
3. Check Node.js version: `node --version` (requires v20.0.0 or higher)
4. Restart your coding agent after making configuration changes
5. Verify your MCP configuration file syntax is correct

### Issues Not Appearing

1. Push issues from the Skippr extension first (use the extension to review your product)
2. Check that the `.skippr/` directory exists in your project root
3. Verify the MCP server is running: check your agent's MCP status
4. Look for errors in your coding agent's logs
5. Try running `skippr_list_projects` to verify the server is responding

### Port Already in Use

If you see "Port already in use" errors:

1. Change the WebSocket port by setting `WS_PORT` environment variable
2. Use the `skippr_restart_extension_server` tool with a different port
3. Identify and stop any other service using port 4040

## Example Usage

### Discovering Issues

```
You: "Show me all the issues Skippr found in my project"

AI: I'll list all issues for you.
[Calls skippr_list_projects to find project IDs]
[Calls skippr_list_issues with the project ID]

AI: I found 12 issues across your project:
- 3 high-severity accessibility issues
- 5 medium-severity UX issues
- 4 low-severity content issues

Would you like me to show you the high-severity issues first?
```

### Filtering Issues

```
You: "What are the unresolved accessibility issues?"

AI: Let me filter for unresolved accessibility issues.
[Calls skippr_list_issues with agentType=a11y and resolved=false]

AI: I found 3 unresolved accessibility issues:
1. Missing alt text on product images (high severity)
2. Insufficient color contrast on warning buttons (medium severity)
3. Form inputs missing labels (high severity)

Would you like me to help fix these?
```

### Fixing Issues

```
You: "Help me fix the missing alt text issue"

AI: I'll get the details for that issue.
[Calls skippr_get_issue with the issue ID]

AI: The issue affects images in the product gallery. The images are located at:
- Selector: .product-gallery img
- Files: src/components/ProductGallery.tsx

I'll add descriptive alt text to all product images...
[AI implements the fix]
```

## Support

For questions, technical support, or feedback:

* **Email**: contact@skippr.ai
* **Website**: [https://skippr.ai](https://skippr.ai)

## License

This software is proprietary and licensed exclusively for use with AI coding agents.

See [LICENSE.md](LICENSE.md) for full terms.

© 2025 Skippr - All Rights Reserved
