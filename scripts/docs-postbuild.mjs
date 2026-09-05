import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const docsDir = path.join(rootDir, "docs");
const buildDir = path.join(rootDir, "doc_build");
const apiBuildDir = path.join(buildDir, "api");

console.log("🚀 Running docs post-build audit and touchup...");

if (!fs.existsSync(buildDir)) {
  console.error("❌ Error: doc_build directory not found.");
  process.exit(1);
}

// 1. Ensure .nojekyll exists in doc_build root for GitHub Pages
const noJekyllPath = path.join(buildDir, ".nojekyll");
if (!fs.existsSync(noJekyllPath)) {
  fs.writeFileSync(noJekyllPath, "", "utf-8");
  console.log("✅ Created doc_build/.nojekyll");
}

// 2. Synchronize Markdown files into doc_build for direct .md access
function copyMarkdownFiles(srcDir, destDir) {
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name !== "public" && entry.name !== "node_modules") {
        if (!fs.existsSync(destPath)) {
          fs.mkdirSync(destPath, { recursive: true });
        }
        copyMarkdownFiles(srcPath, destPath);
      }
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyMarkdownFiles(docsDir, buildDir);
console.log("✅ Synchronized Markdown files into doc_build");

// 3. Define structured documentation sections for LLMs
const docsSections = [
  {
    title: "Getting Started",
    pages: [
      { name: "Overview", file: "getting-started/overview.md" },
      { name: "Installation", file: "getting-started/installation.md" },
      {
        name: "Philosophy & The Five Pillars",
        file: "getting-started/philosophy.md",
      },
    ],
  },
  {
    title: "Core Concepts",
    pages: [
      { name: "Signals", file: "core-concepts/signals.md" },
      { name: "Computed", file: "core-concepts/computed.md" },
      { name: "Effects", file: "core-concepts/effects.md" },
      {
        name: "Reactive Objects & Collections",
        file: "core-concepts/reactive-proxies.md",
      },
      {
        name: "Batching & Scheduler",
        file: "core-concepts/batching-scheduler.md",
      },
      {
        name: "Telemetry & Observability Hubs",
        file: "core-concepts/telemetry-hubs.md",
      },
    ],
  },
  {
    title: "Framework Adapters",
    pages: [
      { name: "React Adapter", file: "framework-adapters/react.md" },
      { name: "Lit Adapter", file: "framework-adapters/lit.md" },
      { name: "SolidJS Adapter", file: "framework-adapters/solid.md" },
      {
        name: "Vanilla JS & DOM Adapter",
        file: "framework-adapters/vanilla.md",
      },
    ],
  },
  {
    title: "Observability & Developer Tooling",
    pages: [
      { name: "Observability", file: "devtools-mcp/telemetry.md" },
      {
        name: "Chrome DevTools & Agentic MCP Observability",
        file: "devtools-mcp/recipes.md",
      },
      {
        name: "Runtime Debugging & Invariants",
        file: "devtools-mcp/debugging.md",
      },
    ],
  },
  {
    title: "API Reference",
    pages: [
      { name: "API Matrix", file: "api-reference/index.md" },
      { name: "API Module Index", file: "api/index.md" },
      { name: "Core Module API", file: "api/modules/index.md" },
      { name: "React Module API", file: "api/modules/react.md" },
      { name: "Lit Module API", file: "api/modules/lit.md" },
      { name: "SolidJS Module API", file: "api/modules/solid.md" },
      { name: "Vanilla Module API", file: "api/modules/vanilla.md" },
      { name: "DevTools Module API", file: "api/modules/devtools.md" },
    ],
  },
  {
    title: "Engineering & Governance",
    pages: [
      {
        name: "Reactivity Performance Benchmarking & Budgets",
        file: "benchmarks.md",
      },
      {
        name: "Development & Contributor Guidelines",
        file: "development-guidelines.md",
      },
      {
        name: "Build Distribution, Bundling Strategy & Observability Audit",
        file: "distribution-audit.md",
      },
      {
        name: "Semantic Versioning & Changeset Workflow",
        file: "versioning-and-changesets.md",
      },
    ],
  },
];

// 4. Generate llms.txt
let llmsTxt = `# signals\n\n> An ultra-fast reactivity engine for the modern web with pure domain models, multi-framework adapters, and first-class observability.\n\n`;

for (const section of docsSections) {
  llmsTxt += `## ${section.title}\n\n`;
  for (const page of section.pages) {
    llmsTxt += `- [${page.name}](/${page.file})\n`;
  }
  llmsTxt += `\n`;
}

const llmsTxtPath = path.join(buildDir, "llms.txt");
fs.writeFileSync(llmsTxtPath, llmsTxt.trimEnd() + "\n", "utf-8");
console.log(`✅ llms.txt generated (${fs.statSync(llmsTxtPath).size} bytes)`);

// 5. Generate llms-full.txt
let llmsFullTxt = `# @banksia/signals Documentation\n\nAn ultra-fast reactivity engine for the modern web with pure domain models, multi-framework adapters (React, Lit, SolidJS, Vanilla DOM), and first-class observability.\n\n`;

function cleanMarkdownContent(raw) {
  let content = raw.replace(/^---[\s\S]*?---\n*/, "");
  return content.trim();
}

for (const section of docsSections) {
  llmsFullTxt += `\n================================================================================\n`;
  llmsFullTxt += `# SECTION: ${section.title}\n`;
  llmsFullTxt += `================================================================================\n\n`;

  for (const page of section.pages) {
    const filePath = path.join(docsDir, page.file);
    if (fs.existsSync(filePath)) {
      const rawContent = fs.readFileSync(filePath, "utf-8");
      const cleaned = cleanMarkdownContent(rawContent);
      llmsFullTxt += `\n--------------------------------------------------------------------------------\n`;
      llmsFullTxt += `## FILE: /${page.file} (${page.name})\n`;
      llmsFullTxt += `--------------------------------------------------------------------------------\n\n`;
      llmsFullTxt += cleaned + "\n\n";
    }
  }
}

const llmsFullTxtPath = path.join(buildDir, "llms-full.txt");
fs.writeFileSync(llmsFullTxtPath, llmsFullTxt.trimEnd() + "\n", "utf-8");
console.log(
  `✅ llms-full.txt generated (${fs.statSync(llmsFullTxtPath).size} bytes)`,
);

console.log("✨ Documentation post-build touchup complete!");
