/**
 * @module core/signal
 * Fine-grained reactive signal primitive.
 */

import { RAW_TARGET, IS_REACTIVE } from "./raw";
import { trackDependency, triggerMutation } from "./observability";

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
 * Concrete implementation of a mutable reactive signal container.
 *
 * @template T - The type of value held by the signal.
 */
export class SignalImpl<T> implements Signal<T> {
  private _raw: { value: T };

  constructor(initialValue: T) {
    this._raw = { value: initialValue };
  }

  /**
   * Reads the current signal value and records a dependency edge in the active reactive context.
   */
  get value(): T {
    trackDependency(this._raw, "value");
    return this._raw.value;
  }

  /**
   * Updates the signal value and triggers notifications to dependent subscribers if the value changed.
   */
  set value(nextValue: T) {
    const prev = this._raw.value;
    if (!Object.is(prev, nextValue)) {
      this._raw.value = nextValue;
      triggerMutation(this._raw, "value", prev, nextValue);
    }
  }

  /**
   * Returns the underlying unproxied raw container object for non-tracking reads.
   */
  get [RAW_TARGET](): { value: T } {
    return this._raw;
  }

  /**
   * Reactivity flag indicating this container is a reactive primitive.
   */
  get [IS_REACTIVE](): boolean {
    return true;
  }
}

/**
 * Creates a reactive signal holding an initial value.
 *
 * @remarks
 * Signals are the fundamental unit of state in the reactivity engine.
 * Accessing `.value` records dependencies in active effects or computeds, and mutating `.value`
 * schedules reactions for downstream subscribers.
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
  return new SignalImpl(initialValue);
}
