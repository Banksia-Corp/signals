# Overview

`@banksia/signals` is an ultra-fast reactivity engine built for the modern web, empowering engineers to build pure domain models that adapt to any framework.

```
┌─────────────────────────────────────────────────────────────┐
│                 Application Domain Layer                    │
│   class UserStore {                                         │
│     constructor() { return makeReactive(this); }            │
│   }                                                         │
└───────────────┬─────────────────────────────────────────────┘
                │ Transparent property access
┌───────────────▼─────────────────────────────────────────────┐
│                  Signals Core Engine                        │
│   - Dependency Graph & Dynamic Edge Tracking                │
│   - Microtask Batch Scheduler (zero layout thrashing)       │
│   - Granular Collection Reactions (Array, Map, Set)         │
│   - Observability Hubs & Universal Telemetry Engine         │
└───────────────┬─────────────────────────────────────────────┘
                │ Surgical notifications
┌───────────────▼─────────────────────────────────────────────┐
│               Framework Integration Layer                   │
│   React       Lit           SolidJS        Vanilla DOM      │
└─────────────────────────────────────────────────────────────┘
```

---

## What Problems Do Signals Solve?

State management often suffers from four fundamental architectural limitations:

1. **Coarse-Grained Re-rendering & Wasteful Computation**: Traditional state models notify subscribers at the whole-component or whole-store level. When a single nested property changes, entire component subtrees re-render and execute unneeded diffing cycles. Signals track dependency edges down to individual property reads, updating only the exact calculations or DOM nodes that depend on that specific value.
2. **Manual Subscription Management & Memory Leaks**: Event-driven and stream-based architectures require manual listener registration, custom unsubscribe logic, and lifecycle hook plumbing. Missing an unsubscription causes insidious memory leaks. Signals dynamically track dependencies only when accessed during execution and automatically tear down unused links.
3. **Boilerplate & Indirection Overhead**: Action creators, string constants, dispatchers, and reducer ceremony introduce cognitive overhead and friction for straightforward state mutations. Signals allow natural reading and writing directly on standard JavaScript objects and classes without ceremony.
4. **State Glitches & Layout Thrashing**: Uncoordinated sequential state mutations cause transient intermediate states ("glitches") and repeated synchronous DOM layout thrashing. Signals coordinate dependency propagation through atomic microtask batching, guaranteeing consistent, single-turn updates.

---

## Why Signals Deliver Maximum Performance

`@banksia/signals` combines the mathematical efficiency of **fine-grained dependency graphs** with the ergonomics of **pure JavaScript state**:

- **Surgical Invalidation**: Updates propagate strictly to active consumers of mutated properties, eliminating full-tree diffing and wasted rendering cycles.
- **Lazy, Memoized Computations**: Derived values compute only when read and cache their result until an upstream dependency changes.
- **Automatic Microtask Batching**: Multiple synchronous mutations collapse into a single microtask turn, preventing layout thrashing and intermediate glitch states.
- **Granular Collection Reactions**: Built-in, surgical reactions for native `Array`, `Map`, and `Set` operations without coarse invalidation cascades.
- **Zero-Boilerplate Ergonomics**: Standard TypeScript classes and objects become reactive domain models with a single constructor line (`return makeReactive(this)`), preserving `instanceof`, prototype methods, and getters without decorators.
- **Zero Runtime Dependencies**: The core package weighs ~2.5 kB min+brotli with 0 external dependencies.
- **Decoupled Multi-Framework Adapters**: First-class, lightweight adapters for React, Lit, SolidJS, and Vanilla DOM.
- **First-Class Observability**: Built-in lifecycle hooks, target-scoped observers, and telemetry hubs allow any medium—whether Chrome DevTools, agentic tooling, streaming pipelines, or analytical monitoring engines—to inspect state, trace dependency graphs, and audit mutations in real time without polluting the reactive graph.

---

## Architectural Comparison Matrix

| Dimension              | Coarse-Grained State Stores                                 | Accessor-Wrapped Signals                                                      | `@banksia/signals` (Pure Domain Signals)                                                                          |
| :--------------------- | :---------------------------------------------------------- | :---------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------- |
| **Object Mutability**  | Immutable clones (`{...state}`) or action dispatchers       | Wrapped accessors (`sig.value`, `sig()`); complex nested models need wrappers | **Direct property reads & writes** with zero-decorator constructor self-reactivity                                |
| **Collection Traps**   | Manual array copying or wrapper classes                     | Shallow wrapping; manual immutability (`[...arr, item]`)                      | **Granular collection reactions** for native `Array`, `Map`, and `Set`                                            |
| **Update Granularity** | Coarse component re-renders or manual selector memoization  | Fine-grained leaf updates                                                     | **Surgical property-level dependency tracking** & automatic microtask batching                                    |
| **Bundle Size & Deps** | 10–50+ kB, multiple dependencies                            | 1–3 kB core, but complex domain models require heavy add-on stores            | **~2.5 kB min+brotli, ZERO external runtime dependencies**                                                        |
| **Framework Agnostic** | Usually tied to specific UI runtimes or custom bindings     | Often tied to a specific view library                                         | **Framework-agnostic domain layer** with modular adapters for React, Lit, Solid, Vanilla                          |
| **Observability**      | Heavy profiler middleware or browser extension dependencies | Ad-hoc console logging                                                        | **First-class observability engine** (global hooks, scoped observers, telemetry hubs, DevTools & agentic tooling) |

---

## Quick Example

```typescript
import { makeReactive, computed, effect } from "@banksia/signals";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

// 1. Define a pure TypeScript domain store with constructor self-reactivity:
class CartStore {
  items: CartItem[] = [];
  discounts = new Map<string, number>();

  constructor() {
    return makeReactive(this);
  }

  get total(): number {
    const subtotal = this.items.reduce(
      (acc, i) => acc + i.price * i.quantity,
      0,
    );
    const discountRate = Array.from(this.discounts.values()).reduce(
      (sum, d) => sum + d,
      0,
    );
    return Math.max(0, subtotal * (1 - discountRate));
  }

  addItem(item: CartItem) {
    this.items.push(item);
  }

  applyDiscount(code: string, rate: number) {
    this.discounts.set(code, rate);
  }
}

// 2. Instantiate and observe derived state:
const cart = new CartStore();

effect(() => {
  console.log(
    `Cart total: $${cart.total.toFixed(2)} (${cart.items.length} items)`,
  );
});

// 3. Mutate directly with natural JavaScript syntax:
cart.addItem({
  id: "item-1",
  name: "Mechanical Keyboard",
  price: 120,
  quantity: 1,
});
// Logs: "Cart total: $120.00 (1 items)"

cart.applyDiscount("SAVE10", 0.1);
// Logs: "Cart total: $108.00 (1 items)"
```

---

## Next Steps

- **[Installation Guide](./installation)**: Install `@banksia/signals` and explore supported framework peer dependencies.
- **[Philosophy & The Five Pillars](./philosophy)**: Understand the core design principles guiding our architecture.
- **[Core Concepts](../core-concepts/signals)**: Deep dive into signals, computed derivations, effects, reactive state, and scheduling.
