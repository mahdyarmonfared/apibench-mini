/**
 * High-performance HTTP/HTTPS Benchmarking Engine.
 * Concurrency worker pool using native Node.js http/https modules.
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');
const { calculateStats } = require('./stats');

function sendSingleRequest(targetUrl, options = {}) {
  return new Promise((resolve) => {
    const urlObj = new URL(targetUrl);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;

    const reqOptions = {
      protocol: urlObj.protocol,
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: `${urlObj.pathname}${urlObj.search}`,
      method: (options.method || 'GET').toUpperCase(),
      headers: {
        'User-Agent': 'apibench-mini/1.0.0',
        'Accept': '*/*',
        ...(options.headers || {})
      }
    };

    let bodyData = null;
    if (options.body && ['POST', 'PUT', 'PATCH'].includes(reqOptions.method)) {
      bodyData = typeof options.body === 'object' ? JSON.stringify(options.body) : String(options.body);
      if (!reqOptions.headers['Content-Type']) {
        reqOptions.headers['Content-Type'] = 'application/json';
      }
      reqOptions.headers['Content-Length'] = Buffer.byteLength(bodyData);
    }

    const startTime = process.hrtime.bigint();

    const req = client.request(reqOptions, (res) => {
      let bytesReceived = 0;
      res.on('data', (chunk) => {
        bytesReceived += chunk.length;
      });

      res.on('end', () => {
        const endTime = process.hrtime.bigint();
        const latencyMs = Number(endTime - startTime) / 1e6;

        resolve({
          success: true,
          statusCode: res.statusCode,
          latencyMs,
          bytesReceived
        });
      });
    });

    req.on('error', (err) => {
      const endTime = process.hrtime.bigint();
      const latencyMs = Number(endTime - startTime) / 1e6;
      resolve({
        success: false,
        statusCode: 0,
        error: err.message,
        latencyMs,
        bytesReceived: 0
      });
    });

    req.setTimeout(options.timeoutMs || 10000, () => {
      req.destroy(new Error('Timeout'));
    });

    if (bodyData) {
      req.write(bodyData);
    }
    req.end();
  });
}

async function runBenchmark(targetUrl, options = {}) {
  const totalRequests = parseInt(options.requests || options.totalRequests || 100, 10);
  const concurrency = Math.min(parseInt(options.concurrency || 10, 10), totalRequests);

  const latencies = [];
  const statusCodes = {};
  let totalBytes = 0;
  let successfulRequests = 0;
  let failedRequests = 0;

  const benchStartTime = process.hrtime.bigint();
  let completedCount = 0;

  async function worker() {
    while (completedCount < totalRequests) {
      completedCount++;
      const res = await sendSingleRequest(targetUrl, options);

      if (res.success) {
        successfulRequests++;
        latencies.push(res.latencyMs);
        totalBytes += res.bytesReceived;
        const codeKey = String(res.statusCode);
        statusCodes[codeKey] = (statusCodes[codeKey] || 0) + 1;
      } else {
        failedRequests++;
        const codeKey = res.statusCode ? String(res.statusCode) : 'ERR';
        statusCodes[codeKey] = (statusCodes[codeKey] || 0) + 1;
      }
    }
  }

  const workers = [];
  for (let i = 0; i < concurrency; i++) {
    workers.push(worker());
  }

  await Promise.all(workers);

  const benchEndTime = process.hrtime.bigint();
  const totalDurationMs = Number(benchEndTime - benchStartTime) / 1e6;

  const stats = calculateStats(latencies, totalDurationMs, totalBytes, statusCodes);

  return {
    targetUrl,
    method: (options.method || 'GET').toUpperCase(),
    concurrency,
    successfulRequests,
    failedRequests,
    ...stats
  };
}

module.exports = {
  sendSingleRequest,
  runBenchmark
};
