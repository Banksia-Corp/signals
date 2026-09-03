import path from "node:path";
import { fileURLToPath } from "node:url";
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
  route: {
    cleanUrls: true,
    exclude: ["**/api/**", "**/api/**/*"],
  },
  builderConfig: {
    output: {
      copy: [
        {
          from: path.join(__dirname, "docs/api"),
          to: "api",
        },
      ],
    },
  },
  themeConfig: {
    nav: [
      { text: "Guide", link: "/getting-started/overview" },
      { text: "Core Concepts", link: "/core-concepts/signals" },
      { text: "Framework Adapters", link: "/framework-adapters/react" },
      { text: "Observability", link: "/devtools-mcp/telemetry" },
      { text: "API Reference", link: "/api-reference/" },
      { text: "TypeDoc Portal", link: "/api/index.html" },
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
