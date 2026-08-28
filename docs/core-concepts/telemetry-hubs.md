# Telemetry & Hubs

`@banksia/signals` features a first-class observability pipeline. You can monitor read and write operations, inspect dependency graph edges, detect circular update cascades, and route telemetry events to DevTools or remote monitors.

## Global Reactivity Hooks (`registerReactivityHooks`)

Register global callbacks to trace all reactive lifecycle events across the engine:

```typescript
import { registerReactivityHooks } from "@banksia/signals";

const unregister = registerReactivityHooks({
  onRead(source) {
    console.log(`[READ] ${source.meta.label}`);
  },
  onWrite(change) {
    console.log(
      `[WRITE] ${change.source.meta.label}:`,
      change.oldValue,
      "->",
      change.newValue,
    );
  },
  onCompute(computedInfo) {
    console.log(`[COMPUTE] ${computedInfo.label} evaluated`);
  },
  onBatchStart() {
    console.log("[BATCH] Transaction started");
  },
  onBatchEnd() {
    console.log("[BATCH] Transaction completed");
  },
});

// To disconnect hooks later:
unregister();
```

## Target-Scoped Observation (`observe`)

To track lifecycle mutations on a specific reactive object or store without setting up global hooks, use `observe()`:

```typescript
import { makeReactive, observe } from "@banksia/signals";

class UserSession {
  username = "guest";
  isAuthenticated = false;

  constructor() {
    return makeReactive(this);
  }
}

const session = new UserSession();

const unsubscribe = observe(session, (event) => {
  console.log(
    `Property '${String(event.property)}' changed:`,
    event.oldValue,
    "->",
    event.newValue,
  );
});

session.username = "alex"; // Logs change
session.isAuthenticated = true; // Logs change

unsubscribe(); // Stop observing
```

## Dedicated Telemetry Hubs (`createReactivityHub`)

For modular telemetry routing, audit logs, or AI agent tool interfaces, create an isolated `ReactivityHub`:

```typescript
import { createReactivityHub } from "@banksia/signals";

const hub = createReactivityHub({
  name: "analytics-hub",
  bufferCapacity: 250, // Circular buffer size for recent events
});

hub.on("write", (event) => {
  // Process mutation event
});

// Retrieve recent event history for debugging or test assertions:
const recentEvents = hub.getSnapshot();

// Clear buffer or disconnect:
hub.clear();
hub.dispose();
```
