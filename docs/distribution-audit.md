# Build Distribution, Bundling Strategy & Observability Audit

This document records the comprehensive build distribution, bundling strategy, packaging hygiene, and observability footprint audit conducted for `@banksia/signals` (Milestone 1 of [#25](https://github.com/Banksia-Corp/signals/issues/25), tracked in [#26](https://github.com/Banksia-Corp/signals/issues/26)).

---

## 1. Executive Summary

`@banksia/signals` is architected as a zero-dependency, ultra-fast reactive state management engine with optional framework adapters (`/react`, `/lit`, `/solid`, `/vanilla`) and DevTools/telemetry integration (`/devtools`).

### Key Findings & Improvements

1. **Packaging Hygiene**: Verified npm tarball packaging boundaries (`package.json#files`) and tightened JSR publish scope (`jsr.json` `publish.include` / `publish.exclude`), ensuring zero test files, internal scripts, or build caches leak into published packages.
2. **Subpath Decoupling**: Identified and resolved an issue where `src/index.ts` re-exported DevTools symbols (`DevToolsBridge`, `initDevTools`, etc.), which inadvertently pulled `dist/devtools.js` (~11.9 kB unminified) into the core `@banksia/signals` static closure. Core has now been decoupled from DevTools, reducing the unminified core closure from **42.2 kB** down to **30.2 kB** (and **3.89 kB** gzipped minified).
3. **Bundling Evaluation (`bundle: false` vs `bundle: true`)**: Confirmed that unbundled ESM (`bundle: false`) using `@rslib/core` provides optimal flexibility for modern consumer bundlers (Vite, Rollup, Webpack, esbuild), allowing granular tree-shaking of individual core primitives (`signal`, `computed`, `effect`, `proxy`, `collections`) without bundling overhead.
4. **Zero-Overhead Observability**: Verified that the core observability hooks in `dist/core/observability.js` maintain a zero-cost profile when DevTools or external telemetry observers are not attached.

---

## 2. Packaging & Distribution Artifact Hygiene

### NPM Distribution Tarball (`pnpm pack --dry-run`)

The npm published tarball strictly includes only distribution assets:

```
📦 @banksia/signals@0.1.0
Tarball Contents:
  ├── dist/
  │   ├── core/
  │   │   ├── collections.js & .d.ts
  │   │   ├── computed.js & .d.ts
  │   │   ├── effect.js & .d.ts
  │   │   ├── observability.js & .d.ts
  │   │   ├── proxy.js & .d.ts
  │   │   ├── scheduler.js & .d.ts
  │   │   └── signal.js & .d.ts
  │   ├── devtools.js & .d.ts
  │   ├── index.js & .d.ts
  │   ├── lit.js & .d.ts
  │   ├── react.js & .d.ts
  │   ├── solid.js & .d.ts
  │   └── vanilla.js & .d.ts
  ├── package.json
  └── README.md
```

- **Zero Leakage**: No `.ts` source files, `tests/`, `docs/`, `scripts/`, or internal tooling artifacts leak into npm.
- **Type Declaration Cleanliness**: Generated TypeScript `.d.ts` declaration files accurately reflect public API types with full TypeDoc docstrings.

### JSR Manifest Configuration (`jsr.json`)

Explicit publish filter rules are configured in `jsr.json`:

```json
{
  "name": "@banksia/signals",
  "version": "0.1.0",
  "license": "MIT",
  "exports": {
    ".": "./src/index.ts",
    "./react": "./src/react.ts",
    "./lit": "./src/lit.ts",
    "./solid": "./src/solid.ts",
    "./vanilla": "./src/vanilla.ts",
    "./devtools": "./src/devtools.ts"
  },
  "publish": {
    "include": ["src/**/*.ts", "README.md", "jsr.json"],
    "exclude": ["tests/**", "docs/**", "scripts/**"]
  }
}
```

---

## 3. Bundling Strategy: Unbundled vs. Bundled ESM

### Evaluation Matrix

| Metric                       | Unbundled ESM (`bundle: false`)                                                                                       | Pre-Bundled Subpaths (`bundle: true`)                                                        |
| :--------------------------- | :-------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------- |
| **Downstream Tree-Shaking**  | **Granular**: Downstream bundlers can eliminate unused core files (e.g. `collections.js` if only `signal()` is used). | Coarse: The whole subpath bundle is parsed unless downstream minifier supports deep AST DCE. |
| **Debugging & Sourcemaps**   | Direct 1:1 correspondence with `src/` modules.                                                                        | Stack traces traverse synthetic bundled code.                                                |
| **Framework Peer Isolation** | Direct module references cleanly isolated.                                                                            | Risk of accidental bundle duplication across subpaths.                                       |
| **NPM Package Footprint**    | ~46.8 kB (all unminified JS + DTS)                                                                                    | ~46.8 kB                                                                                     |

### Conclusion

**Unbundled ESM (`bundle: false`) remains the recommended distribution format** for `@banksia/signals` on npm. Modern bundlers (Vite, Rollup, esbuild, Webpack 5) resolve ESM graphs natively and apply fine-grained dead-code elimination far more efficiently when modules remain modular.

---

## 4. Size & Dependency Closure Breakdown

### Individual File Breakdown (`dist/`)

| Output File                  | Raw Size |  Gzip   | Brotli  | Description                                 |
| :--------------------------- | :------: | :-----: | :-----: | :------------------------------------------ |
| `dist/core/signal.js`        |  191 B   |  148 B  |  108 B  | Primitive signal container                  |
| `dist/core/proxy.js`         | 3.61 kB  |  994 B  |  854 B  | Deep Proxy wrapping & trap intercepts       |
| `dist/core/collections.js`   | 7.94 kB  | 1.25 kB | 1.09 kB | Reactive Set & Map proxies                  |
| `dist/core/scheduler.js`     | 2.30 kB  |  756 B  |  670 B  | Batching scheduler & microtask queue        |
| `dist/core/computed.js`      | 3.60 kB  |  938 B  |  824 B  | Memoized derived signals                    |
| `dist/core/effect.js`        | 2.35 kB  |  708 B  |  644 B  | Reactive side effect observer               |
| `dist/core/observability.js` | 9.67 kB  | 1.97 kB | 1.78 kB | Reactivity telemetry & hook hub             |
| `dist/index.js`              |  557 B   |  257 B  |  225 B  | Core entrypoint re-exports                  |
| `dist/react.js`              | 2.07 kB  |  731 B  |  639 B  | React adapter (`useReactive`, `observer`)   |
| `dist/lit.js`                |  897 B   |  407 B  |  334 B  | Lit adapter (`SignalsController`)           |
| `dist/solid.js`              |  395 B   |  219 B  |  184 B  | SolidJS bridge (`createSolidSignalBridge`)  |
| `dist/vanilla.js`            |  289 B   |  175 B  |  148 B  | DOM & Text bindings (`bindDOM`, `bindText`) |
| `dist/devtools.js`           | 11.89 kB | 2.45 kB | 2.20 kB | DevTools & MCP bridge adapter               |

### Subpath Export Closures (Minified Simulation)

When consumer bundlers package and minify subpath entrypoints, the complete static dependency closures measure as follows:

| Subpath Export              | Closure Modules | Minified Raw | Minified Gzip | Minified Brotli |
| :-------------------------- | :-------------: | :----------: | :-----------: | :-------------: |
| `@banksia/signals` (Core)   |        8        |   12.52 kB   |  **3.89 kB**  |   **3.50 kB**   |
| `@banksia/signals/react`    |        8        |   13.05 kB   |  **4.15 kB**  |   **3.72 kB**   |
| `@banksia/signals/lit`      |        6        |   10.90 kB   |  **3.61 kB**  |   **3.22 kB**   |
| `@banksia/signals/solid`    |        6        |   10.62 kB   |  **3.53 kB**  |   **3.17 kB**   |
| `@banksia/signals/vanilla`  |        6        |   10.58 kB   |  **3.50 kB**  |   **3.14 kB**   |
| `@banksia/signals/devtools` |        5        |   15.54 kB   |  **4.75 kB**  |   **4.29 kB**   |

---

## 5. Observability & Zero-Overhead Telemetry

### Architecture

Reactivity hooks (`registerReactivityHooks`, `observe`, `createReactivityHub`) operate through fast boolean flags (`hasTrackObservers()`, `hasNotifyObservers()`, etc.).

- **When DevTools are NOT connected**: Flag checks immediately return `false`, bypassing telemetry event allocation and callback dispatches with zero runtime cost.
- **When DevTools ARE connected**: The DevTools bridge registers observers to buffer mutation and reactivity events into ring buffers for DevTools / MCP clients.
- **Decoupling Guarantee**: Core engine code does not import `@banksia/signals/devtools`. DevTools imports core hooks, preserving one-way dependency isolation.

---

## 6. Recommended Size Budgets for Milestone 2 (#27)

Based on the empirical measurements above, the following budget thresholds are established for automated CI enforcement in Milestone 2:

| Entrypoint / Subpath            |  Target Gzip Budget   | Target Brotli Budget | Max Threshold Limit |
| :------------------------------ | :-------------------: | :------------------: | :-----------------: |
| `@banksia/signals` (Core Index) |       < 3.5 kB        |       < 3.0 kB       |     **4.2 kB**      |
| `@banksia/signals/react`        | < 1.0 kB (standalone) |       < 0.8 kB       |     **1.2 kB**      |
| `@banksia/signals/lit`          | < 0.8 kB (standalone) |       < 0.6 kB       |     **1.0 kB**      |
| `@banksia/signals/solid`        | < 0.5 kB (standalone) |       < 0.4 kB       |     **0.6 kB**      |
| `@banksia/signals/vanilla`      | < 0.5 kB (standalone) |       < 0.4 kB       |     **0.6 kB**      |
| `@banksia/signals/devtools`     | < 3.0 kB (standalone) |       < 2.5 kB       |     **3.5 kB**      |
