# Installation

`@banksia/signals` is available on npm and JSR. It requires Node.js >= 20 (or modern evergreen browsers).

## Package Managers

### pnpm

```bash
pnpm add @banksia/signals
```

### npm

```bash
npm install @banksia/signals
```

### yarn

```bash
yarn add @banksia/signals
```

### bun

```bash
bun add @banksia/signals
```

### JSR

```bash
npx jsr add @banksia/signals
```

## Framework Peer Dependencies

The core package `@banksia/signals` has **zero external runtime dependencies**.

Framework adapters are optional and available via dedicated subpath exports. Install the corresponding peer dependency if using an adapter:

| Subpath Export              | Peer Dependency | Supported Versions |
| :-------------------------- | :-------------- | :----------------- |
| `@banksia/signals/react`    | `react`         | `^18.0.0           |     | ^19.0.0` |
| `@banksia/signals/lit`      | `lit`           | `^3.0.0`           |
| `@banksia/signals/solid`    | `solid-js`      | `^1.9.0`           |
| `@banksia/signals/vanilla`  | _(None)_        | Zero dependencies  |
| `@banksia/signals/devtools` | _(None)_        | Zero dependencies  |

Example installing with React:

```bash
pnpm add @banksia/signals react react-dom
```

Example installing with Lit:

```bash
pnpm add @banksia/signals lit
```

Example installing with Solid:

```bash
pnpm add @banksia/signals solid-js
```

## TypeScript Configuration

`@banksia/signals` includes complete, strict TypeScript type declarations. For optimal type inference and modern subpath resolution, configure your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "skipLibCheck": true
  }
}
```
