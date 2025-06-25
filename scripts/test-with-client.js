const { createClient } = require('@supabase/supabase-js');
const { loadEnvironmentVariables } = require('./utils/env-loader');

// Load environment variables
loadEnvironmentVariables();

async function testSupabaseClient() {
  console.log('🔍 Testing Supabase with client library...\n');
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log('📋 Configuration:');
  console.log(`URL: ${url}`);
  console.log(`Key: ${key ? key.substring(0, 50) + '...' : 'NOT SET'}\n`);
  
  try {
    console.log('✅ Supabase client library loaded\n');
    
    // Create client
    const supabase = createClient(url, key);
    
    console.log('🔄 Testing connection...');
    
    // Try a simple query
    const { data, error } = await supabase
      .from('test_connection')
      .select('*')
      .limit(1);
    
    if (error) {
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        console.log('\n✅ Connection successful!');
        console.log('ℹ️  Table does not exist (which is expected)');
        console.log('\n🎉 Your Supabase connection is working correctly!');
        console.log('\nNext step: Create the database tables (Task 2.1)');
      } else if (error.message.includes('Invalid API key')) {
        console.log('\n❌ Authentication failed');
        console.log('Error:', error.message);
        console.log('\nPlease check your anon key in the Supabase dashboard');
      } else {
        console.log('\n❌ Unexpected error');
        console.log('Error:', error.message);
      }
    } else {
      console.log('\n✅ Connection successful!');
      console.log('Data:', data);
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    if (error.message.includes('Cannot find module')) {
      console.log('\nThe Supabase client is not installed. Run:');
      console.log('npm install');
    }
  }
}

testSupabaseClient();