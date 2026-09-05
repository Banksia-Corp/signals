---
"@banksia/signals": patch
---

Optimize core closure bundle size, downstream tree-shaking, and dispatch throughput (Phase 1 of #57):

- Added `sideEffects` configuration to `package.json` to allow consumer bundlers (Vite, Webpack, Rollup) to prune unreferenced core primitives on partial imports.
- Consolidated hook dispatching and metadata allocation in `src/core/observability.ts`.
- Eliminated intermediate Set allocations during mutation subscriber notification in `triggerMutation`.
- Deduplicated Map and Set mutation handlers and iteration logic in `src/core/collections.ts`.
- Streamlined `computed()` by returning `ComputedImpl` directly without forwarding wrapper objects.

Co-authored-by: Google Antigravity <ai@google.com>
