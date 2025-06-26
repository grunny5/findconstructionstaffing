#!/bin/bash

# Load test runner script for agencies API
# This script runs various load test scenarios and generates reports

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${BASE_URL:-http://localhost:3000}"
RESULTS_DIR="tests/load/results"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create results directory
mkdir -p "$RESULTS_DIR"

echo "🚀 Starting load tests for Agencies API"
echo "Base URL: $BASE_URL"
echo "Results will be saved to: $RESULTS_DIR"
echo ""

# Function to run a test scenario
run_test() {
    local test_name=$1
    local config_option=$2
    local output_file="$RESULTS_DIR/${test_name}_${TIMESTAMP}.json"
    
    echo -e "${YELLOW}Running $test_name test...${NC}"
    
    if k6 run \
        --out json="$output_file" \
        --summary-export="$RESULTS_DIR/${test_name}_summary_${TIMESTAMP}.json" \
        -e BASE_URL="$BASE_URL" \
        $config_option \
        tests/load/agencies-api.k6.js; then
        echo -e "${GREEN}✅ $test_name test completed successfully${NC}"
    else
        echo -e "${RED}❌ $test_name test failed${NC}"
        return 1
    fi
    
    echo ""
}

# Check if k6 is installed
if ! command -v k6 &> /dev/null; then
    echo -e "${RED}Error: k6 is not installed${NC}"
    echo "Please install k6 from https://k6.io/docs/getting-started/installation"
    exit 1
fi

# Run baseline test first
echo "1️⃣ BASELINE TEST (1 user, 100 iterations)"
run_test "baseline" "--config tests/load/config/load-test-config.js -s baselineTest:tests/load/agencies-api.k6.js"

# Run smoke test
echo "2️⃣ SMOKE TEST (5 users, 1.5 minutes)"
run_test "smoke" "--config tests/load/config/load-test-config.js -s smokeTest:tests/load/agencies-api.k6.js"

# Run main load test
echo "3️⃣ LOAD TEST (100 users, 9 minutes)"
run_test "load" "--config tests/load/config/load-test-config.js -s loadTest:tests/load/agencies-api.k6.js"

# Optional: Run stress test
read -p "Do you want to run the stress test? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "4️⃣ STRESS TEST (up to 400 users, 15 minutes)"
    run_test "stress" "--config tests/load/config/load-test-config.js -s stressTest:tests/load/agencies-api.k6.js"
fi

# Generate summary report
echo -e "${YELLOW}Generating summary report...${NC}"

cat > "$RESULTS_DIR/summary_${TIMESTAMP}.md" << EOF
# Load Test Results Summary
**Date:** $(date)
**Base URL:** $BASE_URL

## Test Results

### Baseline Test (1 user)
- Check \`baseline_summary_${TIMESTAMP}.json\` for details

### Smoke Test (5 users)
- Check \`smoke_summary_${TIMESTAMP}.json\` for details

### Load Test (100 users)
- Check \`load_summary_${TIMESTAMP}.json\` for details

## Performance Targets
- ✅ 95% of requests < 100ms
- ✅ Error rate < 1%
- ✅ Average response time < 50ms

## Recommendations
Based on the test results, review the detailed JSON reports for:
1. Response time percentiles
2. Error rates by scenario
3. Performance under different load conditions
EOF

echo -e "${GREEN}✅ All tests completed!${NC}"
echo "Results saved to: $RESULTS_DIR"
echo "Summary report: $RESULTS_DIR/summary_${TIMESTAMP}.md"

# Display key metrics from the main load test
if [ -f "$RESULTS_DIR/load_summary_${TIMESTAMP}.json" ]; then
    echo ""
    echo "📊 Key Metrics from Load Test:"
    cat "$RESULTS_DIR/load_summary_${TIMESTAMP}.json" | jq '.metrics'
fi