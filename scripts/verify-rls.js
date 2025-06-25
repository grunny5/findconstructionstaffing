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

async function verifyRLS() {
  console.log('🔒 Verifying Row Level Security...\n');
  
  const { createClient } = require('@supabase/supabase-js');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  
  const tables = [
    { name: 'agencies', type: 'core' },
    { name: 'trades', type: 'core' },
    { name: 'regions', type: 'core' },
    { name: 'agency_trades', type: 'junction' },
    { name: 'agency_regions', type: 'junction' }
  ];
  
  let rlsEnabled = 0;
  let accessDenied = 0;
  
  console.log('📊 Checking RLS status on all tables:\n');
  
  for (const table of tables) {
    console.log(`Table: ${table.name} (${table.type})`);
    
    try {
      const { data, error } = await supabase
        .from(table.name)
        .select('*')
        .limit(1);
      
      if (error) {
        if (error.message.includes('permission denied') || 
            error.message.includes('new row violates row-level security policy')) {
          console.log(`✅ RLS is ENABLED - Access denied as expected`);
          rlsEnabled++;
          accessDenied++;
        } else {
          console.log(`⚠️  Unexpected error: ${error.message}`);
        }
      } else {
        console.log(`❌ RLS might be DISABLED - Query succeeded without policies`);
        console.log(`   Found ${data.length} rows`);
      }
    } catch (err) {
      console.log(`❌ Error: ${err.message}`);
    }
    
    console.log('');
  }
  
  console.log('='.repeat(60));
  console.log('\n📈 Summary:');
  console.log(`- Tables checked: ${tables.length}`);
  console.log(`- RLS confirmed enabled: ${rlsEnabled}`);
  console.log(`- Access properly denied: ${accessDenied}`);
  
  if (accessDenied === tables.length) {
    console.log('\n✅ SUCCESS: All tables are secured with RLS!');
    console.log('\n🔐 Security Status:');
    console.log('- All tables have RLS enabled');
    console.log('- No unauthorized access possible');
    console.log('- Ready for policy creation (Task 3.2)');
  } else {
    console.log('\n⚠️  WARNING: Not all tables are properly secured!');
    console.log('Please run the RLS migration in SQL Editor.');
  }
  
  console.log('\n📋 Next Steps:');
  console.log('1. If RLS is not enabled, run the SQL from apply-rls.js');
  console.log('2. Once RLS is enabled, proceed to Task 3.2');
  console.log('3. Task 3.2 will create policies to allow public read access');
}

verifyRLS();