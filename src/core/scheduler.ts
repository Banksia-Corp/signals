/**
 * @module core/scheduler
 * Reactive dependency scheduling, subscriber tracking, and microtask batch execution.
 */

import {
  dispatchBatch,
  dispatchExecute,
  dispatchSchedule,
  hasBatchObservers,
  hasExecuteObservers,
  hasScheduleObservers,
  type ReactiveConsumer,
} from "./observability";

/**
 * Generic subscriber notification callback signature.
 */
export type SubscriberCallback = () => void;

/**
 * Core interface representing a reactive subscriber (e.g. an effect, computed signal, or framework bridge).
 */
export interface Subscriber {
  /**
   * Optional unique identifier or symbol representing this subscriber.
   */
  id?: string | symbol;

  /**
   * Optional human-readable name for debugging and telemetry.
   */
  name?: string;

  /**
   * Subscriber classification category.
   */
  type?: "effect" | "computed" | "adapter";

  /**
   * Callback invoked by the scheduler when one of the subscriber's tracked dependencies mutates.
   */
  notify: () => void;

  /**
   * Set of upstream subscriber sets storing this subscriber, allowing dynamic dependency unbinding.
   */
  dependencies: Set<Set<Subscriber>>;
}

let activeSubscriber: Subscriber | null = null;
const subscriberStack: (Subscriber | null)[] = [];

/**
 * Retrieves the currently active reactive subscriber from the execution stack.
 *
 * @returns The active {@link Subscriber} currently running, or `null` if outside any reactive context.
 */
export function getActiveSubscriber(): Subscriber | null {
  return activeSubscriber;
}

/**
 * Pushes a subscriber onto the reactive subscriber tracking stack and sets it as the active subscriber.
 *
 * @param sub - The subscriber to activate, or `null` to suspend tracking.
 */
export function pushActiveSubscriber(sub: Subscriber | null): void {
  subscriberStack.push(activeSubscriber);
  activeSubscriber = sub;
}

/**
 * Pops the topmost subscriber from the reactive stack, restoring the previous active subscriber.
 */
export function popActiveSubscriber(): void {
  activeSubscriber = subscriberStack.pop() ?? null;
}

let isBatching = false;
let microtaskScheduled = false;
const queuedSubscribers = new Set<Subscriber>();
const onReactionCallbacks: Array<(sub: Subscriber) => void> = [];

/**
 * Registers a global listener invoked every time a subscriber is notified during a reactive cycle.
 *
 * @param cb - Callback receiving the notified {@link Subscriber}.
 * @returns An unsubscribe function to remove the listener.
 *
 * @example
 * ```ts
 * import { registerOnReaction } from '@platform/signals';
 *
 * const unsubscribe = registerOnReaction((subscriber) => {
 *   console.log('Reaction triggered for:', subscriber.name);
 * });
 * ```
 */
export function registerOnReaction(cb: (sub: Subscriber) => void): () => void {
  onReactionCallbacks.push(cb);
  return () => {
    const idx = onReactionCallbacks.indexOf(cb);
    if (idx !== -1) onReactionCallbacks.splice(idx, 1);
  };
}

/**
 * Queues a set of subscribers for notification in the current or upcoming microtask batch.
 *
 * @param subscribers - Set of subscribers requiring notification.
 */
export function scheduleNotification(subscribers: Set<Subscriber>): void {
  for (const sub of subscribers) {
    queuedSubscribers.add(sub);
    if (hasScheduleObservers()) {
      const consumer: ReactiveConsumer = {
        id: sub.id || "anonymous-subscriber",
        name: sub.name || "AnonymousSubscriber",
        type: sub.type || "effect",
      };
      dispatchSchedule(consumer);
    }
  }

  if (isBatching) {
    return;
  }

  if (!microtaskScheduled) {
    microtaskScheduled = true;
    queueMicrotask(flushBatch);
  }
}

/**
 * Synchronously executes all pending subscriber notifications currently queued in the batch.
 *
 * @remarks
 * Flushes all pending reactions immediately rather than waiting for the next microtask tick.
 * Useful in unit tests or scenarios where immediate synchronous DOM synchronization is required.
 */
export function flushBatch(): void {
  microtaskScheduled = false;
  const pending = Array.from(queuedSubscribers);
  queuedSubscribers.clear();

  if (hasBatchObservers()) {
    dispatchBatch({
      phase: "flush",
      flushedCount: pending.length,
    });
  }

  for (const sub of pending) {
    sub.notify();
    for (const cb of onReactionCallbacks) {
      try {
        cb(sub);
      } catch (err) {
        console.error("[Signals] Error in onReaction callback:", err);
      }
    }
  }
}

/**
 * Executes a function within a synchronous batch context, deferring subscriber notifications until completion.
 *
 * @remarks
 * Within a `batch` block, all mutations across signals, objects, and collections accumulate without triggering
 * immediate downstream effects. Once the outermost batch function concludes, all unique affected subscribers
 * are notified in a single consolidated pass.
 * Nested calls to `batch` are automatically flattened.
 *
 * @template T - The return type of the batch function.
 * @param fn - Synchronous callback function containing state mutations.
 * @returns The return value of `fn`.
 *
 * @example
 * ```ts
 * import { signal, effect, batch } from '@platform/signals';
 *
 * const a = signal(1);
 * const b = signal(2);
 *
 * effect(() => console.log('Sum:', a.value + b.value)); // Logs: Sum: 3
 *
 * batch(() => {
 *   a.value = 10;
 *   b.value = 20;
 * }); // Logs: Sum: 30 (only runs once after the batch finishes)
 * ```
 */
export function batch<T>(fn: () => T): T {
  const previousBatching = isBatching;
  isBatching = true;
  if (hasBatchObservers()) {
    dispatchBatch({ phase: "start" });
  }

  try {
    return fn();
  } finally {
    isBatching = previousBatching;
    if (!isBatching) {
      flushBatch();
      if (hasBatchObservers()) {
        dispatchBatch({ phase: "end" });
      }
    }
  }
}
