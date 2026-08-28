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
│   - Microtask Batch Scheduler (zero thrashing)              │
│   - Granular Collections (Array, Map, Set)                  │
│   - Observability Hub & DevTools Bridge                     │
└───────────────┬─────────────────────────────────────────────┘
                │ Reactive updates
┌───────────────▼─────────────────────────────────────────────┐
│               Framework Integration Layer                   │
│   React       Lit           SolidJS        Vanilla DOM      │
└─────────────────────────────────────────────────────────────┘
```

## Why Banksia Signals?

Modern front-end applications often struggle with state management extremes:

1. **Action Indirection & Boilerplate**: Redux-like patterns require action creators, type constants, reducers, and dispatcher rituals just to toggle a boolean.
2. **Decorator Lock-In & Compiler Transforms**: MobX and similar libraries rely on legacy decorators or custom compiler plugins that couple domain logic to proprietary runtimes.
3. **Stream Operator Complexity**: RxJS provides powerful reactivity but introduces steep learning curves, operator sprawl, and accidental subscription memory leaks.

`@banksia/signals` was designed to solve these problems by providing:

- **Zero-Boilerplate Direct Property Access**: Read values like `store.user.name` and mutate state naturally with `store.items.push(item)`.
- **Constructor Self-Reactivity**: Return `makeReactive(this)` inside standard class constructors to make any domain class deeply reactive.
- **Microtask Batching**: Multiple synchronous mutations automatically coalesce into a single update turn.
- **Native Granular Collection Traps**: Built-in, surgical reactions for `Array`, `Map`, and `Set` operations.
- **Zero Runtime Dependencies**: The core package has 0 dependencies and weighs ~2.5 kB min+brotli.
- **First-Class Multi-Framework UI Adapters**: First-class support for React, Lit, SolidJS, and Vanilla JS.
- **Chrome DevTools & AI Agent Observability**: Built-in hooks and recipes for runtime introspection and agentic pair-programming.

## Quick Example

```typescript
import { makeReactive, computed, effect } from "@banksia/signals";

class CounterStore {
  count = 0;
  step = 1;

  constructor() {
    return makeReactive(this);
  }

  increment() {
    this.count += this.step;
  }
}

const counter = new CounterStore();
const double = computed(() => counter.count * 2);

effect(() => {
  console.log(`Count is: ${counter.count}, Doubled: ${double.value}`);
});

// Mutate directly:
counter.increment(); // Logs: "Count is: 1, Doubled: 2"
```

## Next Steps

- Check out the [Installation Guide](./installation) to install `@banksia/signals` in your package manager of choice.
- Learn about the core design in [Philosophy & Pillars](./philosophy).
- Dive deep into reactive building blocks in [Core Concepts](../core-concepts/signals).
