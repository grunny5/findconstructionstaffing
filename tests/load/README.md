# Load Testing for Agencies API

This directory contains load testing scripts for the GET /api/agencies endpoint to verify performance requirements:

- ✅ 95% of requests complete in < 100ms
- ✅ < 1% error rate under normal load
- ✅ Support for 100 concurrent users
- ✅ Stable performance with 1000+ agencies in database

## Quick Start

### Running the Comprehensive Test Suite

```bash
# Interactive mode (will prompt for stress test)
./tests/load/run-load-tests.sh

# CI/CD mode - skip stress test (default)
./tests/load/run-load-tests.sh --skip-stress

# CI/CD mode - include stress test
./tests/load/run-load-tests.sh --run-stress

# Using environment variables
RUN_STRESS_TEST=true ./tests/load/run-load-tests.sh
CI=true ./tests/load/run-load-tests.sh  # Auto-detects CI environment
```

For detailed CI/CD integration, see [CI Integration Guide](./docs/ci-integration.md).

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

The project includes a comprehensive GitHub Actions workflow for load testing with the following features:

- **Robust API readiness checks** using both health endpoint and API validation
- **Input parameter validation** to prevent resource exhaustion
- **Detailed performance reporting** with statistical analysis
- **Automatic artifact storage** for test results

### Health Check Endpoint

The API includes a dedicated health endpoint (`/api/health`) that verifies:
- API availability
- Database connectivity
- Environment configuration

Example health check response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.123Z",
  "checks": {
    "api": true,
    "database": true,
    "environment": true
  },
  "details": {
    "environment": "production",
    "version": "1.0.0",
    "uptime": 3600
  }
}
```

### GitHub Actions Workflow

The load test workflow includes comprehensive readiness checks:

```yaml
name: Load Testing

on:
  workflow_dispatch:
    inputs:
      target_url:
        description: 'Target URL for load testing'
        required: false
        default: 'http://localhost:3000'
        type: string
      concurrent_users:
        description: 'Number of concurrent users (1-500)'
        required: false
        default: '50'
        type: string
      test_duration:
        description: 'Test duration in seconds (10-600)'
        required: false
        default: '60'
        type: string

jobs:
  load-test:
    runs-on: ubuntu-latest
    
    env:
      NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
      NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
      BASE_URL: ${{ github.event.inputs.target_url || 'http://localhost:3000' }}
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      # Only build and start locally if testing localhost
      - name: Build application
        if: contains(env.BASE_URL, 'localhost')
        run: npm run build
      
      - name: Start application
        if: contains(env.BASE_URL, 'localhost')
        run: |
          npm start &
          echo $! > .pid
      
      - name: Wait for API to be ready
        run: |
          echo "Waiting for API at $BASE_URL to be ready..."
          for i in {1..30}; do
            if curl -s $BASE_URL/api/agencies > /dev/null; then
              echo "API is ready!"
              break
            fi
            echo "Attempt $i/30..."
            sleep 2
          done
          
          # Verify API is responding
          if ! curl -s $BASE_URL/api/agencies > /dev/null; then
            echo "::error::API did not become ready after 60 seconds"
            exit 1
          fi
      
      - name: Run load test
        run: |
          echo "Running load test against $BASE_URL"
          node tests/load/simple-load-test.js
        env:
          CONCURRENT_USERS: ${{ github.event.inputs.concurrent_users }}
          TEST_DURATION: ${{ github.event.inputs.test_duration }}
      
      - name: Upload results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: load-test-results-${{ github.run_number }}
          path: tests/load/results/
          retention-days: 30
      
      - name: Stop application
        if: always() && contains(env.BASE_URL, 'localhost')
        run: |
          if [ -f .pid ]; then
            kill "$(cat .pid)" || true
            rm .pid
          fi
      
      - name: Check performance targets
        run: |
          # Find the latest summary file
          SUMMARY=$(ls -t tests/load/results/simple-load-test-summary_*.md 2>/dev/null | head -1)
          
          if [ -z "$SUMMARY" ] || [ ! -f "$SUMMARY" ]; then
            echo "::error::No load test summary file found"
            exit 1
          fi
          
          # Display results in job summary
          {
            echo "## Load Test Results"
            echo ""
            echo "**Target URL:** $BASE_URL"
            echo "**Concurrent Users:** ${{ github.event.inputs.concurrent_users }}"
            echo "**Test Duration:** ${{ github.event.inputs.test_duration }}s"
            echo ""
            cat "$SUMMARY"
          } >> "$GITHUB_STEP_SUMMARY"
          
          # Fail if targets not met
          if grep -q "❌" "$SUMMARY"; then
            echo "::error::Performance targets not met. See summary for details."
            exit 1
          fi
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