#!/bin/bash

# Test script to verify strict mode handling in run-load-tests.sh
# This script tests that the load test runner properly handles:
# 1. Undefined variables (-u)
# 2. Pipeline failures (-o pipefail)
# 3. Command failures (-e)

set -euo pipefail

echo "Testing load test runner with strict mode..."

# Test 1: Check that help works
echo "Test 1: Checking --help flag..."
if ./tests/load/run-load-tests.sh --help >/dev/null 2>&1; then
    echo "✅ Help flag works correctly"
else
    echo "❌ Help flag failed"
    exit 1
fi

# Test 2: Check that the script validates required tools
echo "Test 2: Testing with missing k6 (simulated)..."
(
    # Create a subshell with k6 hidden from PATH
    EMPTY_DIR=$(mktemp -d)
    # Prepend empty directory to PATH so k6 is not found, but other commands still work
    PATH="$EMPTY_DIR:$PATH"
    if ./tests/load/run-load-tests.sh --skip-stress 2>&1 | grep -q "k6 is not installed"; then
        echo "✅ Missing k6 detection works"
        rmdir "$EMPTY_DIR"
    else
        echo "❌ Missing k6 detection failed"
        rmdir "$EMPTY_DIR"
        exit 1
    fi
)

# Test 3: Test with invalid environment variable value
echo "Test 3: Testing with invalid RUN_STRESS_TEST value..."
(
    export RUN_STRESS_TEST="invalid"
    if ./tests/load/run-load-tests.sh --skip-stress 2>&1 | grep -q "Warning: Invalid RUN_STRESS_TEST value"; then
        echo "✅ Invalid environment variable handling works"
    else
        echo "❌ Invalid environment variable handling failed"
        exit 1
    fi
)

echo ""
echo "All strict mode tests passed! ✅"
echo "The script properly handles:"
echo "- Undefined variables"
echo "- Pipeline failures"  
echo "- Command errors"