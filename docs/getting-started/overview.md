# Overview

`@banksia/signals` is a high-performance, Proxy-based fine-grained reactive state framework designed for modern TypeScript applications and multi-framework architectures.

```
┌─────────────────────────────────────────────────────────────┐
│                 Application Domain Layer                    │
│   class UserStore {                                         │
│     constructor() { return makeReactive(this); }            │
│   }                                                         │
└───────────────┬─────────────────────────────────────────────┘
                │ Proxy traps (get / set / delete)
┌───────────────▼─────────────────────────────────────────────┐
│                  Signals Core Engine                        │
│   - Dependency Graph & Dynamic Edge Tracking                │
│   - Microtask Batch Scheduler (zero layout thrashing)       │
│   - Granular Collection Traps (Array, Map, Set)             │
│   - Observability Hub & Chrome DevTools MCP Bridge          │
└───────────────┬─────────────────────────────────────────────┘
                │ Reactive notifications
┌───────────────▼─────────────────────────────────────────────┐
│               Framework Integration Layer                   │
│   React       Lit           SolidJS        Vanilla DOM      │
└─────────────────────────────────────────────────────────────┘
```

---

## Why Banksia Signals?

Modern application developers often find themselves choosing between painful extremes in state management:

1. **Action Indirection & Boilerplate**: Redux-like architectures require action creators, type constants, dispatchers, and reducer ceremony just to update a primitive property.
2. **Decorator Lock-In & Compiler Transforms**: MobX and legacy state libraries rely on proprietary decorator syntax or babel/SWC compiler plugins, coupling business models to specific build tools.
3. **Stream Operator Complexity**: RxJS provides exceptional reactive power, but introduces steep learning curves, operator sprawl, and insidious subscription memory leaks.
4. **Access-Indirection Signals**: Conventional signal libraries require unwrapping values through function calls (`count()`) or property getters (`count.value`), making deep nested object and array mutations awkward.

`@banksia/signals` solves these challenges by combining the ergonomics of **transparent ES6 Proxies** with the mathematical rigor of **fine-grained dependency graphs**:

- **Zero-Boilerplate Property Access**: Read properties naturally (`store.user.name`) and mutate directly (`store.items.push(item)`).
- **Constructor Self-Reactivity**: Simply return `makeReactive(this)` in standard TypeScript class constructors to make any domain class deeply reactive—preserving `instanceof`, prototype methods, and getters without decorators.
- **Microtask Transaction Batching**: Multiple synchronous mutations collapse into a single microtask turn, eliminating intermediate state glitches and UI thrashing.
- **Granular Collection Traps**: Built-in, surgical reactions for native `Array`, `Map`, and `Set` operations.
- **Zero Runtime Dependencies**: The core package weighs ~2.5 kB min+brotli with 0 external dependencies.
- **Decoupled Multi-Framework Adapters**: First-class, lightweight adapters for React, Lit, SolidJS, and Vanilla DOM.
- **Chrome DevTools & AI Agent MCP Observability**: Built-in telemetry hooks and DevTools MCP bridge (`window.__BANKSIA_SIGNALS_DEVTOOLS__`) enable real-time introspection and autonomous agent pair-programming.

---

## Architectural Comparison Matrix

| Dimension              | Primitive Signals (Preact, TC39)                                                             | Heavy Proxy Stores (MobX)                                                  | `@banksia/signals`                                                                                  |
| :--------------------- | :------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------- |
| **Object Mutability**  | Wrapped accessors (`sig.value`, `sig()`); complex nested models require separate boilerplate | Transparent proxies, but requires decorators or custom compiler transforms | **Zero-decorator, constructor self-reactivity** (`return makeReactive(this)`)                       |
| **Collection Traps**   | Shallow wrapping or manual immutability (`[...arr, item]`)                                   | Observable collection wrapper classes                                      | **Granular Proxy traps** for native `Array`, `Map`, and `Set`                                       |
| **Bundle Size & Deps** | ~1–3 kB, but companion stores add substantial weight                                         | ~15–50 kB, multiple dependencies                                           | **~2.5 kB min+brotli, ZERO external runtime dependencies**                                          |
| **Framework Agnostic** | Tied to a specific view library or standalone                                                | Typically tied to React or custom bindings                                 | **Framework-agnostic domain layer** with modular adapters for React, Lit, Solid, Vanilla            |
| **Observability**      | Ad-hoc console logging or browser extensions                                                 | Heavy profiler plugins                                                     | **First-class DevTools MCP bridge** (`window.__BANKSIA_SIGNALS_DEVTOOLS__`) & telemetry ring buffer |

---

## Quick Example

```typescript
import { makeReactive, computed, effect } from "@banksia/signals";

// 1. Define a pure TypeScript domain store with constructor self-reactivity:
class CartStore {
  items: { id: string; name: string; price: number; quantity: number }[] = [];
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

  addItem(item: { id: string; name: string; price: number; quantity: number }) {
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
- **[Core Concepts](../core-concepts/signals)**: Deep dive into signals, computed derivations, effects, reactive proxies, and scheduling.
