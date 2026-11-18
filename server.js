const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const BLOCKED = new Set(["server.js", "package.json", "package-lock.json"]);

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".htm": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".eot": "application/vnd.ms-fontobject",
  ".txt": "text/plain; charset=utf-8"
};

function send(res, status, body) {
  res.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(body);
}

function serveFile(res, filePath) {
  const type = MIME_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream";
  fs.readFile(filePath, (err, data) => {
    if (err) return send(res, 500, "Internal Server Error");
    res.writeHead(200, { "Content-Type": type });
    res.end(data);
  });
}

http.createServer((req, res) => {
  let reqPath;
  try {
    reqPath = decodeURIComponent((req.url || "/").split("?")[0]);
  } catch (e) {
    return send(res, 400, "Bad Request");
  }
  const fullPath = path.join(ROOT, path.normalize(reqPath));
  if (!fullPath.startsWith(ROOT) || reqPath.split("/").some((p) => p.startsWith(".")) || BLOCKED.has(path.basename(fullPath))) {
    return send(res, 404, "Not Found");
  }

  fs.stat(fullPath, (err, stats) => {
    if (!err && stats.isDirectory()) {
      if (!reqPath.endsWith("/")) {
        res.writeHead(301, { Location: reqPath + "/" });
        return res.end();
      }
      for (const idx of ["index.html", "index.htm"]) {
        const candidate = path.join(fullPath, idx);
        if (fs.existsSync(candidate)) return serveFile(res, candidate);
      }
    }
    if (!err && stats.isFile()) return serveFile(res, fullPath);
    send(res, 404, "Not Found");
  });
}).listen(PORT, () => {
  console.log(`BemsSoft Landing Page running on port ${PORT}`);
});
