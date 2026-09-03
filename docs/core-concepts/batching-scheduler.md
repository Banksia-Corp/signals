# Batching & Scheduler

`@banksia/signals` includes an integrated microtask scheduler and transactional primitives to guarantee predictable execution order and eliminate intermediate layout thrashing.

---

## Automatic Microtask Batching

When multiple signals or reactive properties are mutated within the same synchronous tick, notifications to downstream effects are automatically queued and coalesced into a single microtask:

```typescript
import { signal, effect } from "@banksia/signals";

const width = signal(100);
const height = signal(200);

effect(() => {
  console.log(`Area: ${width.value * height.value}`);
});

// Mutating multiple values synchronously:
width.value = 150;
height.value = 250;

// The effect runs only ONCE at the end of the current microtask turn.
```

Under the hood, the scheduler uses `queueMicrotask()` to defer subscriber notifications. Even without wrapping your code in explicit batch calls, your UI avoids redundant layout cycles and intermediate recalculation glitches.

---

## Explicit Transactions with `batch(fn)`

To group a series of mutations explicitly into a transaction, use `batch()`:

```typescript
import { signal, batch } from "@banksia/signals";

const x = signal(0);
const y = signal(0);

const result = batch(() => {
  x.value = 10;
  y.value = 20;
  return x.value + y.value;
});

console.log(result); // 30
```

### Reentrant / Nested Batches

Batches can be nested arbitrarily. Downstream notifications are deferred until the **outermost** batch transaction completes:

```typescript
batch(() => {
  store.stepOne();
  batch(() => {
    store.stepTwo();
  }); // Inner batch flattens; no reactions fire yet
  store.stepThree();
}); // Outermost batch completes: all subscribers notified in a single pass
```

---

## Synchronous Flush with `flushBatch()`

In scenarios where synchronous side-effects are mandatory—such as reading DOM layout geometry (`getBoundingClientRect()`), coordinating with browser canvas render loops, or running assertions in unit tests—call `flushBatch()`:

```typescript
import { signal, effect, flushBatch } from "@banksia/signals";

const position = signal(0);
let renderedPos = 0;

effect(() => {
  renderedPos = position.value;
});

position.value = 400;
console.log(renderedPos); // 0 (still pending in microtask queue)

// Force synchronous execution of all pending reactive notifications:
flushBatch();
console.log(renderedPos); // 400
```

---

## Direct Reaction Auditing with `registerOnReaction`

To attach a low-level callback that executes every time an individual subscriber is notified during a batch flush:

```typescript
import { registerOnReaction } from "@banksia/signals";

const unregister = registerOnReaction((subscriber) => {
  console.log(`Notified subscriber: ${subscriber.name || "anonymous"}`);
});

// Teardown listener:
unregister();
```

---

## TypeScript Signatures

```typescript
export function batch<T>(fn: () => T): T;
export function flushBatch(): void;
export function registerOnReaction(cb: (sub: Subscriber) => void): () => void;
```
