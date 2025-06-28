const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { loadEnvironmentVariables, extractProjectReference } = require('./utils/env-loader');

// Load environment variables using the centralized utility
loadEnvironmentVariables();

// Get project reference using the utility function
const projectRef = process.env.SUPABASE_PROJECT_REF || 
                  extractProjectReference(process.env.NEXT_PUBLIC_SUPABASE_URL) ||
                  'your-project-ref';

console.log('🔄 Applying Supabase Migrations\n');

// Display project reference info
if (projectRef === 'your-project-ref') {
  console.log('⚠️  Project reference not found in environment');
  console.log('   Please set SUPABASE_PROJECT_REF in your .env.local file');
  console.log('   or ensure NEXT_PUBLIC_SUPABASE_URL is set correctly\n');
} else {
  console.log(`📌 Project Reference: ${projectRef}\n`);
}

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
  console.log(`Run: supabase link --project-ref ${projectRef}`);
  process.exit(1);
}

// Apply migrations
console.log('📤 Pushing migrations to database...\n');

try {
  // Use --non-interactive flag to prevent hanging in CI environments
  const output = execSync('supabase db push --non-interactive', { encoding: 'utf8' });
  console.log(output);
  console.log('\n✅ Migrations applied successfully!');
  
  // Generate TypeScript types from remote database
  console.log('\n🔧 Generating TypeScript types from remote database...');
  try {
    // Ensure lib directory exists
    const libDir = path.join(process.cwd(), 'lib');
    if (!fs.existsSync(libDir)) {
      fs.mkdirSync(libDir, { recursive: true });
      console.log('📁 Created lib directory');
    }
    
    // First, pull the latest schema from remote to ensure accuracy
    console.log('📥 Pulling latest schema from remote database...');
    execSync('supabase db pull', { encoding: 'utf8' });
    
    // Generate types from the remote database schema
    execSync(`supabase gen types typescript --project-ref ${projectRef} > lib/database.types.ts`);
    console.log('✅ TypeScript types generated from remote database in lib/database.types.ts');
  } catch (typeError) {
    console.log('⚠️  Could not generate types:', typeError.message);
    console.log('Falling back to local schema generation...');
    try {
      // Ensure lib directory exists for fallback case too
      const libDir = path.join(process.cwd(), 'lib');
      if (!fs.existsSync(libDir)) {
        fs.mkdirSync(libDir, { recursive: true });
        console.log('📁 Created lib directory');
      }
      execSync('supabase gen types typescript --local > lib/database.types.ts');
      console.log('✅ TypeScript types generated from local schema');
    } catch (localError) {
      console.log('❌ Type generation failed:', localError.message);
    }
  }
  
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  console.log('\nTroubleshooting:');
  console.log('1. Check your database password is correct');
  console.log('2. Ensure you have the latest migrations in supabase/migrations/');
  console.log('3. Try running: supabase db reset (WARNING: This will delete all data)');
}