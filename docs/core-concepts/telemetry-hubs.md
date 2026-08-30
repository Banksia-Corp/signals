# Telemetry & Observability Hubs

`@banksia/signals` features a first-class observability pipeline. You can trace dependency graph edges, audit state mutations, profile execution durations, and route events to custom logging backends or the Chrome DevTools MCP bridge.

---

## Global Reactivity Hooks (`registerReactivityHooks`)

Register global callbacks to intercept reactive lifecycle events across the engine:

```typescript
import { registerReactivityHooks } from "@banksia/signals";

const unregister = registerReactivityHooks({
  // Fired when a consumer (computed/effect) accesses a reactive dependency:
  onTrack(source, consumer) {
    console.debug(`[Track] ${consumer.name} reads -> ${source.meta.label}`);
  },

  // Fired when a reactive source mutates:
  onNotify(source, change) {
    console.log(
      `[Notify] ${source.meta.label}:`,
      change.oldValue,
      "➜",
      change.newValue,
    );
  },

  // Fired when the scheduler queues a subscriber:
  onSchedule(consumer) {
    console.debug(`[Schedule] Queued subscriber: ${consumer.name}`);
  },

  // Fired before ('start') and after ('end') an effect or computed runs:
  onExecute(consumer, context) {
    if (context.phase === "end") {
      console.debug(
        `[Execute] ${consumer.name} completed in ${context.durationMs?.toFixed(2)}ms`,
      );
    }
  },

  // Fired during batch transaction lifecycle phases ('start', 'flush', 'end'):
  onBatch(stats) {
    if (stats.phase === "flush") {
      console.debug(`[Batch] Flushed ${stats.flushedCount} pending reactions`);
    }
  },

  // Fired when an unhandled error occurs during reactive execution:
  onError(error, context) {
    console.error(`[Reactivity Error in ${context.phase}]`, error);
  },
});

// To disconnect all registered hooks:
unregister();
```

---

## Target-Scoped Observation (`observe`)

To track lifecycle mutations on a specific reactive object or store without listening to global engine noise, use `observe()`:

```typescript
import { makeReactive, observe } from "@banksia/signals";

class UserSession {
  username = "guest";
  isAuthenticated = false;

  constructor() {
    return makeReactive(this);
  }
}

const session = new UserSession();

// Scoped hooks only receive events for `session`:
const unsubscribe = observe(session, {
  onNotify(source, change) {
    console.log(
      `Property '${String(source.meta.property)}' changed:`,
      change.oldValue,
      "➜",
      change.newValue,
    );
  },
});

session.username = "alex"; // Logs: Property 'username' changed: guest ➜ alex
session.isAuthenticated = true; // Logs: Property 'isAuthenticated' changed: false ➜ true

unsubscribe(); // Stop observing
```

---

## Dedicated Telemetry Hubs (`createReactivityHub`)

For modular telemetry routing, audit log pipelines, or AI agent tool interfaces, create an isolated `ReactivityHub`:

```typescript
import { createReactivityHub } from "@banksia/signals";

// Create a hub with an optional source filter predicate:
const hub = createReactivityHub({
  filter: (source) => !source.meta.isPrivate,
});

// Attach hooks to this specific hub:
const detach = hub.use({
  onNotify(source, change) {
    console.log(
      `[Telemetry Hub] ${source.meta.label} changed:`,
      change.newValue,
    );
  },
});

// Remove individual hooks:
detach();

// Or clear all hooks attached to this hub:
hub.clear();
```

---

## Dependency Graph Inspection (`getDependencyGraph`)

You can query active subscriber counts across all properties of any reactive target:

```typescript
import { makeReactive, effect, getDependencyGraph } from "@banksia/signals";

const state = makeReactive({ title: "Hello", views: 100 });

effect(() => {
  console.log(state.title);
});

const graph = getDependencyGraph(state);
console.log(graph);
// {
//   targetName: "Object",
//   properties: {
//     title: { subscriberCount: 1 },
//     views: { subscriberCount: 0 }
//   }
// }
```

---

## Zero-Overhead Fast Path

When no telemetry hooks are active, `@banksia/signals` tracks hook subscriber counts using internal integer counters (`hasTrackObservers()`, `hasNotifyObservers()`, etc.). Read and write operations bypass event object allocation and dispatcher invocation entirely, guaranteeing **near-zero overhead in production**.

---

## TypeScript Signatures

```typescript
export interface ReactivityHooks {
  onTrack?(source: ReactiveSource, consumer: ReactiveConsumer): void;
  onNotify?(source: ReactiveSource, change: ChangeEvent): void;
  onSchedule?(consumer: ReactiveConsumer): void;
  onExecute?(consumer: ReactiveConsumer, context: ExecutionContext): void;
  onBatch?(stats: BatchStats): void;
  onError?(
    error: unknown,
    context: {
      source?: ReactiveSource;
      consumer?: ReactiveConsumer;
      phase: string;
    },
  ): void;
}

export function registerReactivityHooks(hooks: ReactivityHooks): () => void;
export function observe<T extends object>(
  target: T,
  hooks: ReactivityHooks,
): () => void;
export function createReactivityHub(options?: HubOptions): ReactivityHub;
export function getDependencyGraph(target: object): DependencyGraphNode;
```
