# Computed

A **Computed** primitive produces derived state that is lazily evaluated and automatically memoized.

## Basic Usage

```typescript
import { signal, computed } from "@banksia/signals";

const firstName = signal("Grace");
const lastName = signal("Hopper");

const fullName = computed(() => {
  return `${firstName.value} ${lastName.value}`;
});

// Computed is lazy: the computation runs only when `.value` is read:
console.log(fullName.value); // "Grace Hopper"
```

## Lazy Evaluation & Memoization

Computed expressions evaluate only when demanded and cache their results:

1. **Lazy Execution**: If nobody reads `fullName.value`, the derivation function never executes.
2. **Memoization**: Repeated reads of `fullName.value` return the cached result immediately without re-running the derivation function.
3. **Dirty Propagation**: When a dependency changes (e.g. `firstName.value = 'Admiral Grace'`), the computed is flagged dirty. It only recomputes on the next read.

```typescript
const count = signal(0);
let executionCount = 0;

const double = computed(() => {
  executionCount++;
  return count.value * 2;
});

// Has not run yet:
console.log(executionCount); // 0

// First read triggers execution:
console.log(double.value); // 0
console.log(executionCount); // 1

// Subsequent reads use cached value:
console.log(double.value); // 0
console.log(executionCount); // 1
```

## Glitch-Free Diamond Dependencies

In complex dependency graphs where multiple paths depend on a single ancestor, `@banksia/signals` prevents diamond graph glitches:

```
        A (count)
       / \
      B   C (computed intermediate values)
       \ /
        D (computed final value)
```

Because derived values evaluate in topological order, downstream subscribers never observe intermediate, torn state values.

## TypeScript Signatures

```typescript
export interface ReadonlySignal<T> {
  (): T;
  readonly value: T;
  peek(): T;
  subscribe(fn: (val: T) => void): () => void;
}

export function computed<T>(fn: () => T): ReadonlySignal<T>;
```
