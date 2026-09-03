import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
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

// 2. Recursively generate clean URL directory redirects for all TypeDoc HTML files
function createCleanUrlRedirects(dir) {
  let count = 0;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "index") {
        count += createCleanUrlRedirects(fullPath);
      }
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      const baseName = entry.name.slice(0, -5); // remove .html
      if (baseName === "index") {
        const indexSubdir = path.join(dir, "index");
        if (!fs.existsSync(indexSubdir)) {
          fs.mkdirSync(indexSubdir, { recursive: true });
        }
        const redirectHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta http-equiv="refresh" content="0; url=../" />
  <link rel="canonical" href="../" />
  <title>Redirecting to API Documentation...</title>
  <script>
    const targetUrl = "../" + window.location.search + window.location.hash;
    window.location.replace(targetUrl);
  </script>
</head>
<body>
  <p>Redirecting to <a href="../">API Documentation</a>...</p>
</body>
</html>
`;
        fs.writeFileSync(
          path.join(indexSubdir, "index.html"),
          redirectHtml,
          "utf-8",
        );
        count++;
      } else {
        const cleanDir = path.join(dir, baseName);
        if (!fs.existsSync(cleanDir)) {
          fs.mkdirSync(cleanDir, { recursive: true });
        }
        const targetFile = `../${entry.name}`;
        const redirectHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta http-equiv="refresh" content="0; url=${targetFile}" />
  <link rel="canonical" href="${targetFile}" />
  <title>Redirecting to ${baseName}...</title>
  <script>
    const targetUrl = "${targetFile}" + window.location.search + window.location.hash;
    window.location.replace(targetUrl);
  </script>
</head>
<body>
  <p>Redirecting to <a href="${targetFile}">${baseName}</a>...</p>
</body>
</html>
`;
        fs.writeFileSync(
          path.join(cleanDir, "index.html"),
          redirectHtml,
          "utf-8",
        );
        count++;
      }
    }
  }
  return count;
}

if (fs.existsSync(apiBuildDir)) {
  const redirectCount = createCleanUrlRedirects(apiBuildDir);
  console.log(
    `✅ Generated ${redirectCount} clean URL redirects in doc_build/api`,
  );
} else {
  console.warn("⚠️ Warning: doc_build/api directory not found.");
}

// 3. Validate TypeDoc Static Assets
const requiredApiAssets = [
  path.join(apiBuildDir, "index.html"),
  path.join(apiBuildDir, "assets/style.css"),
  path.join(apiBuildDir, "assets/main.js"),
];

let assetsValid = true;
for (const asset of requiredApiAssets) {
  if (!fs.existsSync(asset)) {
    console.warn(
      `⚠️ Warning: TypeDoc asset missing at ${path.relative(rootDir, asset)}`,
    );
    assetsValid = false;
  }
}
if (assetsValid) {
  console.log("✅ TypeDoc static bundle assets verified");
}

// 4. Validate LLM-Native Documentation Artifacts
const llmsTxtPath = path.join(buildDir, "llms.txt");
const llmsFullTxtPath = path.join(buildDir, "llms-full.txt");

if (fs.existsSync(llmsTxtPath)) {
  const llmsStats = fs.statSync(llmsTxtPath);
  console.log(`✅ llms.txt generated (${llmsStats.size} bytes)`);
} else {
  console.warn("⚠️ Warning: llms.txt was not found in doc_build");
}

if (fs.existsSync(llmsFullTxtPath)) {
  const llmsFullStats = fs.statSync(llmsFullTxtPath);
  console.log(`✅ llms-full.txt generated (${llmsFullStats.size} bytes)`);
} else {
  console.warn("⚠️ Warning: llms-full.txt was not found in doc_build");
}

console.log("✨ Documentation post-build touchup complete!");
