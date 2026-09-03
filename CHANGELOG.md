# @banksia/signals

## 0.1.6

### Patch Changes

- [#51](https://github.com/Banksia-Corp/signals/pull/51) [`5897927`](https://github.com/Banksia-Corp/signals/commit/58979271b2b1fc79683f8dedd974aed5a3c8357d) Thanks [@luismiddleton](https://github.com/luismiddleton)! - Refine and finesse documentation copy across all portal guides, aligning API signatures, code snippets, and architectural value proposition with engine implementations (fixes #47).

- [#51](https://github.com/Banksia-Corp/signals/pull/51) [`787239f`](https://github.com/Banksia-Corp/signals/commit/787239f6dd9c4f8f8d758ba2bbad54f58d36d6c9) Thanks [@luismiddleton](https://github.com/luismiddleton)! - Refine and strengthen the core value proposition in README.md and documentation portal around ultra-fast reactivity, pure domain models, and universal framework adapters (fixes #50).

- [#51](https://github.com/Banksia-Corp/signals/pull/51) [`8016f19`](https://github.com/Banksia-Corp/signals/commit/8016f1904ab47c8358d455235c70d67182ca6a3e) Thanks [@luismiddleton](https://github.com/luismiddleton)! - Setup interactive Rspress documentation portal, documentation guides (Getting Started, Core Concepts, Framework Adapters, DevTools & MCP, API Reference), TypeDoc bundling, and automated GitHub Pages deployment workflow.

## 0.1.5

### Patch Changes

- [#43](https://github.com/Banksia-Corp/signals/pull/43) [`c4e7d54`](https://github.com/Banksia-Corp/signals/commit/c4e7d54513a2284b6ee50f283220eef130d48793) Thanks [@luismiddleton](https://github.com/luismiddleton)! - Add Lefthook git hook configuration for automated pre-commit linting and formatting verification.

## 0.1.4

### Patch Changes

- [#39](https://github.com/Banksia-Corp/signals/pull/39) [`3ec83ae`](https://github.com/Banksia-Corp/signals/commit/3ec83aefe75d8c6fd5c593a76567b378d685ce6a) Thanks [@luismiddleton](https://github.com/luismiddleton)! - Define `engines.node` specification and align repository toolchains to active Node.js 22 LTS.

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
