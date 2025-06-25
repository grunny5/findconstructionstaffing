const { execSync } = require('child_process');
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

// Extract project reference from Supabase URL
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || 'your-project-ref';

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
  console.log(`Run: supabase link --project-ref ${projectRef}`);
  process.exit(1);
}

// Apply migrations
console.log('📤 Pushing migrations to database...\n');

try {
  const output = execSync('supabase db push', { encoding: 'utf8' });
  console.log(output);
  console.log('\n✅ Migrations applied successfully!');
  
  // Generate TypeScript types from remote database
  console.log('\n🔧 Generating TypeScript types from remote database...');
  try {
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