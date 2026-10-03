const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const { createServer, isPathSafe } = require('../src/server/server');

test('isPathSafe correctly detects path traversal attempts', () => {
  const base = '/var/www/ui';
  assert.equal(isPathSafe(base, '/var/www/ui/index.html'), true);
  assert.equal(isPathSafe(base, '/var/www/ui/sub/file.js'), true);
  assert.equal(isPathSafe(base, '/var/www/etc/passwd'), false);
  assert.equal(isPathSafe(base, '/var/www/ui/../secret'), false);
});

test('HTTP server /api/health endpoint returns 200 OK', async () => {
  const app = createServer();
  await new Promise(resolve => app.listen(0, '127.0.0.1', resolve));
  const port = app.address().port;

  try {
    const res = await new Promise((resolve, reject) => {
      http.get(`http://127.0.0.1:${port}/api/health`, (response) => {
        let data = '';
        response.on('data', chunk => data += chunk);
        response.on('end', () => resolve({ statusCode: response.statusCode, data: JSON.parse(data) }));
      }).on('error', reject);
    });

    assert.equal(res.statusCode, 200);
    assert.equal(res.data.status, 'ok');
    assert.equal(res.data.name, 'apibench-mini');
  } finally {
    await new Promise(resolve => app.close(resolve));
  }
});
