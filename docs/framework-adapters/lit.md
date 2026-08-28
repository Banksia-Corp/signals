# Lit Adapter

The `@banksia/signals/lit` subpath provides a `SignalsController` that connects `@banksia/signals` domain stores or signals directly to `LitElement` and Web Component lifecycles.

## Installation

```bash
pnpm add @banksia/signals lit
```

## `SignalsController`

The `SignalsController` implements Lit's `ReactiveController` interface. It automatically tracks reactive access inside your element and triggers `requestUpdate()` when properties change. Subscriptions are automatically connected in `hostConnected` and torn down in `hostDisconnected`.

### Example with LitElement

```typescript
import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";
import { SignalsController } from "@banksia/signals/lit";
import { cartStore } from "./stores/cart-store";

@customElement("cart-badge")
export class CartBadge extends LitElement {
  // Bind the controller to this element and the reactive store:
  private cart = new SignalsController(this, cartStore);

  render() {
    return html`
      <div class="badge">
        <span>Cart Items: ${this.cart.target.items.length}</span>
        <span>Total: $${this.cart.target.total.toFixed(2)}</span>
        <button
          @click=${() => this.cart.target.addItem({ id: "sku-1", price: 15, quantity: 1 })}
        >
          Add Item
        </button>
      </div>
    `;
  }
}
```

## Controller Lifecycle Guarantees

1. **Memory-Leak Free**: Disposes the underlying reactive effect as soon as `hostDisconnected()` fires.
2. **Reconnection Safe**: When elements are detached and re-attached to the DOM, the reactive subscription is re-established in `hostConnected()`.
3. **Multi-Store Binding**: You can register multiple `SignalsController` instances on a single LitElement.
