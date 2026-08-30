# Chrome DevTools MCP Recipes

`@banksia/signals/devtools` connects directly to AI agent tooling such as Chrome DevTools MCP (`evaluate_script`). This enables LLM coding agents and browser automation scripts to inspect state, trace subscriptions, and verify reactive invariants in real time—without triggering reactive side effects or creating phantom dependency edges.

---

## Initializing the DevTools Bridge

In your application entrypoint (e.g. `main.ts` or `index.tsx`):

```typescript
import { initDevTools } from "@banksia/signals/devtools";
import { userStore } from "./stores/user-store";
import { cartStore } from "./stores/cart-store";

// Mount the bridge onto window.__BANKSIA_SIGNALS_DEVTOOLS__
const devtools = initDevTools({
  maxBufferSize: 500,
  recordNotifyEvents: true,
  recordExecuteEvents: true,
  recordBatchEvents: true,
  sanitizePrivate: true, // Redacts leading '_' or isPrivate: true properties
});

// Register domain stores with recognizable names for indexing:
devtools.registerTarget(userStore, "UserStore");
devtools.registerTarget(cartStore, "CartStore");
```

---

## Agent Recipe 1: Inspecting Sandboxed State

Query current reactive state snapshots in an isolated, untracked execution sandbox:

```json
{
  "ServerName": "chrome-devtools",
  "ToolName": "evaluate_script",
  "Arguments": {
    "expression": "window.__BANKSIA_SIGNALS_DEVTOOLS__.inspectState('UserStore')"
  }
}
```

Example result:

```json
{
  "name": "Grace Hopper",
  "authenticated": true,
  "role": "admin",
  "_authToken": "[REDACTED_PRIVATE]"
}
```

To retrieve both state and the subscriber dependency graph for a target simultaneously, call `inspectTarget('UserStore')`.

---

## Agent Recipe 2: Inspecting Dependency Graph Topology

Discover which reactive targets and properties currently have active subscribers:

```json
{
  "ServerName": "chrome-devtools",
  "ToolName": "evaluate_script",
  "Arguments": {
    "expression": "window.__BANKSIA_SIGNALS_DEVTOOLS__.inspectGraph()"
  }
}
```

Example result:

```json
{
  "UserStore": {
    "targetName": "UserStore",
    "properties": {
      "name": { "subscriberCount": 2 },
      "authenticated": { "subscriberCount": 1 }
    }
  },
  "CartStore": {
    "targetName": "CartStore",
    "properties": {
      "items": { "subscriberCount": 3 }
    }
  }
}
```

---

## Agent Recipe 3: Reading Recent Mutation Events

Audit the most recent state mutations captured in the in-memory ring buffer:

```json
{
  "ServerName": "chrome-devtools",
  "ToolName": "evaluate_script",
  "Arguments": {
    "expression": "window.__BANKSIA_SIGNALS_DEVTOOLS__.getRecentMutations(5)"
  }
}
```

Example output:

```json
[
  {
    "type": "notify",
    "label": "CartStore.items",
    "property": "items",
    "oldValue": 1,
    "newValue": 2,
    "timestamp": 1755834720123
  }
]
```

To filter across all telemetry event types (e.g. `execute`, `batch`, or `error`), use `getRecentEvents({ limit: 10, type: "error" })`.

---

## Agent Recipe 4: Profiling Scheduler & Execution Performance

Query aggregate scheduler performance metrics, including batch counts, mutation totals, and average computation durations:

```json
{
  "ServerName": "chrome-devtools",
  "ToolName": "evaluate_script",
  "Arguments": {
    "expression": "window.__BANKSIA_SIGNALS_DEVTOOLS__.getPerformanceMetrics()"
  }
}
```

Example output:

```json
{
  "totalBatches": 18,
  "totalMutations": 54,
  "totalExecutions": 112,
  "totalExecutionDurationMs": 28.4,
  "averageExecutionDurationMs": 0.25,
  "maxExecutionDurationMs": 1.42,
  "errorCount": 0
}
```
