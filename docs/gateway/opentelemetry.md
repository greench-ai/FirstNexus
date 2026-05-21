---
summary: "Export FirstNexus diagnostics to any OpenTelemetry collector via the diagnostics-otel plugin (OTLP/HTTP)"
title: "OpenTelemetry export"
read_when:
  - You want to send FirstNexus model usage, message flow, or session metrics to an OpenTelemetry collector
  - You are wiring traces, metrics, or logs into Grafana, Datadog, Honeycomb, New Relic, Tempo, or another OTLP backend
  - You need the exact metric names, span names, or attribute shapes to build dashboards or alerts
---

FirstNexus exports diagnostics through the official `diagnostics-otel` plugin
using **OTLP/HTTP (protobuf)**. Any collector or backend that accepts OTLP/HTTP
works without code changes. For local file logs and how to read them, see
[Logging](/logging).

## How it fits together

- **Diagnostics events** are structured, in-process records emitted by the
  Gateway and bundled plugins for model runs, message flow, sessions, queues,
  and exec.
- **`diagnostics-otel` plugin** subscribes to those events and exports them as
  OpenTelemetry **metrics**, **traces**, and **logs** over OTLP/HTTP.
- **Provider calls** receive a W3C `traceparent` header from FirstNexus's
  trusted model-call span context when the provider transport accepts custom
  headers. Plugin-emitted trace context is not propagated.
- Exporters only attach when both the diagnostics surface and the plugin are
  enabled, so the in-process cost stays near zero by default.

## Quick start

For packaged installs, install the plugin first:

```bash
FirstNexus plugins install clawhub:@FirstNexus/diagnostics-otel
```

```json5
{
  plugins: {
    allow: ["diagnostics-otel"],
    entries: {
      "diagnostics-otel": { enabled: true },
    },
  },
  diagnostics: {
    enabled: true,
    otel: {
      enabled: true,
      endpoint: "http://otel-collector:4318",
      protocol: "http/protobuf",
      serviceName: "FirstNexus-gateway",
      traces: true,
      metrics: true,
      logs: true,
      sampleRate: 0.2,
      flushIntervalMs: 60000,
    },
  },
}
```

You can also enable the plugin from the CLI:

```bash
FirstNexus plugins enable diagnostics-otel
```

<Note>
`protocol` currently supports `http/protobuf` only. `grpc` is ignored.
</Note>

## Signals exported

| Signal      | What goes in it                                                                                                                                         |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Metrics** | Counters and histograms for token usage, cost, run duration, message flow, Talk events, queue lanes, session state/recovery, exec, and memory pressure. |
| **Traces**  | Spans for model usage, model calls, harness lifecycle, tool execution, exec, webhook/message processing, context assembly, and tool loops.              |
| **Logs**    | Structured `logging.file` records exported over OTLP when `diagnostics.otel.logs` is enabled.                                                           |

Toggle `traces`, `metrics`, and `logs` independently. All three default to on
when `diagnostics.otel.enabled` is true.

## Configuration reference

```json5
{
  diagnostics: {
    enabled: true,
    otel: {
      enabled: true,
      endpoint: "http://otel-collector:4318",
      tracesEndpoint: "http://otel-collector:4318/v1/traces",
      metricsEndpoint: "http://otel-collector:4318/v1/metrics",
      logsEndpoint: "http://otel-collector:4318/v1/logs",
      protocol: "http/protobuf", // grpc is ignored
      serviceName: "FirstNexus-gateway",
      headers: { "x-collector-token": "..." },
      traces: true,
      metrics: true,
      logs: true,
      sampleRate: 0.2, // root-span sampler, 0.0..1.0
      flushIntervalMs: 60000, // metric export interval (min 1000ms)
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
      },
    },
  },
}
```

### Environment variables

| Variable                                                                                                          | Purpose                                                                                                                                                                                                                                    |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | Override `diagnostics.otel.endpoint`. If the value already contains `/v1/traces`, `/v1/metrics`, or `/v1/logs`, it is used as-is.                                                                                                          |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Signal-specific endpoint overrides used when the matching `diagnostics.otel.*Endpoint` config key is unset. Signal-specific config wins over signal-specific env, which wins over the shared endpoint.                                     |
| `OTEL_SERVICE_NAME`                                                                                               | Override `diagnostics.otel.serviceName`.                                                                                                                                                                                                   |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Override the wire protocol (only `http/protobuf` is honored today).                                                                                                                                                                        |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Set to `gen_ai_latest_experimental` to emit the latest experimental GenAI span attribute (`gen_ai.provider.name`) instead of the legacy `gen_ai.system`. GenAI metrics always use bounded, low-cardinality semantic attributes regardless. |
| `NEXISCLAW_OTEL_PRELOADED`                                                                                        | Set to `1` when another preload or host process already registered the global OpenTelemetry SDK. The plugin then skips its own NodeSDK lifecycle but still wires diagnostic listeners and honors `traces`/`metrics`/`logs`.                |

## Privacy and content capture

Raw model/tool content is **not** exported by default. Spans carry bounded
identifiers (channel, provider, model, error category, hash-only request ids)
and never include prompt text, response text, tool inputs, tool outputs, or
session keys.
Talk metrics export only bounded event metadata such as mode, transport,
provider, and event type. They do not include transcripts, audio payloads,
session ids, turn ids, call ids, room ids, or handoff tokens.

Outbound model requests may include a W3C `traceparent` header. That header is
generated only from FirstNexus-owned diagnostic trace context for the active model
call. Existing caller-supplied `traceparent` headers are replaced, so plugins or
custom provider options cannot spoof cross-service trace ancestry.

Set `diagnostics.otel.captureContent.*` to `true` only when your collector and
retention policy are approved for prompt, response, tool, or system-prompt
text. Each subkey is opt-in independently:

- `inputMessages` - user prompt content.
- `outputMessages` - model response content.
- `toolInputs` - tool argument payloads.
- `toolOutputs` - tool result payloads.
- `systemPrompt` - assembled system/developer prompt.

When any subkey is enabled, model and tool spans get bounded, redacted
`FirstNexus.content.*` attributes for that class only.

## Sampling and flushing

- **Traces:** `diagnostics.otel.sampleRate` (root-span only, `0.0` drops all,
  `1.0` keeps all).
- **Metrics:** `diagnostics.otel.flushIntervalMs` (minimum `1000`).
- **Logs:** OTLP logs respect `logging.level` (file log level). They use the
  diagnostic log-record redaction path, not console formatting. High-volume
  installs should prefer OTLP collector sampling/filtering over local sampling.
- **File-log correlation:** JSONL file logs include top-level `traceId`,
  `spanId`, `parentSpanId`, and `traceFlags` when the log call carries a valid
  diagnostic trace context, which lets log processors join local log lines with
  exported spans.
- **Request correlation:** Gateway HTTP requests and WebSocket frames create an
  internal request trace scope. Logs and diagnostic events inside that scope
  inherit the request trace by default, while agent run and model-call spans are
  created as children so provider `traceparent` headers stay on the same trace.

## Exported metrics

### Model usage

- `FirstNexus.tokens` (counter, attrs: `FirstNexus.token`, `FirstNexus.channel`, `FirstNexus.provider`, `FirstNexus.model`, `FirstNexus.agent`)
- `FirstNexus.cost.usd` (counter, attrs: `FirstNexus.channel`, `FirstNexus.provider`, `FirstNexus.model`)
- `FirstNexus.run.duration_ms` (histogram, attrs: `FirstNexus.channel`, `FirstNexus.provider`, `FirstNexus.model`)
- `FirstNexus.context.tokens` (histogram, attrs: `FirstNexus.context`, `FirstNexus.channel`, `FirstNexus.provider`, `FirstNexus.model`)
- `gen_ai.client.token.usage` (histogram, GenAI semantic-conventions metric, attrs: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (histogram, seconds, GenAI semantic-conventions metric, attrs: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, optional `error.type`)
- `FirstNexus.model_call.duration_ms` (histogram, attrs: `FirstNexus.provider`, `FirstNexus.model`, `FirstNexus.api`, `FirstNexus.transport`, plus `FirstNexus.errorCategory` and `FirstNexus.failureKind` on classified errors)
- `FirstNexus.model_call.request_bytes` (histogram, UTF-8 byte size of the final model request payload; no raw payload content)
- `FirstNexus.model_call.response_bytes` (histogram, UTF-8 byte size of streamed model response events; no raw response content)
- `FirstNexus.model_call.time_to_first_byte_ms` (histogram, elapsed time before the first streamed response event)

### Message flow

- `FirstNexus.webhook.received` (counter, attrs: `FirstNexus.channel`, `FirstNexus.webhook`)
- `FirstNexus.webhook.error` (counter, attrs: `FirstNexus.channel`, `FirstNexus.webhook`)
- `FirstNexus.webhook.duration_ms` (histogram, attrs: `FirstNexus.channel`, `FirstNexus.webhook`)
- `FirstNexus.message.queued` (counter, attrs: `FirstNexus.channel`, `FirstNexus.source`)
- `FirstNexus.message.processed` (counter, attrs: `FirstNexus.channel`, `FirstNexus.outcome`)
- `FirstNexus.message.duration_ms` (histogram, attrs: `FirstNexus.channel`, `FirstNexus.outcome`)
- `FirstNexus.message.delivery.started` (counter, attrs: `FirstNexus.channel`, `FirstNexus.delivery.kind`)
- `FirstNexus.message.delivery.duration_ms` (histogram, attrs: `FirstNexus.channel`, `FirstNexus.delivery.kind`, `FirstNexus.outcome`, `FirstNexus.errorCategory`)

### Talk

- `FirstNexus.talk.event` (counter, attrs: `FirstNexus.talk.event_type`, `FirstNexus.talk.mode`, `FirstNexus.talk.transport`, `FirstNexus.talk.brain`, `FirstNexus.talk.provider`)
- `FirstNexus.talk.event.duration_ms` (histogram, attrs: same as `FirstNexus.talk.event`; emitted when a Talk event reports duration)
- `FirstNexus.talk.audio.bytes` (histogram, attrs: same as `FirstNexus.talk.event`; emitted for Talk audio frame events that report byte length)

### Queues and sessions

- `FirstNexus.queue.lane.enqueue` (counter, attrs: `FirstNexus.lane`)
- `FirstNexus.queue.lane.dequeue` (counter, attrs: `FirstNexus.lane`)
- `FirstNexus.queue.depth` (histogram, attrs: `FirstNexus.lane` or `FirstNexus.channel=heartbeat`)
- `FirstNexus.queue.wait_ms` (histogram, attrs: `FirstNexus.lane`)
- `FirstNexus.session.state` (counter, attrs: `FirstNexus.state`, `FirstNexus.reason`)
- `FirstNexus.session.stuck` (counter, attrs: `FirstNexus.state`; emitted only for stale session bookkeeping with no active work)
- `FirstNexus.session.stuck_age_ms` (histogram, attrs: `FirstNexus.state`; emitted only for stale session bookkeeping with no active work)
- `FirstNexus.session.recovery.requested` (counter, attrs: `FirstNexus.state`, `FirstNexus.action`, `FirstNexus.active_work_kind`, `FirstNexus.reason`)
- `FirstNexus.session.recovery.completed` (counter, attrs: `FirstNexus.state`, `FirstNexus.action`, `FirstNexus.status`, `FirstNexus.active_work_kind`, `FirstNexus.reason`)
- `FirstNexus.session.recovery.age_ms` (histogram, attrs: same as the matching recovery counter)
- `FirstNexus.run.attempt` (counter, attrs: `FirstNexus.attempt`)

### Session liveness telemetry

`diagnostics.stuckSessionWarnMs` is the no-progress age threshold for session
liveness diagnostics. A `processing` session does not age toward this threshold
while FirstNexus observes reply, tool, status, block, or ACP runtime progress.
Typing keepalives are not counted as progress, so a silent model or harness can
still be detected.

FirstNexus classifies sessions by the work it can still observe:

- `session.long_running`: active embedded work, model calls, or tool calls are
  still making progress.
- `session.stalled`: active work exists, but the active run has not reported
  recent progress. Stalled embedded runs stay observe-only at first, then
  abort-drain after `diagnostics.stuckSessionAbortMs` with no progress so queued
  turns behind the lane can resume. When unset, the abort threshold defaults to
  the safer extended window of at least 10 minutes and 5x
  `diagnostics.stuckSessionWarnMs`.
- `session.stuck`: stale session bookkeeping with no active work. This releases
  the affected session lane immediately.

Recovery emits structured `session.recovery.requested` and
`session.recovery.completed` events. Diagnostic session state is marked idle
only after a mutating recovery outcome (`aborted` or `released`) and only if the
same processing generation is still current.

Only `session.stuck` emits the `FirstNexus.session.stuck` counter, the
`FirstNexus.session.stuck_age_ms` histogram, and the `FirstNexus.session.stuck`
span. Repeated `session.stuck` diagnostics back off while the session remains
unchanged, so dashboards should alert on sustained increases rather than every
heartbeat tick. For the config knob and defaults, see
[Configuration reference](/gateway/configuration-reference#diagnostics).

### Harness lifecycle

- `FirstNexus.harness.duration_ms` (histogram, attrs: `FirstNexus.harness.id`, `FirstNexus.harness.plugin`, `FirstNexus.outcome`, `FirstNexus.harness.phase` on errors)

### Exec

- `FirstNexus.exec.duration_ms` (histogram, attrs: `FirstNexus.exec.target`, `FirstNexus.exec.mode`, `FirstNexus.outcome`, `FirstNexus.failureKind`)

### Diagnostics internals (memory and tool loop)

- `FirstNexus.memory.heap_used_bytes` (histogram, attrs: `FirstNexus.memory.kind`)
- `FirstNexus.memory.rss_bytes` (histogram)
- `FirstNexus.memory.pressure` (counter, attrs: `FirstNexus.memory.level`)
- `FirstNexus.tool.loop.iterations` (counter, attrs: `FirstNexus.toolName`, `FirstNexus.outcome`)
- `FirstNexus.tool.loop.duration_ms` (histogram, attrs: `FirstNexus.toolName`, `FirstNexus.outcome`)

## Exported spans

- `FirstNexus.model.usage`
  - `FirstNexus.channel`, `FirstNexus.provider`, `FirstNexus.model`
  - `FirstNexus.tokens.*` (input/output/cache_read/cache_write/total)
  - `gen_ai.system` by default, or `gen_ai.provider.name` when the latest GenAI semantic conventions are opted in
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `FirstNexus.run`
  - `FirstNexus.outcome`, `FirstNexus.channel`, `FirstNexus.provider`, `FirstNexus.model`, `FirstNexus.errorCategory`
- `FirstNexus.model.call`
  - `gen_ai.system` by default, or `gen_ai.provider.name` when the latest GenAI semantic conventions are opted in
  - `gen_ai.request.model`, `gen_ai.operation.name`, `FirstNexus.provider`, `FirstNexus.model`, `FirstNexus.api`, `FirstNexus.transport`
  - `FirstNexus.errorCategory` and optional `FirstNexus.failureKind` on errors
  - `FirstNexus.model_call.request_bytes`, `FirstNexus.model_call.response_bytes`, `FirstNexus.model_call.time_to_first_byte_ms`
  - `FirstNexus.provider.request_id_hash` (bounded SHA-based hash of the upstream provider request id; raw ids are not exported)
- `FirstNexus.harness.run`
  - `FirstNexus.harness.id`, `FirstNexus.harness.plugin`, `FirstNexus.outcome`, `FirstNexus.provider`, `FirstNexus.model`, `FirstNexus.channel`
  - On completion: `FirstNexus.harness.result_classification`, `FirstNexus.harness.yield_detected`, `FirstNexus.harness.items.started`, `FirstNexus.harness.items.completed`, `FirstNexus.harness.items.active`
  - On error: `FirstNexus.harness.phase`, `FirstNexus.errorCategory`, optional `FirstNexus.harness.cleanup_failed`
- `FirstNexus.tool.execution`
  - `gen_ai.tool.name`, `FirstNexus.toolName`, `FirstNexus.errorCategory`, `FirstNexus.tool.params.*`
- `FirstNexus.exec`
  - `FirstNexus.exec.target`, `FirstNexus.exec.mode`, `FirstNexus.outcome`, `FirstNexus.failureKind`, `FirstNexus.exec.command_length`, `FirstNexus.exec.exit_code`, `FirstNexus.exec.timed_out`
- `FirstNexus.webhook.processed`
  - `FirstNexus.channel`, `FirstNexus.webhook`
- `FirstNexus.webhook.error`
  - `FirstNexus.channel`, `FirstNexus.webhook`, `FirstNexus.error`
- `FirstNexus.message.processed`
  - `FirstNexus.channel`, `FirstNexus.outcome`, `FirstNexus.reason`
- `FirstNexus.message.delivery`
  - `FirstNexus.channel`, `FirstNexus.delivery.kind`, `FirstNexus.outcome`, `FirstNexus.errorCategory`, `FirstNexus.delivery.result_count`
- `FirstNexus.session.stuck`
  - `FirstNexus.state`, `FirstNexus.ageMs`, `FirstNexus.queueDepth`
- `FirstNexus.context.assembled`
  - `FirstNexus.prompt.size`, `FirstNexus.history.size`, `FirstNexus.context.tokens`, `FirstNexus.errorCategory` (no prompt, history, response, or session-key content)
- `FirstNexus.tool.loop`
  - `FirstNexus.toolName`, `FirstNexus.outcome`, `FirstNexus.iterations`, `FirstNexus.errorCategory` (no loop messages, params, or tool output)
- `FirstNexus.memory.pressure`
  - `FirstNexus.memory.level`, `FirstNexus.memory.heap_used_bytes`, `FirstNexus.memory.rss_bytes`

When content capture is explicitly enabled, model and tool spans can also
include bounded, redacted `FirstNexus.content.*` attributes for the specific
content classes you opted into.

## Diagnostic event catalog

The events below back the metrics and spans above. Plugins can also subscribe
to them directly without OTLP export.

**Model usage**

- `model.usage` - tokens, cost, duration, context, provider/model/channel,
  session ids. `usage` is provider/turn accounting for cost and telemetry;
  `context.used` is the current prompt/context snapshot and can be lower than
  provider `usage.total` when cached input or tool-loop calls are involved.

**Message flow**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**Queue and session**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (aggregate counters: webhooks/queue/session)

**Harness lifecycle**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` -
  per-run lifecycle for the agent harness. Includes `harnessId`, optional
  `pluginId`, provider/model/channel, and run id. Completion adds
  `durationMs`, `outcome`, optional `resultClassification`, `yieldDetected`,
  and `itemLifecycle` counts. Errors add `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory`, and
  optional `cleanupFailed`.

**Exec**

- `exec.process.completed` - terminal outcome, duration, target, mode, exit
  code, and failure kind. Command text and working directories are not
  included.

## Without an exporter

You can keep diagnostics events available to plugins or custom sinks without
running `diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

For targeted debug output without raising `logging.level`, use diagnostics
flags. Flags are case-insensitive and support wildcards (e.g. `telegram.*` or
`*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

Or as a one-off env override:

```bash
NEXISCLAW_DIAGNOSTICS=telegram.http,telegram.payload FirstNexus gateway
```

Flag output goes to the standard log file (`logging.file`) and is still
redacted by `logging.redactSensitive`. Full guide:
[Diagnostics flags](/diagnostics/flags).

## Disable

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

You can also leave `diagnostics-otel` out of `plugins.allow`, or run
`FirstNexus plugins disable diagnostics-otel`.

## Related

- [Logging](/logging) - file logs, console output, CLI tailing, and the Control UI Logs tab
- [Gateway logging internals](/gateway/logging) - WS log styles, subsystem prefixes, and console capture
- [Diagnostics flags](/diagnostics/flags) - targeted debug-log flags
- [Diagnostics export](/gateway/diagnostics) - operator support-bundle tool (separate from OTEL export)
- [Configuration reference](/gateway/configuration-reference#diagnostics) - full `diagnostics.*` field reference
