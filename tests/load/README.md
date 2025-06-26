# Load Testing for Agencies API

This directory contains load testing scripts for the GET /api/agencies endpoint to verify performance requirements:

- ✅ 95% of requests complete in < 100ms
- ✅ < 1% error rate under normal load
- ✅ Support for 100 concurrent users
- ✅ Stable performance with 1000+ agencies in database

## Available Load Tests

### 1. Simple Load Test (No Dependencies)

The easiest way to run load tests - uses only built-in Node.js modules.

```bash
# Run with default settings (100 users, 60 seconds)
node tests/load/simple-load-test.js

# Customize the test
CONCURRENT_USERS=50 TEST_DURATION=120 node tests/load/simple-load-test.js

# Test against production
BASE_URL=https://api.example.com node tests/load/simple-load-test.js
```

### 2. K6 Load Test (Advanced)

Professional load testing with detailed metrics and scenarios.

```bash
# Install k6 first
# macOS: brew install k6
# Windows: choco install k6
# Linux: see https://k6.io/docs/getting-started/installation

# Run the load test
k6 run tests/load/agencies-api.k6.js

# Run with custom base URL
k6 run -e BASE_URL=https://api.example.com tests/load/agencies-api.k6.js

# Run with HTML report
k6 run --out html=report.html tests/load/agencies-api.k6.js
```

### 3. Autocannon Load Test

High-performance HTTP benchmarking tool.

```bash
# Install autocannon
npm install -g autocannon

# Run the test
node tests/load/agencies-api.autocannon.js
```

## Test Scenarios

All load tests cover these scenarios:
- Fetching all agencies (no filters)
- Search by name
- Filter by single trade
- Filter by multiple trades
- Filter by state
- Combined filters (search + trade + state)
- Pagination with different page sizes

## Results

Test results are saved to `tests/load/results/` with timestamps:
- JSON files with detailed metrics
- Markdown summaries with recommendations
- Performance target validation

## Performance Targets

| Metric | Target | Description |
|--------|--------|-------------|
| P95 Response Time | < 100ms | 95% of requests must complete within 100ms |
| Error Rate | < 1% | Less than 1% of requests should fail |
| Throughput | > 100 req/s | Should handle at least 100 requests per second |
| Concurrent Users | 100 | Support 100 simultaneous users |

## Running Load Tests in CI/CD

Add to your GitHub Actions workflow:

```yaml
- name: Start API server
  run: npm run dev &
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}

- name: Wait for API
  run: npx wait-on http://localhost:3000/api/agencies

- name: Run load test
  run: node tests/load/simple-load-test.js
  env:
    CONCURRENT_USERS: 50
    TEST_DURATION: 30

- name: Upload results
  uses: actions/upload-artifact@v3
  with:
    name: load-test-results
    path: tests/load/results/
```

## Interpreting Results

### Good Performance
```
✅ 95th Percentile: 45ms
✅ Error Rate: 0.1%
✅ Throughput: 250 req/sec
```

### Needs Optimization
```
❌ 95th Percentile: 150ms
❌ Error Rate: 2.5%
⚠️  Throughput: 80 req/sec

Recommendations:
- Implement caching layer
- Optimize database queries
- Add connection pooling
- Review N+1 query patterns
```

## Troubleshooting

### "Connection refused" errors
- Ensure the API server is running
- Check the BASE_URL is correct
- Verify no firewall blocking

### High error rates
- Check database connection limits
- Monitor server memory usage
- Review error logs for details

### Slow response times
- Enable query logging to find slow queries
- Check database indexes
- Monitor CPU usage during tests
- Consider implementing caching

## Next Steps

After load testing:

1. **If targets are met**: 
   - Run tests in staging environment
   - Schedule regular performance testing
   - Set up monitoring alerts

2. **If targets are not met**:
   - Profile slow queries
   - Implement caching (Redis)
   - Optimize database indexes
   - Consider pagination limits
   - Add request queuing