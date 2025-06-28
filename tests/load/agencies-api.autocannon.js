/**
 * Load test for agencies API using autocannon
 * 
 * Run with: node tests/load/agencies-api.autocannon.js
 */

const autocannon = require('autocannon');
const fs = require('fs').promises;
const path = require('path');

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_ENDPOINT = `${BASE_URL}/api/agencies`;
const RESULTS_DIR = path.join(__dirname, 'results');

// Test scenarios
const scenarios = [
  { name: 'all_agencies', path: '' },
  { name: 'search', path: '?search=construction' },
  { name: 'single_trade', path: '?trades[]=electricians' },
  { name: 'multiple_trades', path: '?trades[]=electricians&trades[]=plumbers' },
  { name: 'state_filter', path: '?states[]=TX' },
  { name: 'combined', path: '?search=elite&trades[]=electricians&states[]=TX' },
  { name: 'pagination', path: '?limit=10&offset=20' },
];

// Test configurations
const testConfigs = {
  baseline: {
    connections: 1,
    duration: 30,
    title: 'Baseline Test (1 connection)',
  },
  load: {
    connections: 100,
    duration: 300, // 5 minutes
    title: 'Load Test (100 concurrent connections)',
  },
  stress: {
    connections: 400,
    duration: 180, // 3 minutes
    title: 'Stress Test (400 concurrent connections)',
  },
};

async function ensureResultsDir() {
  try {
    await fs.mkdir(RESULTS_DIR, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
}

function getRandomScenario() {
  return scenarios[Math.floor(Math.random() * scenarios.length)];
}

async function runTest(testName, config) {
  console.log(`\n🚀 Running ${config.title}...`);
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const resultFile = path.join(RESULTS_DIR, `${testName}_${timestamp}.json`);
  
  return new Promise((resolve, reject) => {
    const instance = autocannon({
      url: API_ENDPOINT,
      connections: config.connections,
      duration: config.duration,
      headers: {
        'Accept': 'application/json',
      },
      requests: [
        {
          method: 'GET',
          setupRequest: (req, context) => {
            // Randomly select a scenario for each request
            const scenario = getRandomScenario();
            req.path = `/api/agencies${scenario.path}`;
            return req;
          },
        },
      ],
      setupClient: (client) => {
        client.on('response', (statusCode, resBytes, responseTime) => {
          if (responseTime > 100) {
            console.warn(`⚠️  Slow request: ${responseTime}ms`);
          }
          if (statusCode !== 200) {
            console.error(`❌ Error response: ${statusCode}`);
          }
        });
      },
    }, async (err, result) => {
      if (err) {
        reject(err);
        return;
      }
      
      // Save results
      await fs.writeFile(resultFile, JSON.stringify(result, null, 2));
      
      // Display summary
      console.log('\n📊 Test Results:');
      console.log(`- Requests: ${result.requests.total}`);
      console.log(`- Throughput: ${result.throughput.average} req/sec`);
      console.log(`- Avg Latency: ${result.latency.mean}ms`);
      console.log(`- 95th percentile: ${result.latency.p95}ms`);
      console.log(`- 99th percentile: ${result.latency.p99}ms`);
      console.log(`- Errors: ${result.errors}`);
      console.log(`- Timeouts: ${result.timeouts}`);
      
      // Check if performance targets are met
      const targetMet = result.latency.p95 < 100;
      console.log(`\n${targetMet ? '✅' : '❌'} Performance Target: 95% < 100ms (actual: ${result.latency.p95}ms)`);
      
      resolve(result);
    });
    
    // Handle graceful shutdown
    process.once('SIGINT', () => {
      instance.stop();
    });
    
    // Start the test
    autocannon.track(instance, { renderProgressBar: true });
  });
}

async function generateSummaryReport(results) {
  const timestamp = new Date().toISOString();
  const summaryFile = path.join(RESULTS_DIR, `summary_${timestamp.replace(/[:.]/g, '-')}.md`);
  
  let report = `# Load Test Results Summary\n\n`;
  report += `**Date:** ${timestamp}\n`;
  report += `**Base URL:** ${BASE_URL}\n\n`;
  
  for (const [testName, result] of Object.entries(results)) {
    report += `## ${testConfigs[testName].title}\n\n`;
    report += `- **Total Requests:** ${result.requests.total}\n`;
    report += `- **Throughput:** ${result.throughput.average} req/sec\n`;
    report += `- **Average Latency:** ${result.latency.mean}ms\n`;
    report += `- **95th Percentile:** ${result.latency.p95}ms\n`;
    report += `- **99th Percentile:** ${result.latency.p99}ms\n`;
    report += `- **Errors:** ${result.errors}\n`;
    report += `- **Target Met (95% < 100ms):** ${result.latency.p95 < 100 ? '✅ YES' : '❌ NO'}\n\n`;
  }
  
  report += `## Recommendations\n\n`;
  
  if (results.load && results.load.latency.p95 >= 100) {
    report += `- ⚠️  Performance target not met under normal load\n`;
    report += `- Consider implementing caching strategies\n`;
    report += `- Review database query optimization\n`;
    report += `- Analyze slow query logs\n`;
  } else {
    report += `- ✅ Performance targets met under normal load\n`;
    report += `- Continue monitoring production performance\n`;
  }
  
  await fs.writeFile(summaryFile, report);
  console.log(`\n📄 Summary report saved to: ${summaryFile}`);
}

async function main() {
  try {
    // Ensure results directory exists
    await ensureResultsDir();
    
    console.log('🏁 Starting Agencies API Load Tests');
    console.log(`Base URL: ${BASE_URL}`);
    
    const results = {};
    
    // Run baseline test
    results.baseline = await runTest('baseline', testConfigs.baseline);
    
    // Wait a bit between tests
    console.log('\n⏳ Waiting 10 seconds before next test...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Run load test
    results.load = await runTest('load', testConfigs.load);
    
    // Ask about stress test
    console.log('\n❓ Stress test will put significant load on the server.');
    console.log('   Only run if you have proper monitoring in place.');
    // For automated testing, skip stress test
    // In interactive mode, you would prompt the user here
    
    // Generate summary report
    await generateSummaryReport(results);
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the tests
if (require.main === module) {
  main();
}