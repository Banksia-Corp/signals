# @banksia/signals

## 0.1.0

### Minor Changes

- e1a5e9e: Include native SolidJS integration (`@banksia/signals/solid` and `createSolidSignalBridge`) replacing legacy bridge packages.
- e1a5e9e: Integrate `@banksia/signals` observability lifecycle hooks with Chrome DevTools MCP and browser DevTools via `@banksia/signals/devtools`, exposing runtime inspection globals (`window.__BANKSIA_SIGNALS_DEVTOOLS__`), ring-buffered telemetry, sandboxed untracked state introspection, dependency graph querying, and performance profiling.
- e1a5e9e: Create `@banksia/signals` fine-grained Proxy-based reactivity framework superseding legacy RxJS state management.
- e1a5e9e: Implement primitive-first Reactivity Observability & Lifecycle Event Hooks (`onTrack`, `onNotify`, `onSchedule`, `onExecute`, `onBatch`, `onError`), supporting multi-registry pipelines (`createReactivityHub`), target-scoped observation (`observe`), and zero-cost fast-path performance gates.

### Patch Changes

- e1a5e9e: Decouple `domain-objects` from `@banksia/signals` unit tests and package dependencies so that the signals framework has zero required platform dependencies.
- e1a5e9e: Add comprehensive TSDoc documentation across all exported core modules, framework adapters (React, Lit, SolidJS, Vanilla DOM), types, interfaces, classes, and observability utilities for npm and JSR publishing readiness.
