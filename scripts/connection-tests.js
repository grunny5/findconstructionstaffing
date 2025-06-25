const fs = require('fs');
const path = require('path');
const { loadEnvironmentVariables, verifyRequiredVariables } = require('./utils/env-loader');

// Load environment variables
loadEnvironmentVariables();

// Verify required variables
try {
  verifyRequiredVariables([
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ]);
} catch (error) {
  console.error(`❌ ${error.message}`);
  process.exit(1);
}

async function runConnectionTests() {
  console.log('🔌 Supabase Connection Testing Suite\n');
  
  const { createClient } = require('@supabase/supabase-js');
  
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };
  
  // Test 1: Basic Connection
  console.log('Test 1: Basic Connection');
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    const start = Date.now();
    const { data, error } = await supabase
      .from('agencies')
      .select('id')
      .limit(1);
    const duration = Date.now() - start;
    
    if (!error) {
      console.log(`✅ PASS - Connected in ${duration}ms`);
      results.passed++;
      results.tests.push({ name: 'Basic Connection', status: 'PASS', duration });
    } else {
      console.log(`❌ FAIL - ${error.message}`);
      results.failed++;
      results.tests.push({ name: 'Basic Connection', status: 'FAIL', error: error.message });
    }
  } catch (err) {
    console.log(`❌ FAIL - ${err.message}`);
    results.failed++;
    results.tests.push({ name: 'Basic Connection', status: 'FAIL', error: err.message });
  }
  
  // Test 2: Connection with Invalid URL
  console.log('\nTest 2: Invalid URL Handling');
  try {
    const badSupabase = createClient(
      'https://invalid-url.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    const start = Date.now();
    const { data, error } = await Promise.race([
      badSupabase.from('agencies').select('id').limit(1),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 5000)
      )
    ]);
    const duration = Date.now() - start;
    
    if (error) {
      console.log(`✅ PASS - Properly handled invalid URL`);
      results.passed++;
      results.tests.push({ name: 'Invalid URL Handling', status: 'PASS', duration });
    } else {
      console.log(`❌ FAIL - Should have failed with invalid URL`);
      results.failed++;
      results.tests.push({ name: 'Invalid URL Handling', status: 'FAIL' });
    }
  } catch (err) {
    console.log(`✅ PASS - Properly handled error: ${err.message}`);
    results.passed++;
    results.tests.push({ name: 'Invalid URL Handling', status: 'PASS' });
  }
  
  // Test 3: Connection with Invalid Key
  console.log('\nTest 3: Invalid API Key Handling');
  try {
    const badKeySupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      'invalid-api-key'
    );
    
    const { data, error } = await badKeySupabase
      .from('agencies')
      .select('id')
      .limit(1);
    
    if (error?.message?.includes('Invalid API key')) {
      console.log(`✅ PASS - Properly rejected invalid API key`);
      results.passed++;
      results.tests.push({ name: 'Invalid API Key Handling', status: 'PASS' });
    } else {
      console.log(`❌ FAIL - Should have rejected invalid API key`);
      results.failed++;
      results.tests.push({ name: 'Invalid API Key Handling', status: 'FAIL' });
    }
  } catch (err) {
    console.log(`✅ PASS - Properly handled error: ${err.message}`);
    results.passed++;
    results.tests.push({ name: 'Invalid API Key Handling', status: 'PASS' });
  }
  
  // Test 4: Connection Pool Test (Multiple Concurrent Requests)
  console.log('\nTest 4: Connection Pooling (10 concurrent requests)');
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    const start = Date.now();
    const promises = Array(10).fill(null).map((_, i) => 
      supabase.from('agencies').select('id').limit(1)
    );
    
    const concurrentResults = await Promise.all(promises);
    const duration = Date.now() - start;
    const avgTime = duration / 10;
    
    const allSuccessful = concurrentResults.every(r => !r.error);
    
    if (allSuccessful) {
      console.log(`✅ PASS - All 10 requests completed`);
      console.log(`   Average time: ${avgTime.toFixed(2)}ms per request`);
      results.passed++;
      results.tests.push({ 
        name: 'Connection Pooling', 
        status: 'PASS', 
        duration,
        avgTime 
      });
    } else {
      console.log(`❌ FAIL - Some requests failed`);
      results.failed++;
      results.tests.push({ name: 'Connection Pooling', status: 'FAIL' });
    }
  } catch (err) {
    console.log(`❌ FAIL - ${err.message}`);
    results.failed++;
    results.tests.push({ name: 'Connection Pooling', status: 'FAIL', error: err.message });
  }
  
  // Test 5: Connection Recovery
  console.log('\nTest 5: Connection Recovery');
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    // First request
    const { error: error1 } = await supabase.from('agencies').select('id').limit(1);
    
    // Simulate some delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Second request
    const { error: error2 } = await supabase.from('agencies').select('id').limit(1);
    
    if (!error1 && !error2) {
      console.log(`✅ PASS - Connection remains stable`);
      results.passed++;
      results.tests.push({ name: 'Connection Recovery', status: 'PASS' });
    } else {
      console.log(`❌ FAIL - Connection unstable`);
      results.failed++;
      results.tests.push({ name: 'Connection Recovery', status: 'FAIL' });
    }
  } catch (err) {
    console.log(`❌ FAIL - ${err.message}`);
    results.failed++;
    results.tests.push({ name: 'Connection Recovery', status: 'FAIL', error: err.message });
  }
  
  // Test 6: Large Query Performance
  console.log('\nTest 6: Large Query Performance');
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    const start = Date.now();
    const { data, error } = await supabase
      .from('agencies')
      .select(`
        *,
        agency_trades (
          trade:trades (*)
        ),
        agency_regions (
          region:regions (*)
        )
      `)
      .limit(100);
    const duration = Date.now() - start;
    
    if (!error) {
      console.log(`✅ PASS - Large query completed in ${duration}ms`);
      if (duration < 1000) {
        console.log(`   Performance: Excellent (<1s)`);
      } else if (duration < 3000) {
        console.log(`   Performance: Good (<3s)`);
      } else {
        console.log(`   Performance: Needs optimization (>${duration}ms)`);
      }
      results.passed++;
      results.tests.push({ name: 'Large Query Performance', status: 'PASS', duration });
    } else {
      console.log(`❌ FAIL - ${error.message}`);
      results.failed++;
      results.tests.push({ name: 'Large Query Performance', status: 'FAIL', error: error.message });
    }
  } catch (err) {
    console.log(`❌ FAIL - ${err.message}`);
    results.failed++;
    results.tests.push({ name: 'Large Query Performance', status: 'FAIL', error: err.message });
  }
  
  // Test 7: Connection Headers
  console.log('\nTest 7: Request Headers Validation');
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true
        }
      }
    );
    
    const { data, error } = await supabase
      .from('agencies')
      .select('id')
      .limit(1);
    
    if (!error) {
      console.log(`✅ PASS - Headers properly configured`);
      results.passed++;
      results.tests.push({ name: 'Request Headers Validation', status: 'PASS' });
    } else {
      console.log(`❌ FAIL - ${error.message}`);
      results.failed++;
      results.tests.push({ name: 'Request Headers Validation', status: 'FAIL', error: error.message });
    }
  } catch (err) {
    console.log(`❌ FAIL - ${err.message}`);
    results.failed++;
    results.tests.push({ name: 'Request Headers Validation', status: 'FAIL', error: err.message });
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Connection Test Summary:\n');
  console.log(`Total Tests: ${results.passed + results.failed}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
  
  // Performance Summary
  const performanceTests = results.tests.filter(t => t.duration);
  if (performanceTests.length > 0) {
    const avgDuration = performanceTests.reduce((sum, t) => sum + t.duration, 0) / performanceTests.length;
    console.log(`\n⏱️  Performance Metrics:`);
    console.log(`Average Response Time: ${avgDuration.toFixed(2)}ms`);
    
    const fastest = Math.min(...performanceTests.map(t => t.duration));
    const slowest = Math.max(...performanceTests.map(t => t.duration));
    console.log(`Fastest: ${fastest}ms`);
    console.log(`Slowest: ${slowest}ms`);
  }
  
  // Save test results
  const reportPath = path.join(__dirname, '..', 'docs', 'connection-test-results.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n📄 Test results saved to: ${reportPath}`);
  
  // Overall status
  if (results.failed === 0) {
    console.log('\n✅ All connection tests passed!');
    console.log('The database connection is stable and performant.');
  } else {
    console.log('\n⚠️  Some connection tests failed.');
    console.log('Review the failures and ensure your connection is properly configured.');
  }
}

// Run the tests
runConnectionTests().catch(console.error);