# Philosophy & The Five Pillars

`@banksia/signals` is built on five architectural principles engineered for predictability, maximum runtime throughput, and developer ergonomics.

---

## 1. Zero-Boilerplate Property Access

State is accessed and mutated using standard JavaScript object and array syntax:

```typescript
const state = makeReactive({
  user: { name: "Alice", active: true },
  tags: ["admin", "editor"],
});

// Direct property reads dynamically register dependency edges:
console.log(state.user.name);

// Direct property writes automatically schedule reactive updates:
state.user.name = "Bob";
state.tags.push("maintainer");
```

**Why it matters**: Developers should not have to learn custom accessor methods (`state.user.name.get()` / `state.user.name.set('Bob')`), action dispatchers, or reducer patterns for simple business mutations. Standard language idioms seamlessly bridge into the reactive graph.

---

## 2. Constructor Self-Reactivity (`return makeReactive(this)`)

Domain stores and state machines remain pure, idiomatic TypeScript classes. There is no need for base classes, legacy experimental decorators, or build-step compiler transforms:

```typescript
export interface CartItem {
  id: string;
  price: number;
  quantity: number;
}

export class CartStore {
  items: CartItem[] = [];

  constructor() {
    return makeReactive(this);
  }

  addItem(item: CartItem) {
    this.items.push(item);
  }

  get total(): number {
    return this.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  }
}
```

**Why it matters**: Returning `makeReactive(this)` in the constructor makes the class instance deeply reactive while retaining full prototype methods, getters, and `instanceof` fidelity. Your domain logic stays portable, testable, and completely decoupled from framework runtime dependencies.

---

## 3. Automatic Microtask Batching

Synchronous state mutations across multiple properties or collection items are automatically coalesced into a single microtask turn:

```typescript
import { makeReactive, effect } from "@banksia/signals";

const store = makeReactive({ firstName: "John", lastName: "Doe" });

effect(() => {
  console.log(`Full name: ${store.firstName} ${store.lastName}`);
});

// Mutating multiple properties in one synchronous tick:
store.firstName = "Jane";
store.lastName = "Smith";
// Downstream effect triggers only ONCE at the end of the microtask queue!
```

**Why it matters**: Unbatched reactive updates lead to "glitches" (transient intermediate calculations) and trigger catastrophic DOM layout thrashing. Automatic microtask batching provides transactional consistency by default, while `flushBatch()` remains available when immediate synchronous layout synchronization is required.

---

## 4. Deep Granular Collection Tracking

Native JavaScript collections wrapped with `makeReactive` distinguish between item reads, key mutations, and size changes:

- **`Array`**: `.push()`, `.pop()`, `.shift()`, `.unshift()`, `.splice()`, `.sort()`, `.reverse()`, `.length`, and indexed mutations.
- **`Map`**: `.set()`, `.get()`, `.has()`, `.delete()`, `.clear()`, `.keys()`, `.values()`, `.entries()`, `.size`.
- **`Set`**: `.add()`, `.has()`, `.delete()`, `.clear()`, `.keys()`, `.values()`, `.entries()`, `.size`.

```typescript
const roles = makeReactive(new Set<string>(["user"]));
const userMap = makeReactive(new Map<string, string>());

effect(() => {
  console.log(`Has admin: ${roles.has("admin")}`);
});

// Mutating an unrelated set value does NOT trigger the effect:
roles.add("editor"); // No reaction

// Mutating the watched value triggers surgical reaction:
roles.add("admin"); // Triggers reaction!
```

**Why it matters**: Heavy applications rely heavily on Maps, Sets, and Arrays. Granular collection tracking prevents coarse-grained invalidation cascades, keeping data tables and memory registries lightning-fast.

---

## 5. Decoupled Multi-Framework UI Layer

Domain models are completely independent of UI presentation. The exact same domain store instance can drive a React component, a Lit Web Component, a SolidJS app, or a vanilla micro-frontend:

```typescript
// Shared domain store instance:
export const authStore = new AuthStore();

// 1. React Component (Hook or HOC):
const { user } = useReactive(authStore);

// 2. Lit Web Component (Lifecycle Controller):
private authCtrl = new SignalsController(this, authStore);
// Access authStore.user directly in render()

// 3. SolidJS Component (Signal Bridge):
const auth = createSolidSignalBridge(authStore);
// Access auth().user in JSX

// 4. Vanilla DOM (Direct Binding):
bindText(userBadgeElement, () => authStore.user.name);
```

**Why it matters**: Enterprise applications frequently evolve, migrate frameworks, or embed micro-frontends with different UI stacks. Separating domain state into pure reactive models prevents framework lock-in and guarantees maximal code reuse.
