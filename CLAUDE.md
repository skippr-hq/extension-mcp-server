# skippr-extension-mcp-server

## Overview

**Skippr2Code** is an npm package that provides a Model Context Protocol (MCP) server, enabling AI coding agents to access and fix product issues identified by the Skippr browser extension.

The package is published as `@skippr/skippr-extension-mcp-server` on npm and can be used with any MCP-compatible coding assistant (Claude Code, Cursor, Windsurf, etc.).

## Package Information

- **Package Name**: `@skippr/skippr-extension-mcp-server`
- **Type**: ES Module (`"type": "module"`)
- **Entry Point**: `dist/index.js` (compiled from `src/index.ts`)
- **Executable**: `skippr-extension-mcp-server` (bin command)
- **Node Version**: >=22.x (for top-level await support)

## Project Structure

```
mcp/
├── src/                          # TypeScript source files
│   ├── index.ts                  # Main entry point (has shebang)
│   ├── servers/
│   │   ├── mcp.ts               # MCP server (stdio transport)
│   │   └── websocket.ts         # WebSocket server (extension connection)
│   ├── tools/                    # MCP tool implementations
│   │   ├── list-issues.ts
│   │   ├── list-projects.ts
│   │   └── get-issue.ts
│   ├── utils/                    # Utility functions
│   │   ├── frontmatter-parser.ts
│   │   ├── issues-reader.ts
│   │   ├── issues-writer.ts
│   │   └── working-directory.ts
│   ├── schemas/                  # Zod schemas for validation
│   │   └── index.ts
│   └── types/                    # TypeScript type definitions
│       └── index.ts
├── tests/                        # Unit tests (Vitest)
│   ├── servers/
│   ├── tools/
│   ├── utils/
│   └── fixtures/
├── dist/                         # Compiled JavaScript output
├── .github/workflows/            # CI/CD automation
│   └── publish.yml              # Automated npm publishing
├── package.json                  # Package metadata and dependencies
├── tsconfig.json                 # TypeScript configuration
├── vitest.config.ts             # Vitest test configuration
└── .release-it.json             # Release automation config

```

## Architecture

The server implements a **dual-interface pattern** running in a single Node.js process:

1. **MCP stdio Interface** - Communicates with AI coding agents via standard input/output
2. **WebSocket Server** (Port 4040) - Receives issues from Skippr browser extension

### Data Flow

```
Skippr Extension → WebSocket (4040) → Local .skippr/ files → MCP Tools → AI Coding Agent
```

## MCP Tools

The server provides three main tools for AI agents:

| Tool | Purpose |
|------|---------|
| `list_projects` | List all projects with available issues |
| `list_issues` | List all issues for a specific project or review |
| `get_issue` | Get detailed information about a specific issue |

## Testing

**Framework**: Vitest

- **Location**: `tests/` directory
- **Run tests**: `npm test`
- **Test UI**: `npm run test:ui`
- **Coverage**: `npm run test:coverage`

Tests cover:
- MCP server initialization and tool handling
- WebSocket server connection and message parsing
- Issue file reading/writing utilities
- Frontmatter parsing for markdown files

## Development

### Scripts

- `npm run dev` - Watch mode with tsx (hot reload)
- `npm run build` - Compile TypeScript to JavaScript
- `npm test` - Run unit tests
- `npm start` - Run compiled server
- `npm run inspector` - Debug with MCP inspector

### Publishing

Automated via GitHub Actions:
1. Push to `main` branch triggers CI/CD
2. Release It handles versioning based on conventional commits
3. Builds, tests, and publishes to npm with provenance
4. Creates GitHub release with changelog

## Key Technologies

- **TypeScript** - Type-safe development
- **Zod** - Runtime schema validation
- **@modelcontextprotocol/sdk** - MCP protocol implementation
- **ws** - WebSocket server
- **gray-matter** - Markdown frontmatter parsing
- **Vitest** - Unit testing framework
- **Release It** - Automated versioning and publishing

## References

- [Model Context Protocol Specification](https://modelcontextprotocol.io/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Skippr Website](https://skippr.ai)
