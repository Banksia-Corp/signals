# Reactivity Performance Benchmarking & Budgets

This document outlines the automated runtime performance benchmarking suite and baseline performance budgets for `@banksia/signals` (Milestone 3 of [#25](https://github.com/Banksia-Corp/signals/issues/25), tracked in [#28](https://github.com/Banksia-Corp/signals/issues/28)).

---

## 1. Overview & Objectives

Reactivity throughput, minimal dependency propagation latency, and zero-waste memory footprints are core architectural pillars of `@banksia/signals`.

The runtime benchmark suite (`benchmarks/reactivity.bench.ts`) runs via `vitest bench` and measures:

- **Throughput**: Primitive signal reads/writes and Proxy property mutations.
- **Deep Dependency Propagation**: Linear computed chains up to 500 levels deep.
- **Diamond Graph Propagation**: 1 root signal $\rightarrow$ 1,000 computed signals $\rightarrow$ 1 subscriber effect.
- **Reactive Collections**: Reactive `Map` and `Set` operations.
- **Batching Efficiency**: Coalesced microtask updates via `batch(...)` vs synchronous triggers.
- **Teardown & Cleanup**: Effect creation and disposal latency.

---

## 2. Baseline Benchmark Results

_Environment: Node.js v22 (macOS Apple Silicon / ARM64)_

| Benchmark Scenario                               | Throughput (ops/sec) | Mean Latency (ms) | p75 (ms)  | p99 (ms)  | Minimum Budget Target | Status  |
| :----------------------------------------------- | :------------------: | :---------------: | :-------: | :-------: | :-------------------: | :-----: |
| **Primitive Signal Read** (`signal.value`)       |  **10.83M ops/sec**  |     0.0001 ms     | 0.0001 ms | 0.0001 ms |    > 5.0M ops/sec     | ✅ PASS |
| **Primitive Signal Write** (`signal.value = x`)  |  **5.58M ops/sec**   |     0.0002 ms     | 0.0002 ms | 0.0003 ms |    > 2.0M ops/sec     | ✅ PASS |
| **Reactive Proxy Read** (`makeReactive` object)  |  **3.81M ops/sec**   |     0.0003 ms     | 0.0003 ms | 0.0003 ms |    > 1.5M ops/sec     | ✅ PASS |
| **Reactive Proxy Write** (`makeReactive` object) |  **2.75M ops/sec**   |     0.0004 ms     | 0.0004 ms | 0.0005 ms |    > 1.0M ops/sec     | ✅ PASS |
| **100-Deep Computed Chain** (Update & Resolve)   |  **2.03M ops/sec**   |     0.0005 ms     | 0.0003 ms | 0.0171 ms |    > 500k ops/sec     | ✅ PASS |
| **500-Deep Computed Chain** (Update & Resolve)   |  **2.11M ops/sec**   |     0.0005 ms     | 0.0003 ms | 0.0004 ms |    > 200k ops/sec     | ✅ PASS |
| **1,000-Wide Diamond Graph Propagation**         |  **18.4k ops/sec**   |     0.0542 ms     | 0.0531 ms | 0.0887 ms |    > 5.0k ops/sec     | ✅ PASS |
| **Reactive Map (`set`/`get`/`delete`)**          |  **2.49M ops/sec**   |     0.0004 ms     | 0.0004 ms | 0.0005 ms |    > 1.0M ops/sec     | ✅ PASS |
| **Reactive Set (`add`/`has`/`delete`)**          |  **2.51M ops/sec**   |     0.0004 ms     | 0.0004 ms | 0.0005 ms |    > 1.0M ops/sec     | ✅ PASS |
| **Unbatched Multi-Signal Updates (3 writes)**    |  **1.31M ops/sec**   |     0.0008 ms     | 0.0007 ms | 0.0010 ms |    > 500k ops/sec     | ✅ PASS |
| **Batched Updates via `batch()` (3 writes)**     |   **765k ops/sec**   |     0.0013 ms     | 0.0013 ms | 0.0019 ms |    > 250k ops/sec     | ✅ PASS |
| **Create & Dispose 100 Effects**                 |  **26.0k ops/sec**   |     0.0385 ms     | 0.0338 ms | 0.0942 ms |    > 10.0k ops/sec    | ✅ PASS |

---

## 3. Running Benchmarks Locally

Run the complete benchmark suite using:

```bash
pnpm run bench
```

To watch benchmarks during performance optimization:

```bash
pnpm exec vitest bench
```

---

## 4. Continuous Integration & Regression Budgets

The benchmark suite runs automatically as part of the PR quality gate workflow (`.github/workflows/ci.yml`). Any architectural change that introduces a >15% throughput regression or memory leak must be flagged during review.
