// Manually load environment variables
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    line = line.trim();
    if (!line || line.startsWith('#')) return;
    
    const equalIndex = line.indexOf('=');
    if (equalIndex > 0) {
      const key = line.substring(0, equalIndex).trim();
      const value = line.substring(equalIndex + 1).trim();
      process.env[key] = value;
    }
  });
}

async function testSupabaseClient() {
  console.log('🔍 Testing Supabase with client library...\n');
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log('📋 Configuration:');
  console.log(`URL: ${url}`);
  console.log(`Key: ${key ? key.substring(0, 50) + '...' : 'NOT SET'}\n`);
  
  try {
    const { createClient } = require('@supabase/supabase-js');
    
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