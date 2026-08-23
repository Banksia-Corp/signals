# @banksia/signals

## 0.1.3

### Patch Changes

- [#37](https://github.com/Banksia-Corp/signals/pull/37) [`5eb4e9c`](https://github.com/Banksia-Corp/signals/commit/5eb4e9cc9db0378b2854ed390529c4f8cb70b835) Thanks [@luismiddleton](https://github.com/luismiddleton)! - Add automated reactivity performance benchmarking suite (`vitest bench`), `pnpm run bench` command, baseline performance documentation, and CI regression checks.

## 0.1.2

### Patch Changes

- [#33](https://github.com/Banksia-Corp/signals/pull/33) [`859e9a7`](https://github.com/Banksia-Corp/signals/commit/859e9a7a528658ab33ba4328a5918183efab6b72) Thanks [@luismiddleton](https://github.com/luismiddleton)! - Add automated build size budget gate, `pnpm run size` script, and CI size enforcement workflow.

## 0.1.1

### Patch Changes

- [#30](https://github.com/Banksia-Corp/signals/pull/30) [`b2223fd`](https://github.com/Banksia-Corp/signals/commit/b2223fdf84fe5d34ebb3ab4ed669a1582b30a55c) Thanks [@luismiddleton](https://github.com/luismiddleton)! - Add TypeDoc API documentation generation tooling, configuration, and `pnpm run docs` script.

- [#32](https://github.com/Banksia-Corp/signals/pull/32) [`9cd9fd7`](https://github.com/Banksia-Corp/signals/commit/9cd9fd7debc8aa522ff6369fda6033d7e0924a92) Thanks [@luismiddleton](https://github.com/luismiddleton)! - Audit build distribution and decouple DevTools export from root entrypoint to optimize core bundle size.

## 0.1.0

### Minor Changes

- e1a5e9e: Include native SolidJS integration (`@banksia/signals/solid` and `createSolidSignalBridge`) replacing legacy bridge packages.
- e1a5e9e: Integrate `@banksia/signals` observability lifecycle hooks with Chrome DevTools MCP and browser DevTools via `@banksia/signals/devtools`, exposing runtime inspection globals (`window.__BANKSIA_SIGNALS_DEVTOOLS__`), ring-buffered telemetry, sandboxed untracked state introspection, dependency graph querying, and performance profiling.
- e1a5e9e: Create `@banksia/signals` fine-grained Proxy-based reactivity framework superseding legacy RxJS state management.
- e1a5e9e: Implement primitive-first Reactivity Observability & Lifecycle Event Hooks (`onTrack`, `onNotify`, `onSchedule`, `onExecute`, `onBatch`, `onError`), supporting multi-registry pipelines (`createReactivityHub`), target-scoped observation (`observe`), and zero-cost fast-path performance gates.

### Patch Changes

- e1a5e9e: Decouple `domain-objects` from `@banksia/signals` unit tests and package dependencies so that the signals framework has zero required platform dependencies.
- e1a5e9e: Add comprehensive TSDoc documentation across all exported core modules, framework adapters (React, Lit, SolidJS, Vanilla DOM), types, interfaces, classes, and observability utilities for npm and JSR publishing readiness.
