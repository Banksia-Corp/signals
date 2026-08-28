# Reactive Proxies

`@banksia/signals` allows plain JavaScript objects, class instances, and collections to become deeply reactive without altering class hierarchies or syntax.

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

// Deep mutations trigger surgical reactions:
profile.address.city = "Oakland";
```

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

### Benefits:

- Retains prototype methods and property descriptors.
- Works with standard `instanceof` checks.
- Compatible with all bundlers and runtimes without legacy experimental decorators.

## Granular Collection Traps

Native JavaScript collections wrapped with `makeReactive` provide surgical change notifications:

### Arrays

```typescript
const list = makeReactive([1, 2, 3]);

effect(() => {
  console.log(`Length: ${list.length}, First: ${list[0]}`);
});

list.push(4); // Modifies length and appends index
```

### Maps

```typescript
const map = makeReactive(new Map<string, number>());

effect(() => {
  console.log(`User score: ${map.get("user-1") ?? 0}`);
});

map.set("user-1", 99); // Updates subscriber
map.set("user-2", 50); // Does not trigger user-1 subscriber
```

### Sets

```typescript
const activeUsers = makeReactive(new Set<string>());

effect(() => {
  console.log(`Has alice: ${activeUsers.has("alice")}`);
});

activeUsers.add("alice"); // Triggers reaction
activeUsers.add("bob"); // Does not re-run alice reaction
```

## Utility Helpers: `isReactive` & `toRaw`

- **`isReactive(value)`**: Returns `true` if the given object is a reactive proxy managed by `@banksia/signals`.
- **`toRaw(proxy)`**: Returns the underlying unproxied, raw JavaScript object. Useful when passing objects to external third-party libraries that fail identity checks.

```typescript
import { makeReactive, isReactive, toRaw } from "@banksia/signals";

const raw = { value: 42 };
const proxy = makeReactive(raw);

console.log(isReactive(proxy)); // true
console.log(isReactive(raw)); // false
console.log(toRaw(proxy) === raw); // true
```
