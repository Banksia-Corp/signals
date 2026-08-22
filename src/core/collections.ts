/**
 * @module core/collections
 * Fine-grained reactive Proxy adapters for native JavaScript collections (Array, Map, Set).
 */

import { trackDependency, triggerMutation } from "./observability";
import { batch } from "./scheduler";

/**
 * Symbol key used internally and on reactive proxies to retrieve the underlying unproxied target object.
 */
export const RAW_TARGET = Symbol("RAW_TARGET");

/**
 * Symbol key used to detect whether an object or collection is wrapped in a reactive Proxy.
 */
export const IS_REACTIVE = Symbol("IS_REACTIVE");

/**
 * Higher-order recursive reactivity transformer function type.
 *
 * @template T - The type of object to make reactive.
 */
export type MakeReactiveFn = <T>(target: T) => T;

/**
 * Creates a reactive `Proxy` wrapper around a native JavaScript `Array`.
 *
 * @remarks
 * Intercepts index reads (`arr[0]`), property reads (`arr.length`), and iterations (`for...of`, `map`, `forEach`)
 * to dynamically record fine-grained reactive dependencies. Mutating methods (`push`, `pop`, `shift`, `unshift`,
 * `splice`, `sort`, `reverse`) and direct index writes are wrapped in an atomic {@link batch} to trigger
 * `length` and wildcard collection mutations. Nested object elements accessed from the array are recursively made reactive.
 *
 * @template T - The element type stored in the array.
 * @param arr - The native array to wrap in a reactive proxy.
 * @param makeReactive - Factory function to recursively wrap child objects into reactive proxies.
 * @returns A reactive `Proxy` instance for the given array.
 *
 * @example
 * ```ts
 * import { makeReactive, effect } from '@platform/signals';
 *
 * const items = makeReactive(['Apple', 'Banana']);
 * effect(() => console.log('Item count:', items.length)); // Logs: Item count: 2
 * items.push('Cherry'); // Logs: Item count: 3
 * ```
 */
export function createArrayProxy<T>(
  arr: T[],
  makeReactive: MakeReactiveFn,
): T[] {
  const mutatingMethods = [
    "push",
    "pop",
    "shift",
    "unshift",
    "splice",
    "sort",
    "reverse",
  ];

  const handler: ProxyHandler<T[]> = {
    get(target, prop, receiver) {
      if (prop === RAW_TARGET) return target;
      if (prop === IS_REACTIVE) return true;

      if (typeof prop === "string" && !isNaN(Number(prop))) {
        trackDependency(target, prop);
      } else if (prop === "length" || prop === Symbol.iterator) {
        trackDependency(target, "length");
        trackDependency(target, Symbol.for("__ALL__"));
      }

      if (typeof prop === "string" && mutatingMethods.includes(prop)) {
        return (...args: unknown[]) => {
          return batch(() => {
            const oldLength = target.length;
            const res = (Array.prototype as any)[prop].apply(target, args);
            triggerMutation(target, "length", oldLength, target.length);
            triggerMutation(
              target,
              Symbol.for("__ALL__"),
              undefined,
              undefined,
            );
            return res;
          });
        };
      }

      const val = Reflect.get(target, prop, receiver);

      if (typeof val === "function") {
        return val.bind(target);
      }

      if (val !== null && typeof val === "object") {
        return makeReactive(val);
      }

      return val;
    },

    set(target, prop, value, receiver) {
      const oldVal = (target as any)[prop];
      const oldLength = target.length;

      const success = Reflect.set(target, prop, value, target);
      if (success) {
        if (Object.is(oldVal, value) && prop !== "length") {
          return true;
        }
        triggerMutation(target, prop as string | symbol, oldVal, value);
        if (target.length !== oldLength) {
          triggerMutation(target, "length", oldLength, target.length);
        }
      }
      return success;
    },
  };

  return new Proxy(arr, handler);
}

/**
 * Creates a reactive `Proxy` wrapper around a native JavaScript `Map`.
 *
 * @remarks
 * Intercepts key-based lookups (`get`, `has`), size inspection (`size`), and iterations (`forEach`, `keys`, `values`, `entries`, `Symbol.iterator`).
 * Mutations (`set`, `delete`, `clear`) trigger reactive invalidation on the affected keys, the `size` property, and wildcard collection subscribers.
 * Any non-primitive values retrieved via `.get()` or iteration are recursively wrapped in reactive proxies.
 *
 * @template K - The type of keys in the map.
 * @template V - The type of values in the map.
 * @param map - The native Map instance to wrap in a reactive proxy.
 * @param makeReactive - Factory function to recursively wrap child objects into reactive proxies.
 * @returns A reactive `Proxy` instance for the given Map.
 *
 * @example
 * ```ts
 * import { makeReactive, effect } from '@platform/signals';
 *
 * const users = makeReactive(new Map<string, string>());
 * effect(() => console.log('User alice:', users.get('alice'))); // Logs: User alice: undefined
 * users.set('alice', 'Admin'); // Logs: User alice: Admin
 * ```
 */
export function createMapProxy<K, V>(
  map: Map<K, V>,
  makeReactive: MakeReactiveFn,
): Map<K, V> {
  const handler: ProxyHandler<Map<K, V>> = {
    get(target, prop, receiver) {
      if (prop === RAW_TARGET) return target;
      if (prop === IS_REACTIVE) return true;

      if (prop === "size") {
        trackDependency(target, "size");
        return target.size;
      }

      if (prop === "get") {
        return (key: K) => {
          trackDependency(target, key as unknown as string);
          const val = target.get(key);
          return isObject(val) ? makeReactive(val) : val;
        };
      }

      if (prop === "has") {
        return (key: K) => {
          trackDependency(target, key as unknown as string);
          return target.has(key);
        };
      }

      if (prop === "set") {
        return (key: K, value: V) => {
          const hadKey = target.has(key);
          const oldVal = target.get(key);
          if (!hadKey || !Object.is(oldVal, value)) {
            target.set(key, value);
            triggerMutation(target, key as unknown as string, oldVal, value);
            triggerMutation(
              target,
              "size",
              hadKey ? target.size : target.size - 1,
              target.size,
            );
            triggerMutation(
              target,
              Symbol.for("__ALL__"),
              undefined,
              undefined,
            );
          }
          return receiver;
        };
      }

      if (prop === "delete") {
        return (key: K) => {
          const hadKey = target.has(key);
          const oldVal = target.get(key);
          if (hadKey) {
            const res = target.delete(key);
            triggerMutation(
              target,
              key as unknown as string,
              oldVal,
              undefined,
            );
            triggerMutation(target, "size", target.size + 1, target.size);
            triggerMutation(
              target,
              Symbol.for("__ALL__"),
              undefined,
              undefined,
            );
            return res;
          }
          return false;
        };
      }

      if (prop === "clear") {
        return () => {
          const oldSize = target.size;
          if (oldSize > 0) {
            target.clear();
            triggerMutation(target, "size", oldSize, 0);
            triggerMutation(
              target,
              Symbol.for("__ALL__"),
              undefined,
              undefined,
            );
          }
        };
      }

      if (prop === "forEach") {
        return (
          callbackfn: (value: V, key: K, map: Map<K, V>) => void,
          thisArg?: unknown,
        ) => {
          trackDependency(target, Symbol.for("__ALL__"));
          trackDependency(target, "size");
          target.forEach((val, key) => {
            const rVal = isObject(val) ? makeReactive(val) : val;
            callbackfn.call(thisArg, rVal, key, receiver);
          });
        };
      }

      if (
        prop === "keys" ||
        prop === "values" ||
        prop === "entries" ||
        prop === Symbol.iterator
      ) {
        return () => {
          trackDependency(target, Symbol.for("__ALL__"));
          trackDependency(target, "size");
          const iterator = (target as any)[prop]();
          return iterator;
        };
      }

      const res = Reflect.get(target, prop, receiver);
      return typeof res === "function" ? res.bind(target) : res;
    },
  };

  return new Proxy(map, handler);
}

/**
 * Creates a reactive `Proxy` wrapper around a native JavaScript `Set`.
 *
 * @remarks
 * Intercepts membership checks (`has`), size inspection (`size`), and iterations (`forEach`, `keys`, `values`, `entries`, `Symbol.iterator`).
 * Mutating methods (`add`, `delete`, `clear`) trigger reactive invalidation on the affected value key, the `size` property, and wildcard collection subscribers.
 * Any non-primitive values accessed through iteration are recursively made reactive.
 *
 * @template T - The type of elements in the set.
 * @param set - The native Set instance to wrap in a reactive proxy.
 * @param makeReactive - Factory function to recursively wrap child objects into reactive proxies.
 * @returns A reactive `Proxy` instance for the given Set.
 *
 * @example
 * ```ts
 * import { makeReactive, effect } from '@platform/signals';
 *
 * const tags = makeReactive(new Set<string>(['alpha']));
 * effect(() => console.log('Has beta tag:', tags.has('beta'))); // Logs: Has beta tag: false
 * tags.add('beta'); // Logs: Has beta tag: true
 * ```
 */
export function createSetProxy<T>(
  set: Set<T>,
  makeReactive: MakeReactiveFn,
): Set<T> {
  const handler: ProxyHandler<Set<T>> = {
    get(target, prop, receiver) {
      if (prop === RAW_TARGET) return target;
      if (prop === IS_REACTIVE) return true;

      if (prop === "size") {
        trackDependency(target, "size");
        return target.size;
      }

      if (prop === "has") {
        return (value: T) => {
          trackDependency(target, value as unknown as string);
          return target.has(value);
        };
      }

      if (prop === "add") {
        return (value: T) => {
          const hadValue = target.has(value);
          if (!hadValue) {
            target.add(value);
            triggerMutation(
              target,
              value as unknown as string,
              undefined,
              value,
            );
            triggerMutation(target, "size", target.size - 1, target.size);
            triggerMutation(
              target,
              Symbol.for("__ALL__"),
              undefined,
              undefined,
            );
          }
          return receiver;
        };
      }

      if (prop === "delete") {
        return (value: T) => {
          const hadValue = target.has(value);
          if (hadValue) {
            const res = target.delete(value);
            triggerMutation(
              target,
              value as unknown as string,
              value,
              undefined,
            );
            triggerMutation(target, "size", target.size + 1, target.size);
            triggerMutation(
              target,
              Symbol.for("__ALL__"),
              undefined,
              undefined,
            );
            return res;
          }
          return false;
        };
      }

      if (prop === "clear") {
        return () => {
          const oldSize = target.size;
          if (oldSize > 0) {
            target.clear();
            triggerMutation(target, "size", oldSize, 0);
            triggerMutation(
              target,
              Symbol.for("__ALL__"),
              undefined,
              undefined,
            );
          }
        };
      }

      if (prop === "forEach") {
        return (
          callbackfn: (value: T, value2: T, set: Set<T>) => void,
          thisArg?: unknown,
        ) => {
          trackDependency(target, Symbol.for("__ALL__"));
          trackDependency(target, "size");
          target.forEach((val) => {
            const rVal = isObject(val) ? makeReactive(val) : val;
            callbackfn.call(thisArg, rVal, rVal, receiver);
          });
        };
      }

      if (
        prop === "keys" ||
        prop === "values" ||
        prop === "entries" ||
        prop === Symbol.iterator
      ) {
        return () => {
          trackDependency(target, Symbol.for("__ALL__"));
          trackDependency(target, "size");
          return (target as any)[prop]();
        };
      }

      const res = Reflect.get(target, prop, receiver);
      return typeof res === "function" ? res.bind(target) : res;
    },
  };

  return new Proxy(set, handler);
}

function isObject(val: unknown): val is object {
  return val !== null && typeof val === "object";
}
