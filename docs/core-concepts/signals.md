# Signals

A **Signal** is a foundational reactive primitive that wraps a single value, tracks subscribers who read it, and notifies dependents when its value changes.

## Basic Usage

```typescript
import { signal } from "@banksia/signals";

// Create a signal with an initial value
const count = signal(0);

// Reading the value (records dependency in active effect/computed)
console.log(count.value); // 0

// Writing a new value (triggers subscribers if value changed)
count.value = 1;

// Function syntax is also supported:
console.log(count()); // 1
count(2); // Updates value to 2
```

## Non-Tracking Read with `peek()`

When you need to read a signal's current value inside an effect or computed expression _without_ establishing a reactive dependency edge, use `peek()`:

```typescript
import { signal, effect } from "@banksia/signals";

const count = signal(0);
const multiplier = signal(2);

effect(() => {
  // Only subscribe to `count`
  const currentCount = count.value;
  // Read `multiplier` without subscribing
  const factor = multiplier.peek();

  console.log(`Product: ${currentCount * factor}`);
});

multiplier.value = 10; // Does NOT re-run the effect!
count.value = 5; // Re-runs the effect: "Product: 50"
```

## Equality Checks

Signals check values with `Object.is()`. If a new value is written that is identical to the current value according to `Object.is()`, no notifications are dispatched:

```typescript
const name = signal("Ada");
name.value = "Ada"; // No-op, subscribers will not be scheduled
```

## TypeScript Signatures

```typescript
export interface Signal<T> {
  (): T;
  (newValue: T): void;
  value: T;
  peek(): T;
  subscribe(fn: (val: T) => void): () => void;
}

export function signal<T>(initialValue: T): Signal<T>;
```
