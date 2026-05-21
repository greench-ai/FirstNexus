import { afterAll, afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const telemetryState = vi.hoisted(() => {
  const counters = new Map<string, { add: ReturnType<typeof vi.fn> }>();
  const histograms = new Map<string, { record: ReturnType<typeof vi.fn> }>();
  const spans: Array<{
    name: string;
    addEvent: ReturnType<typeof vi.fn>;
    end: ReturnType<typeof vi.fn>;
    setAttributes: ReturnType<typeof vi.fn>;
    setStatus: ReturnType<typeof vi.fn>;
    spanContext: ReturnType<typeof vi.fn>;
  }> = [];
  const tracer = {
    startSpan: vi.fn((name: string, _opts?: unknown, _ctx?: unknown) => {
      const spanNumber = spans.length + 1;
      const spanId = spanNumber.toString(16).padStart(16, "0");
      const span = {
        addEvent: vi.fn(),
        end: vi.fn(),
        setAttributes: vi.fn(),
        setStatus: vi.fn(),
        spanContext: vi.fn(() => ({
          traceId: "4bf92f3577b34da6a3ce929d0e0e4736",
          spanId,
          traceFlags: 1,
        })),
      };
      spans.push({ name, ...span });
      return span;
    }),
    setSpanContext: vi.fn((_ctx: unknown, spanContext: unknown) => ({ spanContext })),
  };
  const meter = {
    createCounter: vi.fn((name: string) => {
      const counter = { add: vi.fn() };
      counters.set(name, counter);
      return counter;
    }),
    createHistogram: vi.fn((name: string) => {
      const histogram = { record: vi.fn() };
      histograms.set(name, histogram);
      return histogram;
    }),
  };
  return { counters, histograms, spans, tracer, meter };
});

const sdkStart = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const sdkShutdown = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const logEmit = vi.hoisted(() => vi.fn());
const logShutdown = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const traceExporterCtor = vi.hoisted(() => vi.fn());
const metricExporterCtor = vi.hoisted(() => vi.fn());
const logExporterCtor = vi.hoisted(() => vi.fn());

vi.mock("@opentelemetry/api", () => ({
  context: {
    active: () => ({}),
  },
  metrics: {
    getMeter: () => telemetryState.meter,
  },
  trace: {
    getTracer: () => telemetryState.tracer,
    setSpanContext: telemetryState.tracer.setSpanContext,
  },
  TraceFlags: {
    NONE: 0,
    SAMPLED: 1,
  },
  SpanStatusCode: {
    ERROR: 2,
  },
}));

vi.mock("@opentelemetry/sdk-node", () => ({
  NodeSDK: class {
    start = sdkStart;
    shutdown = sdkShutdown;
  },
}));

vi.mock("@opentelemetry/exporter-metrics-otlp-proto", () => ({
  OTLPMetricExporter: function OTLPMetricExporter(options?: unknown) {
    metricExporterCtor(options);
  },
}));

vi.mock("@opentelemetry/exporter-trace-otlp-proto", () => ({
  OTLPTraceExporter: function OTLPTraceExporter(options?: unknown) {
    traceExporterCtor(options);
  },
}));

vi.mock("@opentelemetry/exporter-logs-otlp-proto", () => ({
  OTLPLogExporter: function OTLPLogExporter(options?: unknown) {
    logExporterCtor(options);
  },
}));

vi.mock("@opentelemetry/sdk-logs", () => ({
  BatchLogRecordProcessor: function BatchLogRecordProcessor() {},
  LoggerProvider: class {
    getLogger = vi.fn(() => ({
      emit: logEmit,
    }));
    shutdown = logShutdown;
  },
}));

vi.mock("@opentelemetry/sdk-metrics", () => ({
  PeriodicExportingMetricReader: function PeriodicExportingMetricReader() {},
}));

vi.mock("@opentelemetry/sdk-trace-base", () => ({
  ParentBasedSampler: function ParentBasedSampler() {},
  TraceIdRatioBasedSampler: function TraceIdRatioBasedSampler() {},
}));

vi.mock("@opentelemetry/resources", () => ({
  resourceFromAttributes: vi.fn((attrs: Record<string, unknown>) => attrs),
  Resource: function Resource(_value?: unknown) {
    // Constructor shape required by the mocked OpenTelemetry API.
  },
}));

vi.mock("@opentelemetry/semantic-conventions", () => ({
  ATTR_SERVICE_NAME: "service.name",
}));

import {
  emitTrustedDiagnosticEvent,
  onInternalDiagnosticEvent,
  resetDiagnosticEventsForTest,
} from "FirstNexus/plugin-sdk/diagnostic-runtime";
import type { FirstNexusPluginServiceContext } from "../api.js";
import { emitDiagnosticEvent } from "../api.js";
import { createDiagnosticsOtelService } from "./service.js";

const OTEL_TEST_STATE_DIR = "/tmp/FirstNexus-diagnostics-otel-test";
const OTEL_TEST_ENDPOINT = "http://otel-collector:4318";
const OTEL_TEST_PROTOCOL = "http/protobuf";
const TRACE_ID = "4bf92f3577b34da6a3ce929d0e0e4736";
const SPAN_ID = "00f067aa0ba902b7";
const CHILD_SPAN_ID = "1111111111111111";
const GRANDCHILD_SPAN_ID = "2222222222222222";
const TOOL_SPAN_ID = "3333333333333333";
const PROTO_KEY = "__proto__";
const MAX_TEST_OTEL_CONTENT_ATTRIBUTE_CHARS = 4096;
const OTEL_TRUNCATED_SUFFIX_MAX_CHARS = 20;
const ORIGINAL_NEXISCLAW_OTEL_PRELOADED = process.env.NEXISCLAW_OTEL_PRELOADED;
const ORIGINAL_OTEL_EXPORTER_OTLP_TRACES_ENDPOINT = process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT;
const ORIGINAL_OTEL_EXPORTER_OTLP_METRICS_ENDPOINT =
  process.env.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT;
const ORIGINAL_OTEL_EXPORTER_OTLP_LOGS_ENDPOINT = process.env.OTEL_EXPORTER_OTLP_LOGS_ENDPOINT;
const ORIGINAL_OTEL_SEMCONV_STABILITY_OPT_IN = process.env.OTEL_SEMCONV_STABILITY_OPT_IN;

function createLogger() {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  };
}

type OtelContextFlags = {
  traces?: boolean;
  metrics?: boolean;
  logs?: boolean;
  captureContent?: NonNullable<
    NonNullable<FirstNexusPluginServiceContext["config"]["diagnostics"]>["otel"]
  >["captureContent"];
};
function createOtelContext(
  endpoint: string,
  { traces = false, metrics = false, logs = false, captureContent }: OtelContextFlags = {},
): FirstNexusPluginServiceContext {
  return {
    config: {
      diagnostics: {
        enabled: true,
        otel: {
          enabled: true,
          endpoint,
          protocol: OTEL_TEST_PROTOCOL,
          traces,
          metrics,
          logs,
          ...(captureContent !== undefined ? { captureContent } : {}),
        },
      },
    },
    logger: createLogger(),
    stateDir: OTEL_TEST_STATE_DIR,
    internalDiagnostics: {
      emit: emitTrustedDiagnosticEvent,
      onEvent: onInternalDiagnosticEvent,
    },
  };
}

function createTraceOnlyContext(endpoint: string): FirstNexusPluginServiceContext {
  return createOtelContext(endpoint, { traces: true });
}

function startedSpanCall(name: string) {
  const calls = telemetryState.tracer.startSpan.mock.calls as unknown as Array<
    [string, { attributes?: Record<string, unknown>; startTime?: unknown }?, unknown?]
  >;
  return calls.find(([spanName]) => spanName === name);
}

function startedSpanOptions(name: string) {
  return startedSpanCall(name)?.[1];
}

function mockCall(mock: { mock: { calls: unknown[][] } }, callIndex = 0): unknown[] {
  const call = mock.mock.calls.at(callIndex);
  if (!call) {
    throw new Error(`Expected mock call at index ${callIndex}`);
  }
  return call;
}

function mockCallArg(mock: { mock: { calls: unknown[][] } }, argIndex: number, callIndex = 0) {
  return mockCall(mock, callIndex)[argIndex];
}

function firstExporterOptions(mock: { mock: { calls: unknown[][] } }): { url?: string } {
  return mockCallArg(mock, 0) as { url?: string };
}

function firstSetSpanContext(): Record<string, unknown> {
  return mockCallArg(telemetryState.tracer.setSpanContext, 1) as Record<string, unknown>;
}

function spanByName(name: string): (typeof telemetryState.spans)[number] {
  const span = telemetryState.spans.find((candidate) => candidate.name === name);
  if (!span) {
    throw new Error(`Expected span ${name}`);
  }
  return span;
}

function firstSpanAttributes(name: string): Record<string, unknown> {
  return mockCallArg(spanByName(name).setAttributes, 0) as Record<string, unknown>;
}

function firstSpanEndTime(name: string): unknown {
  return mockCallArg(spanByName(name).end, 0);
}

function firstCounterAddCall(name: string): [unknown, Record<string, unknown>?] {
  const counter = telemetryState.counters.get(name);
  if (!counter) {
    throw new Error(`Expected counter ${name}`);
  }
  return mockCall(counter.add) as [unknown, Record<string, unknown>?];
}

function lastHistogramRecord(name: string) {
  return telemetryState.histograms.get(name)?.record.mock.calls.at(-1) as
    | [unknown, Record<string, unknown>?]
    | undefined;
}

function histogramCreateOptions(name: string) {
  const calls = telemetryState.meter.createHistogram.mock.calls as unknown as Array<
    [string, unknown?]
  >;
  const call = calls.find(([histogramName]) => histogramName === name);
  return call?.[1] as
    | { unit?: unknown; advice?: { explicitBucketBoundaries?: unknown[] } }
    | undefined;
}

async function emitAndCaptureLog(
  event: Omit<Extract<Parameters<typeof emitDiagnosticEvent>[0], { type: "log.record" }>, "type">,
  options: { trusted?: boolean } = {},
) {
  const service = createDiagnosticsOtelService();
  const ctx = createOtelContext(OTEL_TEST_ENDPOINT, { logs: true });
  await service.start(ctx);
  const emit = options.trusted ? emitTrustedDiagnosticEvent : emitDiagnosticEvent;
  emit({
    type: "log.record",
    ...event,
  });
  await flushDiagnosticEvents();
  expect(logEmit).toHaveBeenCalled();
  const emitCall = mockCallArg(logEmit, 0) as {
    attributes?: Record<string, unknown>;
    body?: string;
    context?: unknown;
  };
  await service.stop?.(ctx);
  return emitCall;
}

function flushDiagnosticEvents() {
  return new Promise<void>((resolve) => setImmediate(resolve));
}

afterAll(() => {
  vi.doUnmock("@opentelemetry/api");
  vi.doUnmock("@opentelemetry/sdk-node");
  vi.doUnmock("@opentelemetry/exporter-metrics-otlp-proto");
  vi.doUnmock("@opentelemetry/exporter-trace-otlp-proto");
  vi.doUnmock("@opentelemetry/exporter-logs-otlp-proto");
  vi.doUnmock("@opentelemetry/sdk-logs");
  vi.doUnmock("@opentelemetry/sdk-metrics");
  vi.doUnmock("@opentelemetry/sdk-trace-base");
  vi.doUnmock("@opentelemetry/resources");
  vi.doUnmock("@opentelemetry/semantic-conventions");
  vi.resetModules();
});

describe("diagnostics-otel service", () => {
  beforeEach(() => {
    resetDiagnosticEventsForTest();
    delete process.env.NEXISCLAW_OTEL_PRELOADED;
    delete process.env.OTEL_SEMCONV_STABILITY_OPT_IN;
    telemetryState.counters.clear();
    telemetryState.histograms.clear();
    telemetryState.spans.length = 0;
    telemetryState.tracer.startSpan.mockClear();
    telemetryState.tracer.setSpanContext.mockClear();
    telemetryState.meter.createCounter.mockClear();
    telemetryState.meter.createHistogram.mockClear();
    sdkStart.mockClear();
    sdkShutdown.mockClear();
    logEmit.mockReset();
    logShutdown.mockClear();
    traceExporterCtor.mockClear();
    metricExporterCtor.mockClear();
    logExporterCtor.mockClear();
    delete process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT;
    delete process.env.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT;
    delete process.env.OTEL_EXPORTER_OTLP_LOGS_ENDPOINT;
  });

  afterEach(() => {
    resetDiagnosticEventsForTest();
    if (ORIGINAL_NEXISCLAW_OTEL_PRELOADED === undefined) {
      delete process.env.NEXISCLAW_OTEL_PRELOADED;
    } else {
      process.env.NEXISCLAW_OTEL_PRELOADED = ORIGINAL_NEXISCLAW_OTEL_PRELOADED;
    }
    if (ORIGINAL_OTEL_SEMCONV_STABILITY_OPT_IN === undefined) {
      delete process.env.OTEL_SEMCONV_STABILITY_OPT_IN;
    } else {
      process.env.OTEL_SEMCONV_STABILITY_OPT_IN = ORIGINAL_OTEL_SEMCONV_STABILITY_OPT_IN;
    }
    if (ORIGINAL_OTEL_EXPORTER_OTLP_TRACES_ENDPOINT === undefined) {
      delete process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT;
    } else {
      process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT = ORIGINAL_OTEL_EXPORTER_OTLP_TRACES_ENDPOINT;
    }
    if (ORIGINAL_OTEL_EXPORTER_OTLP_METRICS_ENDPOINT === undefined) {
      delete process.env.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT;
    } else {
      process.env.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT =
        ORIGINAL_OTEL_EXPORTER_OTLP_METRICS_ENDPOINT;
    }
    if (ORIGINAL_OTEL_EXPORTER_OTLP_LOGS_ENDPOINT === undefined) {
      delete process.env.OTEL_EXPORTER_OTLP_LOGS_ENDPOINT;
    } else {
      process.env.OTEL_EXPORTER_OTLP_LOGS_ENDPOINT = ORIGINAL_OTEL_EXPORTER_OTLP_LOGS_ENDPOINT;
    }
  });

  test("records message-flow metrics and spans", async () => {
    const service = createDiagnosticsOtelService();
    const ctx = createOtelContext(OTEL_TEST_ENDPOINT, { traces: true, metrics: true, logs: true });
    await service.start(ctx);

    emitDiagnosticEvent({
      type: "webhook.received",
      channel: "telegram",
      updateType: "telegram-post",
    });
    emitDiagnosticEvent({
      type: "webhook.processed",
      channel: "telegram",
      updateType: "telegram-post",
      chatId: "chat-should-not-export",
      durationMs: 120,
    });
    emitDiagnosticEvent({
      type: "message.queued",
      channel: "telegram",
      source: "telegram",
      queueDepth: 2,
    });
    emitDiagnosticEvent({
      type: "message.processed",
      channel: "telegram",
      chatId: "chat-should-not-export",
      messageId: "message-should-not-export",
      outcome: "completed",
      reason: "progress draft / message tool 123",
      durationMs: 55,
    });
    emitDiagnosticEvent({
      type: "queue.lane.dequeue",
      lane: "main",
      queueSize: 3,
      waitMs: 10,
    });
    emitDiagnosticEvent({
      type: "session.stuck",
      state: "processing",
      ageMs: 125_000,
      classification: "stale_session_state",
    });
    emitDiagnosticEvent({
      type: "run.attempt",
      runId: "run-1",
      attempt: 2,
    });

    expect(telemetryState.counters.get("FirstNexus.webhook.received")?.add).toHaveBeenCalledWith(
      1,
      {
        "FirstNexus.channel": "telegram",
        "FirstNexus.webhook": "telegram-post",
      },
    );
    expect(
      telemetryState.histograms.get("FirstNexus.webhook.duration_ms")?.record,
    ).toHaveBeenCalledWith(120, {
      "FirstNexus.channel": "telegram",
      "FirstNexus.webhook": "telegram-post",
    });
    expect(telemetryState.counters.get("FirstNexus.message.queued")?.add).toHaveBeenCalledWith(1, {
      "FirstNexus.channel": "telegram",
      "FirstNexus.source": "telegram",
    });
    expect(telemetryState.histograms.get("FirstNexus.queue.depth")?.record).toHaveBeenCalledTimes(
      2,
    );
    expect(telemetryState.histograms.get("FirstNexus.queue.depth")?.record).toHaveBeenCalledWith(
      2,
      {
        "FirstNexus.channel": "telegram",
        "FirstNexus.source": "telegram",
      },
    );
    expect(telemetryState.histograms.get("FirstNexus.queue.depth")?.record).toHaveBeenCalledWith(
      3,
      {
        "FirstNexus.lane": "main",
      },
    );
    expect(telemetryState.counters.get("FirstNexus.message.processed")?.add).toHaveBeenCalledWith(
      1,
      {
        "FirstNexus.channel": "telegram",
        "FirstNexus.outcome": "completed",
      },
    );
    expect(
      telemetryState.histograms.get("FirstNexus.message.duration_ms")?.record,
    ).toHaveBeenCalledWith(55, {
      "FirstNexus.channel": "telegram",
      "FirstNexus.outcome": "completed",
    });
    expect(telemetryState.histograms.get("FirstNexus.queue.wait_ms")?.record).toHaveBeenCalledWith(
      10,
      {
        "FirstNexus.lane": "main",
      },
    );
    expect(telemetryState.counters.get("FirstNexus.session.stuck")?.add).toHaveBeenCalledTimes(1);
    expect(telemetryState.counters.get("FirstNexus.session.stuck")?.add).toHaveBeenCalledWith(1, {
      "FirstNexus.state": "processing",
    });
    expect(
      telemetryState.histograms.get("FirstNexus.session.stuck_age_ms")?.record,
    ).toHaveBeenCalledWith(125_000, {
      "FirstNexus.state": "processing",
    });
    expect(telemetryState.counters.get("FirstNexus.run.attempt")?.add).toHaveBeenCalledWith(1, {
      "FirstNexus.attempt": 2,
    });

    const spanNames = telemetryState.tracer.startSpan.mock.calls.map((call) => call[0]);
    expect(spanNames).toContain("FirstNexus.webhook.processed");
    expect(spanNames).toContain("FirstNexus.message.processed");
    expect(spanNames).toContain("FirstNexus.session.stuck");
    const webhookSpanOptions = startedSpanOptions("FirstNexus.webhook.processed");
    expect(webhookSpanOptions?.attributes).not.toHaveProperty("FirstNexus.chatId");
    expect(webhookSpanOptions?.startTime).toBeTypeOf("number");
    const messageSpanOptions = startedSpanOptions("FirstNexus.message.processed");
    expect(messageSpanOptions?.attributes?.["FirstNexus.channel"]).toBe("telegram");
    expect(messageSpanOptions?.attributes?.["FirstNexus.outcome"]).toBe("completed");
    expect(messageSpanOptions?.attributes?.["FirstNexus.reason"]).toBe("unknown");
    expect(messageSpanOptions?.attributes).not.toHaveProperty("FirstNexus.chatId");
    expect(messageSpanOptions?.attributes).not.toHaveProperty("FirstNexus.messageId");
    expect(messageSpanOptions?.startTime).toBeTypeOf("number");

    emitDiagnosticEvent({
      type: "log.record",
      level: "INFO",
      message: "hello",
      attributes: { subsystem: "diagnostic" },
    });
    await flushDiagnosticEvents();
    expect(logEmit).toHaveBeenCalled();

    await service.stop?.(ctx);
  });

  test("restarts without retaining prior listeners or log transports", async () => {
    const service = createDiagnosticsOtelService();
    const ctx = createOtelContext(OTEL_TEST_ENDPOINT, { traces: true, metrics: true, logs: true });
    await service.start(ctx);
    await service.start(ctx);

    expect(logShutdown).toHaveBeenCalledTimes(1);
    expect(sdkShutdown).toHaveBeenCalledTimes(1);

    telemetryState.tracer.startSpan.mockClear();
    emitDiagnosticEvent({
      type: "message.processed",
      channel: "telegram",
      outcome: "completed",
      durationMs: 10,
    });
    expect(telemetryState.tracer.startSpan).toHaveBeenCalledTimes(1);

    await service.stop?.(ctx);
    expect(logShutdown).toHaveBeenCalledTimes(2);
    expect(sdkShutdown).toHaveBeenCalledTimes(2);

    telemetryState.tracer.startSpan.mockClear();
    emitDiagnosticEvent({
      type: "message.processed",
      channel: "telegram",
      outcome: "completed",
      durationMs: 10,
    });
    expect(telemetryState.tracer.startSpan).not.toHaveBeenCalled();
  });

  test("uses a preloaded OpenTelemetry SDK without dropping diagnostic listeners", async () => {
    process.env.NEXISCLAW_OTEL_PRELOADED = "1";
    const service = createDiagnosticsOtelService();
    const ctx = createOtelContext(OTEL_TEST_ENDPOINT, { traces: true, metrics: true, logs: true });
    await service.start(ctx);

    expect(sdkStart).not.toHaveBeenCalled();
    expect(traceExporterCtor).not.toHaveBeenCalled();
    expect(ctx.logger.info).toHaveBeenCalledWith(
      "diagnostics-otel: using preloaded OpenTelemetry SDK",
    );

    emitDiagnosticEvent({
      type: "run.completed",
      runId: "run-1",
      provider: "openai",
      model: "gpt-5.4",
      outcome: "completed",
      durationMs: 100,
    });
    emitDiagnosticEvent({
      type: "log.record",
      level: "INFO",
      message: "preloaded log",
    });
    await flushDiagnosticEvents();

    const runDurationRecordCall = lastHistogramRecord("FirstNexus.run.duration_ms");
    expect(runDurationRecordCall?.[0]).toBe(100);
    const runDurationAttributes = runDurationRecordCall?.[1];
    expect(runDurationAttributes?.["FirstNexus.provider"]).toBe("openai");
    expect(runDurationAttributes?.["FirstNexus.model"]).toBe("gpt-5.4");
    const runSpanOptions = startedSpanOptions("FirstNexus.run");
    expect(runSpanOptions?.attributes?.["FirstNexus.outcome"]).toBe("completed");
    expect(logEmit).toHaveBeenCalled();

    await service.stop?.(ctx);
    expect(sdkShutdown).not.toHaveBeenCalled();
    expect(logShutdown).toHaveBeenCalledTimes(1);
  });

  test("emits and records bounded telemetry exporter health events", async () => {
    const events: Array<Parameters<Parameters<typeof onInternalDiagnosticEvent>[0]>[0]> = [];
    const unsubscribe = onInternalDiagnosticEvent((event) => {
      if (event.type === "telemetry.exporter") {
        events.push(event);
      }
    });
    const service = createDiagnosticsOtelService();
    const ctx = createOtelContext(OTEL_TEST_ENDPOINT, { traces: true, metrics: true, logs: true });

    await service.start(ctx);

    const exporterEvents = events.filter((event) => event.type === "telemetry.exporter");
    for (const signal of ["traces", "metrics", "logs"]) {
      const event = exporterEvents.find((entry) => entry.signal === signal);
      expect(event?.type).toBe("telemetry.exporter");
      expect(event?.exporter).toBe("diagnostics-otel");
      expect(event?.status).toBe("started");
      expect(event?.reason).toBe("configured");
    }
    expect(
      telemetryState.counters.get("FirstNexus.telemetry.exporter.events")?.add,
    ).toHaveBeenCalledWith(1, {
      "FirstNexus.exporter": "diagnostics-otel",
      "FirstNexus.signal": "logs",
      "FirstNexus.status": "started",
      "FirstNexus.reason": "configured",
    });

    unsubscribe();
    await service.stop?.(ctx);
  });

  test("records liveness warning diagnostics", async () => {
    const service = createDiagnosticsOtelService();
    const ctx = createOtelContext(OTEL_TEST_ENDPOINT, { traces: true, metrics: true });

    await service.start(ctx);
    emitDiagnosticEvent({
      type: "diagnostic.liveness.warning",
      reasons: ["event_loop_delay", "cpu"],
      intervalMs: 30_000,
      eventLoopDelayP99Ms: 250,
      eventLoopDelayMaxMs: 900,
      eventLoopUtilization: 0.95,
      cpuUserMs: 1200,
      cpuSystemMs: 300,
      cpuTotalMs: 1500,
      cpuCoreRatio: 1.4,
      active: 2,
      waiting: 1,
      queued: 4,
    });
    await flushDiagnosticEvents();

    expect(telemetryState.counters.get("FirstNexus.liveness.warning")?.add).toHaveBeenCalledWith(
      1,
      {
        "FirstNexus.liveness.reason": "event_loop_delay:cpu",
      },
    );
    expect(
      telemetryState.histograms.get("FirstNexus.liveness.event_loop_delay_p99_ms")?.record,
    ).toHaveBeenCalledWith(250, {
      "FirstNexus.liveness.reason": "event_loop_delay:cpu",
    });
    expect(
      telemetryState.histograms.get("FirstNexus.liveness.cpu_core_ratio")?.record,
    ).toHaveBeenCalledWith(1.4, {
      "FirstNexus.liveness.reason": "event_loop_delay:cpu",
    });
    const livenessSpanOptions = startedSpanOptions("FirstNexus.liveness.warning");
    expect(livenessSpanOptions?.attributes?.["FirstNexus.liveness.reason"]).toBe(
      "event_loop_delay:cpu",
    );
    expect(livenessSpanOptions?.attributes?.["FirstNexus.liveness.active"]).toBe(2);
    expect(livenessSpanOptions?.attributes?.["FirstNexus.liveness.queued"]).toBe(4);
    const span = telemetryState.spans.find((item) => item.name === "FirstNexus.liveness.warning");
    expect(span?.setStatus).toHaveBeenCalledWith({
      code: 2,
      message: "event_loop_delay:cpu",
    });

    await service.stop?.(ctx);
  });

  test("reports log exporter emit failures without exporting raw error text", async () => {
    const events: Array<Parameters<Parameters<typeof onInternalDiagnosticEvent>[0]>[0]> = [];
    const unsubscribe = onInternalDiagnosticEvent((event) => {
      if (event.type === "telemetry.exporter") {
        events.push(event);
      }
    });
    const service = createDiagnosticsOtelService();
    const ctx = createOtelContext(OTEL_TEST_ENDPOINT, { logs: true });
    logEmit.mockImplementationOnce(() => {
      throw new TypeError("token sk-test-secret should not leave as telemetry");
    });

    await service.start(ctx);
    emitDiagnosticEvent({
      type: "log.record",
      level: "INFO",
      message: "export me",
    });
    await flushDiagnosticEvents();

    const exporterEvents = events.filter((event) => event.type === "telemetry.exporter");
    const failureEvent = exporterEvents.find((event) => event.status === "failure");
    expect(failureEvent?.type).toBe("telemetry.exporter");
    expect(failureEvent?.exporter).toBe("diagnostics-otel");
    expect(failureEvent?.signal).toBe("logs");
    expect(failureEvent?.status).toBe("failure");
    expect(failureEvent?.reason).toBe("emit_failed");
    expect(failureEvent?.errorCategory).toBe("TypeError");
    expect(
      telemetryState.counters.get("FirstNexus.telemetry.exporter.events")?.add,
    ).toHaveBeenCalledWith(1, {
      "FirstNexus.exporter": "diagnostics-otel",
      "FirstNexus.signal": "logs",
      "FirstNexus.status": "failure",
      "FirstNexus.reason": "emit_failed",
      "FirstNexus.errorCategory": "TypeError",
    });

    unsubscribe();
    await service.stop?.(ctx);
  });

  test("ignores untrusted telemetry exporter events for OTEL metrics", async () => {
    const service = createDiagnosticsOtelService();
    const ctx = createOtelContext(OTEL_TEST_ENDPOINT, { metrics: true });

    await service.start(ctx);
    telemetryState.counters.get("FirstNexus.telemetry.exporter.events")?.add.mockClear();
    emitDiagnosticEvent({
      type: "telemetry.exporter",
      exporter: "spoofed-plugin-exporter",
      signal: "metrics",
      status: "failure",
      reason: "emit_failed",
    });

    expect(
      telemetryState.counters.get("FirstNexus.telemetry.exporter.events")?.add,
    ).not.toHaveBeenCalled();

    await service.stop?.(ctx);
  });

  test("records hook-blocked run metrics with safe blocker originator", async () => {
    const service = createDiagnosticsOtelService();
    const ctx = createOtelContext(OTEL_TEST_ENDPOINT, { traces: true, metrics: true });
    await service.start(ctx);

    emitDiagnosticEvent({
      type: "run.completed",
      runId: "run-1",
      provider: "openai",
      model: "gpt-5.4",
      outcome: "blocked",
      blockedBy: "policy-plugin",
      durationMs: 100,
    });
    await flushDiagnosticEvents();

    const runDurationRecordCall = lastHistogramRecord("FirstNexus.run.duration_ms");
    expect(runDurationRecordCall?.[0]).toBe(100);
    expect(runDurationRecordCall?.[1]?.["FirstNexus.outcome"]).toBe("blocked");
    expect(runDurationRecordCall?.[1]?.["FirstNexus.blocked_by"]).toBe("policy-plugin");
    expect(JSON.stringify(telemetryState)).not.toContain("matched secret prompt");

    await service.stop?.(ctx);
  });

  test("honors disabled traces when an OpenTelemetry SDK is preloaded", async () => {
    process.env.NEXISCLAW_OTEL_PRELOADED = "1";
    const service = createDiagnosticsOtelService();
    const ctx = createOtelContext(OTEL_TEST_ENDPOINT, { traces: false, metrics: true });
    await service.start(ctx);

    emitDiagnosticEvent({
      type: "run.completed",
      runId: "run-1",
      provider: "openai",
      model: "gpt-5.4",
      outcome: "completed",
      durationMs: 100,
    });
    await flushDiagnosticEvents();

    expect(sdkStart).not.toHaveBeenCalled();
    const runDurationRecordCall = lastHistogramRecord("FirstNexus.run.duration_ms");
    expect(runDurationRecordCall?.[0]).toBe(100);
    expect(runDurationRecordCall?.[1]?.["FirstNexus.provider"]).toBe("openai");
    expect(telemetryState.tracer.startSpan).not.toHaveBeenCalled();

    await service.stop?.(ctx);
    expect(sdkShutdown).not.toHaveBeenCalled();
  });

  test("tears down active handles when restarted with diagnostics disabled", async () => {
    const service = createDiagnosticsOtelService();
    const enabledCtx = createOtelContext(OTEL_TEST_ENDPOINT, {
      traces: true,
      metrics: true,
      logs: true,
    });
    await service.start(enabledCtx);
    await service.start({
      ...enabledCtx,
      config: { diagnostics: { enabled: false } },
    });

    expect(logShutdown).toHaveBeenCalledTimes(1);
    expect(sdkShutdown).toHaveBeenCalledTimes(1);

    telemetryState.tracer.startSpan.mockClear();
    emitDiagnosticEvent({
      type: "message.processed",
      channel: "telegram",
      outcome: "completed",
      durationMs: 10,
    });
    expect(telemetryState.tracer.startSpan).not.toHaveBeenCalled();
  });

  test("appends signal path when endpoint contains non-signal /v1 segment", async () => {
    const service = createDiagnosticsOtelService();
    const ctx = createTraceOnlyContext("https://www.comet.com/opik/api/v1/private/otel");
    await service.start(ctx);

    const options = firstExporterOptions(traceExporterCtor);
    expect(options.url).toBe("https://www.comet.com/opik/api/v1/private/otel/v1/traces");
    await service.stop?.(ctx);
  });

  test("keeps already signal-qualified endpoint unchanged", async () => {
    const service = createDiagnosticsOtelService();
    const ctx = createTraceOnlyContext("https://collector.example.com/v1/traces");
    await service.start(ctx);

    const options = firstExporterOptions(traceExporterCtor);
    expect(options.url).toBe("https://collector.example.com/v1/traces");
    await service.stop?.(ctx);
  });

  test("keeps signal-qualified endpoint unchanged when it has query params", async () => {
    const service = createDiagnosticsOtelService();
    const ctx = createTraceOnlyContext("https://collector.example.com/v1/traces?timeout=30s");
    await service.start(ctx);

    const options = firstExporterOptions(traceExporterCtor);
    expect(options.url).toBe("https://collector.example.com/v1/traces?timeout=30s");
    await service.stop?.(ctx);
  });

  test("keeps signal-qualified endpoint unchanged when signal path casing differs", async () => {
    const service = createDiagnosticsOtelService();
    const ctx = createTraceOnlyContext("https://collector.example.com/v1/Traces");
    await service.start(ctx);

    const options = firstExporterOptions(traceExporterCtor);
    expect(options.url).toBe("https://collector.example.com/v1/Traces");
    await service.stop?.(ctx);
  });

  test("uses signal-specific OTLP endpoints ahead of the shared endpoint", async () => {
    const service = createDiagnosticsOtelService();
    const ctx = createOtelContext(OTEL_TEST_ENDPOINT, {
      traces: true,
      metrics: true,
      logs: true,
    });
    ctx.config.diagnostics!.otel!.tracesEndpoint = "https://trace.example.com/otlp";
    ctx.config.diagnostics!.otel!.metricsEndpoint = "https://metric.example.com/v1/metrics";
    ctx.config.diagnostics!.otel!.logsEndpoint = "https://log.example.com/otlp";

    await service.start(ctx);

    const traceOptions = firstExporterOptions(traceExporterCtor);
    const metricOptions = firstExporterOptions(metricExporterCtor);
    const logOptions = firstExporterOptions(logExporterCtor);
    expect(traceOptions.url).toBe("https://trace.example.com/otlp/v1/traces");
    expect(metricOptions.url).toBe("https://metric.example.com/v1/metrics");
    expect(logOptions.url).toBe("https://log.example.com/otlp/v1/logs");
    await service.stop?.(ctx);
  });

  test("uses signal-specific OTLP env endpoints when config is unset", async () => {
    process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT = "https://trace-env.example.com/v1/traces";
    process.env.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT = "https://metric-env.example.com/otlp";
    process.env.OTEL_EXPORTER_OTLP_LOGS_ENDPOINT = "https://log-env.example.com/otlp";

    const service = createDiagnosticsOtelService();
    const ctx = createOtelContext(OTEL_TEST_ENDPOINT, {
      traces: true,
      metrics: true,
      logs: true,
    });
    await service.start(ctx);

    const traceOptions = firstExporterOptions(traceExporterCtor);
    const metricOptions = firstExporterOptions(metricExporterCtor);
    const logOptions = firstExporterOptions(logExporterCtor);
    expect(traceOptions.url).toBe("https://trace-env.example.com/v1/traces");
    expect(metricOptions.url).toBe("https://metric-env.example.com/otlp/v1/metrics");
    expect(logOptions.url).toBe("https://log-env.example.com/otlp/v1/logs");
    await service.stop?.(ctx);
  });

  test("redacts sensitive data from log messages before export", async () => {
    const emitCall = await emitAndCaptureLog({
      level: "INFO",
      message: "Using API key sk-1234567890abcdef1234567890abcdef",
    });

    expect(emitCall?.body).not.toContain("sk-1234567890abcdef1234567890abcdef");
    expect(emitCall?.body).toContain("sk-123");
    expect(emitCall?.body).toContain("…");
  });

  test("redacts sensitive data from log attributes before export", async () => {
    const emitCall = await emitAndCaptureLog({
      level: "DEBUG",
      message: "auth configured",
      attributes: {
        token: "ghp_abcdefghijklmnopqrstuvwxyz123456", // pragma: allowlist secret
      },
    });

    const tokenAttr = emitCall?.attributes?.["FirstNexus.token"];
    expect(tokenAttr).not.toBe("ghp_abcdefghijklmnopqrstuvwxyz123456"); // pragma: allowlist secret
    if (typeof tokenAttr === "string") {
      expect(tokenAttr).toContain("…");
    }
  });

  test("does not attach untrusted diagnostic trace context to exported logs", async () => {
    const emitCall = await emitAndCaptureLog({
      level: "INFO",
      message: "traceable log",
      attributes: {
        subsystem: "diagnostic",
      },
      trace: {
        traceId: TRACE_ID,
        spanId: SPAN_ID,
        traceFlags: "01",
      },
    });

    expect(Object.hasOwn(emitCall?.attributes ?? {}, "FirstNexus.traceId")).toBe(false);
    expect(Object.hasOwn(emitCall?.attributes ?? {}, "FirstNexus.spanId")).toBe(false);
    expect(Object.hasOwn(emitCall?.attributes ?? {}, "FirstNexus.traceFlags")).toBe(false);
    expect(telemetryState.tracer.setSpanContext).not.toHaveBeenCalled();
    expect(emitCall?.context).toBeUndefined();
  });

  test("attaches trusted diagnostic trace context to exported logs", async () => {
    const emitCall = await emitAndCaptureLog(
      {
        level: "INFO",
        message: "traceable log",
        trace: {
          traceId: TRACE_ID,
          spanId: SPAN_ID,
          traceFlags: "01",
        },
      },
      { trusted: true },
    );

    expect(telemetryState.tracer.setSpanContext).toHaveBeenCalledTimes(1);
    const trustedSpanContext = firstSetSpanContext();
    expect(trustedSpanContext.traceId).toBe(TRACE_ID);
    expect(trustedSpanContext.spanId).toBe(SPAN_ID);
    expect(trustedSpanContext.traceFlags).toBe(1);
    expect(trustedSpanContext.isRemote).toBe(true);
    const emitContext = emitCall?.context as { spanContext?: Record<string, unknown> } | undefined;
    const emitSpanContext = emitContext?.spanContext;
    expect(emitSpanContext?.traceId).toBe(TRACE_ID);
    expect(emitSpanContext?.spanId).toBe(SPAN_ID);
  });

  test("bounds plugin-emitted log attributes and omits source paths", async () => {
    const service = createDiagnosticsOtelService();
    const ctx = createOtelContext(OTEL_TEST_ENDPOINT, { logs: true });
    await service.start(ctx);

    const attributes = Object.create(null) as Record<string, string>;
    attributes.good = "y".repeat(6000);
    attributes["bad key"] = "drop-me";
    attributes[PROTO_KEY] = "pollute";
    attributes["constructor"] = "pollute";
    attributes["prototype"] = "pollute";
    attributes["sk-1234567890abcdef1234567890abcdef"] = "secret-key"; // pragma: allowlist secret

    emitDiagnosticEvent({
      type: "log.record",
      level: "INFO",
      message: "x".repeat(6000),
      attributes,
      code: {
        filepath: "/Users/alice/FirstNexus/src/private.ts",
        line: 42,
        functionName: "handler",
        location: "/Users/alice/FirstNexus/src/private.ts:42",
      },
    } as Parameters<typeof emitDiagnosticEvent>[0]);
    await flushDiagnosticEvents();

    const emitCall = mockCallArg(logEmit, 0) as {
      attributes: Record<string, unknown>;
      body: string;
    };
    expect(emitCall.body.length).toBeLessThanOrEqual(4200);
    expect(String(emitCall.attributes["FirstNexus.good"])).toMatch(/^y+/);
    expect(emitCall.attributes["code.lineno"]).toBe(42);
    expect(emitCall.attributes["code.function"]).toBe("handler");
    expect(String(emitCall.attributes["FirstNexus.good"]).length).toBeLessThanOrEqual(4200);
    expect(Object.hasOwn(emitCall.attributes, `FirstNexus.${PROTO_KEY}`)).toBe(false);
    expect(Object.hasOwn(emitCall.attributes, "FirstNexus.constructor")).toBe(false);
    expect(Object.hasOwn(emitCall.attributes, "FirstNexus.prototype")).toBe(false);
    expect(
      Object.hasOwn(
        emitCall.attributes,
        "FirstNexus.sk-1234567890abcdef1234567890abcdef", // pragma: allowlist secret
      ),
    ).toBe(false);
    expect(Object.hasOwn(emitCall.attributes, "FirstNexus.bad key")).toBe(false);
    expect(Object.hasOwn(emitCall.attributes, "code.filepath")).toBe(false);
    expect(Object.hasOwn(emitCall.attributes, "FirstNexus.code.location")).toBe(false);
    await service.stop?.(ctx);
  });

  test("rate-limits repeated log export failure reports", async () => {
    const service = createDiagnosticsOtelService();
    const ctx = createOtelContext(OTEL_TEST_ENDPOINT, { logs: true });
    const nowSpy = vi.spyOn(Date, "now").mockReturnValue(1_000);
    logEmit.mockImplementation(() => {
      throw new Error("export failed");
    });
    try {
      await service.start(ctx);

      emitDiagnosticEvent({
        type: "log.record",
        level: "ERROR",
        message: "first failing log",
      });
      emitDiagnosticEvent({
        type: "log.record",
        level: "ERROR",
        message: "second failing log",
      });
      await flushDiagnosticEvents();

      expect(ctx.logger.error).toHaveBeenCalledTimes(1);

      nowSpy.mockReturnValue(62_000);
      emitDiagnosticEvent({
        type: "log.record",
        level: "ERROR",
        message: "third failing log",
      });
      await flushDiagnosticEvents();

      expect(ctx.logger.error).toHaveBeenCalledTimes(2);
    } finally {
      nowSpy.mockRestore();
      await service.stop?.(ctx);
    }
  });

  test("does not parent diagnostic event spans from plugin-emittable trace context", async () => {
    const service = createDiagnosticsOtelService();
    const ctx = createOtelContext(OTEL_TEST_ENDPOINT, { traces: true, metrics: true });
    await service.start(ctx);

    emitDiagnosticEvent({
      type: "model.usage",
      trace: {
        traceId: TRACE_ID,
        spanId: SPAN_ID,
        traceFlags: "01",
      },
      provider: "openai",
      model: "gpt-5.4",
      usage: { total: 4 },
      durationMs: 12,
    });

    const modelUsageCall = telemetryState.tracer.startSpan.mock.calls.find(
      (call) => call[0] === "FirstNexus.model.usage",
    );
    expect(telemetryState.tracer.setSpanContext).not.toHaveBeenCalled();
    expect(modelUsageCall?.[2]).toBeUndefined();
    await service.stop?.(ctx);
  });

  test("exports GenAI client token usage histogram for input and output only", async () => {
    const service = createDiagnosticsOtelService();
    const ctx = createOtelContext(OTEL_TEST_ENDPOINT, { metrics: true });
    await service.start(ctx);

    emitDiagnosticEvent({
      type: "model.usage",
      sessionKey: "session-key",
      channel: "webchat",
      agentId: "ops",
      provider: "openai",
      model: "gpt-5.4",
      usage: {
        input: 12,
        output: 7,
        cacheRead: 3,
        cacheWrite: 2,
        promptTokens: 17,
        total: 24,
      },
    });
    await flushDiagnosticEvents();

    const tokenUsageOptions = histogramCreateOptions("gen_ai.client.token.usage");
    expect(tokenUsageOptions?.unit).toBe("{token}");
    const tokenUsageBoundaries = tokenUsageOptions?.advice?.explicitBucketBoundaries;
    for (const boundary of [1, 4, 16, 1024, 67108864]) {
      expect(tokenUsageBoundaries).toContain(boundary);
    }
    const genAiTokenUsage = telemetryState.histograms.get("gen_ai.client.token.usage");
    const tokens = telemetryState.counters.get("FirstNexus.tokens");
    expect(tokens?.add).toHaveBeenCalledWith(12, {
      "FirstNexus.channel": "webchat",
      "FirstNexus.agent": "ops",
      "FirstNexus.provider": "openai",
      "FirstNexus.model": "gpt-5.4",
      "FirstNexus.token": "input",
    });
    expect(genAiTokenUsage?.record).toHaveBeenCalledTimes(2);
    expect(genAiTokenUsage?.record).toHaveBeenCalledWith(12, {
      "gen_ai.operation.name": "chat",
      "gen_ai.provider.name": "openai",
      "gen_ai.request.model": "gpt-5.4",
      "gen_ai.token.type": "input",
    });
    expect(genAiTokenUsage?.record).toHaveBeenCalledWith(7, {
      "gen_ai.operation.name": "chat",
      "gen_ai.provider.name": "openai",
      "gen_ai.request.model": "gpt-5.4",
      "gen_ai.token.type": "output",
    });
    expect(JSON.stringify(genAiTokenUsage?.record.mock.calls)).not.toContain("session-key");
    await service.stop?.(ctx);
  });

  test("bounds agent identifiers on model usage metric attributes", async () => {
    const service = createDiagnosticsOtelService();
    const ctx = createOtelContext(OTEL_TEST_ENDPOINT, { metrics: true });
    await service.start(ctx);

    emitDiagnosticEvent({
      type: "model.usage",
      agentId: "Bearer sk-test-secret-value",
      provider: "openai",
      model: "gpt-5.4",
      usage: { input: 2 },
    });
    await flushDiagnosticEvents();

    expect(telemetryState.counters.get("FirstNexus.tokens")?.add).toHaveBeenCalledWith(2, {
      "FirstNexus.channel": "unknown",
      "FirstNexus.agent": "unknown",
      "FirstNexus.provider": "openai",
      "FirstNexus.model": "gpt-5.4",
      "FirstNexus.token": "input",
    });
    expect(
      JSON.stringify(telemetryState.counters.get("FirstNexus.tokens")?.add.mock.calls),
    ).not.toContain("sk-test-secret-value");
    await service.stop?.(ctx);
  });

  test("keeps GenAI token usage metric model attribute present when model is unavailable", async () => {
    const service = createDiagnosticsOtelService();
    const ctx = createOtelContext(OTEL_TEST_ENDPOINT, { metrics: true });
    await service.start(ctx);

    emitDiagnosticEvent({
      type: "model.usage",
      provider: "openai",
      usage: { input: 2 },
    });
    await flushDiagnosticEvents();

    expect(telemetryState.histograms.get("gen_ai.client.token.usage")?.record).toHaveBeenCalledWith(
      2,
      {
        "gen_ai.operation.name": "chat",
        "gen_ai.provider.name": "openai",
        "gen_ai.request.model": "unknown",
        "gen_ai.token.type": "input",
      },
    );
    await service.stop?.(ctx);
  });

  test("exports GenAI usage attributes on model usage spans without diagnostic identifiers", async () => {
    const service = createDiagnosticsOtelService();
    const ctx = createOtelContext(OTEL_TEST_ENDPOINT, { traces: true });
    await service.start(ctx);

    emitDiagnosticEvent({
      type: "model.usage",
      sessionKey: "session-key",
      sessionId: "session-id",
      provider: "anthropic",
      model: "claude-sonnet-4.6",
      usage: {
        input: 100,
        output: 40,
        cacheRead: 30,
        cacheWrite: 20,
        promptTokens: 150,
        total: 190,
      },
      durationMs: 25,
    });
    await flushDiagnosticEvents();

    const modelUsageOptions = startedSpanOptions("FirstNexus.model.usage");
    expect(modelUsageOptions?.attributes?.["gen_ai.operation.name"]).toBe("chat");
    expect(modelUsageOptions?.attributes?.["gen_ai.system"]).toBe("anthropic");
    expect(modelUsageOptions?.attributes?.["gen_ai.request.model"]).toBe("claude-sonnet-4.6");
    expect(modelUsageOptions?.attributes?.["gen_ai.usage.input_tokens"]).toBe(150);
    expect(modelUsageOptions?.attributes?.["gen_ai.usage.output_tokens"]).toBe(40);
    expect(modelUsageOptions?.attributes?.["gen_ai.usage.cache_read.input_tokens"]).toBe(30);
    expect(modelUsageOptions?.attributes?.["gen_ai.usage.cache_creation.input_tokens"]).toBe(20);
    expect(Object.hasOwn(modelUsageOptions?.attributes ?? {}, "FirstNexus.sessionKey")).toBe(false);
    expect(Object.hasOwn(modelUsageOptions?.attributes ?? {}, "FirstNexus.sessionId")).toBe(false);
    expect(Object.hasOwn(modelUsageOptions?.attributes ?? {}, "gen_ai.provider.name")).toBe(false);
    expect(Object.hasOwn(modelUsageOptions?.attributes ?? {}, "gen_ai.input.messages")).toBe(false);
    expect(Object.hasOwn(modelUsageOptions?.attributes ?? {}, "gen_ai.output.messages")).toBe(
      false,
    );
    expect(modelUsageOptions?.startTime).toBeTypeOf("number");
    expect(JSON.stringify(modelUsageOptions)).not.toContain("session-key");
    await service.stop?.(ctx);
  });

  test("exports GenAI client operation duration histogram without diagnostic identifiers", async () => {
    const service = createDiagnosticsOtelService();
    const ctx = createOtelContext(OTEL_TEST_ENDPOINT, { metrics: true });
    await service.start(ctx);

    emitDiagnosticEvent({
      type: "model.call.completed",
      runId: "run-1",
      callId: "call-1",
      sessionKey: "session-key",
      provider: "openai",
      model: "gpt-5.4",
      api: "openai-completions",
      durationMs: 250,
    });
    emitDiagnosticEvent({
      type: "model.call.error",
      runId: "run-1",
      callId: "call-2",
      sessionKey: "session-key",
      provider: "google",
      model: "gemini-2.5-flash",
      api: "google-generative-ai",
      durationMs: 1250,
      errorCategory: "TimeoutError",
    });
    await flushDiagnosticEvents();

    const operationDurationOptions = histogramCreateOptions("gen_ai.client.operation.duration");
    expect(operationDurationOptions?.unit).toBe("s");
    const operationDurationBoundaries = operationDurationOptions?.advice?.explicitBucketBoundaries;
    for (const boundary of [0.01, 0.32, 2.56, 81.92]) {
      expect(operationDurationBoundaries).toContain(boundary);
    }
    const genAiOperationDuration = telemetryState.histograms.get(
      "gen_ai.client.operation.duration",
    );
    expect(genAiOperationDuration?.record).toHaveBeenCalledTimes(2);
    expect(genAiOperationDuration?.record).toHaveBeenCalledWith(0.25, {
      "gen_ai.operation.name": "text_completion",
      "gen_ai.provider.name": "openai",
      "gen_ai.request.model": "gpt-5.4",
    });
    expect(genAiOperationDuration?.record).toHaveBeenCalledWith(1.25, {
      "gen_ai.operation.name": "generate_content",
      "gen_ai.provider.name": "google",
      "gen_ai.request.model": "gemini-2.5-flash",
      "error.type": "TimeoutError",
    });
    expect(JSON.stringify(genAiOperationDuration?.record.mock.calls)).not.toContain("session-key");
    expect(JSON.stringify(genAiOperationDuration?.record.mock.calls)).not.toContain("run-1");
    await service.stop?.(ctx);
  });

  test("exports run, model call, and tool execution lifecycle spans", async () => {
    const service = createDiagnosticsOtelService();
    const ctx = createOtelContext(OTEL_TEST_ENDPOINT, { traces: true, metrics: true });
    await service.start(ctx);

    emitDiagnosticEvent({
      type: "run.completed",
      runId: "run-1",
      sessionKey: "session-key",
      provider: "openai",
      model: "gpt-5.4",
      channel: "webchat",
      outcome: "completed",
      durationMs: 100,
      trace: {
        traceId: TRACE_ID,
        spanId: SPAN_ID,
        traceFlags: "01",
      },
    });
    emitDiagnosticEvent({
      type: "model.call.completed",
      runId: "run-1",
      callId: "call-1",
      provider: "openai",
      model: "gpt-5.4",
      api: "completions",
      transport: "http",
      durationMs: 80,
      requestPayloadBytes: 1234,
      responseStreamBytes: 567,
      timeToFirstByteMs: 45,
      trace: {
        traceId: TRACE_ID,
        spanId: CHILD_SPAN_ID,
        parentSpanId: SPAN_ID,
        traceFlags: "01",
      },
    });
    emitDiagnosticEvent({
      type: "harness.run.completed",
      runId: "run-1",
      sessionKey: "session-key",
      sessionId: "session-1",
      provider: "codex",
      model: "gpt-5.4",
      channel: "qa",
      harnessId: "codex",
      pluginId: "codex-plugin",
      outcome: "completed",
      durationMs: 90,
      resultClassification: "reasoning-only",
      yieldDetected: true,
      itemLifecycle: { startedCount: 3, completedCount: 2, activeCount: 1 },
      trace: {
        traceId: TRACE_ID,
        spanId: GRANDCHILD_SPAN_ID,
        parentSpanId: CHILD_SPAN_ID,
        traceFlags: "01",
      },
    });
    emitDiagnosticEvent({
      type: "tool.execution.error",
      runId: "run-1",
      toolName: "read",
      toolCallId: "tool-1",
      paramsSummary: { kind: "object" },
      durationMs: 20,
      errorCategory: "TypeError",
      errorCode: "429",
      trace: {
        traceId: TRACE_ID,
        spanId: GRANDCHILD_SPAN_ID,
        parentSpanId: CHILD_SPAN_ID,
        traceFlags: "01",
      },
    });
    await flushDiagnosticEvents();

    const spanNames = telemetryState.tracer.startSpan.mock.calls.map((call) => call[0]);
    expect(spanNames).toContain("FirstNexus.run");
    expect(spanNames).toContain("FirstNexus.model.call");
    expect(spanNames).toContain("FirstNexus.harness.run");
    expect(spanNames).toContain("FirstNexus.tool.execution");

    const runOptions = startedSpanOptions("FirstNexus.run");
    expect(runOptions?.attributes?.["FirstNexus.outcome"]).toBe("completed");
    expect(runOptions?.attributes?.["FirstNexus.provider"]).toBe("openai");
    expect(runOptions?.attributes?.["FirstNexus.model"]).toBe("gpt-5.4");
    expect(runOptions?.attributes?.["FirstNexus.channel"]).toBe("webchat");
    expect(Object.hasOwn(runOptions?.attributes ?? {}, "gen_ai.system")).toBe(false);
    expect(Object.hasOwn(runOptions?.attributes ?? {}, "gen_ai.request.model")).toBe(false);
    expect(Object.hasOwn(runOptions?.attributes ?? {}, "FirstNexus.runId")).toBe(false);
    expect(Object.hasOwn(runOptions?.attributes ?? {}, "FirstNexus.sessionKey")).toBe(false);
    expect(Object.hasOwn(runOptions?.attributes ?? {}, "FirstNexus.traceId")).toBe(false);
    expect(runOptions?.startTime).toBeTypeOf("number");

    const modelCall = startedSpanCall("FirstNexus.model.call");
    const modelOptions = modelCall?.[1];
    expect(modelOptions?.attributes?.["gen_ai.system"]).toBe("openai");
    expect(modelOptions?.attributes?.["gen_ai.request.model"]).toBe("gpt-5.4");
    expect(modelOptions?.attributes?.["gen_ai.operation.name"]).toBe("text_completion");
    expect(Object.hasOwn(modelOptions?.attributes ?? {}, "gen_ai.provider.name")).toBe(false);
    expect(Object.hasOwn(modelOptions?.attributes ?? {}, "FirstNexus.callId")).toBe(false);
    expect(Object.hasOwn(modelOptions?.attributes ?? {}, "FirstNexus.runId")).toBe(false);
    expect(Object.hasOwn(modelOptions?.attributes ?? {}, "FirstNexus.sessionKey")).toBe(false);
    expect(modelOptions?.startTime).toBeTypeOf("number");
    expect(modelCall?.[2]).toBeUndefined();

    const harnessCall = startedSpanCall("FirstNexus.harness.run");
    const harnessOptions = harnessCall?.[1];
    expect(harnessOptions?.attributes?.["FirstNexus.harness.id"]).toBe("codex");
    expect(harnessOptions?.attributes?.["FirstNexus.harness.plugin"]).toBe("codex-plugin");
    expect(harnessOptions?.attributes?.["FirstNexus.outcome"]).toBe("completed");
    expect(harnessOptions?.attributes?.["FirstNexus.provider"]).toBe("codex");
    expect(harnessOptions?.attributes?.["FirstNexus.model"]).toBe("gpt-5.4");
    expect(harnessOptions?.attributes?.["FirstNexus.channel"]).toBe("qa");
    expect(harnessOptions?.attributes?.["FirstNexus.harness.result_classification"]).toBe(
      "reasoning-only",
    );
    expect(harnessOptions?.attributes?.["FirstNexus.harness.yield_detected"]).toBe(true);
    expect(harnessOptions?.attributes?.["FirstNexus.harness.items.started"]).toBe(3);
    expect(harnessOptions?.attributes?.["FirstNexus.harness.items.completed"]).toBe(2);
    expect(harnessOptions?.attributes?.["FirstNexus.harness.items.active"]).toBe(1);
    expect(Object.hasOwn(harnessOptions?.attributes ?? {}, "FirstNexus.runId")).toBe(false);
    expect(Object.hasOwn(harnessOptions?.attributes ?? {}, "FirstNexus.sessionId")).toBe(false);
    expect(Object.hasOwn(harnessOptions?.attributes ?? {}, "FirstNexus.sessionKey")).toBe(false);
    expect(Object.hasOwn(harnessOptions?.attributes ?? {}, "FirstNexus.traceId")).toBe(false);
    expect(harnessOptions?.startTime).toBeTypeOf("number");
    expect(harnessCall?.[2]).toBeUndefined();

    const toolCall = startedSpanCall("FirstNexus.tool.execution");
    const toolOptions = toolCall?.[1];
    expect(toolOptions?.attributes?.["FirstNexus.toolName"]).toBe("read");
    expect(toolOptions?.attributes?.["FirstNexus.errorCategory"]).toBe("TypeError");
    expect(toolOptions?.attributes?.["FirstNexus.errorCode"]).toBe("429");
    expect(toolOptions?.attributes?.["FirstNexus.tool.params.kind"]).toBe("object");
    expect(toolOptions?.attributes?.["gen_ai.tool.name"]).toBe("read");
    expect(Object.hasOwn(toolOptions?.attributes ?? {}, "FirstNexus.toolCallId")).toBe(false);
    expect(Object.hasOwn(toolOptions?.attributes ?? {}, "FirstNexus.runId")).toBe(false);
    expect(Object.hasOwn(toolOptions?.attributes ?? {}, "FirstNexus.sessionKey")).toBe(false);
    expect(toolOptions?.startTime).toBeTypeOf("number");
    expect(toolCall?.[2]).toBeUndefined();

    const modelCallDuration = lastHistogramRecord("FirstNexus.model_call.duration_ms");
    expect(modelCallDuration?.[0]).toBe(80);
    expect(modelCallDuration?.[1]?.["FirstNexus.provider"]).toBe("openai");
    expect(modelCallDuration?.[1]?.["FirstNexus.model"]).toBe("gpt-5.4");
    const requestBytes = lastHistogramRecord("FirstNexus.model_call.request_bytes");
    expect(requestBytes?.[0]).toBe(1234);
    expect(requestBytes?.[1]?.["FirstNexus.provider"]).toBe("openai");
    expect(requestBytes?.[1]?.["FirstNexus.model"]).toBe("gpt-5.4");
    const responseBytes = lastHistogramRecord("FirstNexus.model_call.response_bytes");
    expect(responseBytes?.[0]).toBe(567);
    expect(responseBytes?.[1]?.["FirstNexus.provider"]).toBe("openai");
    expect(responseBytes?.[1]?.["FirstNexus.model"]).toBe("gpt-5.4");
    const timeToFirstByte = lastHistogramRecord("FirstNexus.model_call.time_to_first_byte_ms");
    expect(timeToFirstByte?.[0]).toBe(45);
    expect(timeToFirstByte?.[1]?.["FirstNexus.provider"]).toBe("openai");
    expect(timeToFirstByte?.[1]?.["FirstNexus.model"]).toBe("gpt-5.4");
    const modelSpanAttributes = firstSpanAttributes("FirstNexus.model.call");
    expect(modelSpanAttributes["FirstNexus.model_call.request_bytes"]).toBe(1234);
    expect(modelSpanAttributes["FirstNexus.model_call.response_bytes"]).toBe(567);
    expect(modelSpanAttributes["FirstNexus.model_call.time_to_first_byte_ms"]).toBe(45);
    const runDuration = lastHistogramRecord("FirstNexus.run.duration_ms");
    expect(runDuration?.[0]).toBe(100);
    expect(Object.hasOwn(runDuration?.[1] ?? {}, "FirstNexus.runId")).toBe(false);
    const harnessDuration = lastHistogramRecord("FirstNexus.harness.duration_ms");
    expect(harnessDuration?.[0]).toBe(90);
    expect(harnessDuration?.[1]?.["FirstNexus.harness.id"]).toBe("codex");
    expect(harnessDuration?.[1]?.["FirstNexus.harness.plugin"]).toBe("codex-plugin");
    expect(harnessDuration?.[1]?.["FirstNexus.outcome"]).toBe("completed");
    expect(Object.hasOwn(harnessDuration?.[1] ?? {}, "FirstNexus.runId")).toBe(false);
    expect(Object.hasOwn(harnessDuration?.[1] ?? {}, "FirstNexus.sessionKey")).toBe(false);
    const toolDuration = lastHistogramRecord("FirstNexus.tool.execution.duration_ms");
    expect(toolDuration?.[0]).toBe(20);
    expect(Object.hasOwn(toolDuration?.[1] ?? {}, "FirstNexus.errorCode")).toBe(false);
    expect(Object.hasOwn(toolDuration?.[1] ?? {}, "FirstNexus.runId")).toBe(false);

    const toolSpan = spanByName("FirstNexus.tool.execution");
    expect(toolSpan?.setStatus).toHaveBeenCalledWith({
      code: 2,
      message: "TypeError",
    });
    expect(firstSpanEndTime("FirstNexus.tool.execution")).toBeTypeOf("number");
    expect(telemetryState.tracer.setSpanContext).not.toHaveBeenCalled();
    await service.stop?.(ctx);
  });

  test("exports model failover spans", async () => {
    const service = createDiagnosticsOtelService();
    const ctx = createOtelContext(OTEL_TEST_ENDPOINT, { traces: true });
    await service.start(ctx);

    emitTrustedDiagnosticEvent({
      type: "model.failover",
      sessionId: "session-1",
      lane: "main",
      fromProvider: "anthropic",
      fromModel: "claude-opus-4-6",
      toProvider: "openai",
      toModel: "gpt-5.4",
      reason: "overloaded",
      suspended: true,
      cascadeDepth: 1,
    });
    await flushDiagnosticEvents();

    const failoverOptions = startedSpanOptions("FirstNexus.model.failover");
    expect(failoverOptions?.attributes?.["FirstNexus.provider"]).toBe("anthropic");
    expect(failoverOptions?.attributes?.["FirstNexus.model"]).toBe("claude-opus-4-6");
    expect(failoverOptions?.attributes?.["FirstNexus.failover.to_provider"]).toBe("openai");
    expect(failoverOptions?.attributes?.["FirstNexus.failover.to_model"]).toBe("gpt-5.4");
    expect(failoverOptions?.attributes?.["FirstNexus.failover.reason"]).toBe("overloaded");
    expect(failoverOptions?.attributes?.["FirstNexus.failover.suspended"]).toBe(true);
    expect(failoverOptions?.attributes?.["FirstNexus.failover.cascade_depth"]).toBe(1);
    expect(failoverOptions?.attributes?.["FirstNexus.lane"]).toBe("main");
    expect(Object.hasOwn(failoverOptions?.attributes ?? {}, "FirstNexus.sessionId")).toBe(false);
    expect(Object.hasOwn(failoverOptions?.attributes ?? {}, "FirstNexus.sessionKey")).toBe(false);
    expect(failoverOptions?.startTime).toBeTypeOf("number");
    expect(firstSpanEndTime("FirstNexus.model.failover")).toBeTypeOf("number");
    await service.stop?.(ctx);
  });

  test("maps model call APIs to GenAI operation names and error type", async () => {
    const service = createDiagnosticsOtelService();
    const ctx = createOtelContext(OTEL_TEST_ENDPOINT, { traces: true, metrics: true });
    await service.start(ctx);

    emitDiagnosticEvent({
      type: "model.call.completed",
      runId: "run-1",
      callId: "call-1",
      provider: "openai",
      model: "gpt-5.4",
      api: "openai-completions",
      durationMs: 80,
    });
    emitDiagnosticEvent({
      type: "model.call.completed",
      runId: "run-1",
      callId: "call-2",
      provider: "google",
      model: "gemini-2.5-flash",
      api: "google-generative-ai",
      durationMs: 90,
    });
    emitDiagnosticEvent({
      type: "model.call.error",
      runId: "run-1",
      callId: "call-3",
      provider: "openai",
      model: "gpt-5.4",
      api: "openai-responses",
      durationMs: 40,
      errorCategory: "TimeoutError",
    });
    await flushDiagnosticEvents();

    const modelCallAttrs = telemetryState.tracer.startSpan.mock.calls
      .filter((call) => call[0] === "FirstNexus.model.call")
      .map((call) => (call[1] as { attributes?: Record<string, unknown> }).attributes);
    expect(modelCallAttrs).toHaveLength(3);
    expect(modelCallAttrs[0]?.["gen_ai.system"]).toBe("openai");
    expect(modelCallAttrs[0]?.["gen_ai.request.model"]).toBe("gpt-5.4");
    expect(modelCallAttrs[0]?.["gen_ai.operation.name"]).toBe("text_completion");
    expect(modelCallAttrs[1]?.["gen_ai.system"]).toBe("google");
    expect(modelCallAttrs[1]?.["gen_ai.request.model"]).toBe("gemini-2.5-flash");
    expect(modelCallAttrs[1]?.["gen_ai.operation.name"]).toBe("generate_content");
    expect(modelCallAttrs[2]?.["gen_ai.system"]).toBe("openai");
    expect(modelCallAttrs[2]?.["gen_ai.request.model"]).toBe("gpt-5.4");
    expect(modelCallAttrs[2]?.["gen_ai.operation.name"]).toBe("chat");
    expect(modelCallAttrs[2]?.["error.type"]).toBe("TimeoutError");
    await service.stop?.(ctx);
  });

  test("uses latest GenAI provider attribute only when semconv opt-in is set", async () => {
    process.env.OTEL_SEMCONV_STABILITY_OPT_IN = "http,gen_ai_latest_experimental";

    const service = createDiagnosticsOtelService();
    const ctx = createOtelContext(OTEL_TEST_ENDPOINT, { traces: true, metrics: true });
    await service.start(ctx);

    emitDiagnosticEvent({
      type: "model.call.completed",
      runId: "run-1",
      callId: "call-1",
      provider: "openai",
      model: "gpt-5.4",
      api: "openai-completions",
      durationMs: 80,
    });
    emitDiagnosticEvent({
      type: "model.usage",
      provider: "openai",
      model: "gpt-5.4",
      usage: { input: 3, output: 2 },
      durationMs: 10,
    });
    await flushDiagnosticEvents();

    const modelCallOptions = startedSpanOptions("FirstNexus.model.call");
    expect(modelCallOptions?.attributes?.["gen_ai.provider.name"]).toBe("openai");
    expect(modelCallOptions?.attributes?.["gen_ai.request.model"]).toBe("gpt-5.4");
    expect(modelCallOptions?.attributes?.["gen_ai.operation.name"]).toBe("text_completion");
    expect(Object.hasOwn(modelCallOptions?.attributes ?? {}, "gen_ai.system")).toBe(false);
    expect(modelCallOptions?.startTime).toBeTypeOf("number");
    const modelUsageOptions = startedSpanOptions("FirstNexus.model.usage");
    expect(modelUsageOptions?.attributes?.["gen_ai.provider.name"]).toBe("openai");
    expect(modelUsageOptions?.attributes?.["gen_ai.request.model"]).toBe("gpt-5.4");
    expect(modelUsageOptions?.attributes?.["gen_ai.operation.name"]).toBe("chat");
    expect(Object.hasOwn(modelUsageOptions?.attributes ?? {}, "gen_ai.system")).toBe(false);
    expect(modelUsageOptions?.startTime).toBeTypeOf("number");
    await service.stop?.(ctx);
  });

  test("records upstream request id hashes as model call span events only", async () => {
    const service = createDiagnosticsOtelService();
    const ctx = createOtelContext(OTEL_TEST_ENDPOINT, { traces: true, metrics: true });
    await service.start(ctx);

    emitDiagnosticEvent({
      type: "model.call.error",
      runId: "run-1",
      callId: "call-1",
      provider: "openai",
      model: "gpt-5.4",
      api: "openai-responses",
      durationMs: 40,
      errorCategory: "ProviderError",
      failureKind: "terminated",
      upstreamRequestIdHash: "sha256:123456abcdef",
    });
    await flushDiagnosticEvents();

    const modelCallOptions = startedSpanOptions("FirstNexus.model.call");
    expect(modelCallOptions?.attributes?.["FirstNexus.failureKind"]).toBe("terminated");
    expect(
      Object.hasOwn(modelCallOptions?.attributes ?? {}, "FirstNexus.upstreamRequestIdHash"),
    ).toBe(false);
    expect(modelCallOptions?.startTime).toBeTypeOf("number");
    const span = telemetryState.spans.find(
      (candidate) => candidate.name === "FirstNexus.model.call",
    );
    expect(span?.addEvent).toHaveBeenCalledWith("FirstNexus.provider.request", {
      "FirstNexus.upstreamRequestIdHash": "sha256:123456abcdef",
    });
    const modelCallDuration = lastHistogramRecord("FirstNexus.model_call.duration_ms");
    expect(modelCallDuration?.[0]).toBe(40);
    expect(modelCallDuration?.[1]?.["FirstNexus.failureKind"]).toBe("terminated");
    expect(Object.hasOwn(modelCallDuration?.[1] ?? {}, "FirstNexus.upstreamRequestIdHash")).toBe(
      false,
    );
    await service.stop?.(ctx);
  });

  test("exports trusted context assembly spans without prompt content", async () => {
    const service = createDiagnosticsOtelService();
    const ctx = createOtelContext(OTEL_TEST_ENDPOINT, { traces: true, metrics: true });
    await service.start(ctx);

    emitTrustedDiagnosticEvent({
      type: "run.started",
      runId: "run-1",
      provider: "openai",
      model: "gpt-5.4",
      trace: {
        traceId: TRACE_ID,
        spanId: SPAN_ID,
        traceFlags: "01",
      },
    });
    emitTrustedDiagnosticEvent({
      type: "context.assembled",
      runId: "run-1",
      sessionKey: "session-key",
      sessionId: "session-id",
      provider: "openai",
      model: "gpt-5.4",
      channel: "webchat",
      trigger: "message",
      messageCount: 12,
      historyTextChars: 1234,
      historyImageBlocks: 2,
      maxMessageTextChars: 456,
      systemPromptChars: 789,
      promptChars: 42,
      promptImages: 1,
      contextTokenBudget: 128_000,
      reserveTokens: 4096,
      trace: {
        traceId: TRACE_ID,
        spanId: GRANDCHILD_SPAN_ID,
        parentSpanId: SPAN_ID,
        traceFlags: "01",
      },
    });
    await flushDiagnosticEvents();

    const contextCall = startedSpanCall("FirstNexus.context.assembled");
    const contextOptions = contextCall?.[1];
    const runSpan = telemetryState.spans.find((span) => span.name === "FirstNexus.run");
    const runSpanId = runSpan?.spanContext.mock.results[0]?.value?.spanId;
    expect(contextOptions?.attributes?.["FirstNexus.provider"]).toBe("openai");
    expect(contextOptions?.attributes?.["FirstNexus.model"]).toBe("gpt-5.4");
    expect(contextOptions?.attributes?.["FirstNexus.channel"]).toBe("webchat");
    expect(contextOptions?.attributes?.["FirstNexus.trigger"]).toBe("message");
    expect(contextOptions?.attributes?.["FirstNexus.context.message_count"]).toBe(12);
    expect(contextOptions?.attributes?.["FirstNexus.context.history_text_chars"]).toBe(1234);
    expect(contextOptions?.attributes?.["FirstNexus.context.history_image_blocks"]).toBe(2);
    expect(contextOptions?.attributes?.["FirstNexus.context.max_message_text_chars"]).toBe(456);
    expect(contextOptions?.attributes?.["FirstNexus.context.system_prompt_chars"]).toBe(789);
    expect(contextOptions?.attributes?.["FirstNexus.context.prompt_chars"]).toBe(42);
    expect(contextOptions?.attributes?.["FirstNexus.context.prompt_images"]).toBe(1);
    expect(contextOptions?.attributes?.["FirstNexus.context.token_budget"]).toBe(128_000);
    expect(contextOptions?.attributes?.["FirstNexus.context.reserve_tokens"]).toBe(4096);
    expect(contextOptions?.attributes).toBeTypeOf("object");
    expect(contextOptions?.startTime).toBeTypeOf("number");
    expect(JSON.stringify(contextCall)).not.toContain("session-key");
    expect(JSON.stringify(contextCall)).not.toContain("prompt text");
    const linkedSpanContext = firstSetSpanContext();
    expect(linkedSpanContext.traceId).toBe(TRACE_ID);
    expect(linkedSpanContext.spanId).toBe(runSpanId);
    expect(
      (contextCall?.[2] as { spanContext?: { spanId?: string } } | undefined)?.spanContext?.spanId,
    ).toBe(runSpanId);
    await service.stop?.(ctx);
  });

  test("exports tool loop diagnostics without loop messages or session identifiers", async () => {
    const service = createDiagnosticsOtelService();
    const ctx = createOtelContext(OTEL_TEST_ENDPOINT, { traces: true, metrics: true });
    await service.start(ctx);

    emitDiagnosticEvent({
      type: "tool.loop",
      sessionKey: "session-key",
      sessionId: "session-id",
      toolName: "process",
      level: "critical",
      action: "block",
      detector: "known_poll_no_progress",
      count: 20,
      message: "CRITICAL: repeated secret-bearing tool output",
      pairedToolName: "read",
    });
    await flushDiagnosticEvents();

    expect(telemetryState.counters.get("FirstNexus.tool.loop")?.add).toHaveBeenCalledWith(1, {
      "FirstNexus.toolName": "process",
      "FirstNexus.loop.level": "critical",
      "FirstNexus.loop.action": "block",
      "FirstNexus.loop.detector": "known_poll_no_progress",
      "FirstNexus.loop.count": 20,
      "FirstNexus.loop.paired_tool": "read",
    });
    const loopSpanCall = startedSpanCall("FirstNexus.tool.loop");
    const loopOptions = loopSpanCall?.[1];
    expect(loopOptions?.attributes?.["FirstNexus.toolName"]).toBe("process");
    expect(loopOptions?.attributes?.["FirstNexus.loop.level"]).toBe("critical");
    expect(loopOptions?.attributes?.["FirstNexus.loop.action"]).toBe("block");
    expect(loopOptions?.attributes?.["FirstNexus.loop.detector"]).toBe("known_poll_no_progress");
    expect(loopOptions?.attributes?.["FirstNexus.loop.count"]).toBe(20);
    expect(loopOptions?.attributes?.["FirstNexus.loop.paired_tool"]).toBe("read");
    const loopSpan = telemetryState.spans.find((span) => span.name === "FirstNexus.tool.loop");
    expect(loopSpan?.setStatus).toHaveBeenCalledWith({
      code: 2,
      message: "known_poll_no_progress:block",
    });
    expect(JSON.stringify(loopSpanCall)).not.toContain("session-key");
    expect(JSON.stringify(loopSpanCall)).not.toContain("secret-bearing");
    await service.stop?.(ctx);
  });

  test("exports diagnostic memory samples and pressure without session identifiers", async () => {
    const service = createDiagnosticsOtelService();
    const ctx = createOtelContext(OTEL_TEST_ENDPOINT, { traces: true, metrics: true });
    await service.start(ctx);

    emitDiagnosticEvent({
      type: "diagnostic.memory.sample",
      uptimeMs: 1234,
      memory: {
        rssBytes: 100,
        heapUsedBytes: 40,
        heapTotalBytes: 80,
        externalBytes: 10,
        arrayBuffersBytes: 5,
      },
    });
    emitDiagnosticEvent({
      type: "diagnostic.memory.pressure",
      level: "critical",
      reason: "rss_growth",
      thresholdBytes: 512,
      rssGrowthBytes: 256,
      windowMs: 60_000,
      memory: {
        rssBytes: 200,
        heapUsedBytes: 50,
        heapTotalBytes: 90,
        externalBytes: 20,
        arrayBuffersBytes: 6,
      },
    });
    await flushDiagnosticEvents();

    expect(
      telemetryState.histograms.get("FirstNexus.memory.rss_bytes")?.record,
    ).toHaveBeenCalledWith(100, {});
    expect(
      telemetryState.histograms.get("FirstNexus.memory.rss_bytes")?.record,
    ).toHaveBeenCalledWith(200, {
      "FirstNexus.memory.level": "critical",
      "FirstNexus.memory.reason": "rss_growth",
    });
    expect(telemetryState.counters.get("FirstNexus.memory.pressure")?.add).toHaveBeenCalledWith(1, {
      "FirstNexus.memory.level": "critical",
      "FirstNexus.memory.reason": "rss_growth",
    });
    const pressureCall = startedSpanCall("FirstNexus.memory.pressure");
    const pressureOptions = pressureCall?.[1];
    expect(pressureOptions?.attributes?.["FirstNexus.memory.level"]).toBe("critical");
    expect(pressureOptions?.attributes?.["FirstNexus.memory.reason"]).toBe("rss_growth");
    expect(pressureOptions?.attributes?.["FirstNexus.memory.rss_bytes"]).toBe(200);
    expect(pressureOptions?.attributes?.["FirstNexus.memory.heap_used_bytes"]).toBe(50);
    expect(pressureOptions?.attributes?.["FirstNexus.memory.heap_total_bytes"]).toBe(90);
    expect(pressureOptions?.attributes?.["FirstNexus.memory.external_bytes"]).toBe(20);
    expect(pressureOptions?.attributes?.["FirstNexus.memory.array_buffers_bytes"]).toBe(6);
    expect(pressureOptions?.attributes?.["FirstNexus.memory.threshold_bytes"]).toBe(512);
    expect(pressureOptions?.attributes?.["FirstNexus.memory.rss_growth_bytes"]).toBe(256);
    expect(pressureOptions?.attributes?.["FirstNexus.memory.window_ms"]).toBe(60_000);
    const pressureSpan = telemetryState.spans.find(
      (span) => span.name === "FirstNexus.memory.pressure",
    );
    expect(pressureSpan?.setStatus).toHaveBeenCalledWith({
      code: 2,
      message: "rss_growth",
    });
    expect(JSON.stringify(pressureCall)).not.toContain("session");
    await service.stop?.(ctx);
  });

  test("parents trusted diagnostic lifecycle spans from active started spans", async () => {
    const service = createDiagnosticsOtelService();
    const ctx = createOtelContext(OTEL_TEST_ENDPOINT, { traces: true, metrics: true });
    await service.start(ctx);

    emitTrustedDiagnosticEvent({
      type: "run.started",
      runId: "run-1",
      provider: "openai",
      model: "gpt-5.4",
      trace: {
        traceId: TRACE_ID,
        spanId: CHILD_SPAN_ID,
        parentSpanId: SPAN_ID,
        traceFlags: "01",
      },
    });
    emitTrustedDiagnosticEvent({
      type: "model.call.started",
      runId: "run-1",
      callId: "call-1",
      provider: "openai",
      model: "gpt-5.4",
      trace: {
        traceId: TRACE_ID,
        spanId: GRANDCHILD_SPAN_ID,
        parentSpanId: CHILD_SPAN_ID,
        traceFlags: "01",
      },
    });
    emitTrustedDiagnosticEvent({
      type: "tool.execution.started",
      runId: "run-1",
      toolName: "read",
      trace: {
        traceId: TRACE_ID,
        spanId: TOOL_SPAN_ID,
        parentSpanId: GRANDCHILD_SPAN_ID,
        traceFlags: "01",
      },
    });
    emitTrustedDiagnosticEvent({
      type: "tool.execution.error",
      runId: "run-1",
      toolName: "read",
      durationMs: 20,
      errorCategory: "TypeError",
      trace: {
        traceId: TRACE_ID,
        spanId: TOOL_SPAN_ID,
        parentSpanId: GRANDCHILD_SPAN_ID,
        traceFlags: "01",
      },
    });
    emitTrustedDiagnosticEvent({
      type: "model.call.completed",
      runId: "run-1",
      callId: "call-1",
      provider: "openai",
      model: "gpt-5.4",
      durationMs: 80,
      trace: {
        traceId: TRACE_ID,
        spanId: GRANDCHILD_SPAN_ID,
        parentSpanId: CHILD_SPAN_ID,
        traceFlags: "01",
      },
    });
    emitTrustedDiagnosticEvent({
      type: "run.completed",
      runId: "run-1",
      provider: "openai",
      model: "gpt-5.4",
      outcome: "completed",
      durationMs: 100,
      trace: {
        traceId: TRACE_ID,
        spanId: CHILD_SPAN_ID,
        parentSpanId: SPAN_ID,
        traceFlags: "01",
      },
    });
    await flushDiagnosticEvents();

    const runSpan = telemetryState.spans.find((span) => span.name === "FirstNexus.run");
    const modelSpan = telemetryState.spans.find((span) => span.name === "FirstNexus.model.call");
    const toolSpan = telemetryState.spans.find((span) => span.name === "FirstNexus.tool.execution");
    const runSpanId = runSpan?.spanContext.mock.results[0]?.value?.spanId;
    const modelSpanId = modelSpan?.spanContext.mock.results[0]?.value?.spanId;

    expect(telemetryState.tracer.setSpanContext).toHaveBeenCalledTimes(2);
    const linkedSpanContexts = telemetryState.tracer.setSpanContext.mock.calls.map(
      (call) => call[1] as Record<string, unknown>,
    );
    expect(linkedSpanContexts[0]?.traceId).toBe(TRACE_ID);
    expect(linkedSpanContexts[0]?.spanId).toBe(runSpanId);
    expect(linkedSpanContexts[1]?.traceId).toBe(TRACE_ID);
    expect(linkedSpanContexts[1]?.spanId).toBe(modelSpanId);

    const parentBySpanName = Object.fromEntries(
      telemetryState.tracer.startSpan.mock.calls.map((call) => [
        call[0],
        (call[2] as { spanContext?: { spanId?: string } } | undefined)?.spanContext?.spanId,
      ]),
    );
    expect(parentBySpanName["FirstNexus.run"]).toBeUndefined();
    expect(parentBySpanName["FirstNexus.model.call"]).toBe(runSpanId);
    expect(parentBySpanName["FirstNexus.tool.execution"]).toBe(modelSpanId);
    expect(toolSpan?.setStatus).toHaveBeenCalledWith({
      code: 2,
      message: "TypeError",
    });
    await service.stop?.(ctx);
  });

  test("keeps trusted run spans alive long enough for post-completion usage parenting", async () => {
    const service = createDiagnosticsOtelService();
    const ctx = createOtelContext(OTEL_TEST_ENDPOINT, { traces: true, metrics: true });
    await service.start(ctx);

    emitTrustedDiagnosticEvent({
      type: "run.started",
      runId: "run-1",
      provider: "openai",
      model: "gpt-5.4",
      trace: {
        traceId: TRACE_ID,
        spanId: CHILD_SPAN_ID,
        parentSpanId: SPAN_ID,
        traceFlags: "01",
      },
    });
    emitTrustedDiagnosticEvent({
      type: "run.completed",
      runId: "run-1",
      provider: "openai",
      model: "gpt-5.4",
      outcome: "completed",
      durationMs: 100,
      trace: {
        traceId: TRACE_ID,
        spanId: CHILD_SPAN_ID,
        parentSpanId: SPAN_ID,
        traceFlags: "01",
      },
    });
    emitTrustedDiagnosticEvent({
      type: "model.usage",
      provider: "openai",
      model: "gpt-5.4",
      usage: { input: 3, output: 2, total: 5 },
      durationMs: 10,
      trace: {
        traceId: TRACE_ID,
        spanId: GRANDCHILD_SPAN_ID,
        parentSpanId: SPAN_ID,
        traceFlags: "01",
      },
    });
    await flushDiagnosticEvents();

    const runSpan = telemetryState.spans.find((span) => span.name === "FirstNexus.run");
    const runSpanId = runSpan?.spanContext.mock.results[0]?.value?.spanId;
    const modelUsageCall = telemetryState.tracer.startSpan.mock.calls.find(
      (call) => call[0] === "FirstNexus.model.usage",
    );

    const linkedSpanContext = firstSetSpanContext();
    expect(linkedSpanContext.traceId).toBe(TRACE_ID);
    expect(linkedSpanContext.spanId).toBe(runSpanId);
    expect(
      (modelUsageCall?.[2] as { spanContext?: { spanId?: string } } | undefined)?.spanContext
        ?.spanId,
    ).toBe(runSpanId);
    expect(firstSpanEndTime("FirstNexus.run")).toBeTypeOf("number");
    await service.stop?.(ctx);
  });

  test("does not force remote parents for completed-only trusted lifecycle spans", async () => {
    const service = createDiagnosticsOtelService();
    const ctx = createOtelContext(OTEL_TEST_ENDPOINT, { traces: true, metrics: true });
    await service.start(ctx);

    emitTrustedDiagnosticEvent({
      type: "run.completed",
      runId: "run-1",
      provider: "openai",
      model: "gpt-5.4",
      outcome: "completed",
      durationMs: 100,
      trace: {
        traceId: TRACE_ID,
        spanId: CHILD_SPAN_ID,
        parentSpanId: SPAN_ID,
        traceFlags: "01",
      },
    });
    emitTrustedDiagnosticEvent({
      type: "model.call.completed",
      runId: "run-1",
      callId: "call-1",
      provider: "openai",
      model: "gpt-5.4",
      durationMs: 80,
      trace: {
        traceId: TRACE_ID,
        spanId: GRANDCHILD_SPAN_ID,
        parentSpanId: CHILD_SPAN_ID,
        traceFlags: "01",
      },
    });
    await flushDiagnosticEvents();

    expect(telemetryState.tracer.setSpanContext).not.toHaveBeenCalled();
    const parentBySpanName = Object.fromEntries(
      telemetryState.tracer.startSpan.mock.calls.map((call) => [call[0], call[2]]),
    );
    expect(parentBySpanName["FirstNexus.run"]).toBeUndefined();
    expect(parentBySpanName["FirstNexus.model.call"]).toBeUndefined();
    await service.stop?.(ctx);
  });

  test("does not self-parent trusted diagnostic lifecycle spans without parent ids", async () => {
    const service = createDiagnosticsOtelService();
    const ctx = createOtelContext(OTEL_TEST_ENDPOINT, { traces: true, metrics: true });
    await service.start(ctx);

    emitTrustedDiagnosticEvent({
      type: "run.completed",
      runId: "run-1",
      provider: "openai",
      model: "gpt-5.4",
      outcome: "completed",
      durationMs: 100,
      trace: {
        traceId: TRACE_ID,
        spanId: CHILD_SPAN_ID,
        traceFlags: "01",
      },
    });
    emitTrustedDiagnosticEvent({
      type: "model.call.completed",
      runId: "run-1",
      callId: "call-1",
      provider: "openai",
      model: "gpt-5.4",
      durationMs: 80,
      trace: {
        traceId: TRACE_ID,
        spanId: GRANDCHILD_SPAN_ID,
        traceFlags: "01",
      },
    });
    await flushDiagnosticEvents();

    expect(telemetryState.tracer.setSpanContext).not.toHaveBeenCalled();
    const parentBySpanName = Object.fromEntries(
      telemetryState.tracer.startSpan.mock.calls.map((call) => [call[0], call[2]]),
    );
    expect(parentBySpanName["FirstNexus.run"]).toBeUndefined();
    expect(parentBySpanName["FirstNexus.model.call"]).toBeUndefined();
    await service.stop?.(ctx);
  });

  test("does not parent untrusted diagnostic lifecycle spans from injected trace ids", async () => {
    const service = createDiagnosticsOtelService();
    const ctx = createOtelContext(OTEL_TEST_ENDPOINT, { traces: true, metrics: true });
    await service.start(ctx);

    emitDiagnosticEvent({
      type: "run.completed",
      runId: "run-1",
      provider: "openai",
      model: "gpt-5.4",
      outcome: "completed",
      durationMs: 100,
      trace: {
        traceId: TRACE_ID,
        spanId: CHILD_SPAN_ID,
        parentSpanId: SPAN_ID,
        traceFlags: "01",
      },
    });
    emitDiagnosticEvent({
      type: "model.call.completed",
      runId: "run-1",
      callId: "call-1",
      provider: "openai",
      model: "gpt-5.4",
      durationMs: 80,
      trace: {
        traceId: TRACE_ID,
        spanId: GRANDCHILD_SPAN_ID,
        parentSpanId: CHILD_SPAN_ID,
        traceFlags: "01",
      },
    });
    emitDiagnosticEvent({
      type: "tool.execution.completed",
      runId: "run-1",
      toolName: "read",
      durationMs: 20,
      trace: {
        traceId: TRACE_ID,
        spanId: TOOL_SPAN_ID,
        parentSpanId: GRANDCHILD_SPAN_ID,
        traceFlags: "01",
      },
    });
    await flushDiagnosticEvents();

    expect(telemetryState.tracer.setSpanContext).not.toHaveBeenCalled();
    const parentBySpanName = Object.fromEntries(
      telemetryState.tracer.startSpan.mock.calls.map((call) => [call[0], call[2]]),
    );
    expect(parentBySpanName["FirstNexus.run"]).toBeUndefined();
    expect(parentBySpanName["FirstNexus.model.call"]).toBeUndefined();
    expect(parentBySpanName["FirstNexus.tool.execution"]).toBeUndefined();
    await service.stop?.(ctx);
  });

  test("does not create live started spans for untrusted lifecycle diagnostics", async () => {
    const service = createDiagnosticsOtelService();
    const ctx = createOtelContext(OTEL_TEST_ENDPOINT, { traces: true, metrics: true });
    await service.start(ctx);

    emitDiagnosticEvent({
      type: "run.started",
      runId: "run-1",
      provider: "openai",
      model: "gpt-5.4",
    });
    emitDiagnosticEvent({
      type: "run.completed",
      runId: "run-1",
      provider: "openai",
      model: "gpt-5.4",
      outcome: "completed",
      durationMs: 100,
    });
    emitDiagnosticEvent({
      type: "model.call.started",
      runId: "run-1",
      callId: "call-1",
      provider: "openai",
      model: "gpt-5.4",
    });
    emitDiagnosticEvent({
      type: "model.call.completed",
      runId: "run-1",
      callId: "call-1",
      provider: "openai",
      model: "gpt-5.4",
      durationMs: 80,
    });
    emitDiagnosticEvent({
      type: "tool.execution.started",
      runId: "run-1",
      toolName: "read",
    });
    emitDiagnosticEvent({
      type: "tool.execution.error",
      runId: "run-1",
      toolName: "read",
      durationMs: 20,
      errorCategory: "TypeError",
    });
    emitDiagnosticEvent({
      type: "harness.run.started",
      runId: "run-1",
      provider: "codex",
      model: "gpt-5.4",
      harnessId: "codex",
      pluginId: "codex-plugin",
    });
    emitDiagnosticEvent({
      type: "harness.run.completed",
      runId: "run-1",
      provider: "codex",
      model: "gpt-5.4",
      harnessId: "codex",
      pluginId: "codex-plugin",
      outcome: "completed",
      durationMs: 90,
    });
    await flushDiagnosticEvents();

    expect(
      telemetryState.tracer.startSpan.mock.calls.filter((call) => call[0] === "FirstNexus.run"),
    ).toHaveLength(1);
    expect(
      telemetryState.tracer.startSpan.mock.calls.filter(
        (call) => call[0] === "FirstNexus.model.call",
      ),
    ).toHaveLength(1);
    expect(
      telemetryState.tracer.startSpan.mock.calls.filter(
        (call) => call[0] === "FirstNexus.tool.execution",
      ),
    ).toHaveLength(1);
    expect(
      telemetryState.tracer.startSpan.mock.calls.filter(
        (call) => call[0] === "FirstNexus.harness.run",
      ),
    ).toHaveLength(1);
    await service.stop?.(ctx);
  });

  test("exports exec process spans without command text", async () => {
    const service = createDiagnosticsOtelService();
    const ctx = createOtelContext(OTEL_TEST_ENDPOINT, { traces: true, metrics: true });
    await service.start(ctx);

    emitDiagnosticEvent({
      type: "exec.process.completed",
      target: "host",
      mode: "child",
      outcome: "failed",
      durationMs: 30,
      commandLength: 42,
      exitCode: 1,
      timedOut: false,
      failureKind: "runtime-error",
    });
    await flushDiagnosticEvents();

    const execDuration = lastHistogramRecord("FirstNexus.exec.duration_ms");
    expect(execDuration?.[0]).toBe(30);
    expect(execDuration?.[1]?.["FirstNexus.exec.target"]).toBe("host");
    expect(execDuration?.[1]?.["FirstNexus.exec.mode"]).toBe("child");
    expect(execDuration?.[1]?.["FirstNexus.outcome"]).toBe("failed");
    expect(execDuration?.[1]?.["FirstNexus.failureKind"]).toBe("runtime-error");

    const execCall = startedSpanCall("FirstNexus.exec");
    const execOptions = execCall?.[1];
    expect(execOptions?.attributes?.["FirstNexus.exec.target"]).toBe("host");
    expect(execOptions?.attributes?.["FirstNexus.exec.mode"]).toBe("child");
    expect(execOptions?.attributes?.["FirstNexus.outcome"]).toBe("failed");
    expect(execOptions?.attributes?.["FirstNexus.exec.command_length"]).toBe(42);
    expect(execOptions?.attributes?.["FirstNexus.exec.exit_code"]).toBe(1);
    expect(execOptions?.attributes?.["FirstNexus.exec.timed_out"]).toBe(false);
    expect(execOptions?.attributes?.["FirstNexus.failureKind"]).toBe("runtime-error");
    expect(Object.hasOwn(execOptions?.attributes ?? {}, "FirstNexus.exec.command")).toBe(false);
    expect(Object.hasOwn(execOptions?.attributes ?? {}, "FirstNexus.exec.workdir")).toBe(false);
    expect(Object.hasOwn(execOptions?.attributes ?? {}, "FirstNexus.sessionKey")).toBe(false);
    expect(execOptions?.startTime).toBeTypeOf("number");

    const execSpan = spanByName("FirstNexus.exec");
    expect(execSpan?.setStatus).toHaveBeenCalledWith({
      code: 2,
      message: "runtime-error",
    });
    expect(firstSpanEndTime("FirstNexus.exec")).toBeTypeOf("number");
    await service.stop?.(ctx);
  });

  test("exports message delivery spans and metrics with low-cardinality attributes", async () => {
    const service = createDiagnosticsOtelService();
    const ctx = createOtelContext(OTEL_TEST_ENDPOINT, { traces: true, metrics: true });
    await service.start(ctx);

    emitDiagnosticEvent({
      type: "message.delivery.started",
      channel: "matrix",
      deliveryKind: "text",
      sessionKey: "session-secret",
    });
    emitDiagnosticEvent({
      type: "message.delivery.completed",
      channel: "matrix",
      deliveryKind: "text",
      durationMs: 25,
      resultCount: 1,
      sessionKey: "session-secret",
    });
    emitDiagnosticEvent({
      type: "message.delivery.error",
      channel: "discord",
      deliveryKind: "media",
      durationMs: 40,
      errorCategory: "TypeError",
      sessionKey: "session-secret",
    });
    await flushDiagnosticEvents();

    expect(
      telemetryState.counters.get("FirstNexus.message.delivery.started")?.add,
    ).toHaveBeenCalledWith(1, {
      "FirstNexus.channel": "matrix",
      "FirstNexus.delivery.kind": "text",
    });
    const deliveryDurationRecords = telemetryState.histograms.get(
      "FirstNexus.message.delivery.duration_ms",
    )?.record.mock.calls as Array<[unknown, Record<string, unknown>]>;
    expect(deliveryDurationRecords[0]?.[0]).toBe(25);
    expect(deliveryDurationRecords[0]?.[1]["FirstNexus.channel"]).toBe("matrix");
    expect(deliveryDurationRecords[0]?.[1]["FirstNexus.delivery.kind"]).toBe("text");
    expect(deliveryDurationRecords[0]?.[1]["FirstNexus.outcome"]).toBe("completed");
    expect(deliveryDurationRecords[1]?.[0]).toBe(40);
    expect(deliveryDurationRecords[1]?.[1]["FirstNexus.channel"]).toBe("discord");
    expect(deliveryDurationRecords[1]?.[1]["FirstNexus.delivery.kind"]).toBe("media");
    expect(deliveryDurationRecords[1]?.[1]["FirstNexus.outcome"]).toBe("error");
    expect(deliveryDurationRecords[1]?.[1]["FirstNexus.errorCategory"]).toBe("TypeError");

    const deliverySpanCalls = telemetryState.tracer.startSpan.mock.calls.filter(
      (call) => call[0] === "FirstNexus.message.delivery",
    );
    expect(deliverySpanCalls).toHaveLength(2);
    const firstDeliveryOptions = deliverySpanCalls[0]?.[1] as
      | { attributes?: Record<string, unknown>; startTime?: unknown }
      | undefined;
    expect(firstDeliveryOptions?.attributes?.["FirstNexus.channel"]).toBe("matrix");
    expect(firstDeliveryOptions?.attributes?.["FirstNexus.delivery.kind"]).toBe("text");
    expect(firstDeliveryOptions?.attributes?.["FirstNexus.outcome"]).toBe("completed");
    expect(firstDeliveryOptions?.attributes?.["FirstNexus.delivery.result_count"]).toBe(1);
    expect(firstDeliveryOptions?.startTime).toBeTypeOf("number");
    const secondDeliveryOptions = deliverySpanCalls[1]?.[1] as
      | { attributes?: Record<string, unknown>; startTime?: unknown }
      | undefined;
    expect(secondDeliveryOptions?.attributes?.["FirstNexus.channel"]).toBe("discord");
    expect(secondDeliveryOptions?.attributes?.["FirstNexus.delivery.kind"]).toBe("media");
    expect(secondDeliveryOptions?.attributes?.["FirstNexus.outcome"]).toBe("error");
    expect(secondDeliveryOptions?.attributes?.["FirstNexus.errorCategory"]).toBe("TypeError");
    expect(secondDeliveryOptions?.startTime).toBeTypeOf("number");
    for (const call of deliverySpanCalls) {
      const options = call[1] as { attributes?: Record<string, unknown>; startTime?: unknown };
      expect(Object.hasOwn(options.attributes ?? {}, "FirstNexus.chatId")).toBe(false);
      expect(Object.hasOwn(options.attributes ?? {}, "FirstNexus.sessionKey")).toBe(false);
      expect(Object.hasOwn(options.attributes ?? {}, "FirstNexus.messageId")).toBe(false);
      expect(Object.hasOwn(options.attributes ?? {}, "FirstNexus.conversationId")).toBe(false);
      expect(Object.hasOwn(options.attributes ?? {}, "FirstNexus.content")).toBe(false);
      expect(Object.hasOwn(options.attributes ?? {}, "FirstNexus.to")).toBe(false);
      expect(options.startTime).toBeTypeOf("number");
    }
    const errorSpan = telemetryState.spans.find(
      (span) => span.name === "FirstNexus.message.delivery" && span.setStatus.mock.calls.length > 0,
    );
    expect(errorSpan?.setStatus).toHaveBeenCalledWith({
      code: 2,
      message: "TypeError",
    });
    await service.stop?.(ctx);
  });

  test("bounds unsafe message delivery attributes before export", async () => {
    const service = createDiagnosticsOtelService();
    const ctx = createOtelContext(OTEL_TEST_ENDPOINT, { traces: true, metrics: true });
    await service.start(ctx);

    emitDiagnosticEvent({
      type: "message.delivery.completed",
      channel: "discord/custom",
      deliveryKind: "progress draft" as never,
      durationMs: 20,
      resultCount: 1,
      sessionKey: "session-secret",
    });
    await flushDiagnosticEvents();

    const deliveryDuration = lastHistogramRecord("FirstNexus.message.delivery.duration_ms");
    expect(deliveryDuration?.[0]).toBe(20);
    expect(deliveryDuration?.[1]?.["FirstNexus.channel"]).toBe("unknown");
    expect(deliveryDuration?.[1]?.["FirstNexus.delivery.kind"]).toBe("other");
    expect(deliveryDuration?.[1]?.["FirstNexus.outcome"]).toBe("completed");
    const deliverySpanCall = startedSpanCall("FirstNexus.message.delivery");
    const deliveryOptions = deliverySpanCall?.[1];
    expect(deliveryOptions?.attributes?.["FirstNexus.channel"]).toBe("unknown");
    expect(deliveryOptions?.attributes?.["FirstNexus.delivery.kind"]).toBe("other");
    expect(deliveryOptions?.attributes?.["FirstNexus.outcome"]).toBe("completed");
    expect(deliveryOptions?.attributes?.["FirstNexus.delivery.result_count"]).toBe(1);
    expect(deliveryOptions?.startTime).toBeTypeOf("number");
    await service.stop?.(ctx);
  });

  test("exports session recovery and talk metrics with bounded attributes", async () => {
    const service = createDiagnosticsOtelService();
    const ctx = createOtelContext(OTEL_TEST_ENDPOINT, { metrics: true });
    await service.start(ctx);

    emitTrustedDiagnosticEvent({
      type: "session.recovery.requested",
      sessionId: "session-should-not-export",
      sessionKey: "key-should-not-export",
      state: "processing",
      ageMs: 12_000,
      reason: "startup-sweep",
      activeWorkKind: "tool_call",
      allowActiveAbort: true,
    });
    emitTrustedDiagnosticEvent({
      type: "session.recovery.completed",
      sessionId: "session-should-not-export",
      sessionKey: "key-should-not-export",
      state: "processing",
      ageMs: 13_000,
      reason: "startup-sweep",
      activeWorkKind: "tool_call",
      status: "released",
      action: "abort-active-run",
    });
    emitTrustedDiagnosticEvent({
      type: "talk.event",
      sessionId: "talk-session-should-not-export",
      turnId: "turn-should-not-export",
      talkEventType: "input.audio.delta",
      mode: "realtime",
      transport: "gateway-relay",
      brain: "agent-consult",
      provider: "openai",
      byteLength: 320,
    });
    emitTrustedDiagnosticEvent({
      type: "talk.event",
      sessionId: "talk-session-should-not-export",
      talkEventType: "latency.metrics",
      mode: "realtime",
      transport: "gateway-relay",
      brain: "agent-consult",
      provider: "openai",
      durationMs: 45,
    });
    await flushDiagnosticEvents();

    const recoveryRequestedCall = firstCounterAddCall("FirstNexus.session.recovery.requested");
    expect(recoveryRequestedCall[0]).toBe(1);
    expect(recoveryRequestedCall[1]?.["FirstNexus.state"]).toBe("processing");
    expect(recoveryRequestedCall[1]?.["FirstNexus.action"]).toBe("abort");
    expect(recoveryRequestedCall[1]?.["FirstNexus.active_work_kind"]).toBe("tool_call");
    const recoveryCompletedCall = firstCounterAddCall("FirstNexus.session.recovery.completed");
    expect(recoveryCompletedCall[0]).toBe(1);
    expect(recoveryCompletedCall[1]?.["FirstNexus.state"]).toBe("processing");
    expect(recoveryCompletedCall[1]?.["FirstNexus.status"]).toBe("released");
    expect(recoveryCompletedCall[1]?.["FirstNexus.action"]).toBe("abort-active-run");
    const recoveryAgeRecord = lastHistogramRecord("FirstNexus.session.recovery.age_ms");
    expect(recoveryAgeRecord?.[0]).toBe(13_000);
    expect(recoveryAgeRecord?.[1]?.["FirstNexus.status"]).toBe("released");
    expect(telemetryState.counters.get("FirstNexus.talk.event")?.add).toHaveBeenCalledWith(1, {
      "FirstNexus.talk.brain": "agent-consult",
      "FirstNexus.talk.event_type": "input.audio.delta",
      "FirstNexus.talk.mode": "realtime",
      "FirstNexus.talk.provider": "openai",
      "FirstNexus.talk.transport": "gateway-relay",
    });
    expect(
      telemetryState.histograms.get("FirstNexus.talk.audio.bytes")?.record,
    ).toHaveBeenCalledWith(320, {
      "FirstNexus.talk.brain": "agent-consult",
      "FirstNexus.talk.event_type": "input.audio.delta",
      "FirstNexus.talk.mode": "realtime",
      "FirstNexus.talk.provider": "openai",
      "FirstNexus.talk.transport": "gateway-relay",
    });
    expect(
      telemetryState.histograms.get("FirstNexus.talk.event.duration_ms")?.record,
    ).toHaveBeenCalledWith(45, {
      "FirstNexus.talk.brain": "agent-consult",
      "FirstNexus.talk.event_type": "latency.metrics",
      "FirstNexus.talk.mode": "realtime",
      "FirstNexus.talk.provider": "openai",
      "FirstNexus.talk.transport": "gateway-relay",
    });

    const talkCounterCalls = JSON.stringify(
      telemetryState.counters.get("FirstNexus.talk.event")?.add.mock.calls,
    );
    expect(talkCounterCalls).not.toContain("talk-session-should-not-export");
    expect(talkCounterCalls).not.toContain("turn-should-not-export");
    await service.stop?.(ctx);
  });

  test("does not export model or tool content unless capture is explicitly enabled", async () => {
    const service = createDiagnosticsOtelService();
    const ctx = createOtelContext(OTEL_TEST_ENDPOINT, { traces: true, metrics: true });
    await service.start(ctx);

    emitDiagnosticEvent({
      type: "model.call.completed",
      runId: "run-1",
      callId: "call-1",
      provider: "openai",
      model: "gpt-5.4",
      durationMs: 80,
      inputMessages: ["private user prompt"],
      outputMessages: ["private model reply"],
      systemPrompt: "private system prompt",
    } as Parameters<typeof emitDiagnosticEvent>[0]);
    emitDiagnosticEvent({
      type: "tool.execution.completed",
      runId: "run-1",
      toolName: "read",
      toolCallId: "tool-1",
      durationMs: 20,
      toolInput: "private tool input",
      toolOutput: "private tool output",
    } as Parameters<typeof emitDiagnosticEvent>[0]);
    await flushDiagnosticEvents();

    const modelOptions = startedSpanOptions("FirstNexus.model.call");
    expect(Object.hasOwn(modelOptions?.attributes ?? {}, "FirstNexus.content.input_messages")).toBe(
      false,
    );
    expect(
      Object.hasOwn(modelOptions?.attributes ?? {}, "FirstNexus.content.output_messages"),
    ).toBe(false);
    expect(Object.hasOwn(modelOptions?.attributes ?? {}, "FirstNexus.content.system_prompt")).toBe(
      false,
    );
    expect(modelOptions?.startTime).toBeTypeOf("number");
    const toolOptions = startedSpanOptions("FirstNexus.tool.execution");
    expect(Object.hasOwn(toolOptions?.attributes ?? {}, "FirstNexus.content.tool_input")).toBe(
      false,
    );
    expect(Object.hasOwn(toolOptions?.attributes ?? {}, "FirstNexus.content.tool_output")).toBe(
      false,
    );
    expect(toolOptions?.startTime).toBeTypeOf("number");
    await service.stop?.(ctx);
  });

  test("exports bounded redacted content when capture fields are opted in", async () => {
    const service = createDiagnosticsOtelService();
    const ctx = createOtelContext(OTEL_TEST_ENDPOINT, {
      traces: true,
      metrics: true,
      captureContent: {
        enabled: true,
        inputMessages: true,
        outputMessages: true,
        toolInputs: true,
        toolOutputs: true,
        systemPrompt: true,
      },
    });
    await service.start(ctx);

    emitDiagnosticEvent({
      type: "model.call.completed",
      runId: "run-1",
      callId: "call-1",
      provider: "openai",
      model: "gpt-5.4",
      durationMs: 80,
      inputMessages: ["use key sk-1234567890abcdef1234567890abcdef"], // pragma: allowlist secret
      outputMessages: ["model reply"],
      systemPrompt: "system prompt",
    } as Parameters<typeof emitDiagnosticEvent>[0]);
    emitDiagnosticEvent({
      type: "tool.execution.completed",
      runId: "run-1",
      toolName: "read",
      toolCallId: "tool-1",
      durationMs: 20,
      toolInput: "tool input",
      toolOutput: `${"x".repeat(4077)} Bearer ${"a".repeat(80)}`, // pragma: allowlist secret
    } as Parameters<typeof emitDiagnosticEvent>[0]);
    await flushDiagnosticEvents();

    const modelCall = telemetryState.tracer.startSpan.mock.calls.find(
      (call) => call[0] === "FirstNexus.model.call",
    );
    const toolCall = telemetryState.tracer.startSpan.mock.calls.find(
      (call) => call[0] === "FirstNexus.tool.execution",
    );
    const modelAttrs = (modelCall?.[1] as { attributes?: Record<string, unknown> } | undefined)
      ?.attributes;
    const toolAttrs = (toolCall?.[1] as { attributes?: Record<string, unknown> } | undefined)
      ?.attributes;

    expect(modelAttrs?.["FirstNexus.content.output_messages"]).toBe("model reply");
    expect(modelAttrs?.["FirstNexus.content.system_prompt"]).toBe("system prompt");
    expect(String(modelAttrs?.["FirstNexus.content.input_messages"])).not.toContain(
      "sk-1234567890abcdef1234567890abcdef", // pragma: allowlist secret
    );
    expect(toolAttrs?.["FirstNexus.content.tool_input"]).toBe("tool input");
    expect(String(toolAttrs?.["FirstNexus.content.tool_output"]).length).toBeLessThanOrEqual(
      MAX_TEST_OTEL_CONTENT_ATTRIBUTE_CHARS + OTEL_TRUNCATED_SUFFIX_MAX_CHARS,
    );
    expect(String(toolAttrs?.["FirstNexus.content.tool_output"])).not.toContain("a".repeat(11));
    await service.stop?.(ctx);
  });

  test("ignores invalid diagnostic event trace parents", async () => {
    const service = createDiagnosticsOtelService();
    const ctx = createOtelContext(OTEL_TEST_ENDPOINT, { traces: true, metrics: true });
    await service.start(ctx);

    emitDiagnosticEvent({
      type: "model.usage",
      trace: {
        traceId: "0".repeat(32),
        spanId: "not-a-span",
        traceFlags: "zz",
      },
      provider: "openai",
      model: "gpt-5.4",
      usage: { total: 4 },
      durationMs: 12,
    });

    const modelUsageCall = telemetryState.tracer.startSpan.mock.calls.find(
      (call) => call[0] === "FirstNexus.model.usage",
    );
    expect(telemetryState.tracer.setSpanContext).not.toHaveBeenCalled();
    expect(modelUsageCall?.[2]).toBeUndefined();
    await service.stop?.(ctx);
  });

  test("redacts sensitive reason in session.state metric attributes", async () => {
    const service = createDiagnosticsOtelService();
    const ctx = createOtelContext(OTEL_TEST_ENDPOINT, { metrics: true });
    await service.start(ctx);

    emitDiagnosticEvent({
      type: "session.state",
      state: "waiting",
      reason: "token=ghp_abcdefghijklmnopqrstuvwxyz123456", // pragma: allowlist secret
    });

    const sessionStateCall = firstCounterAddCall("FirstNexus.session.state");
    const attrs = sessionStateCall[1];
    expect(sessionStateCall[0]).toBe(1);
    expect(String(attrs?.["FirstNexus.reason"])).toContain("…");
    expect(typeof attrs?.["FirstNexus.reason"]).toBe("string");
    expect(String(attrs?.["FirstNexus.reason"])).not.toContain(
      "ghp_abcdefghijklmnopqrstuvwxyz123456", // pragma: allowlist secret
    );
    await service.stop?.(ctx);
  });
});
