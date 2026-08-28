# Effects

An **Effect** creates a reactive observer that runs an arbitrary side-effect function whenever its dependencies change.

## Basic Usage

```typescript
import { signal, effect } from "@banksia/signals";

const theme = signal<"light" | "dark">("light");

const dispose = effect(() => {
  document.body.className = `theme-${theme.value}`;
  console.log(`Updated theme to: ${theme.value}`);
});

theme.value = "dark"; // Runs asynchronously via microtask scheduler
```

## Automatic Edge Tracking & Dynamic Branches

Dependencies are dynamically tracked during each execution. If an effect takes a conditional branch, subscriptions adapt automatically:

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
showDetails.value = true; // Reacts!
detailText.value = "New secret"; // Now reacts!
```

## Cleanup & Teardown

If an effect performs setup work (e.g. attaching event listeners, starting timers, or establishing WebSocket connections), you can return a cleanup function:

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

1. Immediately before the next execution of the effect.
2. When the effect is explicitly disposed via `stop()`.

## TypeScript Signatures

```typescript
export type CleanupFunction = () => void;
export type EffectCallback = () => void | CleanupFunction;

export function effect(callback: EffectCallback): () => void;
```
