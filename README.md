# Skippr MCP Server

A Model Context Protocol (MCP) server implementation for Skippr integration, enabling AI assistants to interact with Skippr functionality through standardized tools and resources.

## Features

- **Tools**: Execute Skippr actions through the `skipper_action` tool
- **Resources**: Access Skippr status and configuration
- **Extensible**: Easy to add new tools, resources, and prompts
- **TypeScript**: Full type safety and modern JavaScript features

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

Run the server in development mode with hot reload:
```bash
npm run dev
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

## Extending the Server

### Adding New Tools

Tools allow AI assistants to perform actions. Add new tools in `src/index.ts`:

1. **Define the tool in the ListToolsRequestSchema handler:**

```typescript
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "your_new_tool",
        description: "Description of what your tool does",
        inputSchema: {
          type: "object",
          properties: {
            param1: {
              type: "string",
              description: "Description of parameter 1",
            },
            param2: {
              type: "number",
              description: "Description of parameter 2",
            },
          },
          required: ["param1"],
        },
      },
      // ... existing tools
    ],
  };
});
```

2. **Handle the tool execution in CallToolRequestSchema:**

```typescript
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "your_new_tool") {
    const args = request.params.arguments;

    // Your tool logic here
    const result = await performYourAction(args.param1, args.param2);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }
  // ... existing tool handlers
});
```

### Adding New Resources

Resources provide data that AI assistants can read. Add new resources:

1. **Define the resource in ListResourcesRequestSchema:**

```typescript
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: "skippr://your-resource",
        name: "Your Resource Name",
        description: "What this resource provides",
        mimeType: "application/json",
      },
      // ... existing resources
    ],
  };
});
```

2. **Handle resource reads in ReadResourceRequestSchema:**

```typescript
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  if (uri === "skippr://your-resource") {
    const data = await fetchYourResourceData();

    return {
      contents: [
        {
          uri: "skippr://your-resource",
          mimeType: "application/json",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }
  // ... existing resource handlers
});
```

### Adding Prompts

Prompts are predefined templates that help AI assistants understand how to use your server:

```typescript
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [
      {
        name: "analyze-skippr-data",
        description: "Analyze Skippr performance metrics",
        arguments: [
          {
            name: "timeframe",
            description: "Time period to analyze (e.g., '7d', '30d')",
            required: false,
          },
        ],
      },
    ],
  };
});

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  if (request.params.name === "analyze-skippr-data") {
    const timeframe = request.params.arguments?.timeframe || "7d";

    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Analyze the Skippr performance data for the last ${timeframe}.
                   Focus on key metrics, trends, and provide actionable insights.`,
          },
        },
      ],
    };
  }
});
```

## API Reference

### Current Tools

#### `skipper_action`
Executes Skippr-related actions.

**Parameters:**
- `action` (string, required): The action to perform
- `params` (object, optional): Additional parameters for the action

**Available Actions:**
- `ping`: Health check, returns "pong"
- `echo`: Echoes back the provided message

### Current Resources

#### `skippr://status`
Returns the current status of the Skippr MCP server.

**Response:**
```json
{
  "status": "ready",
  "version": "1.0.0",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Environment Variables

You can configure the server using environment variables:

```bash
# Add to your MCP client configuration
{
  "mcpServers": {
    "skippr-mcp": {
      "command": "node",
      "args": ["path/to/dist/index.js"],
      "env": {
        "SKIPPR_API_KEY": "your-api-key",
        "SKIPPR_API_URL": "https://api.skippr.com",
        "LOG_LEVEL": "debug"
      }
    }
  }
}
```

## Testing

Test your MCP server using the MCP Inspector:

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

This opens a web interface to interact with your server's tools and resources.

## Troubleshooting

### Server won't start
- Ensure Node.js 18+ is installed: `node --version`
- Check that all dependencies are installed: `npm install`
- Verify the build completed: `npm run build`

### Client can't connect
- Verify the absolute path in your configuration
- Check file permissions
- Look for errors in the MCP client logs

### Tools not appearing
- Ensure tools are properly registered in `ListToolsRequestSchema`
- Check that tool handlers are implemented in `CallToolRequestSchema`
- Restart your MCP client after configuration changes

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

ISC

## Support

For issues and questions, please open an issue on the GitHub repository.