# Observability

Observability is a first-class architectural primitive in `@banksia/signals`. Rather than relying on heavyweight profiler plugins or monkey-patching methods at runtime, the core reactivity engine and microtask scheduler emit low-level, deterministic lifecycle events that can be consumed by any medium:

- **Browser DevTools**: Inspect state, trace dependency graph topology, and review mutation histories via `window.__BANKSIA_SIGNALS_DEVTOOLS__`.
- **Agentic MCP Tooling**: Connect autonomous LLM coding agents via the [Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp) to safely audit state snapshots and verify reactive invariants.
- **Stream-Based Telemetry & APM**: Route mutation events and performance durations to OpenTelemetry, Datadog, Prometheus, or custom logging pipelines.
- **Analytical & Testing Engines**: Create targeted audit loggers to enforce domain model invariants and track transactional state transitions in unit and integration test suites.

---

## How Observability Works

Observability in `@banksia/signals` is powered by six deterministic lifecycle hooks that fire throughout the reactive execution cycle:

1. **`onTrack(source, consumer)`**: Fired when a consumer (an `effect` or `computed`) reads a reactive property, capturing the active dependency edge between the state source and consumer.
2. **`onNotify(source, change)`**: Fired synchronously whenever a state property or collection item mutates, providing `{ oldValue, newValue, timestamp }` before downstream reactions execute.
3. **`onSchedule(consumer)`**: Fired when a subscriber is flagged dirty and queued into the microtask batch scheduler.
4. **`onExecute(consumer, context)`**: Fired immediately before (`phase: "start"`) and after (`phase: "end"`) an effect or computed evaluation, measuring execution duration in milliseconds and tracking execution errors.
5. **`onBatch(stats)`**: Fired across scheduler microtask cycles (`phase: "start" | "flush" | "end"`), reporting queued subscriber depths and batch transaction sizes.
6. **`onError(error, context)`**: Fired when circular dependencies, infinite mutation cascades, or runtime exceptions occur.

When no hooks or DevTools bridges are registered, the engine uses **fast-path boolean counters** to completely bypass metadata creation and event dispatch. Unobserved production deployments incur zero string allocations, zero object cloning, and zero runtime performance overhead.

---

## Universal Telemetry Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│                    Reactive Operation                       │
│    (property read, signal write, collection mutation)       │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 Internal Hooks Dispatcher                   │
│   - onTrack (dependency edge registered)                    │
│   - onNotify (mutation invalidation triggered)              │
│   - onSchedule (subscriber queued in batch)                 │
│   - onExecute (consumer execution start / end)              │
│   - onBatch (scheduler batch start / flush / end)           │
│   - onError (uncaught exception handling)                   │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼                              ▼
┌─────────────────────────────┐ ┌─────────────────────────────┐
│    DevTools & Agent Bridge  │ │    Custom Telemetry Hubs    │
│  - Ring Buffer (FIFO)       │ │  - createReactivityHub()    │
│  - Private field redaction  │ │  - Metrics & OpenTelemetry  │
│  - Chrome DevTools MCP      │ │  - Stream analytical engines│
│  - Sandboxed State Queries  │ │  - Test audit loggers       │
└─────────────────────────────┘ └─────────────────────────────┘
```

---

## How to Hook into Observability Primitives

Developers can tap into observability across four different levels of granularity:

### 1. Global Lifecycle Hooks (`registerReactivityHooks`)

Attach system-wide listeners to pipe reactivity events into APM tools, logging platforms, or metrics aggregators:

```typescript
import { registerReactivityHooks } from "@banksia/signals";

const unsubscribe = registerReactivityHooks({
  // Track dependency edges:
  onTrack(source, consumer) {
    console.debug(`[Track] ${consumer.name} -> ${source.meta.label}`);
  },

  // Monitor property mutations:
  onNotify(source, change) {
    console.log(
      `[Mutation] ${source.meta.label}:`,
      change.oldValue,
      "➜",
      change.newValue,
    );
  },

  // Profile execution performance:
  onExecute(consumer, context) {
    if (context.phase === "end") {
      console.debug(`[Executed] ${consumer.name} in ${context.durationMs}ms`);
    }
  },

  // Monitor batch scheduler flushes:
  onBatch(stats) {
    if (stats.phase === "flush") {
      console.debug(`[Batch] Flushed ${stats.flushedCount} reactive reactions`);
    }
  },

  // Catch reactive errors and circular loops:
  onError(error, context) {
    console.error(`[Reactivity Error in ${context.phase}]`, error);
  },
});

// Teardown hooks when done:
unsubscribe();
```

---

### 2. Target-Scoped Observers (`observe`)

Monitor mutations and dependency tracking for a specific domain model or store instance without noise from the rest of the application:

```typescript
import { observe, makeReactive } from "@banksia/signals";

const cartStore = makeReactive({ items: [], total: 0 });

const stopObserving = observe(cartStore, {
  onNotify(source, change) {
    auditLogger.record({
      target: source.meta.targetName,
      field: source.meta.property,
      oldValue: change.oldValue,
      newValue: change.newValue,
      timestamp: change.timestamp,
    });
  },
});
```

---

### 3. Dedicated Telemetry Hubs (`createReactivityHub`)

Create isolated, filterable telemetry pipelines with custom predicates (e.g. routing only public properties or specific event types):

```typescript
import { createReactivityHub } from "@banksia/signals";

// Create a hub that filters out private or internal domain properties:
const publicAnalyticsHub = createReactivityHub({
  filter: (source) => !source.meta.isPrivate,
});

publicAnalyticsHub.use({
  onNotify(source, change) {
    analyticsClient.track("State Change", {
      property: source.meta.label,
      value: change.newValue,
    });
  },
});

// Clear all attached hub hooks:
publicAnalyticsHub.clear();
```

---

### 4. DevTools & Agentic MCP Bridge (`initDevTools`)

Mount the runtime inspection bridge on `window.__BANKSIA_SIGNALS_DEVTOOLS__` for browser DevTools and AI coding agents:

```typescript
import { initDevTools } from "@banksia/signals/devtools";
import { userStore } from "./stores/user-store";
import { cartStore } from "./stores/cart-store";

const devtools = initDevTools({
  maxBufferSize: 500, // Bounded FIFO ring buffer capacity
  recordNotifyEvents: true, // Record property mutations
  recordExecuteEvents: true, // Profile effect & computed runtimes
  recordBatchEvents: true, // Track scheduler flushes
  sanitizePrivate: true, // Automatically redact private fields
});

// Register domain stores with recognizable names for indexing:
devtools.registerTarget(userStore, "UserStore");
devtools.registerTarget(cartStore, "CartStore");
```

---

## DevTools Event Payloads

When the DevTools bridge is active, it records discriminated event payloads into its bounded FIFO ring buffer:

### 1. `DevToolsMutationEvent` (`type: "notify"`)

Recorded whenever a reactive signal, property, or collection item mutates:

| Field       | Type       | Description                                        |
| :---------- | :--------- | :------------------------------------------------- |
| `type`      | `"notify"` | Discriminator identifier                           |
| `label`     | `string`   | Source diagnostic label (e.g. `'CartStore.items'`) |
| `property`  | `string`   | Property key or symbol that changed                |
| `oldValue`  | `unknown`  | Sanitized previous value                           |
| `newValue`  | `unknown`  | Sanitized updated value                            |
| `timestamp` | `number`   | High-resolution epoch timestamp (ms)               |

### 2. `DevToolsExecuteEvent` (`type: "execute"`)

Recorded before and after an effect or computed signal runs:

| Field          | Type               | Description                                |
| :------------- | :----------------- | :----------------------------------------- |
| `type`         | `"execute"`        | Discriminator identifier                   |
| `consumerName` | `string`           | Diagnostic name of the consumer            |
| `consumerType` | `string`           | `'effect' \| 'computed' \| 'adapter'`      |
| `phase`        | `"start" \| "end"` | Execution lifecycle phase                  |
| `durationMs`   | `number?`          | Duration in milliseconds (provided on end) |
| `timestamp`    | `number`           | High-resolution epoch timestamp (ms)       |

### 3. `DevToolsBatchEvent` (`type: "batch"`)

Recorded during scheduler microtask batch cycles:

| Field          | Type                          | Description                                 |
| :------------- | :---------------------------- | :------------------------------------------ |
| `type`         | `"batch"`                     | Discriminator identifier                    |
| `phase`        | `"start" \| "flush" \| "end"` | Batch lifecycle phase                       |
| `flushedCount` | `number?`                     | Number of reactions notified (on `"flush"`) |
| `timestamp`    | `number`                      | High-resolution epoch timestamp (ms)        |

---

## Sanitization and Privacy

The observability engine enforces privacy by default so sensitive credentials or secrets are never leaked into public telemetry or inspection streams:

- **Leading Underscores**: Properties beginning with `_` (e.g. `_sessionKey`, `_refreshToken`) are automatically replaced with `"[REDACTED_PRIVATE]"`.
- **Private Meta Flags**: Sources explicitly labeled with `isPrivate: true` are redacted.
- **Configurable**: Pass `sanitizePrivate: false` in `DevToolsOptions` for trusted, local debugging environments.
