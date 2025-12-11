const fs = require('fs');
const path = require('path');

// Load environment variables using dotenv if available, otherwise fall back to manual parsing
try {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
} catch (error) {
  // dotenv not available, fall back to manual parsing
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach((line) => {
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
}

async function createTables() {
  console.log('🏗️  Creating Supabase tables...\n');

  // Validate required environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing required environment variables:');
    if (!supabaseUrl) {
      console.error('   - NEXT_PUBLIC_SUPABASE_URL is not set');
    }
    if (!supabaseAnonKey) {
      console.error('   - NEXT_PUBLIC_SUPABASE_ANON_KEY is not set');
    }
    console.error(
      '\n📋 Please ensure your .env.local file contains these variables.'
    );
    console.error('   See .env.example for the required format.');
    process.exit(1);
  }

  const { createClient } = require('@supabase/supabase-js');

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Read SQL file
  const sqlPath = path.join(
    __dirname,
    '..',
    'supabase',
    'migrations',
    '001_create_core_tables.sql'
  );
  let sql;

  try {
    sql = fs.readFileSync(sqlPath, 'utf8');
  } catch (error) {
    console.error('❌ Error reading SQL migration file:', error.message);
    console.error(`   File path: ${sqlPath}`);
    console.error('   Please ensure the migration file exists.');
    process.exit(1);
  }

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
