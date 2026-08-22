/**
 * @module core/computed
 * Memoized derived reactive computations.
 */

import {
  Subscriber,
  getActiveSubscriber,
  popActiveSubscriber,
  pushActiveSubscriber,
  scheduleNotification,
} from "./scheduler";
import {
  dispatchError,
  dispatchExecute,
  dispatchNotify,
  dispatchTrack,
  hasExecuteObservers,
  hasNotifyObservers,
  hasTrackObservers,
  type ReactiveConsumer,
  type ReactiveSource,
} from "./observability";

/**
 * Interface representing a read-only reactive signal container.
 *
 * @remarks
 * Readonly signals expose only a `.value` getter. Accessing `.value` inside a reactive
 * context establishes a dependency edge to the underlying computation or source.
 *
 * @template T - The return type of the computed value.
 */
export interface ReadonlySignal<T> {
  /**
   * The current derived value of the signal.
   *
   * Accessing this property tracks dependencies if called within an active reactive context.
   */
  readonly value: T;
}

let computedCounter = 0;

/**
 * Internal implementation of a lazily-evaluated, memoized reactive computed node.
 *
 * @internal
 * @template T - The return type of the computation.
 */
class ComputedImpl<T> implements Subscriber {
  public id: string;
  public name: string;
  public type = "computed" as const;
  private getter: () => T;
  private cachedValue!: T;
  private dirty = true;
  public dependencies: Set<Set<Subscriber>> = new Set();
  private subscribers: Set<Subscriber> = new Set();

  constructor(getter: () => T, name?: string) {
    this.id = `computed-${++computedCounter}`;
    this.name = name || `Computed#${computedCounter}`;
    this.getter = getter;
  }

  public get value(): T {
    const currentActive = getActiveSubscriber();
    if (currentActive) {
      this.subscribers.add(currentActive);
      currentActive.dependencies.add(this.subscribers);

      if (hasTrackObservers()) {
        const source: ReactiveSource = {
          id: this.id,
          value: this.cachedValue,
          meta: {
            label: this.name,
            type: "computed",
          },
        };
        const consumer: ReactiveConsumer = {
          id: currentActive.id || "anonymous-subscriber",
          name: currentActive.name || "AnonymousSubscriber",
          type: currentActive.type || "effect",
        };
        dispatchTrack(source, consumer);
      }
    }

    if (this.dirty) {
      this.cleanup();
      pushActiveSubscriber(this);

      const consumer: ReactiveConsumer = {
        id: this.id,
        name: this.name,
        type: this.type,
      };

      const startTime = performance.now();
      if (hasExecuteObservers()) {
        dispatchExecute(consumer, { phase: "start" });
      }

      let executionError: unknown = undefined;
      const oldValue = this.cachedValue;

      try {
        this.cachedValue = this.getter();
        this.dirty = false;

        if (
          oldValue !== undefined &&
          !Object.is(oldValue, this.cachedValue) &&
          hasNotifyObservers()
        ) {
          dispatchNotify(
            {
              id: this.id,
              value: this.cachedValue,
              meta: {
                label: this.name,
                type: "computed",
              },
            },
            {
              oldValue,
              newValue: this.cachedValue,
              timestamp: Date.now(),
            },
          );
        }
      } catch (err) {
        executionError = err;
        dispatchError(err, { consumer, phase: "computed.evaluate" });
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

    return this.cachedValue;
  }

  public notify(): void {
    if (!this.dirty) {
      this.dirty = true;
      scheduleNotification(this.subscribers);
    }
  }

  private cleanup(): void {
    for (const depSet of this.dependencies) {
      depSet.delete(this);
    }
    this.dependencies.clear();
  }
}

/**
 * Creates a lazily-evaluated, memoized reactive computed signal derived from reactive sources.
 *
 * @remarks
 * The `computed` primitive takes a pure evaluation function and automatically tracks any reactive
 * signals, domain stores, collections, or other computed signals accessed during its calculation.
 * It caches its output value until one of its tracked dependencies mutates, at which point it marks
 * itself as dirty and invalidates downstream subscribers. The getter is only re-executed on demand
 * when its `.value` is read.
 *
 * Dependency tracking is dynamic: dependencies not read in the latest evaluation branch are cleaned up
 * automatically.
 *
 * @template T - The return type of the computation.
 * @param getter - Pure function that computes the derived value from reactive dependencies.
 * @param name - Optional diagnostic name for debugging, telemetry, and observability tracking.
 * @returns A {@link ReadonlySignal} exposing the derived, cached `.value`.
 *
 * @example
 * ```ts
 * import { signal, computed } from '@platform/signals';
 *
 * const firstName = signal('Ada');
 * const lastName = signal('Lovelace');
 *
 * const fullName = computed(() => `${firstName.value} ${lastName.value}`, 'fullName');
 * console.log(fullName.value); // 'Ada Lovelace'
 *
 * firstName.value = 'Augusta';
 * console.log(fullName.value); // 'Augusta Lovelace'
 * ```
 */
export function computed<T>(getter: () => T, name?: string): ReadonlySignal<T> {
  const comp = new ComputedImpl(getter, name);
  return {
    get value() {
      return comp.value;
    },
  };
}
