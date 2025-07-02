/**
 * Simple load test for agencies API
 * No external dependencies required - uses built-in Node.js modules
 *
 * Run with: node tests/load/simple-load-test.js
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const CONCURRENT_USERS = Math.min(
  Math.max(parseInt(process.env.CONCURRENT_USERS) || 100, 1),
  1000
);
const TEST_DURATION = Math.min(
  Math.max(parseInt(process.env.TEST_DURATION) || 60, 1),
  3600
); // Max 1 hour
const RESULTS_DIR = path.join(__dirname, 'results');

// Validate configuration
if (isNaN(CONCURRENT_USERS) || isNaN(TEST_DURATION)) {
  console.error(
    '❌ Invalid configuration: CONCURRENT_USERS and TEST_DURATION must be valid numbers'
  );
  process.exit(1);
}

// Log configuration with limits
console.log('Load Test Configuration:');
console.log(`- Base URL: ${BASE_URL}`);
console.log(`- Concurrent Users: ${CONCURRENT_USERS} (min: 1, max: 1000)`);
console.log(`- Test Duration: ${TEST_DURATION}s (min: 1s, max: 3600s)`);
console.log();

// Test scenarios
const scenarios = [
  { name: 'all_agencies', path: '/api/agencies' },
  { name: 'search', path: '/api/agencies?search=construction' },
  { name: 'single_trade', path: '/api/agencies?trades[]=electricians' },
  {
    name: 'multiple_trades',
    path: '/api/agencies?trades[]=electricians&trades[]=plumbers',
  },
  { name: 'state_filter', path: '/api/agencies?states[]=TX' },
  {
    name: 'combined',
    path: '/api/agencies?search=elite&trades[]=electricians&states[]=TX',
  },
  { name: 'pagination', path: '/api/agencies?limit=10&offset=20' },
];

// Metrics tracking
const metrics = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  responseTimes: [],
  errors: [],
  startTime: null,
  endTime: null,
};

// Parse URL once
const baseUrl = new URL(BASE_URL);
const client = baseUrl.protocol === 'https:' ? https : http;

async function makeRequest() {
  const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
  const startTime = Date.now();

  return new Promise((resolve) => {
    const options = {
      hostname: baseUrl.hostname,
      port: baseUrl.port || (baseUrl.protocol === 'https:' ? 443 : 80),
      path: scenario.path,
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      timeout: 30000, // 30 second timeout for load testing
    };

    const req = client.request(options, (res) => {
      let data = '';
      let dataSize = 0;
      const maxResponseSize = 1024 * 1024; // 1MB limit for safety during load testing
      let truncated = false;

      res.on('data', (chunk) => {
        dataSize += chunk.length;
        if (dataSize <= maxResponseSize) {
          data += chunk;
        } else if (!truncated) {
          truncated = true;
          console.warn(
            `⚠️  Response truncated at ${maxResponseSize} bytes for ${scenario.name}`
          );
        }
      });

      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        metrics.totalRequests++;
        metrics.responseTimes.push(responseTime);

        if (res.statusCode === 200) {
          metrics.successfulRequests++;

          // Log slow requests
          if (responseTime > 100) {
            console.log(
              `⚠️  Slow request: ${scenario.name} took ${responseTime}ms`
            );
          }
        } else {
          metrics.failedRequests++;

          // Parse response body for error details
          let errorDetails = '';
          try {
            const parsedData = JSON.parse(data);
            errorDetails =
              parsedData.error?.message || parsedData.message || '';
          } catch (e) {
            errorDetails = data.substring(0, 200); // First 200 chars of response
          }

          metrics.errors.push({
            scenario: scenario.name,
            status: res.statusCode,
            statusText: res.statusMessage,
            responseTime: responseTime,
            errorDetails: errorDetails,
            headers: res.headers,
            time: new Date().toISOString(),
          });
          console.error(
            `❌ Error: ${scenario.name} returned ${res.statusCode} - ${errorDetails}`
          );
        }

        resolve();
      });
    });

    req.on('error', (error) => {
      const responseTime = Date.now() - startTime;
      metrics.totalRequests++;
      metrics.failedRequests++;

      // Determine error type and add detailed information
      let errorType = 'NetworkError';
      if (error.code === 'ECONNREFUSED') {
        errorType = 'ConnectionRefused';
      } else if (error.code === 'ETIMEDOUT') {
        errorType = 'NetworkTimeout';
      } else if (error.code === 'ENOTFOUND') {
        errorType = 'DNSLookupFailed';
      }

      metrics.errors.push({
        scenario: scenario.name,
        errorType: errorType,
        errorCode: error.code,
        errorMessage: error.message,
        syscall: error.syscall,
        hostname: error.hostname,
        port: error.port,
        responseTime: responseTime,
        stack: error.stack,
        time: new Date().toISOString(),
      });
      console.error(
        `❌ Request error: ${errorType} - ${error.message} (${scenario.name})`
      );
      resolve();
    });

    req.on('timeout', () => {
      const responseTime = Date.now() - startTime;
      req.destroy();
      metrics.totalRequests++;
      metrics.failedRequests++;
      metrics.errors.push({
        scenario: scenario.name,
        errorType: 'RequestTimeout',
        errorMessage: `Request timed out after ${responseTime}ms`,
        timeout: options.timeout,
        responseTime: responseTime,
        time: new Date().toISOString(),
      });
      console.error(
        `❌ Timeout: ${scenario.name} timed out after ${responseTime}ms`
      );
      resolve();
    });

    req.end();
  });
}

async function runUser() {
  const endTime = metrics.startTime + TEST_DURATION * 1000;

  while (Date.now() < endTime) {
    await makeRequest();
    // Small random delay between requests (0-100ms)
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 100));
  }
}

/**
 * Verify API accessibility without affecting metrics
 * Used for initial health check before starting the load test
 */
async function verifyApiAccessibility() {
  const scenario = scenarios[0]; // Use the simple agencies list endpoint
  const baseUrl = new URL(BASE_URL);
  const client = baseUrl.protocol === 'https:' ? https : http;

  return new Promise((resolve, reject) => {
    const options = {
      hostname: baseUrl.hostname,
      port: baseUrl.port || (baseUrl.protocol === 'https:' ? 443 : 80),
      path: scenario.path,
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      timeout: 10000, // 10 second timeout for verification
    };

    const req = client.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve();
        } else {
          reject(
            new Error(
              `API returned status ${res.statusCode}: ${res.statusMessage}`
            )
          );
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('API verification timed out after 10 seconds'));
    });

    req.end();
  });
}

async function ensureResultsDir() {
  try {
    await fs.mkdir(RESULTS_DIR, { recursive: true });
  } catch (error) {
    // Only ignore EEXIST errors (directory already exists)
    if (error.code !== 'EEXIST') {
      console.error(`❌ Failed to create results directory: ${error.message}`);
      console.error(`   Path: ${RESULTS_DIR}`);
      console.error(`   Error code: ${error.code}`);

      // Handle specific error cases
      if (error.code === 'EACCES') {
        console.error(
          '   Permission denied. Check write permissions for the parent directory.'
        );
      } else if (error.code === 'ENOSPC') {
        console.error(
          '   No space left on device. Free up disk space and try again.'
        );
      }

      // Re-throw to prevent silent failures
      throw error;
    }
  }
}

function calculatePercentile(arr, percentile) {
  if (arr.length === 0) return 0;
  const sorted = arr.slice().sort((a, b) => a - b);

  // Calculate exact position using linear interpolation
  const pos = (percentile / 100) * (sorted.length - 1);
  const lower = Math.floor(pos);
  const upper = Math.ceil(pos);
  const weight = pos - lower;

  // If position is exact, return that value
  if (lower === upper) {
    return sorted[lower];
  }

  // Otherwise, interpolate between lower and upper values
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

function calculateStats() {
  const duration = (metrics.endTime - metrics.startTime) / 1000;
  const throughput = duration > 0 ? metrics.totalRequests / duration : 0;
  const errorRate =
    metrics.totalRequests > 0
      ? metrics.failedRequests / metrics.totalRequests
      : 0;

  return {
    duration,
    totalRequests: metrics.totalRequests,
    successfulRequests: metrics.successfulRequests,
    failedRequests: metrics.failedRequests,
    throughput: throughput.toFixed(2),
    errorRate: (errorRate * 100).toFixed(2),
    responseTimes: {
      min:
        metrics.responseTimes.length > 0
          ? Math.min(...metrics.responseTimes)
          : 0,
      max:
        metrics.responseTimes.length > 0
          ? Math.max(...metrics.responseTimes)
          : 0,
      avg:
        metrics.responseTimes.length > 0
          ? (
              metrics.responseTimes.reduce((a, b) => a + b, 0) /
              metrics.responseTimes.length
            ).toFixed(2)
          : '0',
      p50: calculatePercentile(metrics.responseTimes, 50),
      p90: calculatePercentile(metrics.responseTimes, 90),
      p95: calculatePercentile(metrics.responseTimes, 95),
      p99: calculatePercentile(metrics.responseTimes, 99),
    },
  };
}

async function saveResults(stats) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const resultFile = path.join(
    RESULTS_DIR,
    `simple-load-test_${timestamp}.json`
  );
  const summaryFile = path.join(
    RESULTS_DIR,
    `simple-load-test-summary_${timestamp}.md`
  );

  // Save raw results
  await fs.writeFile(
    resultFile,
    JSON.stringify(
      {
        config: {
          baseUrl: BASE_URL,
          concurrentUsers: CONCURRENT_USERS,
          duration: TEST_DURATION,
        },
        stats,
        errors: metrics.errors.slice(0, 100), // Limit error logs
      },
      null,
      2
    )
  );

  // Generate summary report
  let report = `# Load Test Results\n\n`;
  report += `**Date:** ${new Date().toISOString()}\n`;
  report += `**Base URL:** ${BASE_URL}\n`;
  report += `**Concurrent Users:** ${CONCURRENT_USERS}\n`;
  report += `**Duration:** ${TEST_DURATION} seconds\n\n`;

  report += `## Results Summary\n\n`;
  report += `- **Total Requests:** ${stats.totalRequests}\n`;
  report += `- **Successful:** ${stats.successfulRequests}\n`;
  report += `- **Failed:** ${stats.failedRequests}\n`;
  report += `- **Throughput:** ${stats.throughput} req/sec\n`;
  report += `- **Error Rate:** ${stats.errorRate}%\n\n`;

  report += `## Response Times\n\n`;
  report += `- **Min:** ${stats.responseTimes.min}ms\n`;
  report += `- **Average:** ${stats.responseTimes.avg}ms\n`;
  report += `- **50th percentile:** ${stats.responseTimes.p50}ms\n`;
  report += `- **90th percentile:** ${stats.responseTimes.p90}ms\n`;
  report += `- **95th percentile:** ${stats.responseTimes.p95}ms\n`;
  report += `- **99th percentile:** ${stats.responseTimes.p99}ms\n`;
  report += `- **Max:** ${stats.responseTimes.max}ms\n\n`;

  report += `## Performance Targets\n\n`;
  const p95Target = stats.responseTimes.p95 < 100;
  const errorTarget = parseFloat(stats.errorRate) < 1;

  report += `- ${p95Target ? '✅' : '❌'} 95% of requests < 100ms (actual: ${stats.responseTimes.p95}ms)\n`;
  report += `- ${errorTarget ? '✅' : '❌'} Error rate < 1% (actual: ${stats.errorRate}%)\n\n`;

  if (!p95Target || !errorTarget) {
    report += `## Recommendations\n\n`;
    if (!p95Target) {
      report += `- Response times exceed target. Consider:\n`;
      report += `  - Implementing caching (Redis)\n`;
      report += `  - Optimizing database queries\n`;
      report += `  - Adding database indexes\n`;
      report += `  - Implementing pagination limits\n`;
    }
    if (!errorTarget) {
      report += `- Error rate is high. Check for:\n`;
      report += `  - Database connection pool exhaustion\n`;
      report += `  - Memory leaks\n`;
      report += `  - Rate limiting issues\n`;
    }
  }

  await fs.writeFile(summaryFile, report);

  console.log(`\n📄 Results saved to:`);
  console.log(`   - JSON: ${resultFile}`);
  console.log(`   - Summary: ${summaryFile}`);
}

async function main() {
  console.log('🏁 Starting Simple Load Test for Agencies API');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Concurrent Users: ${CONCURRENT_USERS}`);
  console.log(`Test Duration: ${TEST_DURATION} seconds`);
  console.log('');

  // Ensure results directory exists
  await ensureResultsDir();

  // Verify API is accessible
  console.log('🔍 Verifying API accessibility...');
  try {
    await verifyApiAccessibility();
    console.log('✅ API is accessible\n');
  } catch (error) {
    console.error('❌ Cannot access API:', error.message);
    process.exit(1);
  }

  // Reset metrics
  metrics.totalRequests = 0;
  metrics.successfulRequests = 0;
  metrics.failedRequests = 0;
  metrics.responseTimes = [];
  metrics.errors = [];

  // Start the test
  console.log(
    `🚀 Starting load test with ${CONCURRENT_USERS} concurrent users...`
  );
  metrics.startTime = Date.now();

  // Create concurrent users
  const users = [];
  for (let i = 0; i < CONCURRENT_USERS; i++) {
    users.push(runUser());
  }

  // Show progress
  const progressInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - metrics.startTime) / 1000);
    const progress = ((elapsed / TEST_DURATION) * 100).toFixed(0);
    process.stdout.write(
      `\r⏱️  Progress: ${progress}% (${elapsed}/${TEST_DURATION}s) - Requests: ${metrics.totalRequests}`
    );
  }, 1000);

  // Wait for all users to complete
  await Promise.all(users);
  clearInterval(progressInterval);

  metrics.endTime = Date.now();
  console.log('\n\n✅ Load test completed!\n');

  // Calculate and display results
  const stats = calculateStats();

  console.log('📊 Results Summary:');
  console.log(`- Total Requests: ${stats.totalRequests}`);
  console.log(`- Successful: ${stats.successfulRequests}`);
  console.log(`- Failed: ${stats.failedRequests} (${stats.errorRate}%)`);
  console.log(`- Throughput: ${stats.throughput} req/sec`);
  console.log(`- Avg Response Time: ${stats.responseTimes.avg}ms`);
  console.log(`- 95th Percentile: ${stats.responseTimes.p95}ms`);
  console.log(`- 99th Percentile: ${stats.responseTimes.p99}ms`);

  // Check targets
  const p95Target = stats.responseTimes.p95 < 100;
  console.log(
    `\n${p95Target ? '✅' : '❌'} Performance Target Met: 95% < 100ms`
  );

  // Save results
  await saveResults(stats);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Test interrupted by user');
  metrics.endTime = Date.now();
  const stats = calculateStats();
  saveResults(stats).then(() => {
    process.exit(0);
  });
});

// Run the test
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
}
