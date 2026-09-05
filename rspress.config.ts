import path from "node:path";
import { fileURLToPath } from "node:url";
import { pluginTypeDoc } from "@rspress/plugin-typedoc";
import { defineConfig } from "rspress/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: path.join(__dirname, "docs"),
  title: "signals",
  description:
    "An ultra-fast reactivity engine for the modern web with pure domain models and multi-framework adapters",
  icon: "/logo.svg",
  logo: "/logo.svg",
  logoText: "signals",
  base: process.env.DOCS_BASE || (process.env.GITHUB_PAGES ? "/signals/" : "/"),
  head: [
    ["meta", { property: "og:site_name", content: "@banksia/signals" }],
    ["meta", { property: "og:type", content: "website" }],
    [
      "meta",
      {
        property: "og:title",
        content:
          "@banksia/signals | Ultra-Fast Reactivity Engine for the Modern Web",
      },
    ],
    [
      "meta",
      {
        property: "og:description",
        content:
          "High-performance, Proxy-based fine-grained reactive state framework with pure domain models, multi-framework adapters, and first-class observability.",
      },
    ],
    [
      "meta",
      {
        property: "og:url",
        content: "https://banksia-corp.github.io/signals/",
      },
    ],
    [
      "meta",
      {
        property: "og:image",
        content: "https://banksia-corp.github.io/signals/logo.svg",
      },
    ],
    ["meta", { name: "twitter:card", content: "summary_large_image" }],
    [
      "meta",
      {
        name: "twitter:title",
        content:
          "@banksia/signals | Ultra-Fast Reactivity Engine for the Modern Web",
      },
    ],
    [
      "meta",
      {
        name: "twitter:description",
        content:
          "High-performance, Proxy-based fine-grained reactive state framework with pure domain models, multi-framework adapters, and first-class observability.",
      },
    ],
    [
      "meta",
      {
        name: "twitter:image",
        content: "https://banksia-corp.github.io/signals/logo.svg",
      },
    ],
    [
      "link",
      { rel: "canonical", href: "https://banksia-corp.github.io/signals/" },
    ],
    [
      "meta",
      {
        name: "keywords",
        content:
          "signals, reactivity, state-management, react, lit, solidjs, vanilla, typescript, proxy",
      },
    ],
  ],
  route: {
    cleanUrls: true,
  },
  plugins: [
    pluginTypeDoc({
      entryPoints: [
        path.join(__dirname, "src/index.ts"),
        path.join(__dirname, "src/react.ts"),
        path.join(__dirname, "src/lit.ts"),
        path.join(__dirname, "src/solid.ts"),
        path.join(__dirname, "src/vanilla.ts"),
        path.join(__dirname, "src/devtools.ts"),
      ],
      outDir: "api",
    }),
  ],
  themeConfig: {
    nav: [
      { text: "Guide", link: "/getting-started/overview" },
      { text: "Core Concepts", link: "/core-concepts/signals" },
      { text: "Framework Adapters", link: "/framework-adapters/react" },
      { text: "Observability", link: "/devtools-mcp/telemetry" },
      { text: "API Reference", link: "/api-reference/" },
      { text: "TypeDoc Portal", link: "/api/" },
    ],
    socialLinks: [
      {
        icon: "github",
        mode: "link",
        content: "https://github.com/Banksia-Corp/signals",
      },
    ],
    footer: {
      message: "Released under the MIT License.",
    },
  },
});
