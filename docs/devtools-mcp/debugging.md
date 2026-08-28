# Runtime Debugging

Debugging fine-grained reactive applications can be challenging when state mutations cascade unexpectedly or cause circular loops. `@banksia/signals` includes built-in cycle detection and diagnostic hooks.

## Circular Dependency Detection

If an effect mutates a state property that it also reads, infinite loops can freeze the JavaScript thread. `@banksia/signals` tracks recursion depth within the microtask scheduler:

```typescript
import { signal, effect } from "@banksia/signals";

const count = signal(0);

// Potential infinite loop:
effect(() => {
  console.log(count.value);
  count.value++; // Attempting immediate recursive mutation
});
```

When recursion exceeds threshold limits, the scheduler halts execution, logs a diagnostic stack trace identifying the cycle, and dispatches an `onExecute` error event to registered telemetry hubs.

## Manual State Inspection via Browser Console

Once initialized via `initDevTools()`, you can interact with the runtime bridge directly in Chrome / Edge / Firefox developer tools:

```javascript
// Access the inspector:
const dt = window.__BANKSIA_SIGNALS_DEVTOOLS__;

// Print all registered stores:
console.table(dt.getStateSnapshot());

// Print all recent mutations:
console.table(dt.getRecentEvents());

// Trace graph connections:
console.log(dt.getDependencyGraph());
```

## Performance Overhead

When DevTools or telemetry hooks are not active, internal dispatch checks are guarded by boolean flags. You can run `@banksia/signals` in production environments with confidence that observability code introduces no meaningful runtime penalty.
