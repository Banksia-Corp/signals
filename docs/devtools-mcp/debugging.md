# Runtime Debugging

Debugging fine-grained reactive applications can be challenging when state mutations cascade unexpectedly or cause recursion cycles. `@banksia/signals` includes built-in cycle safeguards, console debug helpers, and diagnostic inspector hooks.

---

## Circular Dependency Safeguards

If an effect directly mutates a state property that it also reads synchronously, an infinite loop would normally freeze the JavaScript main thread. `@banksia/signals` tracks active reentrancy within the scheduler:

```typescript
import { signal, effect } from "@banksia/signals";

const count = signal(0);

// Dangerous direct recursion:
effect(() => {
  console.log(count.value);
  count.value++; // Attempting immediate recursive mutation
});
```

When circular invalidation cascades occur, the scheduler catches the exception, reports a diagnostic stack trace identifying the offending reactive consumer and source, and routes an `onError` event to active telemetry listeners and the DevTools bridge.

---

## Console Tracing with `configureSignalsDebug`

For rapid local debugging without setting up custom telemetry hubs, enable built-in console logging:

```typescript
import { configureSignalsDebug } from "@banksia/signals";

// Enable automatic mutation logging to console:
configureSignalsDebug({
  enableLogging: true,
  traceBatches: true,
});
```

Every property mutation across your application will print diagnostic logs to the browser console:

```
[Signals Mutation] CartStore.items: 0 -> 1
```

---

## Interactive Browser Console Inspection

Once initialized via `initDevTools()`, you can interact with the runtime bridge directly in Chrome, Edge, or Firefox DevTools console via `window.__BANKSIA_SIGNALS_DEVTOOLS__`:

```javascript
// Access the global inspector:
const dt = window.__BANKSIA_SIGNALS_DEVTOOLS__;

// List all registered stores and domain models:
console.table(dt.listRegisteredTargets());

// Inspect state of a specific store:
console.table(dt.inspectState("UserStore"));

// Trace subscriber counts and graph topology:
console.log(dt.inspectGraph("CartStore"));

// View recent mutation history:
console.table(dt.getRecentMutations(10));

// View scheduler performance metrics:
console.table(dt.getPerformanceMetrics());
```

---

## Production Performance Invariant

When DevTools or telemetry hooks are not connected, internal dispatchers are bypassed via boolean count flags (`hasTrackObservers() === false`, etc.). You can deploy `@banksia/signals` to production with confidence that observability hooks incur near-zero overhead.
