/**
 * @module core/effect
 * Reactive side-effect primitive with automatic dependency tracking and disposal.
 */

import {
  Subscriber,
  popActiveSubscriber,
  pushActiveSubscriber,
} from "./scheduler";
import {
  dispatchError,
  dispatchExecute,
  hasExecuteObservers,
  type ReactiveConsumer,
} from "./observability";

/**
 * Callback function executed within a reactive effect context.
 *
 * @remarks
 * Any reactive signal or proxy property accessed during the execution of this callback
 * will be dynamically tracked as a dependency. The callback can optionally return a cleanup
 * function that runs before the next re-execution or when the effect is disposed.
 */
export type EffectFn = () => void | (() => void);

/**
 * Function type returned when registering an effect to immediately cancel tracking and release resources.
 */
export type DisposeFn = () => void;

let effectCounter = 0;

/**
 * Internal implementation of a reactive side-effect runner.
 *
 * @internal
 */
class EffectImpl implements Subscriber {
  public id: string;
  public name: string;
  public type = "effect" as const;
  private fn: EffectFn;
  private cleanupFn?: () => void;
  public dependencies: Set<Set<Subscriber>> = new Set();
  private isDisposed = false;

  constructor(fn: EffectFn, name?: string) {
    this.id = `effect-${++effectCounter}`;
    this.name = name || `Effect#${effectCounter}`;
    this.fn = fn;
    this.run();
  }

  public run(): void {
    if (this.isDisposed) return;
    this.cleanup();

    const consumer: ReactiveConsumer = {
      id: this.id,
      name: this.name,
      type: this.type,
    };

    const startTime = performance.now();
    if (hasExecuteObservers()) {
      dispatchExecute(consumer, { phase: "start" });
    }

    pushActiveSubscriber(this);
    let executionError: unknown = undefined;
    try {
      const res = this.fn();
      if (typeof res === "function") {
        this.cleanupFn = res;
      }
    } catch (err) {
      executionError = err;
      dispatchError(err, { consumer, phase: "effect.run" });
      throw err;
    } finally {
      popActiveSubscriber();
      if (hasExecuteObservers()) {
        const durationMs = performance.now() - startTime;
        dispatchExecute(consumer, {
          phase: "end",
          durationMs,
          error: executionError,
        });
      }
    }
  }

  public notify(): void {
    this.run();
  }

  public dispose(): void {
    if (this.isDisposed) return;
    this.isDisposed = true;
    this.cleanup();
  }

  private cleanup(): void {
    if (this.cleanupFn) {
      try {
        this.cleanupFn();
      } catch (err) {
        dispatchError(err, {
          consumer: { id: this.id, name: this.name, type: this.type },
          phase: "effect.cleanup",
        });
      }
      this.cleanupFn = undefined;
    }

    for (const depSet of this.dependencies) {
      depSet.delete(this);
    }
    this.dependencies.clear();
  }
}

/**
 * Creates and runs a reactive side-effect function immediately, re-running it whenever its dependencies mutate.
 *
 * @remarks
 * When `effect` is invoked, the supplied callback function runs synchronously on the current tick to capture
 * its initial reactive dependency graph. If any tracked signal, collection, or reactive proxy property is mutated
 * subsequently, the effect is scheduled for re-execution in a batched microtask.
 *
 * If the effect callback returns a cleanup function, it will be invoked immediately before the next execution
 * and when the effect is explicitly disposed via the returned {@link DisposeFn}.
 *
 * @param fn - The reactive effect function to execute and re-run upon dependency change.
 * @param name - Optional diagnostic name for debugging, telemetry, and observability tracking.
 * @returns A {@link DisposeFn} that unbinds all reactive subscriptions and cleans up resources.
 *
 * @example
 * ```ts
 * import { signal, effect } from '@banksia/signals';
 *
 * const count = signal(0);
 * const dispose = effect(() => {
 *   console.log('Count changed:', count.value);
 *
 *   return () => {
 *     console.log('Cleaning up previous count run');
 *   };
 * });
 *
 * count.value += 1;
 * // Later, dispose when no longer needed:
 * dispose();
 * ```
 */
export function effect(fn: EffectFn, name?: string): DisposeFn {
  const eff = new EffectImpl(fn, name);
  return () => eff.dispose();
}
