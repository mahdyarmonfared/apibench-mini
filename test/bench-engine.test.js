const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const { runBenchmark } = require('../src/core');

test('runBenchmark executes high-concurrency requests against target server', async () => {
  // Setup local target HTTP server
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', time: Date.now() }));
  });

  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const targetUrl = `http://127.0.0.1:${port}/test`;

  try {
    const report = await runBenchmark(targetUrl, {
      requests: 50,
      concurrency: 5,
      method: 'GET'
    });

    assert.equal(report.totalRequests, 50);
    assert.equal(report.successfulRequests, 50);
    assert.equal(report.failedRequests, 0);
    assert.ok(report.rps > 0);
    assert.ok(report.p50Ms >= 0);
    assert.ok(report.histogram.length > 0);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
