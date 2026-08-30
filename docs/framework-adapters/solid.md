# SolidJS Adapter

The `@banksia/signals/solid` subpath bridges `@banksia/signals` domain models into SolidJS's fine-grained reactivity system.

---

## Installation

```bash
pnpm add @banksia/signals solid-js
```

---

## `createSolidSignalBridge(target)`

Wraps a reactive object or domain store inside a SolidJS signal accessor. When any tracked property on the target changes, the bridge triggers SolidJS signal notifications, updating dependent JSX nodes surgically without Virtual DOM reconciliation:

```tsx
import { Component } from "solid-js";
import { createSolidSignalBridge } from "@banksia/signals/solid";
import { cartStore } from "./stores/cart-store";

export const CartView: Component = () => {
  // Wrap the domain store in a Solid accessor:
  const cart = createSolidSignalBridge(cartStore);

  return (
    <div class="cart-container">
      <h2>Shopping Cart ({cart().items.length} items)</h2>
      <p>Total: ${cart().total.toFixed(2)}</p>
      <button
        onClick={() =>
          cart().addItem({
            id: "sku-2",
            name: "Mouse",
            price: 29.99,
            quantity: 1,
          })
        }
      >
        Add Item
      </button>
    </div>
  );
};
```

---

## Automatic Cleanup

The bridge automatically registers a teardown handler with Solid's `onCleanup()`:

- When the enclosing component unmounts or its reactive root is disposed, the underlying `@banksia/signals` effect is disconnected automatically.
- Prevents dangling subscriptions and memory leaks across route transitions.

---

## TypeScript Signatures

```typescript
export function createSolidSignalBridge<T extends object>(target: T): () => T;
```
