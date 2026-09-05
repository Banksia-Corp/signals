#!/usr/bin/env node

/**
 * Automated Build Size Budget Validator
 *
 * Measures raw, Gzip, and Brotli sizes of built distribution artifacts across all
 * package subpath exports and core engine files, comparing them against defined budget thresholds.
 */

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");

/**
 * Budget configurations for package exports and core modules.
 * All sizes in bytes.
 */
const BUDGETS = [
  {
    name: "@banksia/signals (Core Index)",
    files: ["dist/index.js"],
    maxGzipBytes: 4200, // 4.2 kB standalone budget
    maxBrotliBytes: 3800, // 3.8 kB standalone budget
    description: "Core entrypoint re-exports",
  },
  {
    name: "@banksia/signals (Core Engine Closure)",
    files: [
      "dist/index.js",
      "dist/core/raw.js",
      "dist/core/signal.js",
      "dist/core/proxy.js",
      "dist/core/collections.js",
      "dist/core/computed.js",
      "dist/core/effect.js",
      "dist/core/scheduler.js",
      "dist/core/observability.js",
    ],
    maxGzipBytes: 6000, // 6.0 kB combined unminified core budget (< 3.9 kB minified)
    maxBrotliBytes: 5500, // 5.5 kB combined unminified core budget (< 3.5 kB minified)
    description:
      "Full core engine dependency closure (proxy, collections, observability, scheduler)",
  },
  {
    name: "@banksia/signals/react",
    files: ["dist/react.js"],
    maxGzipBytes: 1200, // 1.2 kB standalone budget
    maxBrotliBytes: 1000, // 1.0 kB standalone budget
    description:
      "React adapter (useReactive, observer, useSignal, useComputed)",
  },
  {
    name: "@banksia/signals/lit",
    files: ["dist/lit.js"],
    maxGzipBytes: 1000, // 1.0 kB standalone budget
    maxBrotliBytes: 800, // 0.8 kB standalone budget
    description: "Lit adapter (SignalsController)",
  },
  {
    name: "@banksia/signals/solid",
    files: ["dist/solid.js"],
    maxGzipBytes: 600, // 0.6 kB standalone budget
    maxBrotliBytes: 500, // 0.5 kB standalone budget
    description: "SolidJS bridge adapter (createSolidSignalBridge)",
  },
  {
    name: "@banksia/signals/vanilla",
    files: ["dist/vanilla.js"],
    maxGzipBytes: 600, // 0.6 kB standalone budget
    maxBrotliBytes: 500, // 0.5 kB standalone budget
    description: "Vanilla DOM & Text binding helpers (bindDOM, bindText)",
  },
  {
    name: "@banksia/signals/devtools",
    files: ["dist/devtools.js"],
    maxGzipBytes: 3500, // 3.5 kB standalone budget
    maxBrotliBytes: 3000, // 3.0 kB standalone budget
    description: "DevTools runtime bridge & Chrome MCP telemetry client",
  },
];

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(2)} kB`;
}

function calculateCompression(filePaths) {
  let combinedContent = "";
  let rawBytes = 0;

  for (const relPath of filePaths) {
    const fullPath = path.join(rootDir, relPath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath);
      rawBytes += content.length;
      combinedContent += "\n" + content.toString("utf-8");
    }
  }

  const buf = Buffer.from(combinedContent, "utf-8");
  const gzipBytes = zlib.gzipSync(buf, { level: 9 }).length;
  const brotliBytes = zlib.brotliCompressSync(buf, {
    params: {
      [zlib.constants.BROTLI_PARAM_QUALITY]: 11,
    },
  }).length;

  return { rawBytes, gzipBytes, brotliBytes };
}

function runSizeCheck() {
  console.log("\n📦 Running @banksia/signals Build Size Budget Gate...\n");

  if (!fs.existsSync(distDir)) {
    console.error(
      "❌ Error: dist/ directory not found. Run 'pnpm run build' before checking sizes.\n",
    );
    process.exit(1);
  }

  let hasFailure = false;
  const results = [];
  const markdownRows = [];

  for (const budget of BUDGETS) {
    let allFilesExist = true;
    for (const file of budget.files) {
      const fullPath = path.join(rootDir, file);
      if (!fs.existsSync(fullPath)) {
        console.error(`❌ Missing distribution entry file: ${file}`);
        allFilesExist = false;
        hasFailure = true;
      }
    }

    if (!allFilesExist) continue;

    const { rawBytes, gzipBytes, brotliBytes } = calculateCompression(
      budget.files,
    );

    const gzipPassed = gzipBytes <= budget.maxGzipBytes;
    const brotliPassed = brotliBytes <= budget.maxBrotliBytes;
    const passed = gzipPassed && brotliPassed;

    if (!passed) {
      hasFailure = true;
    }

    const gzipPercent = ((gzipBytes / budget.maxGzipBytes) * 100).toFixed(1);
    const brotliPercent = ((brotliBytes / budget.maxBrotliBytes) * 100).toFixed(
      1,
    );

    results.push({
      entry: budget.name,
      files:
        budget.files.length === 1
          ? budget.files[0]
          : `${budget.files.length} core files`,
      raw: formatBytes(rawBytes),
      gzip: `${formatBytes(gzipBytes)} / ${formatBytes(budget.maxGzipBytes)} (${gzipPercent}%)`,
      brotli: `${formatBytes(brotliBytes)} / ${formatBytes(budget.maxBrotliBytes)} (${brotliPercent}%)`,
      status: passed ? "✅ PASS" : "❌ FAIL",
    });

    markdownRows.push(
      `| \`${budget.name}\` | \`${budget.files.length === 1 ? budget.files[0] : `${budget.files.length} core files`}\` | ${formatBytes(rawBytes)} | ${formatBytes(gzipBytes)} / ${formatBytes(budget.maxGzipBytes)} (${gzipPercent}%) | ${formatBytes(brotliBytes)} / ${formatBytes(budget.maxBrotliBytes)} (${brotliPercent}%) | ${passed ? "✅ PASS" : "❌ FAIL"} |`,
    );
  }

  console.table(results);

  // Write GitHub Actions Step Summary if running in CI
  if (process.env.GITHUB_STEP_SUMMARY) {
    const summaryMd = `### 📦 Build Size Budget Gate Results

| Subpath Export | Target Files | Raw Size | Gzip / Budget | Brotli / Budget | Status |
| :--- | :--- | :---: | :---: | :---: | :---: |
${markdownRows.join("\n")}

${hasFailure ? "❌ **Build size budget exceeded! Please inspect bundle sizes.**" : "✅ **All subpath exports within budget thresholds.**"}
`;
    try {
      fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summaryMd + "\n");
    } catch (e) {
      console.warn("Could not write to GITHUB_STEP_SUMMARY:", e.message);
    }
  }

  if (hasFailure) {
    console.error(
      "\n❌ Build size budget check failed: One or more entrypoints exceeded their threshold.\n",
    );
    process.exit(1);
  } else {
    console.log("\n✅ All entrypoints passed build size budget checks!\n");
  }
}

runSizeCheck();
