import { describe, expect, it } from "vitest";
import {
  parseAgentsListRouteArgs,
  parseConfigGetRouteArgs,
  parseConfigUnsetRouteArgs,
  parseGatewayStatusRouteArgs,
  parseHealthRouteArgs,
  parseModelsListRouteArgs,
  parseModelsStatusRouteArgs,
  parseSessionsRouteArgs,
  parseStatusRouteArgs,
} from "./route-args.js";

describe("route-args", () => {
  it("parses health and status route args", () => {
    expect(
      parseHealthRouteArgs(["node", "FirstNexus", "health", "--json", "--timeout", "5000"]),
    ).toEqual({
      json: true,
      verbose: false,
      timeoutMs: 5000,
    });
    expect(
      parseStatusRouteArgs([
        "node",
        "FirstNexus",
        "status",
        "--json",
        "--deep",
        "--all",
        "--usage",
        "--timeout",
        "5000",
      ]),
    ).toEqual({
      json: true,
      deep: true,
      all: true,
      usage: true,
      verbose: false,
      timeoutMs: 5000,
    });
    expect(parseStatusRouteArgs(["node", "FirstNexus", "status", "--timeout"])).toBeNull();
  });

  it("parses gateway status route args and rejects probe-only ssh flags", () => {
    expect(
      parseGatewayStatusRouteArgs([
        "node",
        "FirstNexus",
        "gateway",
        "status",
        "--url",
        "ws://127.0.0.1:18789",
        "--token",
        "abc",
        "--password",
        "def",
        "--timeout",
        "5000",
        "--deep",
        "--require-rpc",
        "--json",
      ]),
    ).toEqual({
      rpc: {
        url: "ws://127.0.0.1:18789",
        token: "abc",
        password: "def",
        timeout: "5000",
      },
      probe: true,
      requireRpc: true,
      deep: true,
      json: true,
    });
    expect(
      parseGatewayStatusRouteArgs(["node", "FirstNexus", "gateway", "status", "--ssh", "host"]),
    ).toBeNull();
    expect(
      parseGatewayStatusRouteArgs(["node", "FirstNexus", "gateway", "status", "--ssh-auto"]),
    ).toBeNull();
  });

  it("parses sessions and agents list route args", () => {
    expect(
      parseSessionsRouteArgs([
        "node",
        "FirstNexus",
        "sessions",
        "--json",
        "--all-agents",
        "--agent",
        "default",
        "--store",
        "sqlite",
        "--active",
        "true",
        "--limit",
        "25",
      ]),
    ).toEqual({
      json: true,
      allAgents: true,
      agent: "default",
      store: "sqlite",
      active: "true",
      limit: "25",
    });
    expect(parseSessionsRouteArgs(["node", "FirstNexus", "sessions", "--agent"])).toBeNull();
    expect(parseSessionsRouteArgs(["node", "FirstNexus", "sessions", "--limit"])).toBeNull();
    expect(
      parseAgentsListRouteArgs(["node", "FirstNexus", "agents", "list", "--json", "--bindings"]),
    ).toEqual({
      json: true,
      bindings: true,
    });
    expect(parseAgentsListRouteArgs(["node", "FirstNexus", "agents"])).toEqual({
      json: false,
      bindings: false,
    });
  });

  it("parses config routes", () => {
    expect(
      parseConfigGetRouteArgs([
        "node",
        "FirstNexus",
        "--log-level",
        "debug",
        "config",
        "get",
        "update.channel",
        "--json",
      ]),
    ).toEqual({
      path: "update.channel",
      json: true,
    });
    expect(
      parseConfigUnsetRouteArgs([
        "node",
        "FirstNexus",
        "config",
        "unset",
        "--profile",
        "work",
        "update.channel",
      ]),
    ).toEqual({
      path: "update.channel",
    });
    expect(parseConfigGetRouteArgs(["node", "FirstNexus", "config", "get", "--json"])).toBeNull();
  });

  it("parses models list and models status route args", () => {
    expect(
      parseModelsListRouteArgs([
        "node",
        "FirstNexus",
        "models",
        "list",
        "--provider",
        "openai",
        "--all",
        "--local",
        "--json",
        "--plain",
      ]),
    ).toEqual({
      provider: "openai",
      all: true,
      local: true,
      json: true,
      plain: true,
    });
    expect(
      parseModelsStatusRouteArgs([
        "node",
        "FirstNexus",
        "models",
        "status",
        "--probe-provider",
        "openai",
        "--probe-timeout",
        "5000",
        "--probe-concurrency",
        "2",
        "--probe-max-tokens",
        "64",
        "--probe-profile",
        "fast",
        "--probe-profile",
        "safe",
        "--agent",
        "default",
        "--json",
        "--plain",
        "--check",
        "--probe",
      ]),
    ).toEqual({
      probeProvider: "openai",
      probeTimeout: "5000",
      probeConcurrency: "2",
      probeMaxTokens: "64",
      probeProfile: ["fast", "safe"],
      agent: "default",
      json: true,
      plain: true,
      check: true,
      probe: true,
    });
    expect(
      parseModelsStatusRouteArgs(["node", "FirstNexus", "models", "status", "--probe-profile"]),
    ).toBeNull();
  });
});
