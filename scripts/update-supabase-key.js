const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔑 Supabase Key Update Tool\n');
console.log('Please get your anon key from:');
console.log('1. Go to https://supabase.com/dashboard');
console.log('2. Select your project');
console.log('3. Go to Settings > API');
console.log('4. Copy the "anon public" key (NOT service role)\n');

rl.question('Paste your anon public key here: ', (anonKey) => {
  if (!anonKey || anonKey.length < 100) {
    console.error('\n❌ Invalid key. The anon key should be a long JWT token.');
    rl.close();
    process.exit(1);
  }

  const envPath = path.join(__dirname, '..', '.env.local');
  const envContent = `NEXT_PUBLIC_SUPABASE_URL=https://chyaqualjbhkykgofcov.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=${anonKey.trim()}`;

  fs.writeFileSync(envPath, envContent);
  
  console.log('\n✅ Updated .env.local with new anon key');
  console.log('🔄 Now run: node scripts/test-supabase-connection.js');
  
  rl.close();
});