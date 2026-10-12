import { build } from "esbuild";
import { mkdir, cp, chmod } from "node:fs/promises";

await mkdir("dist", { recursive: true });
for (const format of ["esm", "cjs"]) {
  await build({
    entryPoints: ["src/index.js", "src/analysis.js", "src/allocation.js"],
    bundle: true,
    outdir: "dist",
    format,
    outExtension: { ".js": format === "cjs" ? ".cjs" : ".js" },
    platform: "browser",
    target: "es2022",
    minify: false,
    sourcemap: true,
    legalComments: "inline",
    banner: { js: "/*! nanohash | MIT | Bundles Nano ID where applicable; see THIRD_PARTY_NOTICES.md */" }
  });
}
await build({
  entryPoints: ["src/cli.js"],
  outfile: "dist/cli.js",
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node22",
  sourcemap: true,
  legalComments: "inline",
  banner: { js: "/*! nanohash | MIT | See THIRD_PARTY_NOTICES.md */" }
});
await cp("types", "dist", { recursive: true });
await chmod("dist/cli.js", 0o755);
console.log("Built ESM, CommonJS, CLI, source maps, and TypeScript declarations.");
