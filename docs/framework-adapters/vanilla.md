# Vanilla DOM Adapter

The `@banksia/signals/vanilla` subpath provides zero-dependency DOM synchronization helpers for micro-frontends, lightweight landing pages, and standalone scripts without any UI framework overhead.

---

## Installation

```bash
pnpm add @banksia/signals
```

_(No external or framework peer dependencies required!)_

---

## `bindText(element, getter)`

Directly synchronizes an HTML element's `textContent` with a reactive expression:

```typescript
import { signal } from "@banksia/signals";
import { bindText } from "@banksia/signals/vanilla";

const count = signal(0);
const span = document.querySelector<HTMLSpanElement>("#counter")!;

// Automatically sets span.textContent and updates whenever count.value changes:
const unbind = bindText(span, () => `Current count: ${count.value}`);

count.value = 10; // Updates DOM directly

// Call unbind to tear down subscription:
unbind();
```

---

## `bindDOM(element, updater)`

Provides full control to mutate element classes, styles, attributes, or properties reactively. The `updater` callback executes once immediately upon binding, and re-executes whenever reactive signals or proxy properties read within it mutate:

```typescript
import { makeReactive } from "@banksia/signals";
import { bindDOM } from "@banksia/signals/vanilla";

const uiState = makeReactive({
  loading: false,
  error: null as string | null,
  theme: "dark",
});

const submitBtn = document.querySelector<HTMLButtonElement>("#submit-btn")!;

const unbind = bindDOM(submitBtn, (btn) => {
  btn.disabled = uiState.loading;
  btn.classList.toggle("is-loading", uiState.loading);
  btn.setAttribute("data-theme", uiState.theme);
});
```

---

## Recipe: Two-Way Form Input Binding

To synchronize an `<input>` element two-way with a reactive signal or domain store property, combine `bindDOM` with a native `input` event listener:

```typescript
import { signal } from "@banksia/signals";
import { bindDOM } from "@banksia/signals/vanilla";

export function bindTwoWayInput(
  input: HTMLInputElement,
  textSignal: ReturnType<typeof signal<string>>,
) {
  // 1. Signal -> Input DOM:
  const unbindDOM = bindDOM(input, (el) => {
    if (el.value !== textSignal.value) {
      el.value = textSignal.value;
    }
  });

  // 2. Input DOM -> Signal:
  const onInput = () => {
    textSignal.value = input.value;
  };
  input.addEventListener("input", onInput);

  // Return combined disposal function:
  return () => {
    unbindDOM();
    input.removeEventListener("input", onInput);
  };
}

// Usage:
const search = signal("");
const searchBox = document.querySelector<HTMLInputElement>("#search-box")!;
const unbindInput = bindTwoWayInput(searchBox, search);
```

---

## TypeScript Signatures

```typescript
export function bindDOM<T extends Element>(
  element: T,
  updater: (el: T) => void,
): () => void;

export function bindText(
  element: HTMLElement,
  getter: () => string | number,
): () => void;
```
