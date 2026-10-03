/**
 * CLI command runner for ApiBench-Mini.
 */

const { runBenchmark } = require('../core');
const { chalk, renderTable } = require('./ansi');
const { renderLatencyHistogram, renderStatusCodeSummary } = require('./chart');

function parseArgs(args) {
  const parsed = {
    command: null,
    targetUrl: null,
    options: {
      requests: 100,
      concurrency: 10,
      method: 'GET',
      headers: {},
      body: null,
      timeoutMs: 10000,
      port: 3014,
      json: false,
      help: false,
      version: false
    }
  };

  const positional = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      parsed.options.help = true;
    } else if (arg === '--version' || arg === '-v') {
      parsed.options.version = true;
    } else if (arg === '--json') {
      parsed.options.json = true;
    } else if (arg === '--ui') {
      parsed.command = 'ui';
    } else if ((arg === '-n' || arg === '--requests') && args[i + 1]) {
      parsed.options.requests = parseInt(args[++i], 10);
    } else if ((arg === '-c' || arg === '--concurrency') && args[i + 1]) {
      parsed.options.concurrency = parseInt(args[++i], 10);
    } else if ((arg === '-m' || arg === '--method') && args[i + 1]) {
      parsed.options.method = args[++i].toUpperCase();
    } else if ((arg === '-d' || arg === '--data') && args[i + 1]) {
      parsed.options.body = args[++i];
    } else if ((arg === '-H' || arg === '--header') && args[i + 1]) {
      const headerStr = args[++i];
      const colonIdx = headerStr.indexOf(':');
      if (colonIdx !== -1) {
        const k = headerStr.slice(0, colonIdx).trim();
        const v = headerStr.slice(colonIdx + 1).trim();
        parsed.options.headers[k] = v;
      }
    } else if (arg === '--port' && args[i + 1]) {
      parsed.options.port = parseInt(args[++i], 10);
    } else if (!arg.startsWith('-')) {
      positional.push(arg);
    }
  }

  if (positional.length > 0) {
    if (['ui', 'studio', 'help'].includes(positional[0])) {
      parsed.command = positional[0];
      if (positional[1]) parsed.targetUrl = positional[1];
    } else {
      parsed.targetUrl = positional[0];
    }
  }

  return parsed;
}

function printHelp() {
  console.log(`
${chalk.bold(chalk.cyan('🚀 ApiBench-Mini'))} ${chalk.dim('v1.0.0')}
${chalk.dim('Zero-dependency API latency benchmark tool, RPS calculator & visual web studio.')}

${chalk.bold('USAGE:')}
  ${chalk.green('apibench')} ${chalk.yellow('<url>')} ${chalk.cyan('[options]')}

${chalk.bold('COMMANDS:')}
  ${chalk.yellow('<url>')}              Benchmark target HTTP/HTTPS URL
  ${chalk.yellow('ui, studio')}        Launch interactive Web Studio on localhost:3014
  ${chalk.yellow('help')}              Show this help guide

${chalk.bold('OPTIONS:')}
  ${chalk.cyan('-n, --requests <num>')}     Total request count (default: 100)
  ${chalk.cyan('-c, --concurrency <num>')}  Concurrent request workers (default: 10)
  ${chalk.cyan('-m, --method <method>')}    HTTP Method (GET, POST, PUT, DELETE, PATCH)
  ${chalk.cyan('-H, --header <key:val>')}   Custom HTTP Header (e.g. "Authorization: Bearer token")
  ${chalk.cyan('-d, --data <body>')}        Request payload body
  ${chalk.cyan('--json')}                  Output raw JSON benchmark report
  ${chalk.cyan('--port <number>')}         Port for Web Studio (default: 3014)
  ${chalk.cyan('-h, --help')}              Display help message

${chalk.bold('EXAMPLES:')}
  $ apibench https://api.github.com/users/octocat
  $ apibench https://httpbin.org/post -m POST -d '{"key":"val"}' -n 200 -c 20
  $ apibench ui --port 3014
`);
}

async function runCliBenchmark(targetUrl, options) {
  if (!targetUrl) {
    console.error(chalk.red('✖ Error: Target URL is required. Example: apibench https://api.example.com'));
    return 1;
  }

  console.log(`\n${chalk.bold(chalk.cyan('🚀 ApiBench-Mini Execution'))}`);
  console.log(`  Target:       ${chalk.bold(targetUrl)}`);
  console.log(`  Method:       ${chalk.yellow(options.method)}`);
  console.log(`  Requests:     ${options.requests}`);
  console.log(`  Concurrency:  ${options.concurrency}`);

  console.log(`\n${chalk.dim('Benchmarking in progress...')}`);

  const report = await runBenchmark(targetUrl, options);

  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
    return 0;
  }

  console.log(`\n${chalk.bold(chalk.green('✔ Benchmark Complete'))}\n`);

  // Key Metrics Table
  const headers = ['Metric', 'Value'];
  const rows = [
    [chalk.bold('Throughput (RPS)'), chalk.green(chalk.bold(`${report.rps} req/sec`))],
    [chalk.bold('Transfer Rate'), chalk.cyan(`${report.throughputKbps} KB/sec`)],
    [chalk.bold('Total Duration'), `${report.totalDurationMs} ms`],
    [chalk.bold('Successful / Failed'), `${chalk.green(report.successfulRequests)} / ${report.failedRequests > 0 ? chalk.red(report.failedRequests) : '0'}`],
    [chalk.bold('Min / Max Latency'), `${report.minMs} ms / ${report.maxMs} ms`],
    [chalk.bold('Mean Latency'), `${report.meanMs} ms (±${report.stdDevMs} ms)`],
    [chalk.bold('P50 (Median)'), chalk.green(`${report.p50Ms} ms`)],
    [chalk.bold('P95 Latency'), chalk.yellow(`${report.p95Ms} ms`)],
    [chalk.bold('P99 Latency'), chalk.red(`${report.p99Ms} ms`)]
  ];

  console.log(renderTable(headers, rows));

  // ASCII Latency Distribution Histogram
  console.log(renderLatencyHistogram(report));

  // Response Status Codes
  console.log(`\n${chalk.bold('Status Codes:')}`);
  console.log(renderStatusCodeSummary(report.statusCodes));
  console.log('');

  return 0;
}

function runUi(options) {
  const { startServer } = require('../server/server');
  startServer(options.port);
}

async function execute(args = process.argv.slice(2)) {
  const { command, targetUrl, options } = parseArgs(args);

  if (options.version) {
    const pkg = require('../../package.json');
    console.log(`apibench-mini v${pkg.version}`);
    return 0;
  }

  if (options.help || command === 'help') {
    printHelp();
    return 0;
  }

  if (command === 'ui' || command === 'studio') {
    runUi(options);
    return 0;
  }

  return await runCliBenchmark(targetUrl || command, options);
}

module.exports = {
  execute,
  parseArgs
};
