# API Reference

This page provides an architectural matrix of all subpath exports and functions in `@banksia/signals`.

:::tip Complete TypeDoc Documentation
For exhaustive TypeScript type declarations, member signatures, inheritance diagrams, and symbol documentation generated directly from source code, explore our standalone **[TypeDoc API Portal](/api/index.html)**.
:::

---

## `@banksia/signals` (Core Engine)

The core engine provides fundamental primitives, proxy wrapping, scheduling, and observability.

| Export                                                                                | Type     | Description                                                              |
| :------------------------------------------------------------------------------------ | :------- | :----------------------------------------------------------------------- |
| [`signal(initialValue)`](/api/functions/index.signal.html)                            | Function | Creates a foundational reactive signal node.                             |
| [`computed(fn)`](/api/functions/index.computed.html)                                  | Function | Creates a lazily evaluated, memoized derived computation.                |
| [`effect(fn)`](/api/functions/index.effect.html)                                      | Function | Creates an auto-tracking reactive side-effect observer.                  |
| [`makeReactive(target)`](/api/functions/index.makeReactive.html)                      | Function | Wraps an object, class instance, or collection in a reactive Proxy.      |
| [`isReactive(target)`](/api/functions/index.isReactive.html)                          | Function | Checks whether a value is an active reactive Proxy.                      |
| [`toRaw(proxy)`](/api/functions/index.toRaw.html)                                     | Function | Unwraps a reactive Proxy to access the underlying target.                |
| [`batch(fn)`](/api/functions/index.batch.html)                                        | Function | Executes a transactional callback, deferring reactions until completion. |
| [`flushBatch()`](/api/functions/index.flushBatch.html)                                | Function | Synchronously flushes all pending microtask batch notifications.         |
| [`registerReactivityHooks(hooks)`](/api/functions/index.registerReactivityHooks.html) | Function | Registers global lifecycle observability callbacks.                      |
| [`observe(target, callback)`](/api/functions/index.observe.html)                      | Function | Subscribes to changes on a specific reactive object or store.            |
| [`createReactivityHub(options)`](/api/functions/index.createReactivityHub.html)       | Function | Creates an isolated telemetry buffer and dispatcher hub.                 |

---

## `@banksia/signals/react`

React 18 & 19 integration hooks and Higher-Order Components.

| Export                                                           | Type | Description                                                              |
| :--------------------------------------------------------------- | :--- | :----------------------------------------------------------------------- |
| [`useReactive(target)`](/api/functions/react.useReactive.html)   | Hook | Subscribes a React component to a reactive proxy object or domain store. |
| [`observer(Component)`](/api/functions/react.observer.html)      | HOC  | Converts a functional component into an auto-tracking reactive observer. |
| [`useSignal(initial)`](/api/functions/react.useSignal.html)      | Hook | Creates and memoizes a component-scoped `Signal`.                        |
| [`useComputed(fn, deps)`](/api/functions/react.useComputed.html) | Hook | Creates and memoizes a component-scoped `computed()` derivation.         |

---

## `@banksia/signals/lit`

Lit and Web Component lifecycle controllers.

| Export                                                         | Type  | Description                                                              |
| :------------------------------------------------------------- | :---- | :----------------------------------------------------------------------- |
| [`SignalsController`](/api/classes/lit.SignalsController.html) | Class | Lit `ReactiveController` binding reactive stores to component rendering. |

---

## `@banksia/signals/solid`

SolidJS reactivity bridge.

| Export                                                                                 | Type     | Description                                                                |
| :------------------------------------------------------------------------------------- | :------- | :------------------------------------------------------------------------- |
| [`createSolidSignalBridge(target)`](/api/functions/solid.createSolidSignalBridge.html) | Function | Bridges a `@banksia/signals` reactive store into SolidJS signal accessors. |

---

## `@banksia/signals/vanilla`

Zero-dependency DOM binding helpers.

| Export                                                              | Type     | Description                                                               |
| :------------------------------------------------------------------ | :------- | :------------------------------------------------------------------------ |
| [`bindText(element, getter)`](/api/functions/vanilla.bindText.html) | Function | Two-way or one-way binding between reactive expressions and element text. |
| [`bindDOM(element, updater)`](/api/functions/vanilla.bindDOM.html)  | Function | Reactive updater for classes, attributes, styles, and properties.         |
| [`bindInput(input, signal)`](/api/functions/vanilla.bindInput.html) | Function | Two-way data binding for input elements.                                  |

---

## `@banksia/signals/devtools`

Observability bridge and Chrome DevTools MCP inspection.

| Export                                                                     | Type     | Description                                                            |
| :------------------------------------------------------------------------- | :------- | :--------------------------------------------------------------------- |
| [`initDevTools(options)`](/api/functions/devtools.initDevTools.html)       | Function | Mounts `window.__BANKSIA_SIGNALS_DEVTOOLS__` global runtime inspector. |
| [`connectDevTools(options)`](/api/functions/devtools.connectDevTools.html) | Function | Connects a custom DevTools bridge listener.                            |
