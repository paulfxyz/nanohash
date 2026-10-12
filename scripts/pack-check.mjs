import { spawnSync } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import assert from "node:assert/strict";

function run(command, args, cwd = process.cwd()) {
  const result = spawnSync(command, args, { cwd, encoding: "utf8", env: process.env });
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")}\n${result.stdout}\n${result.stderr}`);
  return result.stdout;
}
const packed = JSON.parse(run("npm", ["pack", "--json", "--ignore-scripts"]))[0];
const archive = resolve(packed.filename);
const files = new Set(packed.files.map(file => file.path));
for (const file of ["dist/index.js", "dist/index.cjs", "dist/index.d.cts", "dist/lite.js", "dist/lite.cjs", "dist/lite.d.ts", "dist/lite.d.cts", "dist/analysis.d.cts", "dist/cli.js", "LICENSE", "THIRD_PARTY_NOTICES.md"]) {
  assert.ok(files.has(file), `Tarball missing ${file}`);
}
assert.ok(![...files].some(file => file.includes(".env") || file.startsWith("node_modules/")));
const directory = await mkdtemp(join(tmpdir(), "nanohash-consumer-"));
try {
  run("npm", ["install", "--ignore-scripts", "--no-audit", "--no-fund", archive], directory);
  const cjs = run(process.execPath, ["-e", "const n=require('@paulfxyz/nanohash'); if(!/^[a-z0-9]{8}$/.test(n.nanohash())) process.exit(1); console.log(n.analyzeSpace().space)"], directory);
  assert.equal(cjs.trim(), "2821109907456");
  const esm = run(process.execPath, ["--input-type=module", "-e", "import {nanohash} from '@paulfxyz/nanohash'; import {analyzeSpace} from '@paulfxyz/nanohash/analysis'; import {claimUnique} from '@paulfxyz/nanohash/allocation'; console.log(nanohash().length, analyzeSpace().length, typeof claimUnique)"], directory);
  assert.equal(esm.trim(), "8 8 function");
  const liteEsm = run(process.execPath, ["--input-type=module", "-e", "import {nanohash} from '@paulfxyz/nanohash/lite'; console.log(nanohash().length, nanohash(5,{allowTiny:true}).length)"], directory);
  assert.equal(liteEsm.trim(), "8 5");
  const liteCjs = run(process.execPath, ["-e", "const {nanohash}=require('@paulfxyz/nanohash/lite'); console.log(nanohash(15).length);"], directory);
  assert.equal(liteCjs.trim(), "15");
  const cli = run(process.execPath, ["node_modules/@paulfxyz/nanohash/dist/cli.js", "--count", "2", "--json"], directory);
  assert.equal(JSON.parse(cli).length, 2);
  console.log(`Verified clean ESM/CJS/CLI consumer install: ${packed.filename}`);
} finally {
  await rm(directory, { recursive: true, force: true });
}
