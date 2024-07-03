import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/build.ts"],
  outDir: "dist",
  dts: true,
  // external: ["node-record-lpcm16", "wav-headers"],
});
