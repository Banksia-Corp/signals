/**
 * @module react
 * React integration adapters, hooks, and Higher-Order Components for `@banksia/signals`.
 */

import React, {
  useSyncExternalStore,
  useMemo,
  useRef,
  useState,
  useEffect,
} from "react";
import { effect } from "./core/effect";
import { makeReactive } from "./core/proxy";
import { signal, Signal } from "./core/signal";
import { computed, ReadonlySignal } from "./core/computed";

/**
 * React hook that subscribes the host component to changes in a reactive target object or store.
 *
 * @remarks
 * Whenever properties of the passed reactive object are accessed and mutated, this hook triggers a component re-render.
 *
 * @template T - The type of reactive target object or domain store.
 * @param target - The reactive object, domain model, or signal container to observe.
 * @returns The same reactive target object reference.
 *
 * @example
 * ```tsx
 * import React from 'react';
 * import { useReactive } from '@banksia/signals/react';
 * import { userStore } from './user-store';
 *
 * export const UserHeader: React.FC = () => {
 *   const store = useReactive(userStore);
 *   return <h2>Welcome, {store.user.name}</h2>;
 * };
 * ```
 */
export function useReactive<T extends object>(target: T): T {
  const [, forceUpdate] = useState({});

  useEffect(() => {
    const dispose = effect(() => {
      // Traverse target properties dynamically during effect tracking
      traverseObject(target);
      forceUpdate({});
    });
    return dispose;
  }, [target]);

  return target;
}

/**
 * Higher-Order Component (HOC) that transforms a React component into a fine-grained reactive observer.
 *
 * @remarks
 * Any reactive signal or proxy property read during the render lifecycle of the wrapped component
 * will be automatically tracked as a dependency. When any of those dependencies mutate, the component re-renders.
 *
 * @template P - The props type accepted by the wrapped component.
 * @param Component - The standard React component to wrap.
 * @returns A reactive observer React component.
 *
 * @example
 * ```tsx
 * import React from 'react';
 * import { observer } from '@banksia/signals/react';
 * import { cartStore } from './cart-store';
 *
 * export const CartCount = observer(() => {
 *   return <span>Items: {cartStore.items.length}</span>;
 * });
 * ```
 */
export function observer<P extends object>(
  Component: React.ComponentType<P>,
): React.FC<P> {
  const ObserverComponent: React.FC<P> = (props: P) => {
    const [, forceUpdate] = useState({});
    const disposeRef = useRef<(() => void) | null>(null);

    useEffect(() => {
      return () => {
        if (disposeRef.current) {
          disposeRef.current();
        }
      };
    }, []);

    let rendered: React.ReactNode = null;
    if (disposeRef.current) {
      disposeRef.current();
    }

    disposeRef.current = effect(() => {
      rendered = React.createElement(Component as any, props);
    });

    return (rendered ?? null) as unknown as React.ReactElement;
  };

  ObserverComponent.displayName = `Observer(${Component.displayName || Component.name || "Component"})`;
  return ObserverComponent;
}

/**
 * React hook that creates and memoizes a persistent {@link Signal} tied to the component lifecycle.
 *
 * @remarks
 * Automatically subscribes the host component to re-render whenever the signal's `.value` mutates.
 *
 * @template T - The type of value held by the signal.
 * @param initialValue - Initial value of the signal.
 * @returns A reactive {@link Signal} instance.
 *
 * @example
 * ```tsx
 * import React from 'react';
 * import { useSignal } from '@banksia/signals/react';
 *
 * export const Counter: React.FC = () => {
 *   const count = useSignal(0);
 *   return (
 *     <button onClick={() => count.value++}>
 *       Count: {count.value}
 *     </button>
 *   );
 * };
 * ```
 */
export function useSignal<T>(initialValue: T): Signal<T> {
  const sig = useMemo(() => signal(initialValue), []);
  useReactive(sig);
  return sig;
}

/**
 * React hook that creates and memoizes a {@link ReadonlySignal} derived computation.
 *
 * @remarks
 * Automatically tracks reactive dependencies read inside `fn` and re-renders the component when derived state changes.
 *
 * @template T - The derived return value type.
 * @param fn - Pure computation getter function.
 * @returns A memoized {@link ReadonlySignal} instance.
 *
 * @example
 * ```tsx
 * import React from 'react';
 * import { useSignal, useComputed } from '@banksia/signals/react';
 *
 * export const FullNameView: React.FC = () => {
 *   const firstName = useSignal('Ada');
 *   const lastName = useSignal('Lovelace');
 *   const fullName = useComputed(() => `${firstName.value} ${lastName.value}`);
 *
 *   return <h3>{fullName.value}</h3>;
 * };
 * ```
 */
export function useComputed<T>(fn: () => T): ReadonlySignal<T> {
  const comp = useMemo(() => computed(fn), []);
  useReactive(comp);
  return comp;
}

function traverseObject(obj: unknown, visited = new WeakSet<object>()): void {
  if (obj === null || typeof obj !== "object") return;
  if (visited.has(obj)) return;
  visited.add(obj);

  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      traverseObject(obj[i], visited);
    }
  } else if (obj instanceof Map) {
    for (const [k, v] of obj.entries()) {
      traverseObject(k, visited);
      traverseObject(v, visited);
    }
  } else if (obj instanceof Set) {
    for (const v of obj.values()) {
      traverseObject(v, visited);
    }
  } else {
    for (const key of Object.keys(obj)) {
      try {
        const val = (obj as any)[key];
        if (val !== null && typeof val === "object") {
          traverseObject(val, visited);
        }
      } catch {
        // ignore getter exceptions during traverse
      }
    }
  }
}
