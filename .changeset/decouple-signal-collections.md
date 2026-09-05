---
"@banksia/signals": patch
---

Decouple `signal()` from collections and proxy subsystems for downstream tree-shaking and throughput (Phase 2 of #57):

- Implemented `SignalImpl` class for `signal()`, eliminating JavaScript `Proxy` overhead and achieving up to 7x higher raw read/write throughput (21.6M ops/sec reads).
- Extracted lightweight raw target reflection utilities and symbols (`RAW_TARGET`, `IS_REACTIVE`, `toRaw`, `isReactive`) into standalone zero-dependency module `src/core/raw.ts`.
- Decoupled `src/core/observability.ts` from `src/core/proxy.ts`, breaking circular dependency edges with `src/core/collections.ts`.
- Removed unused `makeReactive` static import in React adapter (`src/react.ts`).
- Downstream bundlers (Vite, Webpack, Rollup) now eliminate `collections.js` and `proxy.js` entirely when only `signal`, `computed`, or `effect` are imported, reducing downstream signal bundles from 4.22 kB down to 837 B (496 B gzip, an 80.2% reduction).

Co-authored-by: Google Antigravity <ai@google.com>
