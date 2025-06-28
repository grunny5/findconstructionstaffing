#!/bin/bash

# Test script to verify run-load-tests.sh works correctly in different scenarios

echo "Testing run-load-tests.sh in various scenarios..."
echo "=============================================="

# Test 1: Help option
echo -e "\n1. Testing --help option:"
./tests/load/run-load-tests.sh --help > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✓ Help option works"
else
    echo "✗ Help option failed"
fi

# Test 2: Invalid option
echo -e "\n2. Testing invalid option:"
./tests/load/run-load-tests.sh --invalid-option > /dev/null 2>&1
if [ $? -eq 1 ]; then
    echo "✓ Invalid option correctly rejected"
else
    echo "✗ Invalid option handling failed"
fi

# Test 3: Command line arguments
echo -e "\n3. Testing command line arguments:"
echo "   --run-stress should set RUN_STRESS=true"
echo "   --skip-stress should set RUN_STRESS=false"

# Test 4: Environment variables
echo -e "\n4. Testing environment variables:"
export RUN_STRESS_TEST="true"
echo "   RUN_STRESS_TEST=true should enable stress test"
unset RUN_STRESS_TEST

export RUN_STRESS_TEST="false"
echo "   RUN_STRESS_TEST=false should skip stress test"
unset RUN_STRESS_TEST

# Test 5: CI environment
echo -e "\n5. Testing CI environment:"
export CI=true
echo "   CI=true should skip interactive prompts"
unset CI

# Test 6: Non-interactive detection
echo -e "\n6. Testing non-interactive detection:"
echo "   Running with no stdin should skip prompts"
echo "" | ./tests/load/run-load-tests.sh --help > /dev/null 2>&1

echo -e "\n=============================================="
echo "Test scenarios completed. Manual verification required for actual execution."
echo ""
echo "Example usage in CI:"
echo "  # Skip stress test (default in CI)"
echo "  CI=true ./tests/load/run-load-tests.sh"
echo ""
echo "  # Run with stress test in CI"
echo "  CI=true RUN_STRESS_TEST=true ./tests/load/run-load-tests.sh"
echo ""
echo "  # Or using command line"
echo "  ./tests/load/run-load-tests.sh --run-stress"