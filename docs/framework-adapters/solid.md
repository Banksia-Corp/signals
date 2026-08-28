# SolidJS Adapter

The `@banksia/signals/solid` subpath bridges `@banksia/signals` domain models into SolidJS's fine-grained reactivity system.

## Installation

```bash
pnpm add @banksia/signals solid-js
```

## `createSolidSignalBridge(target)`

Wraps a reactive object or domain store inside a SolidJS signal accessor. When any tracked property on the target changes, the bridge triggers SolidJS signal notifications, updating dependent JSX nodes surgically:

```tsx
import { Component } from "solid-js";
import { createSolidSignalBridge } from "@banksia/signals/solid";
import { counterStore } from "./stores/counter-store";

export const CounterView: Component = () => {
  const store = createSolidSignalBridge(counterStore);

  return (
    <div>
      <p>Count: {store().count}</p>
      <button onClick={() => store().increment()}>Increment</button>
    </div>
  );
};
```

## Automatic Cleanup

The bridge automatically registers a teardown handler with Solid's `onCleanup()`:

- When the parent component unmounts or its reactive root is disposed, the underlying `@banksia/signals` effect is disconnected automatically.
- No dangling subscriptions or memory leaks.
