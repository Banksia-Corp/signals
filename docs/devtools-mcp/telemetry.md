# Telemetry & Observability Architecture

The observability engine in `@banksia/signals` provides deterministic insight into the reactive dependency graph and state mutations with near-zero overhead when inactive.

---

## Telemetry Event Pipeline

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
│   Global DevTools Bridge    │ │    Custom Telemetry Hubs    │
│  - Ring Buffer (FIFO)       │ │  - createReactivityHub()    │
│  - Private field redaction  │ │  - Metrics & OpenTelemetry  │
│  - MCP inspector window     │ │  - Test audit loggers       │
└─────────────────────────────┘ └─────────────────────────────┘
```

---

## DevTools Event Payloads

When the DevTools bridge is initialized, it captures and stores discriminated event payloads in a bounded FIFO ring buffer (default capacity: 500):

### 1. `DevToolsMutationEvent` (`type: "notify"`)

Recorded whenever a reactive signal, proxy property, or collection item mutates:

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

## Sanitization and Security

The DevTools bridge enforces privacy by default so that sensitive keys are not exposed to public telemetry or agent inspection streams:

- **Leading Underscores**: Properties beginning with `_` (e.g. `_sessionKey`, `_refreshToken`) are automatically replaced with `"[REDACTED_PRIVATE]"`.
- **Private Meta Flags**: Sources explicitly labeled with `isPrivate: true` are redacted.
- **Configurable**: Pass `sanitizePrivate: false` in `DevToolsOptions` only in local, trusted testing environments.
