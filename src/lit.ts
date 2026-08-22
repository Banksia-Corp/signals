/**
 * @module lit
 * Lit element integration controller for `@banksia/signals`.
 */

import { effect } from "./core/effect";

/**
 * Host component interface for Lit elements supporting reactive lifecycle controllers.
 */
export interface ReactiveControllerHost {
  /**
   * Adds a reactive controller to the host.
   *
   * @param controller - The reactive controller instance to register.
   */
  addController(controller: ReactiveController): void;

  /**
   * Removes a reactive controller from the host.
   *
   * @param controller - The reactive controller instance to remove.
   */
  removeController(controller: ReactiveController): void;

  /**
   * Requests an asynchronous render update of the host element.
   */
  requestUpdate(): void;
}

/**
 * Interface defining lifecycle hooks for Lit reactive controllers.
 */
export interface ReactiveController {
  /**
   * Hook invoked when the host element connects to the DOM.
   */
  hostConnected?(): void;

  /**
   * Hook invoked when the host element disconnects from the DOM.
   */
  hostDisconnected?(): void;
}

/**
 * Lit `ReactiveController` that connects a reactive object or domain store to a Lit element.
 *
 * @remarks
 * When the element connects to the DOM, `SignalsController` establishes a reactive effect
 * that listens to mutations on the target object and triggers `host.requestUpdate()`.
 * When the element disconnects, the effect is automatically disposed.
 *
 * @template T - The type of reactive target object or store.
 *
 * @example
 * ```ts
 * import { LitElement, html } from 'lit';
 * import { customElement } from 'lit/decorators.js';
 * import { SignalsController } from '@banksia/signals/lit';
 * import { counterStore } from './counter-store';
 *
 * @customElement('counter-view')
 * export class CounterView extends LitElement {
 *   private ctrl = new SignalsController(this, counterStore);
 *
 *   render() {
 *     return html`<p>Count: ${counterStore.count}</p>`;
 *   }
 * }
 * ```
 */
export class SignalsController<T extends object> implements ReactiveController {
  private host: ReactiveControllerHost;
  private target: T;
  private disposeEffect?: () => void;

  /**
   * Creates a new `SignalsController` instance and registers it with the host element.
   *
   * @param host - The Lit component host.
   * @param target - The reactive object or domain store to observe.
   */
  constructor(host: ReactiveControllerHost, target: T) {
    this.host = host;
    this.target = target;
    this.host.addController(this);
  }

  /**
   * Subscribes to the reactive target when the host connects to the DOM.
   */
  public hostConnected(): void {
    this.disposeEffect = effect(() => {
      // Access target properties to trigger reactive subscription
      traverseLitTarget(this.target);
      this.host.requestUpdate();
    });
  }

  /**
   * Disposes the reactive subscription when the host disconnects from the DOM.
   */
  public hostDisconnected(): void {
    if (this.disposeEffect) {
      this.disposeEffect();
      this.disposeEffect = undefined;
    }
  }
}

function traverseLitTarget(
  obj: unknown,
  visited = new WeakSet<object>(),
): void {
  if (obj === null || typeof obj !== "object") return;
  if (visited.has(obj)) return;
  visited.add(obj);

  for (const key of Object.keys(obj)) {
    try {
      const val = (obj as any)[key];
      if (val !== null && typeof val === "object") {
        traverseLitTarget(val, visited);
      }
    } catch {
      // ignore
    }
  }
}
