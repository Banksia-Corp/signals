# @banksia/signals

## 0.2.0

### Minor Changes

- [#59](https://github.com/Banksia-Corp/signals/pull/59) [`f9da2cd`](https://github.com/Banksia-Corp/signals/commit/f9da2cd312439cc4e23a3fd1ce2ab9f47be43365) Thanks [@luismiddleton](https://github.com/luismiddleton)! - Decouple `signal()` from collections and proxy subsystems for downstream tree-shaking and throughput (Phase 2 of #57):

  - Implemented `SignalImpl` class for `signal()`, eliminating JavaScript `Proxy` overhead and achieving up to 7x higher raw read/write throughput (21.6M ops/sec reads).
  - Extracted lightweight raw target reflection utilities and symbols (`RAW_TARGET`, `IS_REACTIVE`, `toRaw`, `isReactive`) into standalone zero-dependency module `src/core/raw.ts`.
  - Decoupled `src/core/observability.ts` from `src/core/proxy.ts`, breaking circular dependency edges with `src/core/collections.ts`.
  - Removed unused `makeReactive` static import in React adapter (`src/react.ts`).
  - Downstream bundlers (Vite, Webpack, Rollup) now eliminate `collections.js` and `proxy.js` entirely when only `signal`, `computed`, or `effect` are imported, reducing downstream signal bundles from 4.22 kB down to 837 B (496 B gzip, an 80.2% reduction).

  Co-authored-by: Google Antigravity <ai@google.com>

### Patch Changes

- [#58](https://github.com/Banksia-Corp/signals/pull/58) [`f1abde2`](https://github.com/Banksia-Corp/signals/commit/f1abde2b72f1a2b204536841245465fd2ac34070) Thanks [@luismiddleton](https://github.com/luismiddleton)! - Optimize core closure bundle size, downstream tree-shaking, and dispatch throughput (Phase 1 of #57):

  - Added `sideEffects` configuration to `package.json` to allow consumer bundlers (Vite, Webpack, Rollup) to prune unreferenced core primitives on partial imports.
  - Consolidated hook dispatching and metadata allocation in `src/core/observability.ts`.
  - Eliminated intermediate Set allocations during mutation subscriber notification in `triggerMutation`.
  - Deduplicated Map and Set mutation handlers and iteration logic in `src/core/collections.ts`.
  - Streamlined `computed()` by returning `ComputedImpl` directly without forwarding wrapper objects.

  Co-authored-by: Google Antigravity <ai@google.com>

## 0.1.7

### Patch Changes

- [#54](https://github.com/Banksia-Corp/signals/pull/54) [`a1de484`](https://github.com/Banksia-Corp/signals/commit/a1de484f39417cb8c4be717bf7b4be3752a6a7f0) Thanks [@luismiddleton](https://github.com/luismiddleton)! - docs: integrate `@rspress/plugin-typedoc` for native API documentation routing, LLM-native documentation (`llms.txt`, `llms-full.txt`), OpenGraph and SEO metadata, and quality gate refinements.

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
