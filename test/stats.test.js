const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateStats } = require('../src/core/stats');

test('calculateStats produces accurate percentile and throughput metrics', () => {
  const responses = [
    { statusCode: 200, latencyMs: 10, bytes: 100 },
    { statusCode: 200, latencyMs: 20, bytes: 100 },
    { statusCode: 200, latencyMs: 30, bytes: 100 },
    { statusCode: 200, latencyMs: 40, bytes: 100 },
    { statusCode: 200, latencyMs: 50, bytes: 100 },
    { statusCode: 200, latencyMs: 60, bytes: 100 },
    { statusCode: 200, latencyMs: 70, bytes: 100 },
    { statusCode: 200, latencyMs: 80, bytes: 100 },
    { statusCode: 200, latencyMs: 90, bytes: 100 },
    { statusCode: 500, latencyMs: 100, bytes: 100 }
  ];

  const statusCodes = { '200': 9, '500': 1 };
  const totalDurationMs = 1000; // 1 second
  const totalBytes = 1000;
  const stats = calculateStats(responses, totalDurationMs, totalBytes, statusCodes);

  assert.equal(stats.totalRequests, 10);
  assert.equal(stats.successfulRequests, 9);
  assert.equal(stats.failedRequests, 1);
  assert.equal(stats.minMs, 10);
  assert.equal(stats.maxMs, 100);
  assert.equal(stats.meanMs, 55);
  assert.equal(stats.p50Ms, 55);
  assert.equal(stats.p95Ms, 95.5);
  assert.equal(stats.p99Ms, 99.1);
  assert.equal(stats.rps, 10);
  assert.equal(stats.statusCodes['200'], 9);
  assert.equal(stats.statusCodes['500'], 1);
  assert.ok(stats.histogram.length > 0);
});

test('calculateStats handles empty responses gracefully', () => {
  const stats = calculateStats([], 1000);

  assert.equal(stats.totalRequests, 0);
  assert.equal(stats.successfulRequests, 0);
  assert.equal(stats.failedRequests, 0);
  assert.equal(stats.minMs, 0);
  assert.equal(stats.maxMs, 0);
  assert.equal(stats.meanMs, 0);
  assert.equal(stats.p50Ms, 0);
  assert.equal(stats.rps, 0);
});
