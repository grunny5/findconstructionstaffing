# API Monitoring and Performance

## Overview

The API includes built-in performance monitoring and metrics collection to ensure optimal performance and reliability.

## Performance Monitoring

Every API request is automatically monitored for:
- Response time
- Database query time
- Error rates
- Request metadata

### Performance Requirements

- 95% of requests must complete in under 100ms
- Database queries should complete in under 50ms
- Error rate should remain below 1%

## Metrics Endpoint

The `/api/monitoring/metrics` endpoint provides real-time performance data.

### Development Usage

```bash
# Get current metrics (no authentication required in development)
curl http://localhost:3000/api/monitoring/metrics
```

### Production Usage

In production, the metrics endpoint requires authentication:

```bash
# Set the MONITORING_API_KEY environment variable in your production environment
# Then include the API key in requests:
curl -H "x-monitoring-key: <YOUR_MONITORING_API_KEY>" https://your-domain.com/api/monitoring/metrics
```

### Response Format

```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production",
  "errorRates": {
    "/api/agencies": {
      "errorRate": 0.5,
      "totalRequests": 1000
    }
  },
  "performance": {
    "agencies": {
      "p50": 45,
      "p95": 98,
      "p99": 150,
      "avgResponseTime": 52,
      "avgQueryTime": 38,
      "requestCount": 1000
    }
  },
  "alerts": {
    "recent": [],
    "active": []
  }
}
```

## Load Testing

Several load testing tools are provided to verify performance:

### Using k6

```bash
npm run load-test:k6
```

### Using Autocannon

```bash
npm run load-test:autocannon
```

### Using Simple Load Test

```bash
npm run load-test:simple
```

## Security Configuration

### Environment Variables

Add these to your `.env.local` file:

```bash
# Optional: API key for monitoring metrics endpoint (production only)
MONITORING_API_KEY=<YOUR_SECURE_MONITORING_KEY_HERE>
```

### Vercel Configuration

When deploying to Vercel, add the `MONITORING_API_KEY` environment variable through the Vercel dashboard:

1. Go to your project settings
2. Navigate to Environment Variables
3. Add `MONITORING_API_KEY` with a secure value
4. This will protect your metrics endpoint in production

## Alerts

The performance monitoring system automatically logs warnings when:
- Response time exceeds 80ms (approaching the 100ms target)
- Query time exceeds 50ms (database query performance requirement)
- Error rates exceed thresholds

These alerts can be integrated with your monitoring infrastructure (e.g., Datadog, New Relic, CloudWatch).