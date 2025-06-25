const fs = require('fs');
const path = require('path');

console.log('🔒 Applying Row Level Security\n');

// Read the RLS migration
const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250625_004_enable_rls.sql');
const sql = fs.readFileSync(migrationPath, 'utf8');

console.log('📋 Please run this SQL in your Supabase dashboard:\n');
console.log('1. Go to: https://supabase.com/dashboard/project/chyaqualjbhkykgofcov');
console.log('2. Navigate to SQL Editor');
console.log('3. Copy and paste the following SQL:\n');
console.log('='.repeat(60));
console.log(sql);
console.log('='.repeat(60));
console.log('\n4. Click "Run" to enable RLS on all tables');
console.log('\n⚠️  IMPORTANT: After running this, tables will be secured!');
console.log('You must run Task 3.2 next to create read policies.');