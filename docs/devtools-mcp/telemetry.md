# Telemetry & Observability Architecture

The observability engine in `@banksia/signals` provides deterministic insight into the reactive dependency graph and lifecycle changes with near-zero overhead when inactive.

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
│   - onRead / onTrack                                        │
│   - onWrite / onNotify                                      │
│   - onBatchStart / onBatchEnd                               │
│   - onExecute (start / end / error)                         │
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

## Event Payload Types

### `ChangeEvent<T>`

Dispatched when a reactive signal, proxy property, or collection item changes:

| Field       | Type                | Description                      |
| :---------- | :------------------ | :------------------------------- |
| `source`    | `ReactiveSource<T>` | The source node descriptor       |
| `oldValue`  | `T`                 | Value before mutation            |
| `newValue`  | `T`                 | Value after mutation             |
| `timestamp` | `number`            | Time in ms (`performance.now()`) |

### `DependencyGraphNode`

Represents a source or consumer node in the active graph:

| Field          | Type               | Description                                        |
| :------------- | :----------------- | :------------------------------------------------- |
| `id`           | `string \| symbol` | Unique node identifier                             |
| `label`        | `string`           | Human-readable diagnostic label                    |
| `type`         | `string`           | `'signal' \| 'property' \| 'computed' \| 'effect'` |
| `dependencies` | `string[]`         | Upstream IDs this node reads                       |
| `subscribers`  | `string[]`         | Downstream consumers observing this node           |

## Sanitization and Security

By default, the DevTools bridge respects privacy boundaries:

- Properties beginning with `_` (e.g. `_internalToken`) are automatically redacted to `'[REDACTED]'`.
- Sources explicitly flagged with `isPrivate: true` are sanitized.
- Pass `sanitizePrivate: false` in `DevToolsOptions` only in trusted local test environments.
