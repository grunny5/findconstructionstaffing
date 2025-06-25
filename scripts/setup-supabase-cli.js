const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Supabase CLI Setup\n');

// Check if supabase CLI is installed
try {
  const version = execSync('supabase --version', { encoding: 'utf8' });
  console.log('✅ Supabase CLI is already installed');
  console.log(`   Version: ${version.trim()}`);
} catch (error) {
  console.log('❌ Supabase CLI is not installed\n');
  console.log('📋 Installation Instructions:\n');
  
  console.log('Option 1: Using npm (Recommended)');
  console.log('```bash');
  console.log('npm install -g supabase');
  console.log('```\n');
  
  console.log('Option 2: Download from GitHub');
  console.log('Visit: https://github.com/supabase/cli/releases');
  console.log('Download the appropriate version for your OS\n');
  
  console.log('After installation, run this script again.');
  process.exit(1);
}

// Check if already initialized
if (fs.existsSync(path.join(__dirname, '..', 'supabase', 'config.toml'))) {
  console.log('\n✅ Supabase is already initialized in this project');
  
  // Check if linked
  try {
    const projectStatus = execSync('supabase status', { encoding: 'utf8' });
    console.log('\n📊 Project Status:');
    console.log(projectStatus);
  } catch (error) {
    console.log('\n⚠️  Project is not linked yet');
    console.log('\nTo link your project, run:');
    console.log('```bash');
    console.log('supabase link --project-ref chyaqualjbhkykgofcov');
    console.log('```');
  }
} else {
  console.log('\n📋 Next Steps:\n');
  
  console.log('1. Login to Supabase:');
  console.log('   supabase login\n');
  
  console.log('2. Initialize Supabase in this project:');
  console.log('   supabase init\n');
  
  console.log('3. Link to your remote project:');
  console.log('   supabase link --project-ref chyaqualjbhkykgofcov\n');
  
  console.log('4. Push the migration:');
  console.log('   supabase db push\n');
}

console.log('\n📚 Useful Supabase CLI Commands:');
console.log('- supabase status        # Check connection status');
console.log('- supabase db push       # Apply migrations to remote database');
console.log('- supabase db reset      # Reset database to initial state');
console.log('- supabase gen types     # Generate TypeScript types');
console.log('- supabase start         # Start local development stack');
console.log('- supabase stop          # Stop local development stack');