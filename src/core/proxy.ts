/**
 * @module core/proxy
 * Deep Proxy-based reactivity engine and raw target unwrap utilities.
 */

import {
  createArrayProxy,
  createMapProxy,
  createSetProxy,
} from "./collections";
import { ALL_KEY, trackDependency, triggerMutation } from "./observability";
import { batch } from "./scheduler";
import { RAW_TARGET, IS_REACTIVE, toRaw, isReactive } from "./raw";

export { RAW_TARGET, IS_REACTIVE, toRaw, isReactive };

const proxyCache = new WeakMap<object, object>();
const rawCache = new WeakSet<object>();

/**
 * Wraps a target object, class instance, Array, Set, or Map in a deep fine-grained reactive `Proxy`.
 *
 * @remarks
 * `makeReactive` is the foundational proxy transformer in the signals system.
 * - **Property Traps**: Intercepts `get`, `set`, `deleteProperty`, `has`, and `ownKeys` to record fine-grained dependency edges and schedule invalidation reactions.
 * - **Constructor Self-Reactivity**: Can be returned directly inside class constructors (e.g. Domain Aggregate Roots or Entity classes) via `return makeReactive(this);`.
 * - **Method Batching**: Member methods invoked on a reactive proxy are automatically wrapped in a {@link batch} transaction to prevent redundant intermediate reactions.
 * - **Deep Reactivity**: Reading nested objects, arrays, Sets, or Maps lazily wraps them in reactive proxies.
 * - **Identity & Idempotency**: Repeated calls on the same target return the same cached proxy instance.
 * - **Non-Trappable Objects**: Instances of `Date`, `RegExp`, `Promise`, `Error`, `WeakMap`, and `WeakSet` are preserved without proxy wrapping.
 *
 * @template T - The type of target object or collection to make reactive.
 * @param target - The object, class instance, array, Set, or Map to wrap.
 * @returns A reactive `Proxy` wrapping the target, or the original value if primitive or non-trappable.
 *
 * @example
 * ```ts
 * import { makeReactive, effect } from '@banksia/signals';
 *
 * // 1. Plain Object
 * const user = makeReactive({ name: 'Alice', age: 30 });
 * effect(() => console.log(`${user.name} is ${user.age} years old`));
 * user.age = 31; // Triggers reaction
 *
 * // 2. Class Constructor Self-Reactivity
 * class CounterStore {
 *   public count = 0;
 *   constructor() {
 *     return makeReactive(this);
 *   }
 *   public increment() {
 *     this.count++;
 *   }
 * }
 * const counter = new CounterStore();
 * ```
 */
export function makeReactive<T>(target: T): T {
  if (target === null || typeof target !== "object") {
    return target;
  }

  if ((target as any)[IS_REACTIVE]) {
    return target;
  }

  const existingProxy = proxyCache.get(target as unknown as object);
  if (existingProxy) {
    return existingProxy as unknown as T;
  }

  if (Array.isArray(target)) {
    const p = createArrayProxy(target, makeReactive) as unknown as T;
    proxyCache.set(target as unknown as object, p as unknown as object);
    rawCache.add(p as unknown as object);
    return p;
  }

  if (target instanceof Map) {
    const p = createMapProxy(target, makeReactive) as unknown as T;
    proxyCache.set(target as unknown as object, p as unknown as object);
    rawCache.add(p as unknown as object);
    return p;
  }

  if (target instanceof Set) {
    const p = createSetProxy(target, makeReactive) as unknown as T;
    proxyCache.set(target as unknown as object, p as unknown as object);
    rawCache.add(p as unknown as object);
    return p;
  }

  if (isNonTrappable(target)) {
    return target;
  }

  const handler: ProxyHandler<object> = {
    get(target, prop, receiver) {
      if (prop === RAW_TARGET) return target;
      if (prop === IS_REACTIVE) return true;

      if (typeof prop === "string" || typeof prop === "number") {
        trackDependency(target, prop);
      } else if (prop === Symbol.iterator) {
        trackDependency(target, ALL_KEY);
      }

      const value = Reflect.get(target, prop, receiver);

      if (typeof value === "function") {
        return function (this: unknown, ...args: unknown[]) {
          return batch(() => {
            const thisToUse =
              this === receiver || this === target ? receiver : this;
            return value.apply(thisToUse, args);
          });
        };
      }

      if (
        value !== null &&
        typeof value === "object" &&
        !isNonTrappable(value)
      ) {
        return makeReactive(value);
      }

      return value;
    },

    set(target, prop, value, receiver) {
      const rawVal = toRaw(value);
      const oldVal = (target as any)[prop];

      if (Object.is(oldVal, rawVal)) {
        return true;
      }

      const success = Reflect.set(target, prop, rawVal, target);
      if (success) {
        if (
          typeof prop === "string" ||
          typeof prop === "number" ||
          typeof prop === "symbol"
        ) {
          triggerMutation(target, prop, oldVal, rawVal);
        }
      }
      return success;
    },

    deleteProperty(target, prop) {
      const hadProp = Object.prototype.hasOwnProperty.call(target, prop);
      const oldVal = (target as any)[prop];
      const success = Reflect.deleteProperty(target, prop);

      if (success && hadProp) {
        triggerMutation(target, prop as string | symbol, oldVal, undefined);
      }
      return success;
    },

    has(target, prop) {
      trackDependency(target, prop as string | symbol);
      return Reflect.has(target, prop);
    },

    ownKeys(target) {
      trackDependency(target, ALL_KEY);
      return Reflect.ownKeys(target);
    },
  };

  const proxy = new Proxy(target as unknown as object, handler) as unknown as T;
  proxyCache.set(target as unknown as object, proxy as unknown as object);
  rawCache.add(proxy as unknown as object);
  return proxy;
}

function isNonTrappable(val: unknown): boolean {
  return (
    val instanceof Date ||
    val instanceof RegExp ||
    val instanceof Promise ||
    val instanceof Error ||
    val instanceof WeakMap ||
    val instanceof WeakSet
  );
}
