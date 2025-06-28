/**
 * Load test configuration for different test scenarios
 */

// Smoke test - verify basic functionality
export const smokeTest = {
  stages: [
    { duration: '30s', target: 5 },
    { duration: '30s', target: 5 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(99)<200'],
    errors: ['rate<0.05'],
  },
};

// Load test - normal expected load
export const loadTest = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<100'],
    errors: ['rate<0.01'],
  },
};

// Stress test - beyond normal capacity
export const stressTest = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '2m', target: 200 },
    { duration: '2m', target: 300 },
    { duration: '2m', target: 400 },
    { duration: '5m', target: 400 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    errors: ['rate<0.1'],
  },
};

// Spike test - sudden traffic spike
export const spikeTest = {
  stages: [
    { duration: '1m', target: 50 },
    { duration: '30s', target: 500 },
    { duration: '2m', target: 500 },
    { duration: '30s', target: 50 },
    { duration: '2m', target: 50 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    errors: ['rate<0.2'],
  },
};

// Soak test - sustained load over time
export const soakTest = {
  stages: [
    { duration: '5m', target: 100 },
    { duration: '30m', target: 100 },
    { duration: '5m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'],
    errors: ['rate<0.01'],
  },
};

// Performance baseline - single user
export const baselineTest = {
  vus: 1,
  iterations: 100,
  thresholds: {
    http_req_duration: ['p(95)<50', 'avg<30'],
    errors: ['rate=0'],
  },
};