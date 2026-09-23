// Tiny static server that behaves like Netlify: serves real files (including
// the pre-built pages) and falls back to app.html. Used by the browser tests.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(process.argv[2] || "dist");
const PORT = Number(process.argv[3] || 4321);
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".json": "application/json",
  ".xml": "application/xml",
  ".txt": "text/plain",
};

export function start(root = ROOT, port = PORT) {
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (req.method === "POST") {
      // Netlify Forms stand-in
      req.resume();
      return req.on("end", () => (res.writeHead(200), res.end("ok")));
    }
    let file = path.join(root, url);
    if (!file.startsWith(root)) return (res.writeHead(403), res.end());
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
    if (!fs.existsSync(file)) file = path.join(root, "app.html");
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((r) => server.listen(port, () => r(server)));
}

if (import.meta.url === `file://${process.argv[1]}`)
  start().then(() => console.log(`serving ${ROOT} on http://localhost:${PORT}`));
