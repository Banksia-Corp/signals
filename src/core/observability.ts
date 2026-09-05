/**
 * @module core/observability
 * Lifecycle observability hooks, telemetry dispatchers, dependency graph inspection, and debugging utilities.
 */

import {
  Subscriber,
  getActiveSubscriber,
  scheduleNotification,
} from "./scheduler";
import { toRaw } from "./proxy";

/**
 * Metadata descriptor describing the origin and classification of a reactive source.
 */
export interface ReactiveSourceMeta {
  /** The raw unproxied target object hosting the property, if applicable. */
  target?: object;
  /** The constructor/class name of the target object (e.g. `'UserStore'`). */
  targetName?: string;
  /** The property name or symbol being accessed or mutated. */
  property?: string | symbol;
  /** Human-readable diagnostic label (e.g. `'UserStore.name'`). */
  label: string;
  /** Classification of the reactive source. */
  type: "signal" | "property" | "collection" | "computed";
  /** Optional flag indicating if the source should be omitted from public telemetry pipelines. */
  isPrivate?: boolean;
}

/**
 * Interface representing a reactive state source node.
 *
 * @template T - The type of value emitted or stored by the source.
 */
export interface ReactiveSource<T = unknown> {
  /** Unique identifier or symbol for the reactive source node. */
  id: string | symbol;
  /** Current snapshot value of the source at event time. */
  value?: T;
  /** Associated metadata descriptor. */
  meta: ReactiveSourceMeta;
}

/**
 * Interface representing a consumer subscriber that depends on reactive sources.
 */
export interface ReactiveConsumer {
  /** Unique identifier or symbol for the reactive consumer subscriber. */
  id: string | symbol;
  /** Human-readable name or diagnostic label for the consumer. */
  name: string;
  /** Classification category of the consumer. */
  type: "effect" | "computed" | "adapter";
}

/**
 * Payload describing a mutation change event.
 *
 * @template T - The value type being mutated.
 */
export interface ChangeEvent<T = unknown> {
  /** The previous value prior to mutation. */
  oldValue?: T;
  /** The new value after mutation. */
  newValue?: T;
  /** High-resolution epoch timestamp (in ms) when the mutation was recorded. */
  timestamp: number;
}

/**
 * Context descriptor emitted during consumer execution lifecycles.
 */
export interface ExecutionContext {
  /** Execution lifecycle phase (`'start'` before running, `'end'` after completion). */
  phase: "start" | "end";
  /** Execution duration in milliseconds (provided when `phase === 'end'`). */
  durationMs?: number;
  /** Error thrown during execution, if any. */
  error?: unknown;
}

/**
 * Statistics and phase descriptor emitted during batch scheduler flushes.
 */
export interface BatchStats {
  /** Lifecycle phase of the batch transaction. */
  phase: "start" | "flush" | "end";
  /** Number of subscribers currently queued for notification. */
  queuedCount?: number;
  /** Number of subscribers notified in the current flush cycle. */
  flushedCount?: number;
}

/**
 * Global or scoped lifecycle hooks for reactive telemetry, profiling, and DevTools inspection.
 *
 * @example
 * ```ts
 * import { registerReactivityHooks } from '@banksia/signals';
 *
 * const unregister = registerReactivityHooks({
 *   onTrack(source, consumer) {
 *     console.log(`[Track] ${consumer.name} -> ${source.meta.label}`);
 *   },
 *   onNotify(source, change) {
 *     console.log(`[Notify] ${source.meta.label}:`, change.oldValue, '->', change.newValue);
 *   },
 * });
 * ```
 */
export interface ReactivityHooks {
  /**
   * Invoked when a consumer establishes a dependency edge by reading a reactive source.
   *
   * @param source - The reactive source node being read.
   * @param consumer - The active consumer subscriber establishing the dependency.
   */
  onTrack?(source: ReactiveSource, consumer: ReactiveConsumer): void;

  /**
   * Invoked when a reactive source mutates and invalidates its downstream subscribers.
   *
   * @param source - The reactive source node that changed.
   * @param change - Mutation details including old value, new value, and timestamp.
   */
  onNotify?(source: ReactiveSource, change: ChangeEvent): void;

  /**
   * Invoked when the scheduler queues a consumer subscriber for deferred execution.
   *
   * @param consumer - The consumer subscriber queued for notification.
   */
  onSchedule?(consumer: ReactiveConsumer): void;

  /**
   * Invoked immediately before (`start`) and after (`end`) a consumer executes.
   *
   * @param consumer - The consumer subscriber being executed.
   * @param context - Execution phase, duration in milliseconds, and any caught error.
   */
  onExecute?(consumer: ReactiveConsumer, context: ExecutionContext): void;

  /**
   * Invoked during batch lifecycle events (`start`, `flush`, `end`).
   *
   * @param stats - Batch phase and count statistics.
   */
  onBatch?(stats: BatchStats): void;

  /**
   * Invoked whenever an uncaught error occurs during reactive execution or hook dispatch.
   *
   * @param error - The error thrown.
   * @param context - Contextual information indicating the source, consumer, and phase of failure.
   */
  onError?(
    error: unknown,
    context: {
      source?: ReactiveSource;
      consumer?: ReactiveConsumer;
      phase: string;
    },
  ): void;
}

/**
 * Options for configuring a dedicated reactivity pipeline hub.
 */
export interface HubOptions {
  /** Optional filter predicate to include or exclude specific reactive sources. */
  filter?: (source: ReactiveSource) => boolean;
  /** Optional debounce or batch flush threshold in milliseconds. */
  batchFlushMs?: number;
}

/**
 * Reactive pipeline hub for managing scoped hooks and telemetry channels.
 */
export interface ReactivityHub {
  /**
   * Registers hooks with this hub.
   *
   * @param hooks - Reactivity lifecycle hooks to attach.
   * @returns An unregister function to remove the hooks.
   */
  use(hooks: ReactivityHooks): () => void;

  /**
   * Clears and unregisters all hooks currently attached to this hub.
   */
  clear(): void;
}

/**
 * Legacy mutation event payload for backwards compatibility with `registerOnMutation`.
 */
export interface MutationEvent {
  /** Target object that was mutated. */
  target: object;
  /** Property key or symbol that was modified. */
  property: string | symbol;
  /** Value prior to modification. */
  oldValue: unknown;
  /** Value after modification. */
  newValue: unknown;
  /** Epoch timestamp in milliseconds. */
  timestamp: number;
}

/**
 * Dependency graph node describing subscriber counts per property on a target object.
 */
export interface DependencyGraphNode {
  /** Class or constructor name of the target object. */
  targetName: string;
  /** Map of property keys to active subscriber count. */
  properties: Record<
    string,
    {
      subscriberCount: number;
    }
  >;
}

/**
 * Configuration options for signals debug logging and batch tracing.
 */
export interface SignalsDebugConfig {
  /** Enables console mutation logging. */
  enableLogging?: boolean;
  /** Enables scheduler batch execution tracing. */
  traceBatches?: boolean;
}

// Global active hooks set
const globalHooks = new Set<ReactivityHooks>();

// Scoped hooks per target
const scopedTargetHooks = new WeakMap<object, Set<ReactivityHooks>>();

// Hook counters for fast-path zero-overhead execution
let trackHookCount = 0;
let notifyHookCount = 0;
let scheduleHookCount = 0;
let executeHookCount = 0;
let batchHookCount = 0;
let errorHookCount = 0;

/**
 * Returns whether any active hooks are listening to `onTrack` events.
 *
 * @returns `true` if at least one track observer is registered; otherwise `false`.
 */
export function hasTrackObservers(): boolean {
  return trackHookCount > 0;
}

/**
 * Returns whether any active hooks are listening to `onNotify` mutation events.
 *
 * @returns `true` if at least one notify observer is registered; otherwise `false`.
 */
export function hasNotifyObservers(): boolean {
  return notifyHookCount > 0;
}

/**
 * Returns whether any active hooks are listening to `onSchedule` events.
 *
 * @returns `true` if at least one schedule observer is registered; otherwise `false`.
 */
export function hasScheduleObservers(): boolean {
  return scheduleHookCount > 0;
}

/**
 * Returns whether any active hooks are listening to `onExecute` lifecycle events.
 *
 * @returns `true` if at least one execute observer is registered; otherwise `false`.
 */
export function hasExecuteObservers(): boolean {
  return executeHookCount > 0;
}

/**
 * Returns whether any active hooks are listening to `onBatch` events.
 *
 * @returns `true` if at least one batch observer is registered; otherwise `false`.
 */
export function hasBatchObservers(): boolean {
  return batchHookCount > 0;
}

/**
 * Returns whether any active hooks are listening to `onError` events.
 *
 * @returns `true` if at least one error observer is registered; otherwise `false`.
 */
export function hasErrorObservers(): boolean {
  return errorHookCount > 0;
}

function updateHookCounts(hooks: ReactivityHooks, delta: 1 | -1): void {
  if (hooks.onTrack) trackHookCount = Math.max(0, trackHookCount + delta);
  if (hooks.onNotify) notifyHookCount = Math.max(0, notifyHookCount + delta);
  if (hooks.onSchedule)
    scheduleHookCount = Math.max(0, scheduleHookCount + delta);
  if (hooks.onExecute) executeHookCount = Math.max(0, executeHookCount + delta);
  if (hooks.onBatch) batchHookCount = Math.max(0, batchHookCount + delta);
  if (hooks.onError) errorHookCount = Math.max(0, errorHookCount + delta);
}

/**
 * Registers global reactivity lifecycle hooks for telemetry, analytics, profiling, and debugging.
 *
 * @param hooks - Object implementing one or more {@link ReactivityHooks}.
 * @returns An unsubscribe function to remove the registered hooks.
 *
 * @example
 * ```ts
 * import { registerReactivityHooks } from '@banksia/signals';
 *
 * const unsubscribe = registerReactivityHooks({
 *   onNotify(source, change) {
 *     console.log(`[Mutation] ${source.meta.label}: ${change.oldValue} -> ${change.newValue}`);
 *   },
 * });
 * ```
 */
export function registerReactivityHooks(hooks: ReactivityHooks): () => void {
  globalHooks.add(hooks);
  updateHookCounts(hooks, 1);

  return () => {
    if (globalHooks.has(hooks)) {
      globalHooks.delete(hooks);
      updateHookCounts(hooks, -1);
    }
  };
}

/**
 * Attaches scoped reactivity lifecycle hooks to a specific reactive target object, domain model, or store.
 *
 * @remarks
 * Unlike global hooks, scoped hooks only receive notifications when the specified target object
 * or its nested reactive properties are tracked or mutated.
 *
 * @template T - The type of target object or store.
 * @param target - The reactive object or store to observe.
 * @param hooks - Reactivity lifecycle hooks to attach.
 * @returns An unsubscribe function to detach the hooks from the target.
 *
 * @example
 * ```ts
 * import { observe, makeReactive } from '@banksia/signals';
 *
 * const user = makeReactive({ name: 'Alice' });
 * const unsubscribe = observe(user, {
 *   onNotify(source, change) {
 *     console.log('User mutated:', source.meta.property, change.newValue);
 *   },
 * });
 * ```
 */
export function observe<T extends object>(
  target: T,
  hooks: ReactivityHooks,
): () => void {
  const rawTarget = toRaw(target);
  let hooksSet = scopedTargetHooks.get(rawTarget);
  if (!hooksSet) {
    hooksSet = new Set();
    scopedTargetHooks.set(rawTarget, hooksSet);
  }

  hooksSet.add(hooks);
  updateHookCounts(hooks, 1);

  return () => {
    const set = scopedTargetHooks.get(rawTarget);
    if (set && set.has(hooks)) {
      set.delete(hooks);
      updateHookCounts(hooks, -1);
      if (set.size === 0) {
        scopedTargetHooks.delete(rawTarget);
      }
    }
  };
}

/**
 * Creates a dedicated reactivity pipeline hub for managing isolated subscriber hooks and filtered streams.
 *
 * @param options - Configuration options such as source filtering predicates.
 * @returns A {@link ReactivityHub} instance.
 *
 * @example
 * ```ts
 * import { createReactivityHub } from '@banksia/signals';
 *
 * const hub = createReactivityHub({
 *   filter: (source) => !source.meta.isPrivate,
 * });
 *
 * hub.use({
 *   onNotify(source, change) {
 *     console.log('Telemetry change:', source.meta.label, change.newValue);
 *   },
 * });
 * ```
 */
export function createReactivityHub(options?: HubOptions): ReactivityHub {
  const registered = new Set<() => void>();

  return {
    use(hooks: ReactivityHooks) {
      const wrappedHooks: ReactivityHooks = {
        ...hooks,
        onNotify: hooks.onNotify
          ? (source, change) => {
              if (options?.filter && !options.filter(source)) return;
              hooks.onNotify?.(source, change);
            }
          : undefined,
        onTrack: hooks.onTrack
          ? (source, consumer) => {
              if (options?.filter && !options.filter(source)) return;
              hooks.onTrack?.(source, consumer);
            }
          : undefined,
      };

      const unregister = registerReactivityHooks(wrappedHooks);
      registered.add(unregister);
      return () => {
        unregister();
        registered.delete(unregister);
      };
    },
    clear() {
      for (const unreg of registered) {
        unreg();
      }
      registered.clear();
    },
  };
}

/**
 * Wildcard symbol key for tracking and triggering all-collection subscriber invalidations.
 */
export const ALL_KEY = Symbol.for("__ALL__");

/**
 * Creates a normalized {@link ReactiveSource} descriptor for an object property.
 *
 * @internal
 */
export function createPropertySource(
  target: object,
  property: string | symbol,
  value: unknown,
): ReactiveSource {
  const targetName = target.constructor?.name || "Object";
  const label = `${targetName}.${String(property)}`;
  return {
    id: label,
    value,
    meta: {
      target,
      targetName,
      property,
      label,
      type: "property",
    },
  };
}

function invokeHooks<K extends keyof ReactivityHooks>(
  key: K,
  scopedTarget: object | undefined,
  context: {
    source?: ReactiveSource;
    consumer?: ReactiveConsumer;
    phase: string;
  },
  ...args: any[]
): void {
  const dispatch = (hook: ReactivityHooks) => {
    const fn = hook[key] as any;
    if (fn) {
      try {
        fn(...args);
      } catch (err) {
        dispatchError(err, context);
      }
    }
  };

  for (const hook of globalHooks) dispatch(hook);

  if (scopedTarget) {
    const scoped = scopedTargetHooks.get(scopedTarget);
    if (scoped) {
      for (const hook of scoped) dispatch(hook);
    }
  }
}

/**
 * Internal dispatcher invoked when a dependency edge is established.
 *
 * @internal
 * @param source - The reactive source node being accessed.
 * @param consumer - The active consumer subscriber reading the source.
 */
export function dispatchTrack(
  source: ReactiveSource,
  consumer: ReactiveConsumer,
): void {
  if (trackHookCount === 0) return;
  invokeHooks(
    "onTrack",
    source.meta.target,
    { source, consumer, phase: "onTrack" },
    source,
    consumer,
  );
}

/**
 * Internal dispatcher invoked when a reactive source mutates.
 *
 * @internal
 * @param source - The reactive source node that changed.
 * @param change - Mutation change payload.
 */
export function dispatchNotify(
  source: ReactiveSource,
  change: ChangeEvent,
): void {
  if (notifyHookCount === 0) return;
  invokeHooks(
    "onNotify",
    source.meta.target,
    { source, phase: "onNotify" },
    source,
    change,
  );
}

/**
 * Internal dispatcher invoked when a consumer is queued by the scheduler.
 *
 * @internal
 * @param consumer - The consumer queued for execution.
 */
export function dispatchSchedule(consumer: ReactiveConsumer): void {
  if (scheduleHookCount === 0) return;
  invokeHooks(
    "onSchedule",
    undefined,
    { consumer, phase: "onSchedule" },
    consumer,
  );
}

/**
 * Internal dispatcher invoked before and after a consumer executes.
 *
 * @internal
 * @param consumer - The consumer subscriber executing.
 * @param context - Execution phase, duration, and error context.
 */
export function dispatchExecute(
  consumer: ReactiveConsumer,
  context: ExecutionContext,
): void {
  if (executeHookCount === 0) return;
  invokeHooks(
    "onExecute",
    undefined,
    { consumer, phase: "onExecute" },
    consumer,
    context,
  );
}

/**
 * Internal dispatcher invoked during scheduler batch transactions.
 *
 * @internal
 * @param stats - Batch lifecycle statistics.
 */
export function dispatchBatch(stats: BatchStats): void {
  if (batchHookCount === 0) return;
  invokeHooks("onBatch", undefined, { phase: "onBatch" }, stats);
}

/**
 * Internal dispatcher invoked when an error occurs during reactive evaluation or hook dispatch.
 *
 * @internal
 * @param error - The caught error instance.
 * @param context - Context describing the source, consumer, and phase of error.
 */
export function dispatchError(
  error: unknown,
  context: {
    source?: ReactiveSource;
    consumer?: ReactiveConsumer;
    phase: string;
  },
): void {
  if (errorHookCount > 0) {
    for (const hook of globalHooks) {
      if (hook.onError) {
        try {
          hook.onError(error, context);
        } catch {
          // Prevent error recursion
        }
      }
    }
  } else {
    console.error(`[Signals] Error in ${context.phase}:`, error);
  }
}

// Dependency tracking and Graph storage
const targetPropertySubscribers = new WeakMap<
  object,
  Map<string | symbol, Set<Subscriber>>
>();

/**
 * Records a reactive dependency between the active subscriber and a target property.
 *
 * @param target - The target object containing the property.
 * @param property - The property key or symbol being accessed.
 */
export function trackDependency(
  target: object,
  property: string | symbol,
): void {
  const activeSub = getActiveSubscriber();
  if (!activeSub) return;

  const rawTarget = toRaw(target);
  let propMap = targetPropertySubscribers.get(rawTarget);
  if (!propMap) {
    propMap = new Map();
    targetPropertySubscribers.set(rawTarget, propMap);
  }

  let subs = propMap.get(property);
  if (!subs) {
    subs = new Set();
    propMap.set(property, subs);
  }

  subs.add(activeSub);
  activeSub.dependencies.add(subs);

  if (hasTrackObservers()) {
    const source = createPropertySource(
      rawTarget,
      property,
      (rawTarget as any)[property],
    );
    const consumer: ReactiveConsumer = {
      id: activeSub.id || "anonymous-subscriber",
      name: activeSub.name || "AnonymousSubscriber",
      type: activeSub.type || "effect",
    };
    dispatchTrack(source, consumer);
  }
}

/**
 * Triggers reactive notifications to all subscribers depending on the modified property.
 *
 * @param target - The target object whose property changed.
 * @param property - The property key or symbol that mutated.
 * @param oldValue - The value before mutation.
 * @param newValue - The value after mutation.
 */
export function triggerMutation(
  target: object,
  property: string | symbol,
  oldValue: unknown,
  newValue: unknown,
): void {
  const rawTarget = toRaw(target);

  if (hasNotifyObservers()) {
    const source = createPropertySource(rawTarget, property, newValue);
    dispatchNotify(source, {
      oldValue,
      newValue,
      timestamp: Date.now(),
    });
  }

  const propMap = targetPropertySubscribers.get(rawTarget);
  if (!propMap) return;

  const directSubs = propMap.get(property);
  const wildcardSubs = propMap.get(ALL_KEY);

  if (directSubs && directSubs.size > 0) {
    scheduleNotification(directSubs);
  }
  if (wildcardSubs && wildcardSubs.size > 0) {
    scheduleNotification(wildcardSubs);
  }
}

/**
 * Inspects and retrieves the reactive dependency graph node for a target object.
 *
 * @param target - The target object or store to inspect.
 * @returns A {@link DependencyGraphNode} describing subscriber counts per property.
 *
 * @example
 * ```ts
 * import { makeReactive, effect, getDependencyGraph } from '@banksia/signals';
 *
 * const state = makeReactive({ a: 1, b: 2 });
 * effect(() => console.log(state.a));
 *
 * const graph = getDependencyGraph(state);
 * console.log(graph.properties['a'].subscriberCount); // 1
 * ```
 */
export function getDependencyGraph(target: object): DependencyGraphNode {
  const rawTarget = toRaw(target);
  const targetName = rawTarget.constructor?.name || "Object";
  const propMap = targetPropertySubscribers.get(rawTarget);
  const properties: Record<string, { subscriberCount: number }> = {};

  if (propMap) {
    for (const [prop, subs] of propMap.entries()) {
      properties[String(prop)] = {
        subscriberCount: subs.size,
      };
    }
  }

  return {
    targetName,
    properties,
  };
}

/**
 * Registers a legacy callback listener for state mutation events.
 *
 * @remarks
 * Maintained for backward compatibility. Prefer {@link registerReactivityHooks} for modern telemetry pipelines.
 *
 * @param cb - Callback receiving {@link MutationEvent} payloads on state mutation.
 * @returns An unsubscribe function to remove the listener.
 */
export function registerOnMutation(
  cb: (event: MutationEvent) => void,
): () => void {
  return registerReactivityHooks({
    onNotify(source, change) {
      cb({
        target: source.meta.target || {},
        property: source.meta.property || String(source.id),
        oldValue: change.oldValue,
        newValue: change.newValue,
        timestamp: change.timestamp,
      });
    },
  });
}

let debugConfig: SignalsDebugConfig = {
  enableLogging: false,
  traceBatches: false,
};

let debugLoggerUnsub: (() => void) | null = null;

/**
 * Configures global debugging and logging options for the signals reactivity engine.
 *
 * @param config - Options to configure debug logging and batch tracing.
 *
 * @example
 * ```ts
 * import { configureSignalsDebug } from '@banksia/signals';
 *
 * configureSignalsDebug({
 *   enableLogging: true,
 *   traceBatches: true,
 * });
 * ```
 */
export function configureSignalsDebug(config: SignalsDebugConfig): void {
  debugConfig = { ...debugConfig, ...config };

  if (debugConfig.enableLogging && !debugLoggerUnsub) {
    debugLoggerUnsub = registerReactivityHooks({
      onNotify(source, change) {
        console.log(
          `[Signals Mutation] ${source.meta.label}:`,
          change.oldValue,
          "->",
          change.newValue,
        );
      },
    });
  } else if (!debugConfig.enableLogging && debugLoggerUnsub) {
    debugLoggerUnsub();
    debugLoggerUnsub = null;
  }
}

/**
 * Retrieves the current debug configuration.
 *
 * @returns The active {@link SignalsDebugConfig} settings.
 */
export function getSignalsDebugConfig(): SignalsDebugConfig {
  return debugConfig;
}
