/**
 * HTTP REST Server and Web Studio static file host for ApiBench-Mini.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { runBenchmark } = require('../core');

const UI_DIR = path.join(__dirname, '../ui');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function isPathSafe(baseDir, targetPath) {
  const resolved = path.resolve(targetPath);
  return resolved === baseDir || resolved.startsWith(baseDir + path.sep);
}

function handleStaticFile(req, res) {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') {
    reqPath = '/index.html';
  }

  const filePath = path.join(UI_DIR, reqPath);

  if (!isPathSafe(UI_DIR, filePath)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden: Directory traversal blocked');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 2 * 1024 * 1024) { // 2MB limit
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('Invalid JSON format'));
      }
    });
    req.on('error', reject);
  });
}

function createServer() {
  return http.createServer(async (req, res) => {
    // CORS Headers for API flexibility
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const urlPath = req.url.split('?')[0];

    // REST API Endpoints
    if (urlPath === '/api/bench' && req.method === 'POST') {
      try {
        const payload = await parseJsonBody(req);
        const { targetUrl, requests = 100, concurrency = 10, method = 'GET', headers = {}, body = null, timeoutMs = 10000 } = payload;

        if (!targetUrl) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Target URL is required' }));
          return;
        }

        const report = await runBenchmark(targetUrl, {
          requests: Number(requests),
          concurrency: Number(concurrency),
          method,
          headers,
          body,
          timeoutMs: Number(timeoutMs)
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(report));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }

    if (urlPath === '/api/health' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', name: 'apibench-mini', version: '1.0.0' }));
      return;
    }

    // Static Assets
    if (req.method === 'GET') {
      handleStaticFile(req, res);
      return;
    }

    res.writeHead(405, { 'Content-Type': 'text/plain' });
    res.end('Method Not Allowed');
  });
}

function startServer(port = 3014) {
  const server = createServer();
  server.listen(port, () => {
    console.log(`\n🚀 ApiBench-Mini Web Studio running at: http://localhost:${port}`);
    console.log(`Press Ctrl+C to stop.\n`);
  });
  return server;
}

module.exports = {
  createServer,
  startServer,
  isPathSafe
};
