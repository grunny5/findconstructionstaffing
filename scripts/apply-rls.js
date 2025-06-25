const fs = require('fs');
const path = require('path');

console.log('🔒 Applying Row Level Security\n');

// Read the RLS migration
const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250625_004_enable_rls.sql');

// Check if migration file exists
if (!fs.existsSync(migrationPath)) {
  console.error('❌ Error: Migration file not found!');
  console.error(`   Expected location: ${migrationPath}`);
  console.error('\n📋 Please ensure you have the correct migration file:');
  console.error('   - File should be in: supabase/migrations/');
  console.error('   - File name: 20250625_004_enable_rls.sql');
  console.error('\n💡 If the file is missing, you may need to:');
  console.error('   1. Check if the file name is correct');
  console.error('   2. Ensure all migration files are present');
  console.error('   3. Run git pull to get the latest files');
  process.exit(1);
}

let sql;
try {
  sql = fs.readFileSync(migrationPath, 'utf8');
} catch (error) {
  console.error('❌ Error reading migration file:', error.message);
  console.error(`   File path: ${migrationPath}`);
  console.error('\n📋 Possible causes:');
  console.error('   - File permissions issue');
  console.error('   - File is corrupted or empty');
  console.error('   - Disk read error');
  process.exit(1);
}

console.log('📋 Please run this SQL in your Supabase dashboard:\n');
console.log('1. Go to your Supabase project dashboard');
console.log('2. Navigate to SQL Editor');
console.log('3. Copy and paste the following SQL:\n');
console.log('='.repeat(60));
console.log(sql);
console.log('='.repeat(60));
console.log('\n4. Click "Run" to enable RLS on all tables');
console.log('\n⚠️  IMPORTANT: After running this, tables will be secured!');
console.log('You must run Task 3.2 next to create read policies.');