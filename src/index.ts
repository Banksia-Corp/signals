/**
 * @module signals
 *
 * Framework-agnostic, fine-grained Proxy-based reactive state framework supporting
 * multi-tier domain stores and UI adapters for React, Lit, SolidJS, and Vanilla JS.
 *
 * @remarks
 * ## Core Architecture
 * - **Deep Proxy Traps**: {@link makeReactive} wraps objects, classes, arrays, Sets, and Maps in fine-grained traps.
 * - **Reactivity Primitives**: {@link signal}, {@link computed}, and {@link effect} provide state holding, derived values, and side effects.
 * - **Batching & Scheduling**: {@link batch} and {@link flushBatch} collapse state mutations in the same tick into a single reaction cycle.
 * - **Observability Pipeline**: {@link registerReactivityHooks}, {@link observe}, and {@link createReactivityHub} enable un-opinionated telemetry, profiling, and DevTools integration.
 *
 * ## Subpath Exports
 * - `@banksia/signals` (or `signals`): Main entrypoint exposing core reactivity, proxies, and observability.
 * - `@banksia/signals/react` (or `signals/react`): React integration hooks (`useReactive`, `useSignal`, `useComputed`, `observer`).
 * - `@banksia/signals/lit` (or `signals/lit`): Lit element controller (`SignalsController`).
 * - `@banksia/signals/solid` (or `signals/solid`): SolidJS reactive bridge (`createSolidSignalBridge`).
 * - `@banksia/signals/vanilla` (or `signals/vanilla`): Vanilla DOM synchronization helpers (`bindDOM`, `bindText`).
 *
 * @packageDocumentation
 */

// Core primitives and proxy reactivity
export { makeReactive, isReactive, toRaw } from "./core/proxy";
export { signal, type Signal } from "./core/signal";
export { computed, type ReadonlySignal } from "./core/computed";
export { effect, type EffectFn, type DisposeFn } from "./core/effect";
export { batch, flushBatch, registerOnReaction } from "./core/scheduler";
export {
  registerReactivityHooks,
  observe,
  createReactivityHub,
  configureSignalsDebug,
  getDependencyGraph,
  registerOnMutation,
  hasTrackObservers,
  hasNotifyObservers,
  hasScheduleObservers,
  hasExecuteObservers,
  hasBatchObservers,
  hasErrorObservers,
  type ReactiveSource,
  type ReactiveConsumer,
  type ReactivityHooks,
  type ReactiveSourceMeta,
  type ChangeEvent,
  type ExecutionContext,
  type BatchStats,
  type HubOptions,
  type ReactivityHub,
  type MutationEvent,
  type DependencyGraphNode,
  type SignalsDebugConfig,
} from "./core/observability";
export {
  DevToolsBridge,
  initDevTools,
  connectDevTools,
  disconnectDevTools,
  getDevToolsBridge,
  type DevToolsOptions,
  type DevToolsEvent,
  type DevToolsMutationEvent,
  type DevToolsTrackEvent,
  type DevToolsExecuteEvent,
  type DevToolsBatchEvent,
  type DevToolsErrorEvent,
  type GetRecentEventsOptions,
  type DevToolsTargetInspection,
  type DevToolsPerformanceMetrics,
} from "./devtools";
