# Computed

A **Computed** primitive produces derived state that is lazily evaluated, dynamically tracked, and automatically memoized.

---

## Basic Usage

```typescript
import { signal, computed } from "@banksia/signals";

const firstName = signal("Grace");
const lastName = signal("Hopper");

// Define a derived computation:
const fullName = computed(() => {
  return `${firstName.value} ${lastName.value}`;
}, "fullName");

// Computed is lazy: the computation runs only when `.value` is read:
console.log(fullName.value); // "Grace Hopper"
```

---

## Lazy Evaluation & Memoization

Computed expressions evaluate only when demanded and cache their results:

1. **Lazy Execution**: If no subscriber or code path reads `fullName.value`, the derivation function never executes.
2. **Memoization**: Repeated reads of `fullName.value` return the cached result immediately without re-running the derivation function.
3. **Dirty Invalidation**: When any upstream dependency mutates (e.g. `firstName.value = 'Admiral Grace'`), the computed marks itself dirty and invalidates downstream subscribers. It only recomputes upon the next `.value` read.

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

// Subsequent reads use cached value without recomputing:
console.log(double.value); // 0
console.log(executionCount); // 1

// Upstream dependency changes:
count.value = 5;
console.log(executionCount); // Still 1 (computation is deferred until read)

// Reading .value triggers re-evaluation:
console.log(double.value); // 10
console.log(executionCount); // 2
```

---

## Glitch-Free Diamond Dependencies

In complex dependency graphs where multiple paths diverge and reconverge upon a single source, uncoordinated reactive systems suffer from "glitches"—transient states where downstream values recompute with mixed old and new data:

```
        A (source signal)
       / \
      B   C (computed intermediate derivations)
       \ /
        D (computed final consumer)
```

In `@banksia/signals`, dirty notifications flag dependents before re-evaluation occurs. Downstream computed values evaluate in topological dependency order. As a result, subscriber `D` is never evaluated with a mixture of old and new data from `B` and `C`, ensuring 100% glitch-free state consistency.

---

## TypeScript Signatures

```typescript
export interface ReadonlySignal<T> {
  /**
   * The current derived value of the signal.
   *
   * Accessing this property registers a dependency if called within an active reactive context.
   */
  readonly value: T;
}

export function computed<T>(getter: () => T, name?: string): ReadonlySignal<T>;
```
