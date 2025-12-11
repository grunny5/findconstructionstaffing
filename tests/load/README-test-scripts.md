# Load Test Scripts Documentation

This directory contains scripts for load testing the agencies API and utilities for testing the load test runner itself.

## Test Scripts

### test-run-load-tests.sh

A test script that verifies the `run-load-tests.sh` script works correctly in various scenarios.

**Features:**

- Location-agnostic execution (can be run from any directory)
- Tests all command-line options
- Verifies environment variable handling
- Checks CI/CD compatibility

**Usage:**

```bash
# Run from repository root
./tests/load/test-run-load-tests.sh

# Run from any directory
/path/to/tests/load/test-run-load-tests.sh

# Run from tests directory
cd tests && ./load/test-run-load-tests.sh
```

**What it tests:**

1. `--help` option functionality
2. Invalid option handling
3. Command-line arguments (`--run-stress`, `--skip-stress`)
4. Environment variable processing (`RUN_STRESS_TEST`)
5. CI environment detection
6. Non-interactive mode detection

### test-strict-mode.sh

Tests that the load test runner properly handles Bash strict mode (`set -euo pipefail`).

**What it tests:**

- Undefined variable handling
- Pipeline failure detection
- Tool validation (k6, jq)

### test-bash-compatibility.sh

Verifies Bash compatibility, especially for macOS (Bash 3.2).

**What it tests:**

- Portable lowercase conversion
- Environment variable case-insensitive handling
- Cross-platform compatibility

## Key Design Decisions

### Location Independence

All test scripts use `SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"` to determine their location, making them runnable from any directory.

### No Hardcoded Paths

Scripts reference other scripts relative to their own location:

```bash
RUN_LOAD_TESTS="$SCRIPT_DIR/run-load-tests.sh"
```

### Cross-Platform Compatibility

- Unix line endings (LF) enforced via `.gitattributes`
- Portable Bash constructs (no Bash 4+ specific features)
- POSIX-compliant where possible

## Running All Tests

To run all test scripts:

```bash
# From repository root
for test in tests/load/test-*.sh; do
    echo "Running $test..."
    bash "$test"
done
```
