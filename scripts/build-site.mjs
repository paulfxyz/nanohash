import { cp, mkdir } from "node:fs/promises";
import { build } from "esbuild";

await mkdir(".site/assets", { recursive: true });
await mkdir(".site/lib", { recursive: true });
for (const file of ["index.html", "base.css", "style.css", "brand-card.html"]) {
  await cp(`site/${file}`, `.site/${file}`);
}
await cp("assets/icon.svg", ".site/assets/icon.svg");
await cp("LICENSE", ".site/LICENSE.txt");
await cp("THIRD_PARTY_NOTICES.md", ".site/THIRD_PARTY_NOTICES.txt");
await cp("dist/lite.js", ".site/lib/lite.js");
await cp("dist/lite.js.map", ".site/lib/lite.js.map");
await build({
  entryPoints: ["site/app.js"],
  outfile: ".site/app.js",
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2022",
  minify: true,
  legalComments: "inline",
  banner: { js: "/*! nanohash MIT; includes Nano ID MIT. See LICENSE.txt and THIRD_PARTY_NOTICES.txt. */" }
});
console.log("Built static playground in .site/");
