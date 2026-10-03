# 🚀 ApiBench-Mini

> High-concurrency HTTP/HTTPS API latency benchmark tool, RPS throughput calculator, and interactive Web Studio built with **100% zero external dependencies**.

![ApiBench-Mini Web Studio](https://raw.githubusercontent.com/mahdyarmonfared/apibench-mini/main/docs/preview.png)

## ⚡ Features

- 🏎️ **High Concurrency Engine**: Native HTTP/HTTPS worker pool for stress testing REST APIs.
- 📊 **Precision Percentile Metrics**: Accurate P50, P90, P95, and P99 latency distribution calculations.
- 📈 **ASCII Terminal Charts**: In-terminal latency distribution histogram & status code breakdown.
- 🌐 **Interactive Web Studio**: Clean web GUI dashboard running on `http://localhost:3014`.
- 📦 **Zero External Dependencies**: Built entirely using standard Node.js libraries (`http`, `https`, `url`, `fs`, `node:test`).
- 🛠️ **CLI & Programmatic API**: Use as an executable CLI binary or import directly into Node.js scripts.

---

## 🛠️ Installation

```bash
git clone https://github.com/mahdyarmonfared/apibench-mini.git
cd apibench-mini
npm link
```

---

## 🚀 Quick Start

### 1. Benchmark API via CLI

```bash
# Simple GET benchmark
apibench https://api.github.com/users/octocat

# High-concurrency POST benchmark with custom headers and payload
apibench https://httpbin.org/post \
  -m POST \
  -H "Authorization: Bearer mytoken" \
  -d '{"event":"stress_test"}' \
  -n 500 \
  -c 50
```

### 2. Output Raw JSON Report

```bash
apibench https://api.example.com --json
```

### 3. Launch Interactive Web Studio

```bash
apibench ui --port 3014
```

Open `http://localhost:3014` in your browser to configure and run benchmarks visually.

---

## 📖 CLI Usage

```text
USAGE:
  apibench <url> [options]

COMMANDS:
  <url>              Benchmark target HTTP/HTTPS URL
  ui, studio        Launch interactive Web Studio on localhost:3014
  help              Show help guide

OPTIONS:
  -n, --requests <num>     Total request count (default: 100)
  -c, --concurrency <num>  Concurrent request workers (default: 10)
  -m, --method <method>    HTTP Method (GET, POST, PUT, DELETE, PATCH)
  -H, --header <key:val>   Custom HTTP Header
  -d, --data <body>        Request payload body
  --json                  Output raw JSON benchmark report
  --port <number>         Port for Web Studio (default: 3014)
  -h, --help              Display help message
```

---

## 💻 Programmatic Usage

```javascript
const { runBenchmark } = require('apibench-mini');

async function main() {
  const report = await runBenchmark('https://httpbin.org/get', {
    requests: 200,
    concurrency: 20,
    method: 'GET'
  });

  console.log(`RPS: ${report.rps}`);
  console.log(`P95 Latency: ${report.p95Ms} ms`);
}

main();
```

---

## 🧪 Testing

Run the native test suite using Node.js test runner:

```bash
npm test
```

---

## 📄 License

[MIT](LICENSE) © Mahdyar Monfared
