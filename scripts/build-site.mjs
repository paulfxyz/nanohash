import { cp, mkdir } from "node:fs/promises";
import { build } from "esbuild";

await mkdir(".site/assets", { recursive: true });
for (const file of ["index.html", "base.css", "style.css", "brand-card.html"]) {
  await cp(`site/${file}`, `.site/${file}`);
}
await cp("assets/icon.svg", ".site/assets/icon.svg");
await build({
  entryPoints: ["site/app.js"],
  outfile: ".site/app.js",
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2022",
  minify: true,
  legalComments: "inline"
});
console.log("Built static playground in .site/");
