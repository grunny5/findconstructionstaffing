const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log('🔑 Supabase Key Update Tool\n');
console.log('Please get your anon key from:');
console.log('1. Go to https://supabase.com/dashboard');
console.log('2. Select your project');
console.log('3. Go to Settings > API');
console.log('4. Copy the "anon public" key (NOT service role)\n');

rl.question('Paste your anon public key here: ', (anonKey) => {
  // Trim the key to remove any whitespace
  const trimmedKey = anonKey ? anonKey.trim() : '';

  // Validate JWT structure: should have 3 parts separated by dots
  const jwtParts = trimmedKey.split('.');
  const isValidJWT =
    jwtParts.length === 3 &&
    jwtParts.every((part) => part.length > 0 && /^[A-Za-z0-9_-]+$/.test(part));

  if (!trimmedKey || !isValidJWT) {
    console.error('\n❌ Invalid JWT token format.');
    console.error(
      '   The anon key should be a JWT token with 3 parts separated by dots.'
    );
    console.error('   Example format: xxxxx.yyyyy.zzzzz');
    console.error(
      '   Each part should only contain base64url characters (A-Z, a-z, 0-9, _, -)'
    );
    rl.close();
    process.exit(1);
  }

  // Additional validation: try to decode the header and payload
  try {
    const header = JSON.parse(Buffer.from(jwtParts[0], 'base64').toString());
    const payload = JSON.parse(Buffer.from(jwtParts[1], 'base64').toString());

    // Verify it looks like a Supabase token
    if (!payload.role || !payload.ref) {
      console.error(
        "\n⚠️  Warning: This doesn't appear to be a valid Supabase anon key."
      );
      console.error(
        '   Missing expected fields (role, ref) in the JWT payload.'
      );
    }
  } catch (e) {
    console.error(
      '\n⚠️  Warning: Could not decode JWT token. It may be malformed.'
    );
  }

  console.log(
    '\n⚠️  Note: This script is outdated. Please update your .env.local manually.'
  );
  console.log(
    '   Copy .env.local.template to .env.local and add your Supabase credentials.'
  );
  rl.close();
  process.exit(0);

  // The code below is kept for reference but should not be used
  const envPath = path.join(__dirname, '..', '.env.local');
  const envContent = `NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=${trimmedKey}`;

  try {
    fs.writeFileSync(envPath, envContent);
    console.log('\n✅ Updated .env.local with new anon key');
    console.log('🔄 Now run: node scripts/test-supabase-connection.js');
  } catch (error) {
    console.error('\n❌ Failed to write to .env.local file:', error.message);
    console.error(
      '   Please check file permissions and ensure the directory is writable.'
    );
    rl.close();
    process.exit(1);
  }

  rl.close();
});
