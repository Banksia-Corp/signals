/**
 * @module devtools
 *
 * Runtime bridge and inspection adapter connecting `@banksia/signals` observability lifecycle
 * hooks to browser DevTools and the Chrome DevTools MCP (Model Context Protocol).
 *
 * @remarks
 * ## Overview
 * The DevTools bridge exposes the global inspector `window.__BANKSIA_SIGNALS_DEVTOOLS__`
 * (and `globalThis.__BANKSIA_SIGNALS_DEVTOOLS__`) to allow developers and AI agents using
 * Chrome DevTools MCP `evaluate_script` to:
 * - Query current reactive state snapshots in a sandboxed, untracked context.
 * - Inspect reactive dependency graph topology and subscriber linkage.
 * - Stream and ring-buffer real-time mutation events (`ChangeEvent`).
 * - Profile microtask batch transactions and scheduler execution performance.
 * - Redact private properties (`isPrivate: true`) from public inspection streams.
 *
 * @packageDocumentation
 */

import { toRaw } from "./core/proxy";
import { pushActiveSubscriber, popActiveSubscriber } from "./core/scheduler";
import {
  registerReactivityHooks,
  getDependencyGraph,
  type ReactiveSource,
  type ReactiveConsumer,
  type ChangeEvent,
  type ExecutionContext,
  type BatchStats,
  type DependencyGraphNode,
} from "./core/observability";

/**
 * Configuration options for the DevTools bridge adapter.
 */
export interface DevToolsOptions {
  /**
   * Maximum number of recent events stored in the ring buffer.
   * @defaultValue `500`
   */
  maxBufferSize?: number;

  /**
   * Whether to record `onNotify` state mutation events.
   * @defaultValue `true`
   */
  recordNotifyEvents?: boolean;

  /**
   * Whether to record `onSchedule` subscriber queuing events.
   * @defaultValue `false`
   */
  recordScheduleEvents?: boolean;

  /**
   * Whether to record `onExecute` consumer lifecycle execution events.
   * @defaultValue `true`
   */
  recordExecuteEvents?: boolean;

  /**
   * Whether to record `onBatch` scheduler flush transactions.
   * @defaultValue `true`
   */
  recordBatchEvents?: boolean;

  /**
   * Whether to record `onTrack` dependency edge creation events.
   * @remarks
   * Enabling track event capture may generate a large volume of events in high-frequency rendering loops.
   * @defaultValue `false`
   */
  recordTrackEvents?: boolean;

  /**
   * Whether to automatically sanitize/redact values from private reactive sources (`isPrivate: true` or leading `_`).
   * @defaultValue `true`
   */
  sanitizePrivate?: boolean;

  /**
   * Optional custom filter predicate to restrict which reactive sources are captured in telemetry.
   */
  customFilter?: (source: ReactiveSource) => boolean;
}

/**
 * Mutation telemetry event payload recorded in the DevTools ring buffer.
 */
export interface DevToolsMutationEvent {
  /** Event classification discriminator. */
  type: "notify";
  /** Diagnostic label of the reactive source. */
  label: string;
  /** Property key or symbol that changed. */
  property?: string;
  /** Value prior to mutation (sanitized if private). */
  oldValue: unknown;
  /** Value after mutation (sanitized if private). */
  newValue: unknown;
  /** Timestamp in milliseconds. */
  timestamp: number;
}

/**
 * Dependency tracking event payload recorded in the DevTools ring buffer.
 */
export interface DevToolsTrackEvent {
  /** Event classification discriminator. */
  type: "track";
  /** Diagnostic label of the reactive source being read. */
  sourceLabel: string;
  /** Name of the active consumer subscriber reading the source. */
  consumerName: string;
  /** Consumer category (`'effect' | 'computed' | 'adapter'`). */
  consumerType: string;
  /** Timestamp in milliseconds. */
  timestamp: number;
}

/**
 * Execution lifecycle event payload recorded in the DevTools ring buffer.
 */
export interface DevToolsExecuteEvent {
  /** Event classification discriminator. */
  type: "execute";
  /** Name of the executed consumer. */
  consumerName: string;
  /** Consumer classification category. */
  consumerType: string;
  /** Lifecycle phase (`'start' | 'end'`). */
  phase: "start" | "end";
  /** Duration of execution in milliseconds (if phase is `'end'`). */
  durationMs?: number;
  /** Error message string if execution failed. */
  error?: string;
  /** Timestamp in milliseconds. */
  timestamp: number;
}

/**
 * Microtask batch scheduler event payload recorded in the DevTools ring buffer.
 */
export interface DevToolsBatchEvent {
  /** Event classification discriminator. */
  type: "batch";
  /** Lifecycle phase of the batch transaction (`'start' | 'flush' | 'end'`). */
  phase: "start" | "flush" | "end";
  /** Number of reactive reactions flushed in this batch. */
  flushedCount?: number;
  /** Timestamp in milliseconds. */
  timestamp: number;
}

/**
 * Error event payload recorded in the DevTools ring buffer.
 */
export interface DevToolsErrorEvent {
  /** Event classification discriminator. */
  type: "error";
  /** Error message string. */
  message: string;
  /** Lifecycle phase where error occurred. */
  phase: string;
  /** Diagnostic label of associated source, if any. */
  sourceLabel?: string;
  /** Diagnostic name of associated consumer, if any. */
  consumerName?: string;
  /** Timestamp in milliseconds. */
  timestamp: number;
}

/**
 * Discriminated union of all event payloads captured by the DevTools bridge.
 */
export type DevToolsEvent =
  | DevToolsMutationEvent
  | DevToolsTrackEvent
  | DevToolsExecuteEvent
  | DevToolsBatchEvent
  | DevToolsErrorEvent;

/**
 * Query options for retrieving buffered telemetry events.
 */
export interface GetRecentEventsOptions {
  /** Maximum number of events to return. Defaults to all buffered events. */
  limit?: number;
  /** Filter events by classification type. */
  type?: DevToolsEvent["type"];
  /** Whether to clear returned events from the buffer after querying. */
  clear?: boolean;
}

/**
 * Inspection snapshot of a registered reactive target object or domain store.
 */
export interface DevToolsTargetInspection {
  /** Unique registration ID or name. */
  id: string;
  /** Constructor or class name of the target object. */
  name: string;
  /** Current reactive properties and their sanitized values. */
  state: Record<string, unknown>;
  /** Dependency graph node detailing subscriber counts per property. */
  graph: DependencyGraphNode;
}

/**
 * Aggregate performance and profiling metrics recorded by the DevTools bridge.
 */
export interface DevToolsPerformanceMetrics {
  /** Total number of scheduler batch cycles executed. */
  totalBatches: number;
  /** Total number of state mutations captured. */
  totalMutations: number;
  /** Total number of consumer (effect/computed) executions. */
  totalExecutions: number;
  /** Total execution time spent in reactive computations (ms). */
  totalExecutionDurationMs: number;
  /** Average execution time per consumer invocation (ms). */
  averageExecutionDurationMs: number;
  /** Longest recorded single consumer execution duration (ms). */
  maxExecutionDurationMs: number;
  /** Total number of caught errors. */
  errorCount: number;
}

const REDACTED_VALUE = "[REDACTED_PRIVATE]";

/**
 * DevTools bridge implementation managing lifecycle telemetry, ring-buffered events,
 * and sandboxed inspection for Chrome DevTools MCP and browser environments.
 */
export class DevToolsBridge {
  private unregisterHooks: (() => void) | null = null;
  private options: Required<DevToolsOptions>;
  private eventBuffer: DevToolsEvent[] = [];
  private registeredTargets = new Map<string, object>();
  private targetNames = new WeakMap<object, string>();
  private targetIdCounter = 0;

  private metrics: DevToolsPerformanceMetrics = {
    totalBatches: 0,
    totalMutations: 0,
    totalExecutions: 0,
    totalExecutionDurationMs: 0,
    averageExecutionDurationMs: 0,
    maxExecutionDurationMs: 0,
    errorCount: 0,
  };

  constructor(options?: DevToolsOptions) {
    this.options = {
      maxBufferSize: options?.maxBufferSize ?? 500,
      recordNotifyEvents: options?.recordNotifyEvents ?? true,
      recordScheduleEvents: options?.recordScheduleEvents ?? false,
      recordExecuteEvents: options?.recordExecuteEvents ?? true,
      recordBatchEvents: options?.recordBatchEvents ?? true,
      recordTrackEvents: options?.recordTrackEvents ?? false,
      sanitizePrivate: options?.sanitizePrivate ?? true,
      customFilter: options?.customFilter ?? (() => true),
    };
  }

  /**
   * Connects the DevTools bridge to `@banksia/signals` observability lifecycle hooks.
   *
   * @param options - Optional override configuration options.
   * @returns An unsubscribe function to disconnect the DevTools bridge.
   *
   * @example
   * ```ts
   * const devtools = new DevToolsBridge();
   * devtools.connect({ maxBufferSize: 1000 });
   * ```
   */
  public connect(options?: DevToolsOptions): () => void {
    if (options) {
      this.options = {
        maxBufferSize: options.maxBufferSize ?? this.options.maxBufferSize,
        recordNotifyEvents:
          options.recordNotifyEvents ?? this.options.recordNotifyEvents,
        recordScheduleEvents:
          options.recordScheduleEvents ?? this.options.recordScheduleEvents,
        recordExecuteEvents:
          options.recordExecuteEvents ?? this.options.recordExecuteEvents,
        recordBatchEvents:
          options.recordBatchEvents ?? this.options.recordBatchEvents,
        recordTrackEvents:
          options.recordTrackEvents ?? this.options.recordTrackEvents,
        sanitizePrivate:
          options.sanitizePrivate ?? this.options.sanitizePrivate,
        customFilter: options.customFilter ?? this.options.customFilter,
      };
    }

    if (this.unregisterHooks) {
      return () => this.disconnect();
    }

    this.unregisterHooks = registerReactivityHooks({
      onNotify: this.options.recordNotifyEvents
        ? (source: ReactiveSource, change: ChangeEvent) => {
            if (!this.options.customFilter(source)) return;
            this.metrics.totalMutations++;

            const isPrivate =
              source.meta.isPrivate ||
              (typeof source.meta.property === "string" &&
                source.meta.property.startsWith("_"));

            const sanitize = this.options.sanitizePrivate && isPrivate;

            this.pushEvent({
              type: "notify",
              label: source.meta.label,
              property:
                typeof source.meta.property === "symbol"
                  ? source.meta.property.toString()
                  : source.meta.property,
              oldValue: sanitize
                ? REDACTED_VALUE
                : this.sanitizeValue(change.oldValue),
              newValue: sanitize
                ? REDACTED_VALUE
                : this.sanitizeValue(change.newValue),
              timestamp: change.timestamp || Date.now(),
            });
          }
        : undefined,

      onTrack: this.options.recordTrackEvents
        ? (source: ReactiveSource, consumer: ReactiveConsumer) => {
            if (!this.options.customFilter(source)) return;
            this.pushEvent({
              type: "track",
              sourceLabel: source.meta.label,
              consumerName: consumer.name,
              consumerType: consumer.type,
              timestamp: Date.now(),
            });
          }
        : undefined,

      onExecute: this.options.recordExecuteEvents
        ? (consumer: ReactiveConsumer, context: ExecutionContext) => {
            if (context.phase === "end") {
              this.metrics.totalExecutions++;
              const duration = context.durationMs ?? 0;
              this.metrics.totalExecutionDurationMs += duration;
              this.metrics.averageExecutionDurationMs =
                this.metrics.totalExecutionDurationMs /
                this.metrics.totalExecutions;
              if (duration > this.metrics.maxExecutionDurationMs) {
                this.metrics.maxExecutionDurationMs = duration;
              }
            }

            this.pushEvent({
              type: "execute",
              consumerName: consumer.name,
              consumerType: consumer.type,
              phase: context.phase,
              durationMs: context.durationMs,
              error: context.error ? String(context.error) : undefined,
              timestamp: Date.now(),
            });
          }
        : undefined,

      onBatch: this.options.recordBatchEvents
        ? (stats: BatchStats) => {
            if (stats.phase === "flush") {
              this.metrics.totalBatches++;
            }
            this.pushEvent({
              type: "batch",
              phase: stats.phase,
              flushedCount: stats.flushedCount,
              timestamp: Date.now(),
            });
          }
        : undefined,

      onError: (error: unknown, context) => {
        this.metrics.errorCount++;
        this.pushEvent({
          type: "error",
          message: error instanceof Error ? error.message : String(error),
          phase: context.phase,
          sourceLabel: context.source?.meta.label,
          consumerName: context.consumer?.name,
          timestamp: Date.now(),
        });
      },
    });

    return () => this.disconnect();
  }

  /**
   * Disconnects the DevTools bridge and releases all registered lifecycle hooks.
   */
  public disconnect(): void {
    if (this.unregisterHooks) {
      this.unregisterHooks();
      this.unregisterHooks = null;
    }
  }

  /**
   * Returns whether the DevTools bridge is currently active and capturing telemetry.
   *
   * @returns `true` if connected; otherwise `false`.
   */
  public isConnected(): boolean {
    return this.unregisterHooks !== null;
  }

  /**
   * Explicitly registers a reactive target object, domain model, or store for indexing and inspection.
   *
   * @param target - The reactive object or store instance to register.
   * @param name - Optional diagnostic name or ID for indexing.
   * @returns An unregister function to remove the target from registry.
   *
   * @example
   * ```ts
   * const unregister = devtools.registerTarget(userStore, 'UserStore');
   * ```
   */
  public registerTarget(target: object, name?: string): () => void {
    const rawTarget = toRaw(target);
    const resolvedName =
      name || rawTarget.constructor?.name || `Target#${++this.targetIdCounter}`;

    this.registeredTargets.set(resolvedName, rawTarget);
    this.targetNames.set(rawTarget, resolvedName);

    return () => {
      this.unregisterTarget(rawTarget);
    };
  }

  /**
   * Unregisters a previously registered reactive target object.
   *
   * @param targetOrName - The target instance or registered name to remove.
   */
  public unregisterTarget(targetOrName: object | string): void {
    if (typeof targetOrName === "string") {
      const target = this.registeredTargets.get(targetOrName);
      if (target) {
        this.targetNames.delete(target);
        this.registeredTargets.delete(targetOrName);
      }
    } else {
      const rawTarget = toRaw(targetOrName);
      const name = this.targetNames.get(rawTarget);
      if (name) {
        this.registeredTargets.delete(name);
        this.targetNames.delete(rawTarget);
      }
    }
  }

  /**
   * Lists all currently registered reactive target objects and stores.
   *
   * @returns Array of target descriptors with metadata and available property keys.
   */
  public listRegisteredTargets(): Array<{
    id: string;
    name: string;
    properties: string[];
  }> {
    const list: Array<{ id: string; name: string; properties: string[] }> = [];

    for (const [id, target] of this.registeredTargets.entries()) {
      const properties = Object.keys(target);
      list.push({
        id,
        name: target.constructor?.name || "Object",
        properties,
      });
    }

    return list;
  }

  /**
   * Inspects a registered target or reactive object, returning a full snapshot of state and dependency graph.
   *
   * @remarks
   * All state reads are performed in an isolated, untracked sandbox (`pushActiveSubscriber(null)`),
   * ensuring that DevTools inspections do not pollute active reactivity contexts or create phantom dependencies.
   *
   * @param targetOrName - The registered target name or object instance to inspect.
   * @returns A {@link DevToolsTargetInspection} object, or `null` if target is not found.
   */
  public inspectTarget(
    targetOrName: object | string,
  ): DevToolsTargetInspection | null {
    let target: object | undefined;
    let targetId: string | undefined;

    if (typeof targetOrName === "string") {
      target = this.registeredTargets.get(targetOrName);
      targetId = targetOrName;
    } else {
      target = toRaw(targetOrName);
      targetId =
        this.targetNames.get(target) ||
        target.constructor?.name ||
        "AnonymousTarget";
    }

    if (!target) return null;

    const state = this.inspectState(target);
    const graph = getDependencyGraph(target);

    return {
      id: targetId,
      name: target.constructor?.name || "Object",
      state: state || {},
      graph,
    };
  }

  /**
   * Safely inspects the reactive state of a target object in an untracked, sandboxed execution context.
   *
   * @param targetOrName - The registered name or target object to inspect.
   * @returns A key-value snapshot of target properties with private values sanitized, or `null`.
   */
  public inspectState(
    targetOrName: object | string,
  ): Record<string, unknown> | null {
    let target: object | undefined;

    if (typeof targetOrName === "string") {
      target = this.registeredTargets.get(targetOrName);
    } else {
      target = toRaw(targetOrName);
    }

    if (!target) return null;

    pushActiveSubscriber(null);
    try {
      const snapshot: Record<string, unknown> = {};
      const keys = Object.keys(target) as Array<keyof typeof target>;

      for (const key of keys) {
        const keyStr = String(key);
        const isPrivate =
          this.options.sanitizePrivate && keyStr.startsWith("_");

        if (isPrivate) {
          snapshot[keyStr] = REDACTED_VALUE;
        } else {
          try {
            const val = (target as any)[key];
            snapshot[keyStr] = this.sanitizeValue(val);
          } catch (err) {
            snapshot[keyStr] = `[Error reading property: ${String(err)}]`;
          }
        }
      }

      return snapshot;
    } finally {
      popActiveSubscriber();
    }
  }

  /**
   * Inspects the reactive dependency graph for a specific target or across all registered targets.
   *
   * @param targetOrName - Optional target object or registered name. If omitted, returns graphs for all registered targets.
   * @returns The {@link DependencyGraphNode} for the target, or a record mapping target IDs to their graph nodes.
   */
  public inspectGraph(
    targetOrName?: object | string,
  ): DependencyGraphNode | Record<string, DependencyGraphNode> {
    if (targetOrName) {
      let target: object | undefined;
      if (typeof targetOrName === "string") {
        target = this.registeredTargets.get(targetOrName);
      } else {
        target = toRaw(targetOrName);
      }

      if (!target) {
        return { targetName: "Unknown", properties: {} };
      }
      return getDependencyGraph(target);
    }

    const allGraphs: Record<string, DependencyGraphNode> = {};
    for (const [id, target] of this.registeredTargets.entries()) {
      allGraphs[id] = getDependencyGraph(target);
    }

    return allGraphs;
  }

  /**
   * Retrieves recent telemetry events from the ring buffer.
   *
   * @param options - Filtering and limit options.
   * @returns Array of {@link DevToolsEvent} items matching query.
   */
  public getRecentEvents(options?: GetRecentEventsOptions): DevToolsEvent[] {
    let events = this.eventBuffer;

    if (options?.type) {
      events = events.filter((e) => e.type === options.type);
    }

    if (options?.limit && options.limit > 0) {
      events = events.slice(-options.limit);
    }

    const result = [...events];

    if (options?.clear) {
      this.clearEventBuffer();
    }

    return result;
  }

  /**
   * Convenience helper to retrieve recent mutation events.
   *
   * @param limit - Maximum number of mutation events to return.
   * @returns Array of {@link DevToolsMutationEvent} items.
   */
  public getRecentMutations(limit?: number): DevToolsMutationEvent[] {
    return this.getRecentEvents({
      type: "notify",
      limit,
    }) as DevToolsMutationEvent[];
  }

  /**
   * Clears all buffered events from the DevTools ring buffer.
   */
  public clearEventBuffer(): void {
    this.eventBuffer = [];
  }

  /**
   * Retrieves current aggregate performance and profiling metrics.
   *
   * @returns The {@link DevToolsPerformanceMetrics} descriptor.
   */
  public getPerformanceMetrics(): DevToolsPerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Resets all accumulated performance metrics to zero.
   */
  public resetPerformanceMetrics(): void {
    this.metrics = {
      totalBatches: 0,
      totalMutations: 0,
      totalExecutions: 0,
      totalExecutionDurationMs: 0,
      averageExecutionDurationMs: 0,
      maxExecutionDurationMs: 0,
      errorCount: 0,
    };
  }

  private pushEvent(event: DevToolsEvent): void {
    this.eventBuffer.push(event);
    if (this.eventBuffer.length > this.options.maxBufferSize) {
      this.eventBuffer.shift();
    }
  }

  private sanitizeValue(val: unknown): unknown {
    if (val === null || val === undefined) return val;
    if (
      typeof val === "number" ||
      typeof val === "string" ||
      typeof val === "boolean"
    ) {
      return val;
    }
    if (typeof val === "function") {
      return `[Function: ${val.name || "anonymous"}]`;
    }
    if (typeof val === "symbol") {
      return val.toString();
    }
    if (Array.isArray(val)) {
      return val.map((item) => this.sanitizeValue(item));
    }
    if (typeof val === "object") {
      const rawObj = toRaw(val);
      const constructorName = rawObj.constructor?.name;
      if (
        constructorName &&
        constructorName !== "Object" &&
        constructorName !== "Array"
      ) {
        return `[Instance of ${constructorName}]`;
      }
      return { ...rawObj };
    }
    return String(val);
  }
}

// Global Singleton Instance
let defaultBridge: DevToolsBridge | null = null;

/**
 * Retrieves the global singleton {@link DevToolsBridge} instance, creating it if necessary.
 *
 * @param options - Optional configuration options if instantiating for the first time.
 * @returns The singleton {@link DevToolsBridge} instance.
 */
export function getDevToolsBridge(options?: DevToolsOptions): DevToolsBridge {
  if (!defaultBridge) {
    defaultBridge = new DevToolsBridge(options);
    attachGlobals(defaultBridge);
  }
  return defaultBridge;
}

/**
 * Initializes and connects the global DevTools bridge, binding to `window.__BANKSIA_SIGNALS_DEVTOOLS__`
 * and registering with `@banksia/signals` observability lifecycle hooks.
 *
 * @param options - Configuration options for event buffering, filters, and privacy sandboxing.
 * @returns The active {@link DevToolsBridge} instance.
 *
 * @example
 * ```ts
 * import { initDevTools } from '@banksia/signals/devtools';
 *
 * initDevTools({
 *   maxBufferSize: 500,
 *   sanitizePrivate: true,
 * });
 * ```
 */
export function initDevTools(options?: DevToolsOptions): DevToolsBridge {
  const bridge = getDevToolsBridge(options);
  bridge.connect(options);
  return bridge;
}

/**
 * Connects the global DevTools bridge to `@banksia/signals` observability lifecycle hooks.
 *
 * @param options - Configuration options.
 * @returns An unsubscribe function to disconnect the bridge.
 */
export function connectDevTools(options?: DevToolsOptions): () => void {
  const bridge = getDevToolsBridge(options);
  return bridge.connect(options);
}

/**
 * Disconnects the global DevTools bridge and detaches all active lifecycle hooks.
 */
export function disconnectDevTools(): void {
  if (defaultBridge) {
    defaultBridge.disconnect();
  }
}

function attachGlobals(bridge: DevToolsBridge): void {
  if (typeof globalThis !== "undefined") {
    (globalThis as any).__BANKSIA_SIGNALS_DEVTOOLS__ = bridge;
  }
  if (typeof window !== "undefined") {
    (window as any).__BANKSIA_SIGNALS_DEVTOOLS__ = bridge;
  }
}

// Auto-attach global reference if globalThis exists
if (typeof globalThis !== "undefined") {
  if (!(globalThis as any).__BANKSIA_SIGNALS_DEVTOOLS__) {
    getDevToolsBridge();
  }
}
