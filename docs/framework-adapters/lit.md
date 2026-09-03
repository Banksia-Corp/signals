# Lit Adapter

The `@banksia/signals/lit` subpath provides `SignalsController`, connecting `@banksia/signals` domain stores or signals directly to `LitElement` and Web Component lifecycles.

---

## Installation

```bash
pnpm add @banksia/signals lit
```

---

## `SignalsController`

`SignalsController` implements Lit's `ReactiveController` interface. It establishes a reactive effect that observes the domain store and calls `host.requestUpdate()` whenever tracked properties mutate. Subscriptions are automatically connected in `hostConnected()` and disposed in `hostDisconnected()`.

### Example with LitElement

```typescript
import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";
import { SignalsController } from "@banksia/signals/lit";
import { cartStore } from "./stores/cart-store";

@customElement("cart-badge")
export class CartBadge extends LitElement {
  // Bind the controller to this element and the reactive store:
  private cartCtrl = new SignalsController(this, cartStore);

  render() {
    // Access the reactive store directly; controller handles requesting updates:
    return html`
      <div class="badge">
        <span>Cart Items: ${cartStore.items.length}</span>
        <span>Total: $${cartStore.total.toFixed(2)}</span>
        <button
          @click=${() => cartStore.addItem({ id: "sku-1", name: "Keyboard", price: 15, quantity: 1 })}
        >
          Add Item
        </button>
      </div>
    `;
  }
}
```

---

## Controller Lifecycle Guarantees

1. **Automatic Memory Management**: Disposes the internal reactive effect immediately when `hostDisconnected()` fires, preventing memory leaks in single-page applications.
2. **Reconnection Resilience**: When DOM elements are moved or re-attached, the reactive subscription is re-established seamlessly in `hostConnected()`.
3. **Multi-Store Binding**: A single `LitElement` can instantiate multiple `SignalsController` instances to bind to distinct domain stores:
   ```typescript
   private userCtrl = new SignalsController(this, userStore);
   private cartCtrl = new SignalsController(this, cartStore);
   ```

---

## TypeScript Signatures

```typescript
export interface ReactiveControllerHost {
  addController(controller: ReactiveController): void;
  removeController(controller: ReactiveController): void;
  requestUpdate(): void;
}

export interface ReactiveController {
  hostConnected?(): void;
  hostDisconnected?(): void;
}

export class SignalsController<T extends object> implements ReactiveController {
  constructor(host: ReactiveControllerHost, target: T);
  hostConnected(): void;
  hostDisconnected(): void;
}
```
