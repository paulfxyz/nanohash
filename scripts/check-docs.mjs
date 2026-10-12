import { readdir, readFile, access } from "node:fs/promises";
import { resolve, dirname } from "node:path";

async function walk(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || ["node_modules", "dist", "test-results", "playwright-report"].includes(entry.name)) continue;
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) result.push(...await walk(path));
    else if (path.endsWith(".md")) result.push(path);
  }
  return result;
}
const errors = [];
let checked = 0;
for (const file of await walk(process.cwd())) {
  const content = await readFile(file, "utf8");
  const links = [...content.matchAll(/!?\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)].map(match => match[1]);
  links.push(...[...content.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/g)].map(match => match[1]));
  links.push(...[...content.matchAll(/<source\b[^>]*\bsrcset="([^"]+)"/g)].map(match => match[1]));
  links.push(...[...content.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)].map(match => match[1]));
  for (const link of links) {
    if (/^[a-z]+:/i.test(link) || link.startsWith("#")) continue;
    const target = resolve(dirname(file), decodeURIComponent(link.split("#")[0]));
    try { await access(target); checked++; }
    catch { errors.push(`${file}: missing ${link}`); }
  }
  if ((content.match(/^```/gm)?.length ?? 0) % 2 !== 0) errors.push(`${file}: unbalanced code fences`);
}
if (errors.length) throw new Error(errors.join("\n"));
console.log(`Verified ${checked} relative documentation and image links.`);
