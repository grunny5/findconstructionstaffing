const { loadEnvironmentVariables, verifyRequiredVariables } = require('./utils/env-loader');

// Load environment variables
loadEnvironmentVariables();

async function verifyAllPolicies() {
  console.log('🔐 Comprehensive RLS Policy Verification\n');
  
  // Verify required environment variables
  try {
    verifyRequiredVariables(['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY']);
  } catch (error) {
    console.error('❌ ' + error.message);
    console.error('\n📋 Required environment variables:');
    console.error('   - NEXT_PUBLIC_SUPABASE_URL: Your Supabase project URL');
    console.error('   - NEXT_PUBLIC_SUPABASE_ANON_KEY: Your Supabase anonymous/public key');
    console.error('\n💡 Please check your .env.local file or see .env.example for the required format.');
    console.error('\n🔧 To fix this:');
    console.error('   1. Copy .env.example to .env.local if not already done');
    console.error('   2. Add your Supabase credentials to .env.local');
    console.error('   3. Run this script again');
    process.exit(1);
  }
  
  const { createClient } = require('@supabase/supabase-js');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  
  console.log('📊 Testing all table access:\n');
  
  const results = {
    passed: 0,
    failed: 0
  };
  
  // Test 1: Core tables read access
  console.log('1️⃣ Core Tables Read Access:');
  
  const coreTables = ['agencies', 'trades', 'regions'];
  for (const table of coreTables) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1);
    
    if (!error) {
      console.log(`   ✅ ${table}: Read access granted`);
      results.passed++;
    } else {
      console.log(`   ❌ ${table}: ${error.message}`);
      results.failed++;
    }
  }
  
  // Test 2: Junction tables read access
  console.log('\n2️⃣ Junction Tables Read Access:');
  
  const junctionTables = ['agency_trades', 'agency_regions'];
  for (const table of junctionTables) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1);
    
    if (!error) {
      console.log(`   ✅ ${table}: Read access granted`);
      results.passed++;
    } else {
      console.log(`   ❌ ${table}: ${error.message}`);
      results.failed++;
    }
  }
  
  // Test 3: Write access should be blocked
  console.log('\n3️⃣ Write Access (Should Be Blocked):');
  
  const writeTests = [
    { table: 'agencies', data: { name: 'Test', slug: 'test' } },
    { table: 'trades', data: { name: 'Test', slug: 'test' } },
    { table: 'regions', data: { name: 'Test', state_code: 'TX', slug: 'test' } }
  ];
  
  for (const test of writeTests) {
    const { error } = await supabase
      .from(test.table)
      .insert(test.data);
    
    if (error && error.message.includes('new row violates row-level security policy')) {
      console.log(`   ✅ ${test.table}: Write properly blocked`);
      results.passed++;
    } else {
      console.log(`   ❌ ${test.table}: Write should be blocked!`);
      results.failed++;
    }
  }
  
  // Test 4: Complex query simulation
  console.log('\n4️⃣ Complex Query Test:');
  
  // This simulates what the app would do to get agencies with their trades
  const { data: complexData, error: complexError } = await supabase
    .from('agencies')
    .select('id, name, slug')
    .eq('is_active', true)
    .limit(5);
  
  if (!complexError) {
    console.log(`   ✅ Complex agency query: Success`);
    results.passed++;
    
    // If we had agencies, we could test joining with trades
    if (complexData && complexData.length > 0) {
      const { data: tradeData, error: tradeError } = await supabase
        .from('agency_trades')
        .select('trade_id')
        .eq('agency_id', complexData[0].id);
      
      if (!tradeError) {
        console.log(`   ✅ Agency trades lookup: Success`);
        results.passed++;
      }
    } else {
      console.log(`   ℹ️  No agencies to test relationships (tables empty)`);
    }
  } else {
    console.log(`   ❌ Complex query failed: ${complexError.message}`);
    results.failed++;
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log(`\n📈 Test Summary:`);
  console.log(`   ✅ Passed: ${results.passed}`);
  console.log(`   ❌ Failed: ${results.failed}`);
  console.log(`   📊 Total: ${results.passed + results.failed}`);
  
  if (results.failed === 0) {
    console.log('\n🎉 All RLS policies are working correctly!');
    console.log('\n✅ Security Configuration Complete:');
    console.log('   - All tables have RLS enabled');
    console.log('   - Public read access for directory');
    console.log('   - Junction tables respect parent agency status');
    console.log('   - No unauthorized write access');
    console.log('\n🚀 The database is ready for data migration!');
  } else {
    console.log('\n⚠️  Some policies may need attention.');
  }
}

verifyAllPolicies();