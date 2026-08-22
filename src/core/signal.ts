/**
 * @module core/signal
 * Fine-grained reactive signal primitive.
 */

import { makeReactive } from "./proxy";

/**
 * Interface representing a mutable reactive signal container.
 *
 * @remarks
 * A `Signal` wraps a value in a reactive container. Accessing the `.value` property
 * inside a reactive context (such as an {@link effect} or {@link computed}) registers a dependency edge.
 * Assigning a new value to `.value` triggers reactive invalidation across all downstream consumers.
 *
 * @template T - The type of value stored within the signal.
 *
 * @example
 * ```ts
 * import { signal, effect } from '@banksia/signals';
 *
 * const count = signal(0);
 * effect(() => console.log('Count:', count.value)); // Logs: Count: 0
 * count.value = 1; // Logs: Count: 1
 * ```
 */
export interface Signal<T> {
  /**
   * The current value of the signal.
   *
   * Reading this property establishes a dependency in the active reactive context.
   * Modifying this property triggers updates in all subscribers.
   */
  value: T;
}

/**
 * Creates a reactive signal holding an initial value.
 *
 * @remarks
 * Signals are the fundamental unit of state in the reactivity engine.
 * They leverage JavaScript `Proxy` wrappers internally to track property reads and intercept mutations.
 *
 * @template T - The type of value held by the signal.
 * @param initialValue - The initial value to store in the signal.
 * @returns A reactive {@link Signal} container instance.
 *
 * @example
 * ```ts
 * import { signal } from '@banksia/signals';
 *
 * const name = signal('Alice');
 * console.log(name.value); // 'Alice'
 * name.value = 'Bob';
 * console.log(name.value); // 'Bob'
 * ```
 */
export function signal<T>(initialValue: T): Signal<T> {
  const container = makeReactive({ value: initialValue });
  return container;
}
