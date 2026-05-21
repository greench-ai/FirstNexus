/**
 * Standalone MCP server for selected built-in FirstNexus tools.
 *
 * Run via: node --import tsx src/mcp/FirstNexus-tools-serve.ts
 * Or: bun src/mcp/FirstNexus-tools-serve.ts
 */
import { pathToFileURL } from "node:url";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import type { AnyAgentTool } from "../agents/tools/common.js";
import { createCronTool } from "../agents/tools/cron-tool.js";
import { formatErrorMessage } from "../infra/errors.js";
import { connectToolsMcpServerToStdio, createToolsMcpServer } from "./tools-stdio-server.js";

export function resolveFirstNexusToolsForMcp(): AnyAgentTool[] {
  return [createCronTool()];
}

function createFirstNexusToolsMcpServer(
  params: {
    tools?: AnyAgentTool[];
  } = {},
): Server {
  const tools = params.tools ?? resolveFirstNexusToolsForMcp();
  return createToolsMcpServer({ name: "FirstNexus-tools", tools });
}

async function serveFirstNexusToolsMcp(): Promise<void> {
  const server = createFirstNexusToolsMcpServer();
  await connectToolsMcpServerToStdio(server);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  serveFirstNexusToolsMcp().catch((err) => {
    process.stderr.write(`FirstNexus-tools-serve: ${formatErrorMessage(err)}\n`);
    process.exit(1);
  });
}
