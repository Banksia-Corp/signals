# API Reference

This page provides an architectural matrix of all subpath exports and functions in `@banksia/signals`.

:::tip Complete TypeDoc Documentation
For exhaustive TypeScript type declarations, member signatures, inheritance diagrams, and symbol documentation generated directly from source code, explore our standalone **[TypeDoc API Portal](/api/)**.
:::

---

## `@banksia/signals` (Core Engine)

The core engine provides fundamental primitives, proxy wrapping, microtask scheduling, and telemetry.

| Export                                                                           | Type     | Description                                                              |
| :------------------------------------------------------------------------------- | :------- | :----------------------------------------------------------------------- |
| [`signal(initialValue)`](/api/functions/index.signal-1)                          | Function | Creates a foundational reactive signal container with `.value`.          |
| [`computed(getter, name?)`](/api/functions/index.computed)                       | Function | Creates a lazily evaluated, memoized derived computation.                |
| [`effect(fn, name?)`](/api/functions/index.effect)                               | Function | Creates an auto-tracking reactive side-effect observer.                  |
| [`makeReactive(target)`](/api/functions/index.makeReactive)                      | Function | Wraps an object, class instance, or collection in a reactive Proxy.      |
| [`isReactive(target)`](/api/functions/index.isReactive)                          | Function | Checks whether a value is an active reactive Proxy.                      |
| [`toRaw(proxy)`](/api/functions/index.toRaw)                                     | Function | Unwraps a reactive Proxy to access the underlying raw target.            |
| [`batch(fn)`](/api/functions/index.batch)                                        | Function | Executes a transactional callback, deferring reactions until completion. |
| [`flushBatch()`](/api/functions/index.flushBatch)                                | Function | Synchronously flushes all pending microtask batch notifications.         |
| [`registerReactivityHooks(hooks)`](/api/functions/index.registerReactivityHooks) | Function | Registers global lifecycle observability callbacks.                      |
| [`observe(target, hooks)`](/api/functions/index.observe)                         | Function | Subscribes to changes on a specific reactive object or store.            |
| [`createReactivityHub(options)`](/api/functions/index.createReactivityHub)       | Function | Creates an isolated telemetry buffer and dispatcher hub.                 |
| [`getDependencyGraph(target)`](/api/functions/index.getDependencyGraph)          | Function | Retrieves the active subscriber dependency graph for a target.           |
| [`configureSignalsDebug(config)`](/api/functions/index.configureSignalsDebug)    | Function | Enables console mutation logging and batch tracing.                      |
| [`registerOnReaction(cb)`](/api/functions/index.registerOnReaction)              | Function | Attaches a callback executed whenever a subscriber is notified in batch. |

---

## `@banksia/signals/react`

React 18 & 19 integration hooks and Higher-Order Components.

| Export                                                    | Type | Description                                                              |
| :-------------------------------------------------------- | :--- | :----------------------------------------------------------------------- |
| [`useReactive(target)`](/api/functions/react.useReactive) | Hook | Subscribes a React component to a reactive proxy object or domain store. |
| [`observer(Component)`](/api/functions/react.observer)    | HOC  | Converts a functional component into an auto-tracking reactive observer. |
| [`useSignal(initial)`](/api/functions/react.useSignal)    | Hook | Creates and memoizes a component-scoped `Signal`.                        |
| [`useComputed(fn)`](/api/functions/react.useComputed)     | Hook | Creates and memoizes a component-scoped `computed()` derivation.         |

---

## `@banksia/signals/lit`

Lit and Web Component lifecycle controllers.

| Export                                                    | Type  | Description                                                              |
| :-------------------------------------------------------- | :---- | :----------------------------------------------------------------------- |
| [`SignalsController`](/api/classes/lit.SignalsController) | Class | Lit `ReactiveController` binding reactive stores to component rendering. |

---

## `@banksia/signals/solid`

SolidJS reactivity bridge.

| Export                                                                            | Type     | Description                                                                |
| :-------------------------------------------------------------------------------- | :------- | :------------------------------------------------------------------------- |
| [`createSolidSignalBridge(target)`](/api/functions/solid.createSolidSignalBridge) | Function | Bridges a `@banksia/signals` reactive store into SolidJS signal accessors. |

---

## `@banksia/signals/vanilla`

Zero-dependency DOM binding helpers.

| Export                                                         | Type     | Description                                                       |
| :------------------------------------------------------------- | :------- | :---------------------------------------------------------------- |
| [`bindText(element, getter)`](/api/functions/vanilla.bindText) | Function | Synchronizes an HTML element's `textContent` with reactive state. |
| [`bindDOM(element, updater)`](/api/functions/vanilla.bindDOM)  | Function | Reactive updater for classes, attributes, styles, and properties. |

---

## `@banksia/signals/devtools`

Observability bridge and Chrome DevTools MCP inspection.

| Export                                                                    | Type     | Description                                                            |
| :------------------------------------------------------------------------ | :------- | :--------------------------------------------------------------------- |
| [`initDevTools(options)`](/api/functions/devtools.initDevTools)           | Function | Mounts `window.__BANKSIA_SIGNALS_DEVTOOLS__` global runtime inspector. |
| [`connectDevTools(options)`](/api/functions/devtools.connectDevTools)     | Function | Connects a custom DevTools bridge listener.                            |
| [`disconnectDevTools()`](/api/functions/devtools.disconnectDevTools)      | Function | Disconnects the global DevTools bridge and detaches hooks.             |
| [`getDevToolsBridge(options)`](/api/functions/devtools.getDevToolsBridge) | Function | Retrieves the singleton `DevToolsBridge` instance.                     |
| [`DevToolsBridge`](/api/classes/devtools.DevToolsBridge)                  | Class    | DevTools bridge class managing telemetry ring buffers and sandboxing.  |
