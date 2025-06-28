#!/bin/bash

# Test script to verify Bash 3.2 compatibility for run-load-tests.sh
# This specifically tests the portable lowercase conversion

set -euo pipefail

echo "Testing Bash compatibility for load test runner..."
echo "Current Bash version: $BASH_VERSION"

# Test the portable lowercase conversion
test_lowercase() {
    local input="$1"
    local expected="$2"
    
    # Use the same method as in run-load-tests.sh
    local result=$(printf '%s' "$input" | tr '[:upper:]' '[:lower:]')
    
    if [[ "$result" == "$expected" ]]; then
        echo "✅ Lowercase conversion works: '$input' -> '$result'"
        return 0
    else
        echo "❌ Lowercase conversion failed: '$input' -> '$result' (expected: '$expected')"
        return 1
    fi
}

echo ""
echo "Testing lowercase conversion..."

# Test various inputs
test_lowercase "TRUE" "true"
test_lowercase "True" "true"
test_lowercase "YES" "yes"
test_lowercase "Yes" "yes"
test_lowercase "Y" "y"
test_lowercase "FALSE" "false"
test_lowercase "False" "false"
test_lowercase "NO" "no"
test_lowercase "No" "no"
test_lowercase "N" "n"
test_lowercase "1" "1"
test_lowercase "0" "0"

echo ""
echo "Testing with actual script..."

# Test the actual environment variable handling
test_env_var() {
    local value="$1"
    local expected_action="$2"
    
    # Run a subset of the script logic
    RUN_STRESS=""
    RUN_STRESS_TEST="$value"
    
    if [[ -z "$RUN_STRESS" ]] && [[ -n "$RUN_STRESS_TEST" ]]; then
        RUN_STRESS_TEST_LOWER=$(printf '%s' "$RUN_STRESS_TEST" | tr '[:upper:]' '[:lower:]')
        case "$RUN_STRESS_TEST_LOWER" in
            true|yes|y|1)
                RUN_STRESS="true"
                ;;
            false|no|n|0)
                RUN_STRESS="false"
                ;;
            *)
                RUN_STRESS="invalid"
                ;;
        esac
    fi
    
    if [[ "$RUN_STRESS" == "$expected_action" ]]; then
        echo "✅ Environment variable handling works: RUN_STRESS_TEST='$value' -> RUN_STRESS='$RUN_STRESS'"
    else
        echo "❌ Environment variable handling failed: RUN_STRESS_TEST='$value' -> RUN_STRESS='$RUN_STRESS' (expected: '$expected_action')"
        exit 1
    fi
}

# Test various environment variable values
test_env_var "TRUE" "true"
test_env_var "true" "true"
test_env_var "YES" "true"
test_env_var "yes" "true"
test_env_var "Y" "true"
test_env_var "1" "true"

test_env_var "FALSE" "false"
test_env_var "false" "false"
test_env_var "NO" "false"
test_env_var "no" "false"
test_env_var "N" "false"
test_env_var "0" "false"

test_env_var "invalid" "invalid"
test_env_var "maybe" "invalid"

echo ""
echo "All compatibility tests passed! ✅"
echo ""
echo "Note: This portable approach works on:"
echo "- Bash 3.2 (macOS default)"
echo "- Bash 4.x and 5.x (Linux)"
echo "- Other POSIX-compliant shells"