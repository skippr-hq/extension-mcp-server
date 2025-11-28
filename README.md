# Skippr Extension MCP Server

[![Website](https://img.shields.io/badge/Website-skippr.ai-blue)](https://skippr.ai) [![NPM Version](https://img.shields.io/npm/v/%40skippr%2Fextension-mcp-server?color=red)](https://www.npmjs.com/package/@skippr/extension-mcp-server) [![MIT licensed](https://img.shields.io/npm/l/%40skippr%2Fextension-mcp-server)](./LICENSE)

**Skippr Extension MCP Server** acts as a bridge between product issues identified by Skippr's browser extension. Built upon MCP, it enables your coding agent to discover, understand, and fix issues such as UX inconsistencies, accessibility violations, and product quality problems seamlessly.

## Key Features

* **Natural language interaction**: Fix product issues using intuitive, conversational commands with your AI coding agent.
* **Seamless integration**: Works with Claude Code, Cursor, Copilot, and other MCP-compatible coding assistants.
* **Real-time issue sync**: Automatically receives issues from Skippr's browser extension as you review your product.
* **AI-powered reviews**: Get insights from specialized AI agents that review your product like a PM, designer, content strategist, and accessibility expert would.
* **Context-rich details**: Each issue includes actionable prompts, element metadata, and suggested fixes.
* **Project-based organization**: Manage multiple projects with isolated issue tracking.

## Prerequisites

Before setting up the Skippr MCP server, ensure you have:

* An MCP Coding Agent Client application (Claude Code, Cursor, VS Code, etc.)
* Node.js >= v22.x
* [Skippr Chrome Extension](https://chrome.google.com/webstore/detail/dmbmdnppaoabphpkafbkdcbinkfnjpmh) installed and configured

## Installation

<details>
<summary><b>Install in Claude Code</b></summary>

Run this command in your terminal. See [Claude Code MCP docs](https://docs.anthropic.com/en/docs/claude-code/mcp) for more info.

#### Claude Code Local Server Connection

```sh
claude mcp add skippr-extension-mcp -- npx -y @skippr/extension-mcp-server
```

After installation, the Skippr Extension MCP server will be available in your Claude Code sessions. You can start using natural language commands to interact with your product issues.

</details>

<details>
<summary><b>Install in Cursor</b></summary>

Go to: `Settings` -> `Cursor Settings` -> `MCP` -> `Add new global MCP server`

Paste the following configuration into your Cursor `~/.cursor/mcp.json` file. You may also install in a specific project by creating `.cursor/mcp.json` in your project folder. See [Cursor MCP docs](https://docs.cursor.com/context/model-context-protocol) for more info.

#### Cursor Local Server Connection

```json
{
  "mcpServers": {
    "skippr-extension-mcp": {
      "command": "npx",
      "args": ["-y", "@skippr/extension-mcp-server"]
    }
  }
}
```

After adding the configuration, restart Cursor to activate the MCP server.

</details>

<details>
<summary><b>Install in VS Code + Copilot</b></summary>

Add the following to your VS Code `settings.json` file (accessible via Command Palette > `Preferences: Open User Settings (JSON)`). See [VS Code MCP docs](https://code.visualstudio.com/docs/copilot/chat/mcp-servers) for more info.

```json
"mcp": {
  "servers": {
    "skippr-extension-mcp": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@skippr/extension-mcp-server"]
    }
  }
}
```

After adding the configuration, reload VS Code to activate the MCP server.

</details>

## Usage Examples

Once installed, interact with Skippr using natural language commands in your coding assistant:

* `Show me all high-severity accessibility issues in my project`
* `List all unresolved UX issues for the latest review`
* `Get details for issue abc-123 and help me fix it`
* `What product issues do I have across all my projects?`

## Support

For questions, technical support, or feedback:

* **Email**: contact@skippr.ai
* **Website**: [https://skippr.ai](https://skippr.ai)


© 2025 Skippr - Released under MIT License
