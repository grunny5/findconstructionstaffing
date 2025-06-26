/**
 * Load test for GET /api/agencies endpoint
 * 
 * This test verifies the API performance under various load conditions:
 * - 100 concurrent users
 * - 1000+ agencies in database
 * - 95% of requests < 100ms
 * - No errors under normal load
 * 
 * Run with: k6 run tests/load/agencies-api.k6.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const apiResponseTime = new Trend('api_response_time');
const queryResponseTime = new Trend('query_response_time');

// Test configuration
export const options = {
  stages: [
    // Ramp up to 100 users over 2 minutes
    { duration: '2m', target: 100 },
    // Stay at 100 users for 5 minutes
    { duration: '5m', target: 100 },
    // Ramp down to 0 users over 2 minutes
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    // 95% of requests must complete below 100ms
    http_req_duration: ['p(95)<100'],
    // Error rate must be below 1%
    errors: ['rate<0.01'],
    // Average response time should be below 50ms
    'http_req_duration{type:api}': ['avg<50'],
  },
};

// Test scenarios
const scenarios = [
  // No filters - get all agencies
  { name: 'all_agencies', params: '' },
  // Search by name
  { name: 'search', params: '?search=construction' },
  // Filter by single trade
  { name: 'single_trade', params: '?trades[]=electricians' },
  // Filter by multiple trades
  { name: 'multiple_trades', params: '?trades[]=electricians&trades[]=plumbers' },
  // Filter by state
  { name: 'state_filter', params: '?states[]=TX' },
  // Combined filters
  { name: 'combined', params: '?search=elite&trades[]=electricians&states[]=TX' },
  // Pagination
  { name: 'pagination', params: '?limit=10&offset=20' },
  // Large page size
  { name: 'large_page', params: '?limit=100' },
];

// Environment configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_ENDPOINT = `${BASE_URL}/api/agencies`;

export function setup() {
  // Verify the API is accessible
  const res = http.get(API_ENDPOINT);
  if (res.status !== 200) {
    throw new Error(`API is not accessible. Status: ${res.status}`);
  }
  
  // Get initial agency count
  const data = res.json();
  console.log(`Initial setup - Total agencies: ${data.pagination.total}`);
  
  if (data.pagination.total < 1000) {
    console.warn(`WARNING: Only ${data.pagination.total} agencies in database. Test requires 1000+ for accurate results.`);
  }
  
  return { totalAgencies: data.pagination.total };
}

export default function (data) {
  // Select a random scenario
  const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
  const url = `${API_ENDPOINT}${scenario.params}`;
  
  // Add tags for better metrics grouping
  const params = {
    tags: {
      scenario: scenario.name,
      type: 'api',
    },
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'k6-load-test/1.0',
    },
  };
  
  // Make the request
  const res = http.get(url, params);
  
  // Track custom metrics
  apiResponseTime.add(res.timings.duration);
  
  // Check response
  const success = check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 100ms': (r) => r.timings.duration < 100,
    'response time < 200ms': (r) => r.timings.duration < 200,
    'has valid JSON': (r) => {
      try {
        const body = r.json();
        return body && body.data !== undefined;
      } catch (e) {
        return false;
      }
    },
    'has pagination info': (r) => {
      try {
        const body = r.json();
        return body.pagination && 
               body.pagination.total !== undefined &&
               body.pagination.limit !== undefined;
      } catch (e) {
        return false;
      }
    },
  });
  
  // Track errors
  errorRate.add(!success);
  
  // Log slow requests
  if (res.timings.duration > 100) {
    console.warn(`Slow request: ${scenario.name} took ${res.timings.duration}ms`);
  }
  
  // Log errors
  if (res.status !== 200) {
    console.error(`Error: ${scenario.name} returned status ${res.status}`);
  }
  
  // Small random delay between requests (0-100ms)
  sleep(Math.random() * 0.1);
}

export function handleSummary(data) {
  // Custom summary output
  const p95 = data.metrics.http_req_duration.values['p(95)'];
  const avgResponseTime = data.metrics.http_req_duration.values.avg;
  const errorRate = data.metrics.errors ? data.metrics.errors.values.rate : 0;
  
  console.log('\n=== Load Test Summary ===');
  console.log(`Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
  console.log(`95th Percentile: ${p95.toFixed(2)}ms`);
  console.log(`Error Rate: ${(errorRate * 100).toFixed(2)}%`);
  console.log(`Target Met: ${p95 < 100 ? '✅ YES' : '❌ NO'} (95% < 100ms)`);
  
  // Return the default summary plus our custom JSON report
  return {
    'stdout': JSON.stringify(data, null, 2),
    'summary.json': JSON.stringify({
      timestamp: new Date().toISOString(),
      metrics: {
        avgResponseTime: avgResponseTime,
        p95ResponseTime: p95,
        p99ResponseTime: data.metrics.http_req_duration.values['p(99)'],
        errorRate: errorRate,
        totalRequests: data.metrics.http_reqs.values.count,
        requestsPerSecond: data.metrics.http_reqs.values.rate,
      },
      thresholds: {
        p95Under100ms: p95 < 100,
        errorRateUnder1Percent: errorRate < 0.01,
        avgUnder50ms: avgResponseTime < 50,
      },
      scenarios: scenarios.map(s => ({
        name: s.name,
        // Would need to track per-scenario metrics for detailed breakdown
      })),
    }, null, 2),
  };
}