/**
 * @module solid
 * SolidJS reactive integration bridge for `@banksia/signals`.
 */

import { createSignal, onCleanup } from "solid-js";
import { effect } from "./core/effect";

/**
 * Bridges a `@banksia/signals` reactive object or domain store into SolidJS's fine-grained reactivity system.
 *
 * @remarks
 * Wraps the reactive proxy target inside a SolidJS signal accessor. When any tracked property on the target
 * mutates, the SolidJS signal is triggered, causing dependent SolidJS computations and JSX components to update.
 * Cleanup is managed automatically when the enclosing SolidJS reactive root or component is unmounted.
 *
 * @template T - The type of reactive target object or store.
 * @param target - The reactive domain store or proxy object to bridge into SolidJS.
 * @returns An accessor getter function returning the target object for use in SolidJS components.
 *
 * @example
 * ```tsx
 * import { createSolidSignalBridge } from '@banksia/signals/solid';
 * import { counterStore } from './counter-store';
 *
 * export function CounterView() {
 *   const store = createSolidSignalBridge(counterStore);
 *   return <div>Count: {store().count}</div>;
 * }
 * ```
 */
export function createSolidSignalBridge<T extends object>(target: T): () => T {
  const [state, setState] = createSignal<T>(target, { equals: false });

  const dispose = effect(() => {
    setState(() => target);
  });

  onCleanup(() => {
    dispose();
  });

  return state;
}
