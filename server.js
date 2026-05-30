const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const port = Number(process.env.PORT || 5500);
const storePath = path.join(root, 'data', 'user-store.json');

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg'
};

function send(res, status, body, type) {
  res.writeHead(status, {
    'Content-Type': type || 'text/plain; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(body);
}

function readStore() {
  try {
    return JSON.parse(fs.readFileSync(storePath, 'utf8'));
  } catch (e) {
    return {};
  }
}

function writeStore(data) {
  fs.mkdirSync(path.dirname(storePath), { recursive: true });
  fs.writeFileSync(storePath, JSON.stringify(data, null, 2));
}

function handleStore(req, res) {
  if (req.method === 'OPTIONS') return send(res, 204, '');
  if (req.method === 'GET') {
    return send(res, 200, JSON.stringify(readStore()), 'application/json; charset=utf-8');
  }
  if (req.method !== 'PUT') return send(res, 405, 'Method not allowed');

  let body = '';
  req.on('data', chunk => {
    body += chunk;
    if (body.length > 2_000_000) req.destroy();
  });
  req.on('end', () => {
    try {
      const data = JSON.parse(body || '{}');
      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        return send(res, 400, 'Store must be an object');
      }
      writeStore(data);
      send(res, 200, JSON.stringify({ ok: true }), 'application/json; charset=utf-8');
    } catch (e) {
      send(res, 400, 'Invalid JSON');
    }
  });
}

function serveStatic(req, res) {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  const relPath = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');
  const filePath = path.resolve(root, relPath);

  if (!filePath.startsWith(root)) return send(res, 403, 'Forbidden');

  fs.readFile(filePath, (err, data) => {
    if (err) return send(res, 404, 'Not found');
    send(res, 200, data, types[path.extname(filePath).toLowerCase()] || 'application/octet-stream');
  });
}

http.createServer((req, res) => {
  if ((req.url || '').split('?')[0] === '/api/store') return handleStore(req, res);
  serveStatic(req, res);
}).listen(port, '127.0.0.1', () => {
  console.log(`BrightSAT Trainer running at http://127.0.0.1:${port}`);
});
