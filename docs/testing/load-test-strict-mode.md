# Load Test Script Strict Mode

## Overview

The load test runner script (`tests/load/run-load-tests.sh`) has been updated to use Bash strict mode for improved safety and error detection.

## Changes Made

### Before
```bash
set -e
```

### After
```bash
set -euo pipefail
```

## What This Means

### `-e` (errexit)
- Script exits immediately if any command returns a non-zero status
- Already present in the original script

### `-u` (nounset)
- Script exits if it tries to use an undefined variable
- Prevents silent bugs from typos or missing variables
- **NEW**: Improves safety by catching undefined variables

### `-o pipefail`
- Pipeline returns failure if ANY command in the pipeline fails
- Without this, only the last command's exit status is checked
- **NEW**: Prevents errors from being hidden in pipelines

## Benefits

1. **Catches undefined variables**
   ```bash
   # This would now fail immediately instead of silently continuing
   echo "Value: $UNDEFINED_VAR"
   ```

2. **Detects pipeline failures**
   ```bash
   # Without pipefail: succeeds even if command1 fails
   # With pipefail: fails if ANY command fails
   command1 | command2 | command3
   ```

3. **Faster debugging**
   - Errors are caught at the source
   - No silent data corruption
   - Clear error messages

## Verified Safety

The script has been analyzed and confirmed to be safe with strict mode:

1. **All variables are properly initialized**
   - `should_run_stress` is initialized before use
   - Environment variables use default values with `${VAR:-default}`

2. **Command substitutions have fallbacks**
   ```bash
   # Example: jq commands have || echo "0" fallbacks
   p95=$(jq -r '.metrics.http_req_duration["p(95)"] // 0' "$json_file" 2>/dev/null || echo "0")
   ```

3. **Proper error handling**
   - Commands that might fail are wrapped in conditionals
   - Exit codes are properly checked

## Testing

A test script is provided at `tests/load/test-strict-mode.sh` to verify:
- Help flag functionality
- Tool validation (k6, jq)
- Environment variable handling
- Error propagation

## Best Practices

When modifying the load test script:

1. **Always initialize variables**
   ```bash
   # Good
   my_var=""
   my_var="${ENV_VAR:-default}"
   
   # Bad
   # Using $my_var without initialization
   ```

2. **Use defaults for optional variables**
   ```bash
   BASE_URL="${BASE_URL:-http://localhost:3000}"
   ```

3. **Handle command failures explicitly**
   ```bash
   if command; then
       echo "Success"
   else
       echo "Failed"
       exit 1
   fi
   ```

4. **Quote variables**
   ```bash
   # Good
   echo "$variable"
   
   # Bad (can break with spaces)
   echo $variable
   ```

5. **Use portable Bash features**
   ```bash
   # Good - works on Bash 3.2+ (macOS)
   lowercase=$(printf '%s' "$var" | tr '[:upper:]' '[:lower:]')
   
   # Bad - requires Bash 4+
   lowercase="${var,,}"
   ```

## Bash Compatibility

The script is compatible with:
- **Bash 3.2** (macOS default)
- **Bash 4.x and 5.x** (most Linux distributions)
- Other POSIX-compliant shells

Key compatibility considerations:
- Avoid Bash 4+ specific features like `${var,,}` for case conversion
- Use `tr` for portable string manipulation
- Test on macOS to ensure compatibility