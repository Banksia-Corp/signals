---
pageType: home

hero:
  name: "@banksia/signals"
  text: Fine-grained, zero-boilerplate reactivity
  tagline: Pure TypeScript reactive state engine with multi-framework adapters (React, Lit, Solid, Vanilla DOM) and Chrome DevTools MCP observability.
  actions:
    - theme: brand
      text: Get Started
      link: /getting-started/overview
    - theme: alt
      text: API Reference
      link: /api-reference/
  image:
    src: /logo.svg
    alt: Banksia Signals Logo

features:
  - title: Zero Runtime Dependencies
    details: Core reactive engine weighs ~2.5 kB min+brotli with zero external runtime dependencies. Uncompromising performance and predictability.
    icon: ⚡
  - title: ES6 Proxy-Driven State
    details: Read properties naturally and mutate state directly. No action indirection, dispatcher boilerplate, or reducer ceremony.
    icon: 🎯
  - title: Constructor Self-Reactivity
    details: Idiomatic TypeScript domain models. Simply execute return makeReactive(this) in the constructor to convert any class into a reactive model.
    icon: 🏗️
  - title: Microtask Transaction Batching
    details: Multiple synchronous mutations collapse into a single microtask turn, preventing redundant recalculations and UI layout thrashing.
    icon: 🔄
  - title: Multi-Framework UI Adapters
    details: Dedicated lightweight adapters for React, Lit, SolidJS, and Vanilla DOM. Domain logic stays independent of UI frameworks.
    icon: 🧩
  - title: Chrome DevTools MCP Observability
    details: Built-in telemetry hubs and Chrome DevTools MCP recipes enable live agent inspection, dependency graphing, and runtime debugging.
    icon: 🔍
---
