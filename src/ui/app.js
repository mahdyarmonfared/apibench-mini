document.addEventListener('DOMContentLoaded', () => {
  const benchForm = document.getElementById('benchForm');
  const loader = document.getElementById('loader');
  const resultsContainer = document.getElementById('resultsContainer');

  benchForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const targetUrl = document.getElementById('targetUrl').value.trim();
    const method = document.getElementById('method').value;
    const requests = parseInt(document.getElementById('requests').value, 10);
    const concurrency = parseInt(document.getElementById('concurrency').value, 10);
    const timeoutMs = parseInt(document.getElementById('timeout').value, 10);
    const headersRaw = document.getElementById('headers').value.trim();
    const body = document.getElementById('body').value.trim() || null;

    const headers = {};
    if (headersRaw) {
      headersRaw.split('\n').forEach(line => {
        const colonIdx = line.indexOf(':');
        if (colonIdx !== -1) {
          headers[line.slice(0, colonIdx).trim()] = line.slice(colonIdx + 1).trim();
        }
      });
    }

    // Show loader
    loader.classList.remove('hidden');
    resultsContainer.classList.add('hidden');

    try {
      const response = await fetch('/api/bench', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl,
          method,
          requests,
          concurrency,
          timeoutMs,
          headers,
          body
        })
      });

      const data = await response.json();

      if (!response.ok) {
        alert('Benchmark Error: ' + (data.error || 'Unknown error occurred'));
        return;
      }

      renderResults(data);
    } catch (err) {
      alert('Network error connecting to benchmark server: ' + err.message);
    } finally {
      loader.classList.add('hidden');
    }
  });

  function renderResults(report) {
    resultsContainer.classList.remove('hidden');

    // Primary Cards
    document.getElementById('metricRps').textContent = report.rps;
    document.getElementById('metricP50').textContent = report.p50Ms;
    document.getElementById('metricP95').textContent = report.p95Ms;
    document.getElementById('metricP99').textContent = report.p99Ms;

    // Overview Table
    document.getElementById('valDuration').textContent = `${report.totalDurationMs} ms`;
    document.getElementById('valSuccess').textContent = report.successfulRequests;
    document.getElementById('valFailed').textContent = report.failedRequests;
    document.getElementById('valKbps').textContent = `${report.throughputKbps} KB/s`;
    document.getElementById('valMinMax').textContent = `${report.minMs} / ${report.maxMs} ms`;
    document.getElementById('valMeanStd').textContent = `${report.meanMs} ms (±${report.stdDevMs} ms)`;

    // Status Codes
    const statusCodesList = document.getElementById('statusCodesList');
    statusCodesList.innerHTML = '';
    Object.entries(report.statusCodes || {}).forEach(([code, count]) => {
      const item = document.createElement('div');
      item.className = 'status-code-item';
      item.innerHTML = `<span>Status ${code}</span><strong>${count} reqs</strong>`;
      statusCodesList.appendChild(item);
    });

    // Histogram
    const histogram = document.getElementById('histogram');
    histogram.innerHTML = '';
    const histogramData = report.histogram || [];
    const maxCount = Math.max(...histogramData.map(h => h.count), 1);

    histogramData.forEach(bucket => {
      const row = document.createElement('div');
      row.className = 'bar-row';
      const pct = (bucket.count / maxCount) * 100;

      row.innerHTML = `
        <span class="bar-label">&lt; ${bucket.bucketMs} ms</span>
        <div class="bar-wrapper">
          <div class="bar-fill" style="width: ${pct}%"></div>
        </div>
        <span class="bar-count">${bucket.count}</span>
      `;
      histogram.appendChild(row);
    });
  }
});
