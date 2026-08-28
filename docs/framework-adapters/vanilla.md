# Vanilla JS & DOM Adapter

The `@banksia/signals/vanilla` subpath provides zero-dependency DOM synchronization helpers for micro-frontends, lightweight landing pages, and standalone scripts without any UI framework overhead.

## Installation

```bash
pnpm add @banksia/signals
```

_(No peer dependencies required!)_

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

## `bindDOM(element, updater)`

Provides full control to mutate element classes, styles, attributes, or properties reactively:

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

## `bindInput(inputElement, signal)`

Two-way data binding between an `<input>` element and a `Signal`:

```typescript
import { signal } from "@banksia/signals";
import { bindInput } from "@banksia/signals/vanilla";

const searchQuery = signal("");
const input = document.querySelector<HTMLInputElement>("#search-box")!;

// Synchronizes both DOM input events -> signal, and signal -> input.value:
const unbind = bindInput(input, searchQuery);
```
