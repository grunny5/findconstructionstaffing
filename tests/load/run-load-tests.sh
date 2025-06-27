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

# Check for required tools
if ! command -v k6 &> /dev/null; then
    echo -e "${RED}Error: k6 is not installed. Please install k6 to run load tests.${NC}"
    echo "Visit https://k6.io/docs/getting-started/installation/ for installation instructions."
    exit 1
fi

if ! command -v jq &> /dev/null; then
    echo -e "${RED}Error: jq is not installed. Please install jq to process test results.${NC}"
    echo "Visit https://stedolan.github.io/jq/download/ for installation instructions."
    exit 1
fi

if ! command -v bc &> /dev/null; then
    echo -e "${RED}Error: bc is not installed. Please install bc for floating-point calculations.${NC}"
    echo "Install with: apt-get install bc (Debian/Ubuntu) or yum install bc (RHEL/CentOS)"
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

# Function to evaluate performance targets
evaluate_performance() {
    local json_file=$1
    local test_name=$2
    
    if [ ! -f "$json_file" ]; then
        echo "N/A - Test file not found"
        return
    fi
    
    # Extract metrics using jq
    local p95
    local error_rate
    local avg_duration
    local total_reqs
    local failed_reqs
    
    p95=$(jq -r '.metrics.http_req_duration["p(95)"] // 0' "$json_file" 2>/dev/null || echo "0")
    error_rate=$(jq -r '.metrics.http_req_failed.rate // 0' "$json_file" 2>/dev/null || echo "0")
    avg_duration=$(jq -r '.metrics.http_req_duration.avg // 0' "$json_file" 2>/dev/null || echo "0")
    total_reqs=$(jq -r '.metrics.http_reqs.count // 0' "$json_file" 2>/dev/null || echo "0")
    failed_reqs=$(jq -r '.metrics.http_req_failed.count // 0' "$json_file" 2>/dev/null || echo "0")
    
    # Convert error rate to percentage
    local error_rate_pct
    error_rate_pct=$(awk "BEGIN {printf \"%.2f\", $error_rate * 100}")
    
    # Evaluate targets
    local p95_target="❌"
    local error_target="❌"
    local avg_target="❌"
    
    # Check if p95 < 100ms
    if (( $(echo "$p95 < 100" | bc -l) )); then
        p95_target="✅"
    fi
    
    # Check if error rate < 1%
    if (( $(echo "$error_rate_pct < 1" | bc -l) )); then
        error_target="✅"
    fi
    
    # Check if average < 50ms
    if (( $(echo "$avg_duration < 50" | bc -l) )); then
        avg_target="✅"
    fi
    
    echo "### $test_name"
    echo "- Total requests: $total_reqs"
    echo "- Failed requests: $failed_reqs"
    echo "- P95 response time: ${p95}ms"
    echo "- Average response time: ${avg_duration}ms"
    echo "- Error rate: ${error_rate_pct}%"
    echo ""
    echo "**Performance Targets:**"
    echo "- $p95_target 95% of requests < 100ms (actual: ${p95}ms)"
    echo "- $error_target Error rate < 1% (actual: ${error_rate_pct}%)"
    echo "- $avg_target Average response time < 50ms (actual: ${avg_duration}ms)"
    echo ""
}

cat > "$RESULTS_DIR/summary_${TIMESTAMP}.md" << EOF
# Load Test Results Summary
**Date:** $(date)
**Base URL:** $BASE_URL

## Test Results

$(evaluate_performance "$RESULTS_DIR/baseline_summary_${TIMESTAMP}.json" "Baseline Test (1 user)")

$(evaluate_performance "$RESULTS_DIR/smoke_summary_${TIMESTAMP}.json" "Smoke Test (5 users)")

$(evaluate_performance "$RESULTS_DIR/load_summary_${TIMESTAMP}.json" "Load Test (100 users)")

$(if [ -f "$RESULTS_DIR/stress_summary_${TIMESTAMP}.json" ]; then
    evaluate_performance "$RESULTS_DIR/stress_summary_${TIMESTAMP}.json" "Stress Test (up to 400 users)"
fi)

## Overall Assessment

$(
    # Check if all targets are met for the main load test
    if [ -f "$RESULTS_DIR/load_summary_${TIMESTAMP}.json" ]; then
        p95=$(jq -r '.metrics.http_req_duration["p(95)"] // 0' "$RESULTS_DIR/load_summary_${TIMESTAMP}.json" 2>/dev/null || echo "0")
        error_rate=$(jq -r '.metrics.http_req_failed.rate // 0' "$RESULTS_DIR/load_summary_${TIMESTAMP}.json" 2>/dev/null || echo "0")
        avg_duration=$(jq -r '.metrics.http_req_duration.avg // 0' "$RESULTS_DIR/load_summary_${TIMESTAMP}.json" 2>/dev/null || echo "0")
        error_rate_pct=$(awk "BEGIN {printf \"%.2f\", $error_rate * 100}")
        
        if (( $(echo "$p95 < 100" | bc -l) )) && \
           (( $(echo "$error_rate_pct < 1" | bc -l) )) && \
           (( $(echo "$avg_duration < 50" | bc -l) )); then
            echo "🎉 **All performance targets met!** The API is performing within acceptable limits."
        else
            echo "⚠️ **Performance targets not met.** Review the metrics above and consider optimization."
        fi
    else
        echo "❌ **Load test results not available.**"
    fi
)

## Recommendations
Based on the test results:
1. Review response time percentiles for performance bottlenecks
2. Analyze error patterns if error rate exceeds 1%
3. Consider optimization if average response time exceeds 50ms
4. Check detailed JSON reports for scenario-specific metrics
EOF

echo -e "${GREEN}✅ All tests completed!${NC}"
echo "Results saved to: $RESULTS_DIR"
echo "Summary report: $RESULTS_DIR/summary_${TIMESTAMP}.md"

# Display key metrics from the main load test
if [ -f "$RESULTS_DIR/load_summary_${TIMESTAMP}.json" ]; then
    echo ""
    echo "📊 Key Metrics from Load Test:"
    jq '.metrics' "$RESULTS_DIR/load_summary_${TIMESTAMP}.json"
fi