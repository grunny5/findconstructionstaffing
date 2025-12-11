const fs = require('fs');
const path = require('path');

// Check if debug mode is explicitly enabled
const DEBUG_UNSAFE =
  process.env.DEBUG_ENV_UNSAFE === 'true' || process.argv.includes('--unsafe');
const SHOW_VALUES =
  process.env.DEBUG_ENV_VALUES === 'true' ||
  process.argv.includes('--show-values');

const envPath = path.join(__dirname, '..', '.env.local');

console.log('🔍 Debugging .env.local file...\n');
console.log(`📁 File path: ${envPath}`);

// Known sensitive keys that should always be masked
const SENSITIVE_PATTERNS = [
  /KEY/i,
  /SECRET/i,
  /PASSWORD/i,
  /TOKEN/i,
  /PRIVATE/i,
  /CREDENTIAL/i,
  /AUTH/i,
  /API/i,
];

// Function to mask sensitive values
function maskValue(key, value) {
  // Don't mask if user explicitly requested values
  if (SHOW_VALUES) {
    return value;
  }

  // Check if key matches any sensitive pattern
  const isSensitive = SENSITIVE_PATTERNS.some((pattern) => pattern.test(key));

  if (isSensitive && value) {
    // Show first 4 and last 4 characters for debugging
    if (value.length > 8) {
      return `${value.substring(0, 4)}...${value.substring(value.length - 4)}`;
    } else {
      return '***MASKED***';
    }
  }

  return value;
}

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');

  // Only show raw content if explicitly requested
  if (DEBUG_UNSAFE) {
    console.log(
      '\n⚠️  WARNING: Showing raw file content (DEBUG_ENV_UNSAFE=true)'
    );
    console.log('\n📄 Raw file content (with escape characters):');
    console.log(JSON.stringify(content));

    console.log('\n🔍 Hex dump of first 200 characters:');
    const hexDump = Buffer.from(content.substring(0, 200)).toString('hex');
    console.log(hexDump);
  } else {
    console.log(
      '\n💡 Tip: Use DEBUG_ENV_UNSAFE=true or --unsafe to see raw content'
    );
    console.log(
      '         Use DEBUG_ENV_VALUES=true or --show-values to see unmasked values'
    );
  }

  console.log('\n📋 Environment variables found:');
  const lines = content.split(/\r?\n/);
  let varCount = 0;

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();

    // Skip empty lines and comments
    if (!trimmedLine || trimmedLine.startsWith('#')) {
      return;
    }

    // Parse KEY=VALUE format
    const equalIndex = trimmedLine.indexOf('=');
    if (equalIndex > 0) {
      varCount++;
      const key = trimmedLine.substring(0, equalIndex).trim();
      const value = trimmedLine.substring(equalIndex + 1).trim();
      const maskedValue = maskValue(key, value);

      console.log(`  ${key} = ${maskedValue}`);

      // Additional validation
      if (!value) {
        console.log(`    ⚠️  Warning: Empty value`);
      }
      if (
        value.includes(' ') &&
        !value.startsWith('"') &&
        !value.startsWith("'")
      ) {
        console.log(`    ⚠️  Warning: Value contains spaces but is not quoted`);
      }
    } else {
      console.log(`  Line ${index + 1}: Invalid format - "${trimmedLine}"`);
    }
  });

  console.log(`\n✅ Found ${varCount} environment variables`);

  // Check for required Supabase variables
  console.log('\n🔍 Checking required Supabase variables:');
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];
  const foundVars = lines
    .filter((line) => line.includes('='))
    .map((line) => line.split('=')[0].trim());

  requiredVars.forEach((varName) => {
    if (foundVars.includes(varName)) {
      console.log(`  ✅ ${varName} is present`);
    } else {
      console.log(`  ❌ ${varName} is missing`);
    }
  });
} else {
  console.log('❌ .env.local file not found!');
  console.log('\n💡 Create .env.local with:');
  console.log('   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url');
  console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key');
}
