# Signals

A **Signal** is a foundational reactive primitive that wraps an individual value in a reactive container. In the [Reactive Architecture](./), signals serve as the **state sources (root nodes)** of the dependency graph: accessing `.value` dynamically records dependencies in any active subscriber, and assigning a new value to `.value` schedules surgical invalidations across all downstream consumers.

---

## Why Signals? (Architectural Purpose)

In the [Reactive Triad](./#the-reactive-triad-sources-pipelines--sinks), signals represent the primary source of truth:

1. **Fine-Grained Root State**: Unlike monolithic stores that trigger broad component renders on any mutation, signals isolate change notifications to the exact expressions or DOM nodes that read them.
2. **Transparent Dependency Registration**: Reading `.value` within a [`computed`](./computed) or [`effect`](./effects) establishes a reactive edge automatically without manual subscription boilerplate.
3. **Dirty Notification Trigger**: Writing to `.value` initiates the **push phase** of the reactive engine, marking downstream computeds dirty and queueing dependent effects in the microtask batch scheduler.

---

## Basic Usage

In `@banksia/signals`, signals provide fine-grained reactivity with direct property access:

```typescript
import { signal } from "@banksia/signals";

// Create a signal holding an initial value:
const count = signal(0);

// Reading the value (registers a dependency if inside effect or computed):
console.log(count.value); // 0

// Mutating the value (schedules updates for dependent subscribers):
count.value = 1;
console.log(count.value); // 1
```

---

## Equality Checks with `Object.is`

Signal mutations are evaluated with `Object.is()`. If a value is assigned that is identical to the current value, the write is treated as a no-op and no downstream notifications are dispatched:

```typescript
const username = signal("Ada");

// Identical value: no-op, subscribers will not be scheduled
username.value = "Ada";

// Distinct value: triggers downstream invalidation
username.value = "Grace";
```

---

## Non-Tracking Reads with `toRaw()`

When you need to inspect or log a signal's value inside an effect or computed expression _without_ establishing a reactive dependency edge, use `toRaw()` to unwrap the underlying object:

```typescript
import { signal, effect, toRaw } from "@banksia/signals";

const count = signal(0);
const multiplier = signal(2);

effect(() => {
  // Actively track `count`:
  const currentCount = count.value;

  // Read `multiplier` without subscribing to changes:
  const factor = toRaw(multiplier).value;

  console.log(`Product: ${currentCount * factor}`);
});

// Mutating multiplier does NOT re-run the effect:
multiplier.value = 10; // No reaction

// Mutating count triggers the effect with the latest multiplier:
count.value = 5; // Logs: "Product: 50"
```

---

## Next Steps

- **[Reactive Architecture Overview](./)**: Understand how signals coordinate with computeds and effects.
- **[Computed](./computed)**: Build lazy, memoized derivations from signals.
- **[Effects](./effects)**: Synchronize signal state with external systems.
- **[Reactive Objects](./reactive-proxies)**: Make complex objects and classes reactive without wrapping individual properties in signals.

---

## TypeScript Signatures

```typescript
export interface Signal<T> {
  /**
   * The current value of the signal.
   *
   * Reading this property establishes a dependency in the active reactive context.
   * Modifying this property triggers updates across all downstream subscribers.
   */
  value: T;
}

export function signal<T>(initialValue: T): Signal<T>;
```
