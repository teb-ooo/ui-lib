// Serves dist/ with the Caddy-style SPA fallback (try_files {path} /index.html) and checks the built site.
import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const dist = resolve(dirname(fileURLToPath(import.meta.url)), "..", "dist");
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".woff2": "font/woff2" };

const server = createServer((req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url ?? "/", "http://x").pathname));
  let file = join(dist, path);
  if (!file.startsWith(dist) || !existsSync(file) || statSync(file).isDirectory()) file = join(dist, "index.html");
  res.setHeader("content-type", types[extname(file)] ?? "application/octet-stream");
  res.end(readFileSync(file));
});

const fail = (m) => {
  console.error(`verify-dist: ${m}`);
  server.close();
  process.exit(1);
};

await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}`;
const manifest = JSON.parse(readFileSync(join(dist, "manifest.json"), "utf8"));

for (const path of ["/", "/atoms/button", "/foundations/color?frame=1", ...manifest.entries.map((e) => e.path)]) {
  const r = await fetch(base + path);
  const html = await r.text();
  if (r.status !== 200 || !html.includes('<div id="root"></div>')) fail(`${path}: not the SPA shell (status ${r.status})`);
}

const shell = await (await fetch(`${base}/atoms/button`)).text();
const js = shell.match(/src="([^"]+\.js)"/)?.[1];
const css = shell.match(/href="([^"]+\.css)"/)?.[1];
if (!js || !css) fail("shell does not reference a bundle and a stylesheet");
const bundle = await (await fetch(base + js)).text();
for (const e of manifest.entries) {
  if (!bundle.includes(JSON.stringify(e.title)) && !bundle.includes(`"${e.title}"`)) fail(`bundle lacks story title "${e.title}"`);
}
const buttonProps = ["intent", "loading", "className"];
for (const p of buttonProps) if (!bundle.includes(`name:"${p}"`)) fail(`bundle lacks Button prop "${p}"`);
if ((await fetch(base + css)).status !== 200) fail("stylesheet not served");

console.log(`verify-dist ok: shell + SPA fallback for ${manifest.entries.length + 3} paths, ${manifest.entries.length} story titles and Button props in the bundle`);
server.close();
