const { loadEnvironmentVariables, verifyRequiredVariables } = require('./utils/env-loader');

// Load environment variables
loadEnvironmentVariables();

async function verifyTables() {
  console.log('🔍 Verifying Supabase tables...\n');
  
  // Verify required environment variables
  try {
    verifyRequiredVariables(['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY']);
  } catch (error) {
    console.error('❌ ' + error.message);
    console.error('\n📋 Please ensure your .env.local file contains these variables.');
    console.error('   See .env.example for the required format.');
    process.exit(1);
  }
  
  const { createClient } = require('@supabase/supabase-js');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  
  const tables = ['agencies', 'trades', 'regions'];
  let allTablesExist = true;
  
  for (const table of tables) {
    console.log(`Checking ${table} table...`);
    
    try {
      const { data, error } = await supabase
        .from(table)
        .select('id')
        .limit(1);
      
      if (error) {
        if (error.message.includes('does not exist')) {
          console.log(`❌ Table '${table}' does not exist`);
          allTablesExist = false;
        } else if (error.message.includes('permission denied')) {
          console.log(`✅ Table '${table}' exists (RLS not configured yet)`);
        } else {
          console.log(`⚠️  Table '${table}' error: ${error.message}`);
        }
      } else {
        console.log(`✅ Table '${table}' exists and is accessible`);
      }
    } catch (err) {
      console.log(`❌ Error checking ${table}: ${err.message}`);
      allTablesExist = false;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  
  if (allTablesExist) {
    console.log('✅ All core tables are created!');
    console.log('\nTable structure verified:');
    
    // Test inserting sample data
    console.log('\n🧪 Testing data insertion...');
    
    try {
      // Insert test trade
      const { data: trade, error: tradeError } = await supabase
        .from('trades')
        .insert({
          name: 'Test Trade',
          slug: 'test-trade',
          description: 'Test trade for verification'
        })
        .select()
        .single();
      
      if (tradeError) {
        console.log(`⚠️  Cannot insert test data: ${tradeError.message}`);
        console.log('This is expected if RLS is not configured yet.');
      } else {
        console.log('✅ Successfully inserted test trade');
        
        // Clean up test data
        const { error: deleteError } = await supabase
          .from('trades')
          .delete()
          .eq('id', trade.id);
        
        if (deleteError) {
          console.log(`⚠️  Failed to clean up test data: ${deleteError.message}`);
          console.log('   Test data may remain in the database.');
        } else {
          console.log('✅ Test data cleaned up successfully');
        }
      }
    } catch (err) {
      console.log(`⚠️  Test insertion skipped: ${err.message}`);
    }
    
    console.log('\n📋 Next steps:');
    console.log('1. Run Task 2.2 to create relationship tables');
    console.log('2. Run Task 2.3 to add performance indexes');
    console.log('3. Run Task 3.1 to enable RLS');
  } else {
    console.log('❌ Some tables are missing!');
    console.log('\nPlease run the SQL migration in Supabase:');
    console.log('1. Go to SQL Editor in Supabase dashboard');
    console.log('2. Run the SQL from: supabase/migrations/001_create_core_tables.sql');
  }
}

verifyTables();