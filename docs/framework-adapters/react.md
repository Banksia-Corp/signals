# React Adapter

The `@banksia/signals/react` subpath provides hooks and Higher-Order Components (HOCs) to seamlessly integrate `@banksia/signals` into React 18 and React 19 applications.

---

## Installation

```bash
pnpm add @banksia/signals react react-dom
```

---

## `useReactive(store)`

Subscribes the host component to changes within a reactive object, collection, signal, or domain store instance:

```tsx
import React from "react";
import { useReactive } from "@banksia/signals/react";
import { cartStore } from "./stores/cart-store";

export const CartSummary: React.FC = () => {
  // Component re-renders whenever cartStore properties mutate:
  const cart = useReactive(cartStore);

  return (
    <div className="cart-card">
      <h3>Items in cart: {cart.items.length}</h3>
      <p>Total: ${cart.total.toFixed(2)}</p>
      <button
        onClick={() =>
          cart.addItem({
            id: "sku-1",
            name: "Notebook",
            price: 12.5,
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

## `observer(Component)`

Transforms any functional component into an auto-tracking reactive observer. Any signal, computed, or reactive proxy property read during render automatically becomes a tracked dependency:

```tsx
import React from "react";
import { observer } from "@banksia/signals/react";
import { userSession } from "./stores/user-session";

export const UserBadge = observer(() => {
  return (
    <div className="badge">
      <span>{userSession.user.name}</span>
      {userSession.isAdmin && <span className="admin-tag">Admin</span>}
    </div>
  );
});
```

---

## `useSignal(initialValue)`

Creates and memoizes a component-local `Signal` tied to the lifecycle of the host React component:

```tsx
import React from "react";
import { useSignal } from "@banksia/signals/react";

export const LocalCounter: React.FC = () => {
  const count = useSignal(0);

  return <button onClick={() => count.value++}>Count: {count.value}</button>;
};
```

---

## `useComputed(fn)`

Creates and memoizes a derived `computed()` computation within a React component:

```tsx
import React from "react";
import { useSignal, useComputed } from "@banksia/signals/react";

export const MathWidget: React.FC = () => {
  const count = useSignal(2);
  const squared = useComputed(() => count.value * count.value);

  return (
    <div>
      <p>Base: {count.value}</p>
      <p>Squared: {squared.value}</p>
      <button onClick={() => count.value++}>Increment</button>
    </div>
  );
};
```

---

## TypeScript Signatures

```typescript
export function useReactive<T extends object>(target: T): T;
export function observer<P extends object>(
  Component: React.ComponentType<P>,
): React.FC<P>;
export function useSignal<T>(initialValue: T): Signal<T>;
export function useComputed<T>(fn: () => T): ReadonlySignal<T>;
```
