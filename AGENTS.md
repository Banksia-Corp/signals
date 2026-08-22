# AGENTS.md

You are working on `@banksia/signals`, a high-performance, Proxy-based fine-grained reactive state framework.

## Commands

- `pnpm run build` - Build package via Rslib
- `pnpm run dev` - Build in watch mode
- `pnpm run test` - Run Vitest test suite
- `pnpm run lint` - Check formatting and code style with Prettier
- `pnpm run format` - Format code with Prettier

## Subpath Exports

- `@banksia/signals`: Core engine (`makeReactive`, `signal`, `computed`, `effect`, `batch`, DevTools)
- `@banksia/signals/react`: React integration (`useReactive`, `observer`, `useSignal`, `useComputed`)
- `@banksia/signals/lit`: Lit element integration (`SignalsController`, `@reactive`)
- `@banksia/signals/solid`: SolidJS integration (`createSolidSignalBridge`)
- `@banksia/signals/vanilla`: Vanilla JS integration (`bindDOM`)
- `@banksia/signals/devtools`: Observability & DevTools integration (`window.__BANKSIA_SIGNALS_DEVTOOLS__`)
