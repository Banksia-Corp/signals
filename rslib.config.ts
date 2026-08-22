import { defineConfig } from "@rslib/core";

export default defineConfig({
  lib: [
    {
      format: "esm",
      syntax: ["node 18"],
      dts: true,
      entry: {
        index: "./src/index.ts",
        react: "./src/react.ts",
        lit: "./src/lit.ts",
        solid: "./src/solid.ts",
        vanilla: "./src/vanilla.ts",
        devtools: "./src/devtools.ts",
      },
    },
  ],
});
