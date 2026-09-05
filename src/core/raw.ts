/**
 * @module core/raw
 * Lightweight raw target unwrap utilities and reactivity reflection symbols.
 */

/**
 * Symbol key used internally and on reactive proxies and signals to retrieve the underlying unproxied target object.
 */
export const RAW_TARGET = Symbol.for("__BANKSIA_RAW_TARGET__");

/**
 * Symbol key used internally to inspect whether a target is a reactive Proxy or Signal container.
 */
export const IS_REACTIVE = Symbol.for("__BANKSIA_IS_REACTIVE__");

/**
 * Unwraps a reactive Proxy or Signal to return the underlying raw JavaScript target object.
 *
 * @remarks
 * If the provided value is not a reactive Proxy or Signal, it is returned unchanged.
 * Useful when passing data to external libraries that require unmodified references or when avoiding reactivity overhead.
 *
 * @template T - The type of the target object.
 * @param target - The reactive proxy, signal, or plain object to unwrap.
 * @returns The original unproxied object reference.
 *
 * @example
 * ```ts
 * import { signal, toRaw } from '@banksia/signals';
 *
 * const count = signal(0);
 * console.log(toRaw(count).value); // 0 (non-tracking read)
 * ```
 */
export function toRaw<T>(target: T): T {
  if (
    typeof target === "object" &&
    target !== null &&
    (target as any)[RAW_TARGET]
  ) {
    return (target as any)[RAW_TARGET] as T;
  }
  return target;
}

/**
 * Checks whether a given target object is an active reactive Proxy wrapper or Signal container.
 *
 * @param target - The value or object to inspect.
 * @returns `true` if the target is reactive; otherwise `false`.
 *
 * @example
 * ```ts
 * import { signal, isReactive } from '@banksia/signals';
 *
 * const count = signal(0);
 * console.log(isReactive(count)); // true
 * console.log(isReactive(0)); // false
 * ```
 */
export function isReactive(target: unknown): boolean {
  return (
    typeof target === "object" &&
    target !== null &&
    Boolean((target as any)[IS_REACTIVE])
  );
}
