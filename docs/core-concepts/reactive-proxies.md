# Reactive Proxies

`@banksia/signals` allows plain JavaScript objects, class instances, and collections to become deeply reactive without altering class hierarchies, build configs, or syntax.

---

## `makeReactive(target)`

Wraps an object, class instance, or collection in a transparent ES6 Proxy:

```typescript
import { makeReactive, effect } from "@banksia/signals";

const profile = makeReactive({
  name: "Katherine",
  address: {
    city: "San Francisco",
    postalCode: 94107,
  },
});

effect(() => {
  console.log(`${profile.name} lives in ${profile.address.city}`);
});

// Deep nested mutations trigger surgical reactions:
profile.address.city = "Oakland";
```

### Key Proxy Behaviors

1. **Lazy Recursive Wrapping**: Child objects, nested arrays, and sub-collections are wrapped in reactive proxies on demand as their properties are accessed, avoiding expensive upfront tree cloning.
2. **Method Auto-Batching**: Member methods invoked on a reactive proxy automatically execute within an atomic `batch()` transaction. If a method mutates multiple properties, all downstream effects fire only once after the method completes.
3. **Identity Caching**: Calling `makeReactive` multiple times on the same object returns the identical cached proxy reference.
4. **Non-Trappable Types**: Standard built-ins with native internal slots—such as `Date`, `RegExp`, `Promise`, `Error`, `WeakMap`, and `WeakSet`—are preserved without proxy wrapping to prevent runtime errors.

---

## Constructor Self-Reactivity

You can turn any standard TypeScript domain class into a reactive model by returning `makeReactive(this)` from its constructor:

```typescript
import { makeReactive } from "@banksia/signals";

export class OrderStore {
  id: string;
  items: Array<{ name: string; price: number; qty: number }> = [];
  status: "pending" | "shipped" | "delivered" = "pending";

  constructor(id: string) {
    this.id = id;
    return makeReactive(this);
  }

  addItem(item: { name: string; price: number; qty: number }) {
    this.items.push(item);
  }

  get total(): number {
    return this.items.reduce((acc, curr) => acc + curr.price * curr.qty, 0);
  }
}
```

### Architectural Benefits

- **Pure TypeScript**: Domain models stay portable and require no decorator transpilers, SWC plugins, or library base classes.
- **Full Prototype Fidelity**: Methods, prototype inheritance chains, and property getters/setters operate normally.
- **Type Safety**: Compatible with standard `instanceof` checks (`order instanceof OrderStore`).

---

## Granular Collection Traps

Native JavaScript collections wrapped with `makeReactive` provide surgical, fine-grained change notifications:

### Arrays

```typescript
const list = makeReactive([1, 2, 3]);

effect(() => {
  console.log(`Length: ${list.length}, First item: ${list[0]}`);
});

// Mutating an unobserved index does NOT re-run the effect:
list[1] = 99; // No reaction

// Appending an item mutates length and triggers subscriber:
list.push(4); // Logs: "Length: 4, First item: 1"
```

### Maps

```typescript
const map = makeReactive(new Map<string, number>());

effect(() => {
  console.log(`User score: ${map.get("user-1") ?? 0}`);
});

map.set("user-1", 99); // Triggers reaction
map.set("user-2", 50); // Does NOT trigger user-1 subscriber
```

### Sets

```typescript
const activeUsers = makeReactive(new Set<string>());

effect(() => {
  console.log(`Has alice: ${activeUsers.has("alice")}`);
});

activeUsers.add("alice"); // Triggers reaction
activeUsers.add("bob"); // Does NOT trigger alice reaction
```

---

## Utility Helpers: `isReactive` & `toRaw`

- **`isReactive(value)`**: Returns `true` if the given object is an active reactive proxy managed by `@banksia/signals`.
- **`toRaw(proxy)`**: Returns the underlying unproxied, raw JavaScript object. Essential when passing objects to external third-party libraries, performing untracked reads, or serializing data without proxy overhead.

```typescript
import { makeReactive, isReactive, toRaw } from "@banksia/signals";

const raw = { value: 42 };
const proxy = makeReactive(raw);

console.log(isReactive(proxy)); // true
console.log(isReactive(raw)); // false
console.log(toRaw(proxy) === raw); // true
```
