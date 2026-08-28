# Chrome DevTools MCP Recipes

`@banksia/signals/devtools` connects directly to AI agent tooling like Chrome DevTools MCP (`evaluate_script`). This enables LLM coding agents and browser automation scripts to inspect state, trace subscriptions, and verify reactive invariants in real time.

## Initializing the DevTools Bridge

In your application entrypoint (e.g. `main.ts` or `index.tsx`):

```typescript
import { initDevTools } from "@banksia/signals/devtools";

// Mount the bridge globally onto window.__BANKSIA_SIGNALS_DEVTOOLS__
initDevTools({
  maxBufferSize: 500,
  recordNotifyEvents: true,
  recordExecuteEvents: true,
  recordBatchEvents: true,
  sanitizePrivate: true, // redacts leading '_' or isPrivate: true properties
});
```

---

## Agent Recipe 1: Inspecting the Live State Snapshot

Query current reactive state snapshots across all registered stores without creating any reactive dependency edges:

```json
{
  "ServerName": "chrome-devtools",
  "ToolName": "evaluate_script",
  "Arguments": {
    "expression": "window.__BANKSIA_SIGNALS_DEVTOOLS__.getStateSnapshot()"
  }
}
```

Example result:

```json
{
  "UserStore": {
    "name": "Grace Hopper",
    "authenticated": true,
    "role": "admin"
  },
  "CartStore": {
    "items": [{ "id": "p1", "price": 10, "quantity": 2 }],
    "total": 20
  }
}
```

---

## Agent Recipe 2: Inspecting Dependency Graph Topology

Discover which reactive sources are feeding into which consumers (effects, computed values, or framework adapters):

```json
{
  "ServerName": "chrome-devtools",
  "ToolName": "evaluate_script",
  "Arguments": {
    "expression": "window.__BANKSIA_SIGNALS_DEVTOOLS__.getDependencyGraph()"
  }
}
```

Returns nodes, edges, dependency depths, and subscriber lists.

---

## Agent Recipe 3: Reading Recent Mutation Events

Audit the most recent state changes recorded in the in-memory ring buffer:

```json
{
  "ServerName": "chrome-devtools",
  "ToolName": "evaluate_script",
  "Arguments": {
    "expression": "window.__BANKSIA_SIGNALS_DEVTOOLS__.getRecentEvents({ limit: 10 })"
  }
}
```

Example output:

```json
[
  {
    "type": "notify",
    "label": "CartStore.items",
    "oldValue": 1,
    "newValue": 2,
    "timestamp": 1724901234567
  }
]
```

---

## Agent Recipe 4: Profiling Microtask Batch Performance

Check scheduler batching efficiency, average batch duration, and total coalesced events:

```json
{
  "ServerName": "chrome-devtools",
  "ToolName": "evaluate_script",
  "Arguments": {
    "expression": "window.__BANKSIA_SIGNALS_DEVTOOLS__.getBatchStats()"
  }
}
```
