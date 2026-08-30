---
pageType: home

hero:
  name: "@banksia/signals"
  text: Fine-grained, zero-boilerplate reactivity
  tagline: High-performance, Proxy-based reactive state engine for TypeScript domain models, multi-framework UIs (React, Lit, SolidJS, Vanilla DOM), and AI Agent Chrome DevTools MCP observability.
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
    details: Core reactive engine weighs ~2.5 kB min+brotli with 0 external dependencies. Predictable, ultra-lean, and designed for mission-critical TypeScript apps.
    icon: ⚡
  - title: ES6 Proxy-Driven State
    details: Read properties naturally and mutate state directly. No action indirection, dispatcher boilerplate, or reducer ceremony required.
    icon: 🎯
  - title: Constructor Self-Reactivity
    details: Idiomatic TypeScript domain models. Simply execute return makeReactive(this) in the constructor to convert any class into a deeply reactive model.
    icon: 🏗️
  - title: Microtask Transaction Batching
    details: Multiple synchronous mutations collapse into a single microtask turn, preventing redundant recomputations and UI layout thrashing.
    icon: 🔄
  - title: Multi-Framework UI Adapters
    details: First-class lightweight adapters for React, Lit, SolidJS, and Vanilla DOM. Keep your business logic 100% decoupled from presentation.
    icon: 🧩
  - title: Chrome DevTools MCP Observability
    details: Built-in telemetry hooks and Chrome DevTools MCP recipes enable live AI agent inspection, dependency graph tracing, and runtime debugging.
    icon: 🔍
---
