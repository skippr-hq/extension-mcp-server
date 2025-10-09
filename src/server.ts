import express from "express";
import dotenv from "dotenv";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerTools } from "./modules/tools";
import { registerPrompts } from "./modules/prompts";
import { setupSSEEndpoint, setupMessageEndpoint } from "./modules/transports";
import { createWebSocketServer, closeWebSocketServer } from "./modules/websocket";

dotenv.config();

const server = new McpServer({
  name: "mcp-server",
  version: "1.0.0",
});

// Register tools and prompts
registerTools(server);
registerPrompts(server);

const app = express();

// Setup endpoints
setupSSEEndpoint(app, server);
setupMessageEndpoint(app);

const port = parseInt(process.env.PORT || "4000", 10);
const wsPort = parseInt(process.env.WS_PORT || "4040", 10);

// Start Express server
app.listen(port, () => {
  // console.log(JSON.stringify({"log": `MCP server is running on port ${port}`}));
});

// Start WebSocket server
createWebSocketServer(wsPort);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down servers...');
  closeWebSocketServer();
  process.exit(0);
});