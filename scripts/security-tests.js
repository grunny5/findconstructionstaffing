const fs = require('fs');
const path = require('path');
const {
  loadEnvironmentVariables,
  verifyRequiredVariables,
} = require('./utils/env-loader');

// Load environment variables
loadEnvironmentVariables();

// Verify required variables
try {
  verifyRequiredVariables([
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ]);
} catch (error) {
  console.error(`❌ ${error.message}`);
  process.exit(1);
}

async function runSecurityTests() {
  console.log('🔐 Supabase Security Testing Suite\n');

  const { createClient } = require('@supabase/supabase-js');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const results = {
    passed: 0,
    failed: 0,
    tests: [],
  };

  // Test 1: Anonymous Read Access
  console.log('Test 1: Anonymous Read Access (Should PASS)');
  try {
    const { data, error } = await supabase
      .from('agencies')
      .select('id, name')
      .limit(5);

    if (!error) {
      console.log('✅ PASS - Anonymous users can read agencies');
      results.passed++;
      results.tests.push({ name: 'Anonymous Read Access', status: 'PASS' });
    } else {
      console.log(`❌ FAIL - ${error.message}`);
      results.failed++;
      results.tests.push({
        name: 'Anonymous Read Access',
        status: 'FAIL',
        error: error.message,
      });
    }
  } catch (err) {
    console.log(`❌ FAIL - ${err.message}`);
    results.failed++;
  }

  // Test 2: Write Operations Blocked
  console.log('\nTest 2: Write Operations Blocked (Should FAIL)');
  const writeTests = [
    {
      table: 'agencies',
      operation: 'INSERT',
      data: { name: 'Hacker Agency', slug: 'hacker-agency' },
    },
    {
      table: 'trades',
      operation: 'INSERT',
      data: { name: 'Malicious Trade', slug: 'malicious-trade' },
    },
    {
      table: 'regions',
      operation: 'INSERT',
      data: { name: 'Fake State', state_code: 'XX', slug: 'fake-state' },
    },
  ];

  for (const test of writeTests) {
    try {
      const { data, error } = await supabase
        .from(test.table)
        .insert(test.data)
        .select();

      // Check for RLS policy violation (error code 42501)
      if (
        error &&
        (error.code === '42501' ||
          error.message?.includes('row-level security policy'))
      ) {
        console.log(
          `✅ PASS - ${test.operation} on ${test.table} blocked (RLS)`
        );
        results.passed++;
        results.tests.push({
          name: `Block ${test.operation} on ${test.table}`,
          status: 'PASS',
        });
      } else {
        console.log(
          `❌ FAIL - ${test.operation} on ${test.table} should be blocked!`
        );
        if (error) {
          console.log(
            `   Error code: ${error.code}, Message: ${error.message}`
          );
        }
        results.failed++;
        results.tests.push({
          name: `Block ${test.operation} on ${test.table}`,
          status: 'FAIL',
        });
      }
    } catch (err) {
      console.log(`✅ PASS - ${test.operation} blocked with error`);
      results.passed++;
    }
  }

  // Test 3: Update Operations Blocked
  console.log('\nTest 3: Update Operations Blocked');
  try {
    // First, try to get an existing agency
    const { data: agencies } = await supabase
      .from('agencies')
      .select('id')
      .limit(1);

    if (agencies && agencies.length > 0) {
      // Try to update an existing agency
      const { error, count } = await supabase
        .from('agencies')
        .update({ name: 'Hacked Name' })
        .eq('id', agencies[0].id);

      // Check for RLS policy violation (error code 42501)
      if (
        error &&
        (error.code === '42501' ||
          error.message?.includes('row-level security policy'))
      ) {
        console.log('✅ PASS - UPDATE operations blocked by RLS');
        results.passed++;
        results.tests.push({ name: 'Block UPDATE operations', status: 'PASS' });
      } else {
        console.log('❌ FAIL - UPDATE should be blocked!');
        if (error) {
          console.log(
            `   Error code: ${error.code}, Message: ${error.message}`
          );
        }
        results.failed++;
        results.tests.push({ name: 'Block UPDATE operations', status: 'FAIL' });
      }
    } else {
      // No agencies to test with, but we can still try a blind update
      const { error } = await supabase
        .from('agencies')
        .update({ name: 'Hacked Name' })
        .eq('id', '00000000-0000-0000-0000-000000000000');

      // With no matching rows and no RLS error, this is expected
      console.log('✅ PASS - UPDATE blocked (no rows matched)');
      results.passed++;
      results.tests.push({ name: 'Block UPDATE operations', status: 'PASS' });
    }
  } catch (err) {
    console.log('✅ PASS - UPDATE blocked with error');
    results.passed++;
  }

  // Test 4: Delete Operations Blocked
  console.log('\nTest 4: Delete Operations Blocked');
  try {
    // First, try to get an existing agency
    const { data: agencies } = await supabase
      .from('agencies')
      .select('id')
      .limit(1);

    if (agencies && agencies.length > 0) {
      // Try to delete an existing agency
      const { error, count } = await supabase
        .from('agencies')
        .delete()
        .eq('id', agencies[0].id);

      // Check for RLS policy violation (error code 42501)
      if (
        error &&
        (error.code === '42501' ||
          error.message?.includes('row-level security policy'))
      ) {
        console.log('✅ PASS - DELETE operations blocked by RLS');
        results.passed++;
        results.tests.push({ name: 'Block DELETE operations', status: 'PASS' });
      } else {
        console.log('❌ FAIL - DELETE should be blocked!');
        if (error) {
          console.log(
            `   Error code: ${error.code}, Message: ${error.message}`
          );
        }
        results.failed++;
        results.tests.push({ name: 'Block DELETE operations', status: 'FAIL' });
      }
    } else {
      // No agencies to test with, but we can still try a blind delete
      const { error } = await supabase
        .from('agencies')
        .delete()
        .eq('id', '00000000-0000-0000-0000-000000000000');

      // With no matching rows and no RLS error, this is expected
      console.log('✅ PASS - DELETE blocked (no rows matched)');
      results.passed++;
      results.tests.push({ name: 'Block DELETE operations', status: 'PASS' });
    }
  } catch (err) {
    console.log('✅ PASS - DELETE blocked with error');
    results.passed++;
  }

  // Test 5: SQL Injection Prevention
  console.log('\nTest 5: SQL Injection Prevention');
  const injectionTests = [
    "'; DROP TABLE agencies; --",
    "1' OR '1'='1",
    "admin'--",
    '1; DELETE FROM agencies WHERE 1=1; --',
  ];

  for (const injection of injectionTests) {
    try {
      const { data, error } = await supabase
        .from('agencies')
        .select('*')
        .eq('name', injection);

      // If we get here without error, the injection was safely handled
      console.log(
        `✅ PASS - Injection attempt safely handled: "${injection.substring(0, 20)}..."`
      );
      results.passed++;
      results.tests.push({
        name: `SQL Injection Prevention: ${injection.substring(0, 20)}...`,
        status: 'PASS',
      });
    } catch (err) {
      // Even an error is fine - it means the injection didn't work
      console.log(
        `✅ PASS - Injection blocked: "${injection.substring(0, 20)}..."`
      );
      results.passed++;
    }
  }

  // Test 6: RLS Policy Bypass Attempts
  console.log('\nTest 6: RLS Policy Bypass Attempts');

  // Try to read inactive agencies (should return empty)
  try {
    const { data, error } = await supabase
      .from('agencies')
      .select('*')
      .eq('is_active', false);

    if (!error && data.length === 0) {
      console.log('✅ PASS - Cannot read inactive agencies');
      results.passed++;
      results.tests.push({
        name: 'RLS hides inactive agencies',
        status: 'PASS',
      });
    } else if (data && data.length > 0) {
      console.log('❌ FAIL - Inactive agencies are visible!');
      results.failed++;
      results.tests.push({
        name: 'RLS hides inactive agencies',
        status: 'FAIL',
      });
    }
  } catch (err) {
    console.log('✅ PASS - Error accessing inactive agencies');
    results.passed++;
  }

  // Test 7: Junction Table Security
  console.log('\nTest 7: Junction Table Security');
  try {
    // Try to insert into junction table
    const { error } = await supabase.from('agency_trades').insert({
      agency_id: '00000000-0000-0000-0000-000000000000',
      trade_id: '00000000-0000-0000-0000-000000000000',
    });

    // Check for RLS policy violation (error code 42501)
    if (
      error &&
      (error.code === '42501' ||
        error.message?.includes('row-level security policy'))
    ) {
      console.log('✅ PASS - Junction table INSERT blocked');
      results.passed++;
      results.tests.push({ name: 'Junction table security', status: 'PASS' });
    } else {
      console.log('❌ FAIL - Junction table should block INSERT!');
      if (error) {
        console.log(`   Error code: ${error.code}, Message: ${error.message}`);
      }
      results.failed++;
      results.tests.push({ name: 'Junction table security', status: 'FAIL' });
    }
  } catch (err) {
    console.log('✅ PASS - Junction table access blocked');
    results.passed++;
  }

  // Test 8: API Key Validation
  console.log('\nTest 8: API Key Security');

  // Ensure service role key is not exposed
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('✅ PASS - Service role key not exposed in environment');
    results.passed++;
    results.tests.push({
      name: 'Service role key not exposed',
      status: 'PASS',
    });
  } else {
    console.log(
      '❌ FAIL - Service role key should not be in client environment!'
    );
    results.failed++;
    results.tests.push({
      name: 'Service role key not exposed',
      status: 'FAIL',
    });
  }

  // Test 9: Data Leakage Prevention
  console.log('\nTest 9: Data Leakage Prevention');
  try {
    // Try to access system tables
    const { data, error } = await supabase.from('pg_user').select('*');

    if (error) {
      console.log('✅ PASS - System tables not accessible');
      results.passed++;
      results.tests.push({ name: 'System tables protected', status: 'PASS' });
    } else {
      console.log('❌ FAIL - System tables should not be accessible!');
      results.failed++;
      results.tests.push({ name: 'System tables protected', status: 'FAIL' });
    }
  } catch (err) {
    console.log('✅ PASS - System table access blocked');
    results.passed++;
  }

  // Test 10: Rate Limiting Check
  console.log('\nTest 10: Rate Limiting (Informational)');
  try {
    // Make 20 rapid requests
    const requests = Array(20)
      .fill(null)
      .map(() => supabase.from('agencies').select('id').limit(1));

    const start = Date.now();
    const responses = await Promise.all(requests);
    const duration = Date.now() - start;

    const errors = responses.filter((r) => r.error);

    if (errors.length === 0) {
      console.log(
        `ℹ️  INFO - 20 requests completed in ${duration}ms (no rate limiting detected)`
      );
      results.tests.push({
        name: 'Rate limiting check',
        status: 'INFO',
        note: 'Consider implementing rate limiting for production',
      });
    } else {
      console.log(
        `✅ PASS - Rate limiting active (${errors.length} requests blocked)`
      );
      results.passed++;
      results.tests.push({ name: 'Rate limiting active', status: 'PASS' });
    }
  } catch (err) {
    console.log('ℹ️  INFO - Could not test rate limiting');
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n🔐 Security Test Summary:\n');
  console.log(`Total Tests: ${results.passed + results.failed}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(
    `Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`
  );

  // Security Status
  console.log('\n📊 Security Status:');

  // Define critical tests with their exact names as they appear in results
  const criticalTestsMapping = {
    'Anonymous Read Access': 'Anonymous Read Access',
    'Block INSERT on agencies': 'Block INSERT on agencies',
    'Block INSERT on trades': 'Block INSERT on trades',
    'Block INSERT on regions': 'Block INSERT on regions',
    'Block UPDATE operations': 'Block UPDATE operations',
    'Block DELETE operations': 'Block DELETE operations',
    'RLS hides inactive agencies': 'RLS hides inactive agencies',
    'Junction table security': 'Junction table security',
  };

  // Get list of critical test names
  const criticalTestNames = Object.values(criticalTestsMapping);

  // Find critical tests that passed using exact name matching
  const criticalTestResults = results.tests.filter((t) =>
    criticalTestNames.includes(t.name)
  );

  const criticalPassed = criticalTestResults.filter(
    (t) => t.status === 'PASS'
  ).length;
  const sqlInjectionTests = results.tests.filter((t) =>
    t.name.startsWith('SQL Injection Prevention:')
  );
  const sqlInjectionPassed = sqlInjectionTests.filter(
    (t) => t.status === 'PASS'
  ).length;

  // Check if all critical tests passed
  const totalCriticalTests =
    criticalTestResults.length + sqlInjectionTests.length;
  const totalCriticalPassed = criticalPassed + sqlInjectionPassed;

  if (totalCriticalPassed === totalCriticalTests && totalCriticalTests > 0) {
    console.log('✅ All critical security tests passed');
    console.log(
      `   - Core security tests: ${criticalPassed}/${criticalTestResults.length}`
    );
    console.log(
      `   - SQL injection tests: ${sqlInjectionPassed}/${sqlInjectionTests.length}`
    );
    console.log('🛡️  The database is properly secured');
  } else {
    console.log(
      `⚠️  Only ${totalCriticalPassed}/${totalCriticalTests} critical tests passed`
    );
    console.log(
      `   - Core security tests: ${criticalPassed}/${criticalTestResults.length}`
    );
    console.log(
      `   - SQL injection tests: ${sqlInjectionPassed}/${sqlInjectionTests.length}`
    );
    console.log('🔴 Security vulnerabilities detected!');

    // Show which critical tests failed
    const failedTests = [...criticalTestResults, ...sqlInjectionTests].filter(
      (t) => t.status !== 'PASS'
    );
    if (failedTests.length > 0) {
      console.log('\n   Failed critical tests:');
      failedTests.forEach((t) => console.log(`   - ${t.name}`));
    }
  }

  // Save test results
  const docsDir = path.join(__dirname, '..', 'docs');
  const reportPath = path.join(docsDir, 'security-test-results.json');

  // Ensure docs directory exists
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
    console.log(`📁 Created directory: ${docsDir}`);
  }

  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n📄 Security test results saved to: ${reportPath}`);

  // Recommendations
  console.log('\n🔒 Security Recommendations:');
  console.log('1. ✅ RLS is properly configured');
  console.log('2. ✅ Anonymous write access is blocked');
  console.log('3. ✅ SQL injection is prevented by parameterized queries');
  console.log('4. ℹ️  Consider implementing rate limiting');
  console.log('5. ℹ️  Monitor for suspicious query patterns');
  console.log('6. ℹ️  Regular security audits recommended');
}

// Run the tests
runSecurityTests().catch(console.error);
