/**
 * Statistical calculator for latency percentiles, throughput, error rates, and histogram.
 */

function calculatePercentile(sortedValues, p) {
  if (!sortedValues || sortedValues.length === 0) return 0;
  if (sortedValues.length === 1) return sortedValues[0];

  const rank = (p / 100) * (sortedValues.length - 1);
  const lowerIdx = Math.floor(rank);
  const upperIdx = Math.ceil(rank);
  const fraction = rank - lowerIdx;

  if (lowerIdx === upperIdx) return sortedValues[lowerIdx];
  return sortedValues[lowerIdx] + (sortedValues[upperIdx] - sortedValues[lowerIdx]) * fraction;
}

function generateHistogram(sortedLatencies, numBuckets = 5) {
  if (!sortedLatencies || sortedLatencies.length === 0) return [];
  const max = sortedLatencies[sortedLatencies.length - 1];
  const min = sortedLatencies[0];
  const range = max - min;

  if (range === 0) {
    return [{ bucketMs: Math.round(max), count: sortedLatencies.length }];
  }

  const step = range / numBuckets;
  const buckets = [];
  let currentMin = min;

  for (let i = 0; i < numBuckets; i++) {
    const nextMax = i === numBuckets - 1 ? max + 0.001 : currentMin + step;
    const count = sortedLatencies.filter(val => val >= currentMin && val < nextMax).length;
    buckets.push({
      bucketMs: Math.round(currentMin + step),
      count
    });
    currentMin = nextMax;
  }

  return buckets;
}

function calculateStats(latencies = [], totalDurationMs = 1, totalBytes = 0, statusCodes = {}) {
  const numericLatencies = latencies.map(item => typeof item === 'number' ? item : (item.latencyMs || 0));

  let successfulRequests = 0;
  let failedRequests = 0;

  const codeEntries = Object.entries(statusCodes);
  if (codeEntries.length > 0) {
    codeEntries.forEach(([code, count]) => {
      if (code.startsWith('2') || code.startsWith('3')) {
        successfulRequests += count;
      } else {
        failedRequests += count;
      }
    });
  } else {
    successfulRequests = numericLatencies.length;
    failedRequests = 0;
  }

  if (numericLatencies.length === 0) {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalDurationMs: 0,
      minMs: 0,
      maxMs: 0,
      meanMs: 0,
      stdDevMs: 0,
      p50Ms: 0,
      p90Ms: 0,
      p95Ms: 0,
      p99Ms: 0,
      rps: 0,
      throughputKbps: 0,
      statusCodes: {},
      histogram: []
    };
  }

  const sorted = [...numericLatencies].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, val) => acc + val, 0);
  const mean = sum / sorted.length;

  const min = sorted[0];
  const max = sorted[sorted.length - 1];

  const p50 = calculatePercentile(sorted, 50);
  const p90 = calculatePercentile(sorted, 90);
  const p95 = calculatePercentile(sorted, 95);
  const p99 = calculatePercentile(sorted, 99);

  // Standard deviation
  const variance = sorted.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / sorted.length;
  const stdDev = Math.sqrt(variance);

  const durationSec = totalDurationMs / 1000 || 0.001;
  const rps = sorted.length / durationSec;
  const throughputKbps = (totalBytes / 1024) / durationSec;
  const histogram = generateHistogram(sorted);

  return {
    totalRequests: sorted.length,
    successfulRequests,
    failedRequests,
    totalDurationMs: Math.round(totalDurationMs),
    minMs: parseFloat(min.toFixed(2)),
    maxMs: parseFloat(max.toFixed(2)),
    meanMs: parseFloat(mean.toFixed(2)),
    stdDevMs: parseFloat(stdDev.toFixed(2)),
    p50Ms: parseFloat(p50.toFixed(2)),
    p90Ms: parseFloat(p90.toFixed(2)),
    p95Ms: parseFloat(p95.toFixed(2)),
    p99Ms: parseFloat(p99.toFixed(2)),
    rps: parseFloat(rps.toFixed(2)),
    throughputKbps: parseFloat(throughputKbps.toFixed(2)),
    statusCodes,
    histogram
  };
}

module.exports = {
  calculatePercentile,
  generateHistogram,
  calculateStats
};
