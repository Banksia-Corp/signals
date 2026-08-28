# Batching & Scheduler

`@banksia/signals` includes an integrated microtask scheduler and explicit transaction primitives to guarantee predictable execution order and eliminate intermediate layout thrashing.

## Automatic Microtask Batching

When multiple signals or reactive properties are mutated within the same synchronous tick, notifications to downstream effects are automatically batched into a single microtask:

```typescript
import { signal, effect } from "@banksia/signals";

const width = signal(100);
const height = signal(200);

effect(() => {
  console.log(`Area: ${width.value * height.value}`);
});

// Mutating both values synchronously:
width.value = 150;
height.value = 250;

// The effect runs only ONCE at the end of the current microtask turn.
```

## Explicit Transactions with `batch(fn)`

To group a series of mutations explicitly into a transaction, use `batch()`:

```typescript
import { signal, batch } from "@banksia/signals";

const x = signal(0);
const y = signal(0);

batch(() => {
  x.value = 10;
  y.value = 20;
  // Further nested computations or mutations...
});
```

Batches can be nested arbitrarily. Downstream notifications are deferred until the outermost batch transaction completes.

## Synchronous Flush with `flushBatch()`

In scenarios where synchronous side-effects are mandatory—such as measuring DOM layout geometry (`getBoundingClientRect()`), synchronizing with browser canvas frames, or executing assertions in unit tests—call `flushBatch()`:

```typescript
import { signal, effect, flushBatch } from "@banksia/signals";

const position = signal(0);
let renderedPos = 0;

effect(() => {
  renderedPos = position.value;
});

position.value = 400;
console.log(renderedPos); // 0 (pending in microtask queue)

// Force synchronous execution of all pending reactive notifications:
flushBatch();
console.log(renderedPos); // 400
```

## TypeScript Signatures

```typescript
export function batch<T>(fn: () => T): T;
export function flushBatch(): void;
```
