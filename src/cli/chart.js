/**
 * Zero-dependency ASCII latency chart & histogram renderer for terminal report output.
 */

const { chalk } = require('./ansi');

function renderLatencyHistogram(stats) {
  const percentiles = [
    { label: 'P50 (Median)', value: stats.p50Ms, color: chalk.green },
    { label: 'P90',          value: stats.p90Ms, color: chalk.cyan },
    { label: 'P95',          value: stats.p95Ms, color: chalk.yellow },
    { label: 'P99',          value: stats.p99Ms, color: chalk.red },
    { label: 'Max Latency',  value: stats.maxMs, color: chalk.magenta }
  ];

  const maxVal = Math.max(...percentiles.map(p => p.value), 1);
  const maxBarLength = 30;

  const lines = [chalk.bold('\nLatency Distribution (ms):')];

  for (const p of percentiles) {
    const barLen = Math.max(1, Math.round((p.value / maxVal) * maxBarLength));
    const bar = '█'.repeat(barLen);
    const labelPadded = p.label.padEnd(14, ' ');
    const valStr = `${p.value} ms`.padStart(10, ' ');

    lines.push(`  ${labelPadded} │ ${p.color(bar)} ${chalk.dim(valStr)}`);
  }

  return lines.join('\n');
}

function renderStatusCodeSummary(statusCodes) {
  const entries = Object.entries(statusCodes || {});
  if (entries.length === 0) return chalk.dim('  No responses recorded.');

  const parts = entries.map(([code, count]) => {
    let color = chalk.green;
    if (code.startsWith('4')) color = chalk.yellow;
    if (code.startsWith('5') || code === 'ERR') color = chalk.red;
    return `${color(code)}: ${count}`;
  });

  return `  ${parts.join('  │  ')}`;
}

module.exports = {
  renderLatencyHistogram,
  renderStatusCodeSummary
};
