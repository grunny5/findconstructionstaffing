const fs = require('fs');
const path = require('path');

// Load environment variables
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

async function createTables() {
  console.log('🏗️  Creating Supabase tables...\n');
  
  const { createClient } = require('@supabase/supabase-js');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  
  // Read SQL file
  const sqlPath = path.join(__dirname, '..', 'supabase', 'migrations', '001_create_core_tables.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  
  console.log('📄 Executing SQL migration...');
  console.log(`File: ${sqlPath}\n`);
  
  try {
    // Note: The anon key doesn't have permissions to create tables
    // This needs to be run in the Supabase SQL editor
    console.log('⚠️  Important: The anon key cannot create tables directly.');
    console.log('\n📋 Please follow these steps:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to the SQL Editor');
    console.log('3. Copy and paste the following SQL:');
    console.log('\n' + '='.repeat(60));
    console.log(sql);
    console.log('='.repeat(60) + '\n');
    console.log('4. Click "Run" to execute the SQL');
    console.log('\n✅ Once complete, run: node scripts/verify-tables.js');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createTables();