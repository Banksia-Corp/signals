# Philosophy & The Five Pillars

`@banksia/signals` is built on five core principles engineered for predictability, maximum runtime throughput, and developer ergonomics.

---

## 1. Zero-Boilerplate Proxy Traps

State is accessed and mutated using standard JavaScript object and array syntax:

```typescript
const state = makeReactive({
  user: { name: "Alice", active: true },
  tags: ["admin", "editor"],
});

// Direct property reads track dependency edges dynamically:
console.log(state.user.name);

// Direct property writes automatically schedule reactive updates:
state.user.name = "Bob";
state.tags.push("maintainer");
```

There are no wrapper calls (`state.user.name.set('Bob')`), no actions, and no reducers required for normal mutations.

---

## 2. Constructor Self-Reactivity (`return makeReactive(this)`)

Domain stores remain pure, idiomatic TypeScript classes. There is no need for base classes, decorators, or compiler plugins:

```typescript
export class CartStore {
  items: { id: string; price: number; quantity: number }[] = [];

  constructor() {
    return makeReactive(this);
  }

  addItem(item: { id: string; price: number; quantity: number }) {
    this.items.push(item);
  }

  get total(): number {
    return this.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  }
}
```

Returning `makeReactive(this)` in the constructor returns an ES6 Proxy wrap of the class instance while retaining full prototype methods, getters, and `instanceof` fidelity.

---

## 3. Automatic Microtask Batching

Synchronous state mutations are automatically coalesced into a single microtask turn:

```typescript
import { makeReactive, effect } from "@banksia/signals";

const store = makeReactive({ firstName: "John", lastName: "Doe" });

effect(() => {
  console.log(`Full name: ${store.firstName} ${store.lastName}`);
});

// Mutating multiple properties in one synchronous block:
store.firstName = "Jane";
store.lastName = "Smith";
// Effect triggers only ONCE at the end of the microtask queue!
```

To flush pending updates synchronously when needed (e.g. before taking DOM layout measurements), call `flushBatch()`.

---

## 4. Deep Granular Collection Traps

Collections like `Array`, `Map`, and `Set` are deeply wrapped with custom proxies that trap both mutating methods and structural inspections:

- **`Array`**: `.push()`, `.pop()`, `.shift()`, `.unshift()`, `.splice()`, `.sort()`, `.reverse()`, `.length`, and indexed mutations.
- **`Map`**: `.set()`, `.get()`, `.has()`, `.delete()`, `.clear()`, `.keys()`, `.values()`, `.entries()`, `.size`.
- **`Set`**: `.add()`, `.has()`, `.delete()`, `.clear()`, `.keys()`, `.values()`, `.entries()`, `.size`.

Reactions are triggered surgically only for subscribers observing the specific modified keys, indices, or iterators.

---

## 5. Decoupled Multi-Framework UI Layer

Domain models are completely decoupled from UI presentation. The same domain store instance can drive a React component, a Lit Web Component, a SolidJS app, or a vanilla micro-frontend:

```typescript
// Shared domain store instance:
export const authStore = new AuthStore();

// React:
const { user } = useReactive(authStore);

// Lit:
private auth = new SignalsController(this, authStore);

// SolidJS:
const user = createSolidSignalBridge(() => authStore.user);

// Vanilla JS:
bindText(element, () => authStore.user.name);
```
