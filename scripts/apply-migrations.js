const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔄 Applying Supabase Migrations\n');

// Check if Supabase CLI is available
try {
  execSync('supabase --version', { stdio: 'ignore' });
} catch (error) {
  console.error('❌ Supabase CLI is not installed');
  console.log('Run: npm install -g supabase');
  process.exit(1);
}

// Check if project is linked
try {
  const status = execSync('supabase status', { encoding: 'utf8' });
  console.log('✅ Connected to Supabase project\n');
} catch (error) {
  console.error('❌ Project is not linked');
  console.log('Run: supabase link --project-ref chyaqualjbhkykgofcov');
  process.exit(1);
}

// Apply migrations
console.log('📤 Pushing migrations to database...\n');

try {
  const output = execSync('supabase db push', { encoding: 'utf8' });
  console.log(output);
  console.log('\n✅ Migrations applied successfully!');
  
  // Generate TypeScript types
  console.log('\n🔧 Generating TypeScript types...');
  try {
    execSync('supabase gen types typescript --local > lib/database.types.ts');
    console.log('✅ TypeScript types generated in lib/database.types.ts');
  } catch (typeError) {
    console.log('⚠️  Could not generate types:', typeError.message);
  }
  
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  console.log('\nTroubleshooting:');
  console.log('1. Check your database password is correct');
  console.log('2. Ensure you have the latest migrations in supabase/migrations/');
  console.log('3. Try running: supabase db reset (WARNING: This will delete all data)');
}