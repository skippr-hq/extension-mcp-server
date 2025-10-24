# Skippr Extension MCP Server

**Skippr Extension MCP Server** acts as a bridge between product issues identified by Skippr's browser extension. Built upon MCP, it enables your coding agent to discover, understand, and fix issues such as UX inconsistencies, accessibility violations, and product quality problems seamlessly.

## Key Features

* **Natural language interaction**: Fix product issues using intuitive, conversational commands with your AI coding agent.
* **Seamless integration**: Works with Claude Code, Cursor, Windsurf, and other MCP-compatible coding assistants.
* **Real-time issue sync**: Automatically receives issues from Skippr's browser extension as you review your product.
* **Multi-agent insights**: Access issues identified by specialized agents (UX, Accessibility, Product, Content, Legal).
* **Context-rich details**: Each issue includes actionable prompts, element metadata, and suggested fixes.
* **Project-based organization**: Manage multiple projects with isolated issue tracking.

For example, in Claude Code, Cursor, or any MCP coding agent client, you can use natural language to accomplish things like:

* `Show me all high-severity accessibility issues in my project`
* `List all unresolved UX issues for the latest review`
* `Get details for issue abc-123 and help me fix it`
* `What product issues do I have across all my projects?`

## Setting Up

## Prerequisites

Before setting up the Skippr MCP server, ensure you have:

* An MCP Coding Agent Client application (Claude Code, Cursor, etc.)
* [Skippr Chrome Extension](https://chrome.google.com/webstore/detail/dmbmdnppaoabphpkafbkdcbinkfnjpmh) installed and configured

### Claude Code (CLI)

Add the Skippr MCP server to your Claude Code configuration:

```bash
claude mcp add skippr-extension-mcp -- npx -y @skippr/extension-mcp-server
```

## Support

For questions, technical support, or feedback:

* **Email**: contact@skippr.ai
* **Website**: [https://skippr.ai](https://skippr.ai)


© 2025 Skippr - Released under MIT License
