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
const CONCURRENT_USERS = parseInt(process.env.CONCURRENT_USERS) || 100;
const TEST_DURATION = parseInt(process.env.TEST_DURATION) || 60; // seconds
const RESULTS_DIR = path.join(__dirname, 'results');

// Test scenarios
const scenarios = [
  { name: 'all_agencies', path: '/api/agencies' },
  { name: 'search', path: '/api/agencies?search=construction' },
  { name: 'single_trade', path: '/api/agencies?trades[]=electricians' },
  { name: 'multiple_trades', path: '/api/agencies?trades[]=electricians&trades[]=plumbers' },
  { name: 'state_filter', path: '/api/agencies?states[]=TX' },
  { name: 'combined', path: '/api/agencies?search=elite&trades[]=electricians&states[]=TX' },
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
        'Accept': 'application/json',
      },
      timeout: 5000, // 5 second timeout
    };
    
    const req = client.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        metrics.totalRequests++;
        metrics.responseTimes.push(responseTime);
        
        if (res.statusCode === 200) {
          metrics.successfulRequests++;
          
          // Log slow requests
          if (responseTime > 100) {
            console.log(`⚠️  Slow request: ${scenario.name} took ${responseTime}ms`);
          }
        } else {
          metrics.failedRequests++;
          metrics.errors.push({
            scenario: scenario.name,
            status: res.statusCode,
            time: new Date().toISOString(),
          });
          console.error(`❌ Error: ${scenario.name} returned ${res.statusCode}`);
        }
        
        resolve();
      });
    });
    
    req.on('error', (error) => {
      metrics.totalRequests++;
      metrics.failedRequests++;
      metrics.errors.push({
        scenario: scenario.name,
        error: error.message,
        time: new Date().toISOString(),
      });
      console.error(`❌ Request error: ${error.message}`);
      resolve();
    });
    
    req.on('timeout', () => {
      req.destroy();
      metrics.totalRequests++;
      metrics.failedRequests++;
      metrics.errors.push({
        scenario: scenario.name,
        error: 'Timeout',
        time: new Date().toISOString(),
      });
      resolve();
    });
    
    req.end();
  });
}

async function runUser() {
  const endTime = metrics.startTime + (TEST_DURATION * 1000);
  
  while (Date.now() < endTime) {
    await makeRequest();
    // Small random delay between requests (0-100ms)
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
  }
}

async function ensureResultsDir() {
  try {
    await fs.mkdir(RESULTS_DIR, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
}

function calculatePercentile(arr, percentile) {
  if (arr.length === 0) return 0;
  const sorted = arr.slice().sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[index];
}

function calculateStats() {
  const duration = (metrics.endTime - metrics.startTime) / 1000;
  const throughput = metrics.totalRequests / duration;
  const errorRate = metrics.failedRequests / metrics.totalRequests;
  
  return {
    duration,
    totalRequests: metrics.totalRequests,
    successfulRequests: metrics.successfulRequests,
    failedRequests: metrics.failedRequests,
    throughput: throughput.toFixed(2),
    errorRate: (errorRate * 100).toFixed(2),
    responseTimes: {
      min: Math.min(...metrics.responseTimes),
      max: Math.max(...metrics.responseTimes),
      avg: (metrics.responseTimes.reduce((a, b) => a + b, 0) / metrics.responseTimes.length).toFixed(2),
      p50: calculatePercentile(metrics.responseTimes, 50),
      p90: calculatePercentile(metrics.responseTimes, 90),
      p95: calculatePercentile(metrics.responseTimes, 95),
      p99: calculatePercentile(metrics.responseTimes, 99),
    },
  };
}

async function saveResults(stats) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const resultFile = path.join(RESULTS_DIR, `simple-load-test_${timestamp}.json`);
  const summaryFile = path.join(RESULTS_DIR, `simple-load-test-summary_${timestamp}.md`);
  
  // Save raw results
  await fs.writeFile(resultFile, JSON.stringify({
    config: {
      baseUrl: BASE_URL,
      concurrentUsers: CONCURRENT_USERS,
      duration: TEST_DURATION,
    },
    stats,
    errors: metrics.errors.slice(0, 100), // Limit error logs
  }, null, 2));
  
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
    await makeRequest();
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
  console.log(`🚀 Starting load test with ${CONCURRENT_USERS} concurrent users...`);
  metrics.startTime = Date.now();
  
  // Create concurrent users
  const users = [];
  for (let i = 0; i < CONCURRENT_USERS; i++) {
    users.push(runUser());
  }
  
  // Show progress
  const progressInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - metrics.startTime) / 1000);
    const progress = (elapsed / TEST_DURATION * 100).toFixed(0);
    process.stdout.write(`\r⏱️  Progress: ${progress}% (${elapsed}/${TEST_DURATION}s) - Requests: ${metrics.totalRequests}`);
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
  console.log(`\n${p95Target ? '✅' : '❌'} Performance Target Met: 95% < 100ms`);
  
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
  main().catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
}