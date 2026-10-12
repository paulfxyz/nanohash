import { build, version as esbuildVersion } from "esbuild";
import { gzipSync, brotliCompressSync, constants } from "node:zlib";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const check = process.argv.includes("--check");
const unknown = process.argv.slice(2).filter(value => value !== "--check");
if (unknown.length) throw new Error(`Unknown argument: ${unknown[0]}`);
if (Number(process.versions.node.split(".")[0]) !== 22) {
  throw new Error("Use Node 22 for the reference size report. Library runtime support remains Node 22+.");
}
const pkg = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
const nanoid = JSON.parse(await readFile(resolve(root, "node_modules/nanoid/package.json"), "utf8"));
const inputs = [
  ["lite", "Lite generator", 'export { nanohash } from "@paulfxyz/nanohash/lite";'],
  ["generator", "Generator factory", 'export { createGenerator } from "@paulfxyz/nanohash";'],
  ["shorthand", "nanohash() shorthand", 'export { nanohash } from "@paulfxyz/nanohash";'],
  ["analysis", "Analysis entry point", 'export * from "@paulfxyz/nanohash/analysis";'],
  ["allocation", "Allocation entry point", 'export * from "@paulfxyz/nanohash/allocation";'],
  ["toolkit", "Full toolkit (root API)", 'export * from "@paulfxyz/nanohash";'],
  ["nanoid-default", "Nano ID default primitive", 'export { nanoid } from "nanoid";'],
  ["nanoid-base36", "Nano ID Base36 / 8 primitive", 'import { customAlphabet } from "nanoid"; export const generate = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 8);']
];

const cases = [];
for (const [id, label, entry] of inputs) {
  const output = await build({
    stdin: { contents: entry, resolveDir: root, sourcefile: "size-entry.js" },
    bundle: true,
    minify: true,
    treeShaking: true,
    format: "esm",
    platform: "browser",
    target: "es2022",
    write: false,
    legalComments: "none",
    sourcemap: false
  });
  const bytes = output.outputFiles[0].contents;
  cases.push({
    id, label, entry,
    minifiedBytes: bytes.byteLength,
    gzipBytes: gzipSync(bytes, { level: 9 }).byteLength,
    brotliBytes: brotliCompressSync(bytes, {
      params: { [constants.BROTLI_PARAM_QUALITY]: 11 }
    }).byteLength
  });
}

const fingerprint = createHash("sha256");
for (const filename of ["dist/index.js", "dist/lite.js", "dist/analysis.js", "dist/allocation.js"]) {
  fingerprint.update(filename).update(await readFile(resolve(root, filename)));
}
const report = {
  package: pkg.name,
  packageVersion: pkg.version,
  sourceSha256: fingerprint.digest("hex"),
  toolchain: {
    nodeMajor: 22,
    esbuild: esbuildVersion,
    nanoid: nanoid.version,
    platform: "browser",
    format: "esm",
    target: "es2022",
    minify: true,
    treeShaking: true,
    sourceMaps: false,
    legalComments: "none",
    gzipLevel: 9,
    brotliQuality: 11
  },
  rawDistribution: {
    esmBytes: (await readFile(resolve(root, "dist/index.js"))).byteLength,
    commonjsBytes: (await readFile(resolve(root, "dist/index.cjs"))).byteLength,
    liteEsmBytes: (await readFile(resolve(root, "dist/lite.js"))).byteLength,
    liteCommonjsBytes: (await readFile(resolve(root, "dist/lite.cjs"))).byteLength
  },
  budgets: { liteGzipBytes: 750 },
  exclusions: [
    "This is browser JavaScript transfer size, not npm tarball or installed size.",
    "CLI, declarations, source maps, docs, fonts, screenshots, and HTTP headers are excluded.",
    "The bundled Nano ID code IS included where used; this is not wrapper-only sizing.",
    "License comments are excluded from this benchmark; required notices remain in the distribution.",
    `The upstream Nano ID reference is version ${nanoid.version}, not the historical nanoid-cjs fork.`,
    "Compressed sizes are approximations of transfer cost; server and bundler settings may differ."
  ],
  cases
};

const n = value => value.toLocaleString("en-US");
const lite = cases.find(item => item.id === "lite");
const generator = cases.find(item => item.id === "generator");
const toolkit = cases.find(item => item.id === "toolkit");
if (lite.gzipBytes > report.budgets.liteGzipBytes) {
  throw new Error(`Lite exceeds its ${report.budgets.liteGzipBytes}-byte min+gzip budget: ${lite.gzipBytes} bytes.`);
}
const badge = (label, bytes) => `  <a href="docs/bundle-size.md"><img alt="${label}: ${n(bytes)} bytes, minified and gzipped" src="https://img.shields.io/badge/${encodeURIComponent(label).replaceAll("-", "--")}-${encodeURIComponent(`${n(bytes)} B`)}-354b32?style=flat-square"></a>`;
const badges = [
  '<p align="center">',
  badge("lite min+gzip", lite.gzipBytes),
  badge("generator min+gzip", generator.gzipBytes),
  badge("browser API min+gzip", toolkit.gzipBytes),
  '  <a href="THIRD_PARTY_NOTICES.md"><img alt="Zero runtime npm dependencies; Nano ID code is bundled" src="https://img.shields.io/badge/runtime_npm_deps-0-5d7253?style=flat-square"></a>',
  '  <a href="#presets-and-alphabets"><img alt="Code lengths 4 to 15" src="https://img.shields.io/badge/code_length-4%E2%80%9315-5d7253?style=flat-square"></a>',
  "</p>"
].join("\n");
const summary = `The separate lite generator is **${n(lite.gzipBytes)} bytes minified + gzip**; the full generator factory is **${n(generator.gzipBytes)} bytes**, and the full toolkit's root browser API is **${n(toolkit.gzipBytes)} bytes**, under the same minified + gzip settings. These measurements include the bundled Nano ID implementation, not just a wrapper.`;
const table = [
  "| Import surface | Minified JS | Minified + gzip | Minified + Brotli |",
  "|---|---:|---:|---:|",
  ...cases.filter(item => !item.id.startsWith("nanoid")).map(item =>
    `| ${item.label} | ${n(item.minifiedBytes)} B | ${n(item.gzipBytes)} B | ${n(item.brotliBytes)} B |`
  )
].join("\n");
const comparison = [
  "| Same build settings, different scope | Minified JS | Minified + gzip |",
  "|---|---:|---:|",
  ...[cases.find(item => item.id === "nanoid-default"), cases.find(item => item.id === "nanoid-base36"), lite, generator, toolkit].map(item =>
    `| ${item.label} | ${n(item.minifiedBytes)} B | ${n(item.gzipBytes)} B |`
  )
].join("\n");

const pending = new Map();
pending.set("docs/size-report.json", `${JSON.stringify(report, null, 2)}\n`);
async function replaceBlock(filename, name, value) {
  const current = pending.get(filename) ?? await readFile(resolve(root, filename), "utf8");
  const start = `<!-- nanohash:${name}:start -->`;
  const end = `<!-- nanohash:${name}:end -->`;
  const first = current.indexOf(start);
  const last = current.indexOf(end);
  if (first === -1 || last < first) throw new Error(`Missing generated block ${name} in ${filename}`);
  pending.set(filename, current.slice(0, first + start.length) + `\n${value}\n` + current.slice(last));
}
await replaceBlock("README.md", "size-badges", badges);
await replaceBlock("README.md", "size-summary", summary);
await replaceBlock("README.md", "size-table", table);
await replaceBlock("docs/bundle-size.md", "size-summary", summary);
await replaceBlock("docs/bundle-size.md", "size-table", table);
await replaceBlock("docs/bundle-size.md", "baseline-table", comparison);
await replaceBlock("docs/lite.md", "lite-size",
  `The lite-only browser bundle is **${n(lite.minifiedBytes)} bytes minified**, **${n(lite.gzipBytes)} bytes minified + gzip**, and **${n(lite.brotliBytes)} bytes minified + Brotli**. CI enforces a **${n(report.budgets.liteGzipBytes)}-byte minified + gzip ceiling** and fails if the implementation exceeds it.`
);

const stale = [];
for (const [filename, content] of pending) {
  if (check) {
    let existing = "";
    try { existing = await readFile(resolve(root, filename), "utf8"); } catch {}
    if (existing !== content) stale.push(filename);
  } else {
    await writeFile(resolve(root, filename), content);
  }
}
console.table(cases.map(({ label, minifiedBytes, gzipBytes, brotliBytes }) =>
  ({ surface: label, minifiedBytes, gzipBytes, brotliBytes })
));
if (stale.length) {
  throw new Error(`Size documentation is stale: ${stale.join(", ")}. Run npm run size on Node 22 and commit the results.`);
}
console.log(check ? "Size report, README figures, and badges match the current build." : "Updated size report, README figures, and badges.");
