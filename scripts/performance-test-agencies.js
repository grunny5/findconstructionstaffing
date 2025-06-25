#!/usr/bin/env node

/**
 * Performance Testing Script for Agencies API Endpoint
 * 
 * Tests various query combinations to ensure < 100ms response times
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

// Configuration
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const NUM_REQUESTS = 10; // Number of requests per test scenario
const TARGET_RESPONSE_TIME = 100; // Target response time in ms

// Test scenarios
const TEST_SCENARIOS = [
  {
    name: 'Basic request (no filters)',
    path: '/api/agencies',
    description: 'Retrieve agencies with default pagination'
  },
  {
    name: 'Search filter only',
    path: '/api/agencies?search=construction',
    description: 'Full-text search across name and description'
  },
  {
    name: 'Single trade filter',
    path: '/api/agencies?trades[]=electricians',
    description: 'Filter by one trade specialty'
  },
  {
    name: 'Multiple trade filters',
    path: '/api/agencies?trades[]=electricians&trades[]=plumbers&trades[]=carpenters',
    description: 'Filter by multiple trades (OR logic)'
  },
  {
    name: 'Single state filter',
    path: '/api/agencies?states[]=TX',
    description: 'Filter by one state'
  },
  {
    name: 'Multiple state filters',
    path: '/api/agencies?states[]=TX&states[]=CA&states[]=NY&states[]=FL',
    description: 'Filter by multiple states (OR logic)'
  },
  {
    name: 'Combined filters (search + trade)',
    path: '/api/agencies?search=elite&trades[]=electricians',
    description: 'Combine search with trade filter'
  },
  {
    name: 'Combined filters (search + state)',
    path: '/api/agencies?search=construction&states[]=TX',
    description: 'Combine search with state filter'
  },
  {
    name: 'All filters combined',
    path: '/api/agencies?search=staffing&trades[]=electricians&trades[]=plumbers&states[]=TX&states[]=CA',
    description: 'Search + multiple trades + multiple states'
  },
  {
    name: 'Pagination (small limit)',
    path: '/api/agencies?limit=5',
    description: 'Small page size'
  },
  {
    name: 'Pagination (large limit)',
    path: '/api/agencies?limit=100',
    description: 'Maximum page size'
  },
  {
    name: 'Pagination with offset',
    path: '/api/agencies?limit=20&offset=100',
    description: 'Deep pagination'
  },
  {
    name: 'All filters with pagination',
    path: '/api/agencies?search=construction&trades[]=electricians&states[]=TX&limit=10&offset=20',
    description: 'Complex query with all features'
  }
];

// HTTP request helper
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const parsedUrl = new URL(url);
    const module = parsedUrl.protocol === 'https:' ? https : http;

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    };

    const req = module.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        try {
          const jsonData = JSON.parse(data);
          resolve({
            success: true,
            statusCode: res.statusCode,
            responseTime,
            dataSize: data.length,
            resultCount: jsonData.data ? jsonData.data.length : 0,
            totalCount: jsonData.pagination ? jsonData.pagination.total : 0,
            hasError: jsonData.error ? true : false,
            headers: res.headers
          });
        } catch (e) {
          resolve({
            success: false,
            statusCode: res.statusCode,
            responseTime,
            dataSize: data.length,
            error: 'Failed to parse JSON response'
          });
        }
      });
    });

    req.on('error', (err) => {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      reject({
        success: false,
        responseTime,
        error: err.message
      });
    });

    req.end();
  });
}

// Run performance test for a scenario
async function testScenario(scenario) {
  console.log(`\n📊 Testing: ${scenario.name}`);
  console.log(`   Path: ${scenario.path}`);
  console.log(`   Description: ${scenario.description}`);
  
  const results = [];
  const url = BASE_URL + scenario.path;
  
  // Warm-up request
  console.log('   Warming up...');
  try {
    await makeRequest(url);
  } catch (e) {
    console.error('   ❌ Warm-up failed:', e.error);
    return;
  }
  
  // Test requests
  console.log(`   Running ${NUM_REQUESTS} test requests...`);
  
  for (let i = 0; i < NUM_REQUESTS; i++) {
    try {
      const result = await makeRequest(url);
      results.push(result);
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (e) {
      console.error(`   ❌ Request ${i + 1} failed:`, e.error);
    }
  }
  
  // Calculate statistics
  if (results.length > 0) {
    const successfulResults = results.filter(r => r.success && r.statusCode === 200);
    
    if (successfulResults.length > 0) {
      const responseTimes = successfulResults.map(r => r.responseTime);
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const minResponseTime = Math.min(...responseTimes);
      const maxResponseTime = Math.max(...responseTimes);
      const medianResponseTime = responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length / 2)];
      
      const avgDataSize = successfulResults.reduce((sum, r) => sum + r.dataSize, 0) / successfulResults.length;
      const avgResultCount = successfulResults.reduce((sum, r) => sum + r.resultCount, 0) / successfulResults.length;
      const totalCount = successfulResults[0].totalCount || 0;
      
      console.log('\n   📈 Results:');
      console.log(`   ✅ Successful requests: ${successfulResults.length}/${results.length}`);
      console.log(`   ⏱️  Response times (ms):`);
      console.log(`      - Average: ${avgResponseTime.toFixed(2)}ms ${avgResponseTime > TARGET_RESPONSE_TIME ? '⚠️ ABOVE TARGET' : '✅'}`);
      console.log(`      - Median: ${medianResponseTime}ms`);
      console.log(`      - Min: ${minResponseTime}ms`);
      console.log(`      - Max: ${maxResponseTime}ms`);
      console.log(`   📦 Average response size: ${(avgDataSize / 1024).toFixed(2)} KB`);
      console.log(`   📊 Results: ${avgResultCount.toFixed(1)} items (${totalCount} total)`);
      
      // Check cache headers
      const cacheControl = successfulResults[0].headers['cache-control'];
      const hasEtag = !!successfulResults[0].headers['etag'];
      console.log(`   💾 Caching: ${cacheControl || 'Not set'} ${hasEtag ? '(ETag ✅)' : '(No ETag ❌)'}`);
      
      // Performance grade
      let grade = 'A';
      if (avgResponseTime > TARGET_RESPONSE_TIME) grade = 'B';
      if (avgResponseTime > TARGET_RESPONSE_TIME * 1.5) grade = 'C';
      if (avgResponseTime > TARGET_RESPONSE_TIME * 2) grade = 'D';
      if (avgResponseTime > TARGET_RESPONSE_TIME * 3) grade = 'F';
      
      console.log(`   🏆 Performance Grade: ${grade}`);
      
      return {
        scenario: scenario.name,
        avgResponseTime,
        medianResponseTime,
        minResponseTime,
        maxResponseTime,
        successRate: (successfulResults.length / results.length) * 100,
        avgDataSize,
        grade
      };
    } else {
      console.log('   ❌ No successful requests');
      return null;
    }
  }
}

// Main execution
async function runPerformanceTests() {
  console.log('🚀 Agencies API Performance Testing');
  console.log('=====================================');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Target Response Time: ${TARGET_RESPONSE_TIME}ms`);
  console.log(`Requests per scenario: ${NUM_REQUESTS}`);
  
  const allResults = [];
  
  // Test database connectivity first
  console.log('\n🔌 Testing API connectivity...');
  try {
    const testResult = await makeRequest(BASE_URL + '/api/agencies?limit=1');
    if (testResult.success && testResult.statusCode === 200) {
      console.log('✅ API is accessible');
    } else {
      console.error('❌ API returned error:', testResult.statusCode);
      return;
    }
  } catch (e) {
    console.error('❌ Cannot connect to API:', e.error);
    return;
  }
  
  // Run all test scenarios
  for (const scenario of TEST_SCENARIOS) {
    const result = await testScenario(scenario);
    if (result) {
      allResults.push(result);
    }
    
    // Delay between scenarios
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary report
  console.log('\n\n📊 PERFORMANCE TEST SUMMARY');
  console.log('=====================================');
  
  if (allResults.length > 0) {
    // Overall statistics
    const avgOverall = allResults.reduce((sum, r) => sum + r.avgResponseTime, 0) / allResults.length;
    const successRateOverall = allResults.reduce((sum, r) => sum + r.successRate, 0) / allResults.length;
    
    console.log('\n📈 Overall Performance:');
    console.log(`   Average Response Time: ${avgOverall.toFixed(2)}ms ${avgOverall > TARGET_RESPONSE_TIME ? '⚠️' : '✅'}`);
    console.log(`   Success Rate: ${successRateOverall.toFixed(1)}%`);
    
    // Scenario breakdown
    console.log('\n📋 Scenario Results:');
    console.log('   ' + '-'.repeat(80));
    console.log('   Scenario'.padEnd(40) + 'Avg (ms)'.padEnd(10) + 'Min (ms)'.padEnd(10) + 'Max (ms)'.padEnd(10) + 'Grade');
    console.log('   ' + '-'.repeat(80));
    
    allResults.forEach(result => {
      const name = result.scenario.length > 37 ? result.scenario.substring(0, 37) + '...' : result.scenario;
      console.log(
        '   ' + 
        name.padEnd(40) + 
        result.avgResponseTime.toFixed(2).padEnd(10) + 
        result.minResponseTime.toString().padEnd(10) + 
        result.maxResponseTime.toString().padEnd(10) + 
        result.grade
      );
    });
    
    // Identify slow queries
    const slowQueries = allResults.filter(r => r.avgResponseTime > TARGET_RESPONSE_TIME);
    if (slowQueries.length > 0) {
      console.log('\n⚠️  Slow Queries (> ' + TARGET_RESPONSE_TIME + 'ms):');
      slowQueries.forEach(r => {
        console.log(`   - ${r.scenario}: ${r.avgResponseTime.toFixed(2)}ms`);
      });
    }
    
    // Performance recommendations
    console.log('\n💡 Recommendations:');
    if (avgOverall > TARGET_RESPONSE_TIME) {
      console.log('   - Consider adding database query optimization');
      console.log('   - Implement response caching at application level');
      console.log('   - Add database connection pooling');
    }
    
    if (slowQueries.some(r => r.scenario.includes('All filters'))) {
      console.log('   - Complex queries may benefit from materialized views');
      console.log('   - Consider implementing cursor-based pagination for large offsets');
    }
    
    console.log('\n✅ Performance testing complete!');
  } else {
    console.log('❌ No test results collected');
  }
}

// Run tests
runPerformanceTests().catch(console.error);