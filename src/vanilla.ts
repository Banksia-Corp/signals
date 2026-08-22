/**
 * @module vanilla
 * Vanilla JavaScript DOM bindings and synchronization helpers for `@platform/signals`.
 */

import { effect } from "./core/effect";

/**
 * Binds a DOM element to reactive signals using a custom updater callback.
 *
 * @remarks
 * Runs synchronously on registration to apply initial DOM attributes/styles, then automatically
 * re-executes whenever reactive signals or proxy properties read within `updater` change.
 *
 * @template T - The type of DOM Element.
 * @param element - The native DOM element to update.
 * @param updater - Callback receiving the element and executing mutations based on reactive state.
 * @returns A dispose function to unbind the reactive effect.
 *
 * @example
 * ```ts
 * import { bindDOM, makeReactive } from '@platform/signals/vanilla';
 *
 * const state = makeReactive({ active: false });
 * const btn = document.querySelector('button')!;
 *
 * const unbind = bindDOM(btn, (el) => {
 *   el.classList.toggle('is-active', state.active);
 * });
 *
 * state.active = true; // Button gets 'is-active' class
 * ```
 */
export function bindDOM<T extends Element>(
  element: T,
  updater: (el: T) => void,
): () => void {
  return effect(() => {
    updater(element);
  });
}

/**
 * Directly synchronizes an HTML element's `textContent` with a reactive getter function.
 *
 * @param element - The HTML element whose text content will be updated.
 * @param getter - Pure function returning the reactive string or number to render.
 * @returns A dispose function to unbind the reactive text synchronization.
 *
 * @example
 * ```ts
 * import { bindText, signal } from '@platform/signals/vanilla';
 *
 * const count = signal(0);
 * const span = document.querySelector('#counter-display') as HTMLElement;
 *
 * const unbind = bindText(span, () => `Count: ${count.value}`);
 * count.value = 5; // span.textContent updates to 'Count: 5'
 * ```
 */
export function bindText(
  element: HTMLElement,
  getter: () => string | number,
): () => void {
  return effect(() => {
    element.textContent = String(getter());
  });
}
