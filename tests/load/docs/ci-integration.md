# CI Integration Guide for Load Tests

## Overview

The `run-load-tests.sh` script has been updated to support non-interactive execution in CI/CD pipelines. It can now be controlled via command-line arguments or environment variables, eliminating the need for interactive prompts.

## Usage

### Command Line Arguments

```bash
# Run all tests including stress test
./tests/load/run-load-tests.sh --run-stress

# Run tests but skip stress test
./tests/load/run-load-tests.sh --skip-stress

# Show help
./tests/load/run-load-tests.sh --help
```

### Environment Variables

```bash
# Using RUN_STRESS_TEST environment variable
RUN_STRESS_TEST=true ./tests/load/run-load-tests.sh
RUN_STRESS_TEST=false ./tests/load/run-load-tests.sh

# Acceptable values for RUN_STRESS_TEST:
# true, false, yes, no, y, n, 1, 0 (case-insensitive)
```

### CI Detection

The script automatically detects when it's running in a non-interactive environment:

1. **CI Environment**: When `CI` environment variable is set
2. **No TTY**: When no terminal is attached (e.g., in automated scripts)

In these cases, the script:

- Skips the interactive prompt
- Defaults to **not** running the stress test
- Displays a message about running in non-interactive mode

## GitHub Actions Example

```yaml
- name: Run Load Tests (without stress test)
  run: |
    # CI environment variable is automatically set by GitHub Actions
    ./tests/load/run-load-tests.sh

- name: Run Load Tests (with stress test)
  run: |
    ./tests/load/run-load-tests.sh --run-stress
    # Or using environment variable:
    # RUN_STRESS_TEST=true ./tests/load/run-load-tests.sh
```

## Jenkins Example

```groovy
stage('Load Tests') {
    steps {
        script {
            // Without stress test
            sh './tests/load/run-load-tests.sh --skip-stress'

            // With stress test (e.g., for nightly builds)
            if (env.BUILD_TYPE == 'nightly') {
                sh './tests/load/run-load-tests.sh --run-stress'
            }
        }
    }
}
```

## GitLab CI Example

```yaml
load-test:
  stage: test
  script:
    # Skip stress test for merge requests
    - ./tests/load/run-load-tests.sh --skip-stress

load-test-full:
  stage: test
  script:
    # Run full test suite including stress test
    - ./tests/load/run-load-tests.sh --run-stress
  only:
    - main
    - staging
```

## Docker Example

```dockerfile
# In your Dockerfile or docker-compose
CMD ["./tests/load/run-load-tests.sh", "--skip-stress"]

# Or with environment variable
ENV RUN_STRESS_TEST=false
CMD ["./tests/load/run-load-tests.sh"]
```

## Best Practices

1. **Default Behavior**: In CI, the script defaults to skipping the stress test to save time and resources.

2. **Explicit Control**: Always use explicit flags in CI to make the behavior clear:

   ```bash
   # Good - explicit
   ./tests/load/run-load-tests.sh --skip-stress

   # Less clear - relies on default
   ./tests/load/run-load-tests.sh
   ```

3. **Scheduled Stress Tests**: Run stress tests in scheduled/nightly builds:

   ```yaml
   # GitHub Actions scheduled workflow
   on:
     schedule:
       - cron: '0 2 * * *' # 2 AM daily

   jobs:
     stress-test:
       runs-on: ubuntu-latest
       steps:
         - run: ./tests/load/run-load-tests.sh --run-stress
   ```

4. **Resource Considerations**: Stress tests consume more resources. Consider:
   - Running on dedicated CI runners
   - Setting appropriate timeouts
   - Monitoring CI infrastructure during stress tests

## Troubleshooting

### Script Still Prompts in CI

If the script prompts despite being in CI:

1. Ensure `CI` environment variable is set
2. Check if stdin is being piped unexpectedly
3. Use explicit `--skip-stress` or `--run-stress` flags

### Invalid Environment Variable Value

The script warns about invalid `RUN_STRESS_TEST` values:

```
Warning: Invalid RUN_STRESS_TEST value: invalid
Expected: true, false, yes, no, y, n, 1, or 0
```

### Exit Codes

- `0`: Success
- `1`: Error (invalid arguments, test failures, etc.)

## Migration Guide

If you have existing CI pipelines using the old interactive script:

1. **Add explicit flags**:

   ```bash
   # Old (would hang in CI)
   echo "n" | ./tests/load/run-load-tests.sh

   # New
   ./tests/load/run-load-tests.sh --skip-stress
   ```

2. **Update timeout values**: Stress tests take ~15 minutes, so adjust CI timeouts accordingly.

3. **Monitor first runs**: Check that tests complete successfully without hanging.
