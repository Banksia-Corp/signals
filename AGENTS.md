# AGENTS.md

You are working on `@banksia/signals`, a high-performance, Proxy-based fine-grained reactive state framework.

## Documentation Index & Dedicated Guides

For in-depth guides and policies, refer to the dedicated documentation:

- **[Semantic Versioning & Changeset Workflow](./docs/versioning-and-changesets.md)**: Rules for when changesets are required, SemVer bump classifications (`major`, `minor`, `patch`), and release automation.
- **[Development & Contributor Guidelines](./docs/development-guidelines.md)**: Zero-dependency core principles, memory leak prevention, fine-grained reactivity guarantees, and quality gate workflows.
- **[Build Distribution & Bundling Audit](./docs/distribution-audit.md)**: Artifact packaging hygiene, bundling strategy evaluation, tree-shaking characteristics, and observability footprint benchmarks.

---

## Essential Commands

- `pnpm run build` - Build package via Rslib
- `pnpm run dev` - Build in watch mode
- `pnpm run docs` - Generate API documentation via TypeDoc
- `pnpm run test` - Run Vitest test suite
- `pnpm run lint` - Check formatting and code style with Prettier
- `pnpm run format` - Format code with Prettier
- `pnpm changeset` - Generate a changeset for user-facing changes

---

## Subpath Exports & API Surface

- `@banksia/signals`: Core engine (`makeReactive`, `signal`, `computed`, `effect`, `batch`, `flushBatch`, `registerReactivityHooks`, `observe`, `createReactivityHub`)
- `@banksia/signals/react`: React integration (`useReactive`, `observer`, `useSignal`, `useComputed`)
- `@banksia/signals/lit`: Lit element integration (`SignalsController`)
- `@banksia/signals/solid`: SolidJS integration (`createSolidSignalBridge`)
- `@banksia/signals/vanilla`: Vanilla JS integration (`bindDOM`, `bindText`)
- `@banksia/signals/devtools`: Observability & DevTools integration (`initDevTools`, `connectDevTools`, `window.__BANKSIA_SIGNALS_DEVTOOLS__`)

---

## Agent Operational Rules

1. **Quality Gates**: Always run `pnpm run test`, `pnpm run lint`, and `pnpm run build` before completing a task.
2. **Changesets**: Include a changeset via `pnpm changeset` whenever introducing user-facing bug fixes, new features, or breaking API changes (see [Versioning Guide](./docs/versioning-and-changesets.md)).
3. **Core Dependency Invariant**: Do NOT introduce runtime dependencies to the core `@banksia/signals` engine. Framework adapters must remain optional peer dependencies.
4. **Documentation Sync**: Keep `README.md`, `AGENTS.md`, and `docs/` in sync whenever exports or behaviors change.
5. **Agent Attribution**: When creating git commits, changesets, or pull request metadata for agent-authored work, use `ai@google.com` as the attribution email (e.g. `Co-authored-by: Google Antigravity <ai@google.com>`), and include the `🤖 Co-authored with Google Antigravity` badge and attribution checklist item when raising Pull Requests.
