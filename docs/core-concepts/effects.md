# Effects

An **Effect** creates a reactive observer that runs an arbitrary side-effect function whenever its dependencies change.

---

## Basic Usage

```typescript
import { signal, effect } from "@banksia/signals";

const theme = signal<"light" | "dark">("light");

// Effect executes synchronously on registration to establish initial dependencies:
const dispose = effect(() => {
  document.body.className = `theme-${theme.value}`;
  console.log(`Updated theme to: ${theme.value}`);
}, "themeWatcher");

// Subsequent mutations schedule execution via the microtask scheduler:
theme.value = "dark";
```

---

## Execution Lifecycle

An effect in `@banksia/signals` follows a predictable dual-phase execution model:

1. **Initial Synchronous Registration**: When `effect(fn)` is called, `fn` executes **immediately and synchronously** on the current tick. This captures the active set of reactive dependencies.
2. **Microtask-Batched Invalidation**: When any captured dependency mutates subsequently, the effect is flagged and queued in the microtask batch scheduler. Multiple mutations across signals or proxy properties in the same tick trigger only a single re-execution.

---

## Automatic Edge Tracking & Dynamic Branches

Dependencies are tracked dynamically during each execution turn. If an effect follows a conditional branch, dependencies that are no longer accessed are automatically pruned from the active graph:

```typescript
const showDetails = signal(false);
const detailText = signal("Secret information");

effect(() => {
  if (showDetails.value) {
    console.log(detailText.value);
  } else {
    console.log("Hidden");
  }
});

// While `showDetails` is false, modifying `detailText` will NOT trigger the effect:
detailText.value = "Updated secret"; // No reaction

// Flipping `showDetails` to true activates dynamic tracking of `detailText`:
showDetails.value = true; // Triggers reaction!
detailText.value = "New secret"; // Now triggers reaction!
```

---

## Cleanup & Teardown Patterns

If an effect acquires resources (e.g. attaching DOM event listeners, starting timers, or opening WebSocket connections), the callback can return a cleanup function:

```typescript
import { signal, effect } from "@banksia/signals";

const socketUrl = signal("wss://api.example.com/feed");

const stop = effect(() => {
  const ws = new WebSocket(socketUrl.value);

  ws.onmessage = (event) => {
    console.log("Message received:", event.data);
  };

  // Return teardown function:
  return () => {
    ws.close();
    console.log("Closed WebSocket connection");
  };
});
```

The returned cleanup function is invoked:

1. Immediately before the next re-execution of the effect.
2. When the effect is explicitly cancelled via the returned `DisposeFn` (`stop()`).

---

## TypeScript Signatures

```typescript
export type EffectFn = () => void | (() => void);
export type DisposeFn = () => void;

export function effect(fn: EffectFn, name?: string): DisposeFn;
```
