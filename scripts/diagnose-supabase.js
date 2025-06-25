const https = require('https');
const { loadEnvironmentVariables, verifyRequiredVariables } = require('./utils/env-loader');

// Load environment variables
loadEnvironmentVariables();

console.log('🔍 Supabase Configuration Diagnostic\n');

// Validate required environment variables
try {
  verifyRequiredVariables(['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY']);
} catch (error) {
  console.error('❌ ' + error.message);
  console.error('\n📋 Required environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL: Your Supabase project URL');
  console.error('   - NEXT_PUBLIC_SUPABASE_ANON_KEY: Your Supabase anonymous/public key');
  console.error('\n💡 Please check your .env.local file or see .env.example for the required format.');
  process.exit(1);
}

// Store env vars for easier access
const envVars = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
};

// Check environment variables
console.log('📋 Environment Variables:');
console.log(`URL: ${envVars.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET'}`);
console.log(`Key length: ${envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY ? envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY.length : 0} characters`);
console.log(`Key preview: ${envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY ? envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 50) + '...' : 'NOT SET'}\n`);

// Decode and validate the JWT token
console.log('\n🔐 JWT Token Analysis:');
try {
  const token = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  // Validate JWT structure
  if (!token || typeof token !== 'string') {
    throw new Error('Token is not a valid string');
  }
  
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error(`Invalid JWT structure: expected 3 parts, got ${parts.length}`);
  }
  
  // Validate each part is non-empty
  if (parts.some(part => !part || part.length === 0)) {
    throw new Error('JWT contains empty parts');
  }
  
  // Decode header
  let header;
  try {
    header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
    console.log(`- Algorithm: ${header.alg || 'Not specified'}`);
    console.log(`- Type: ${header.typ || 'Not specified'}`);
  } catch (e) {
    throw new Error(`Failed to decode JWT header: ${e.message}`);
  }
  
  // Decode payload
  let payload;
  try {
    payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
  } catch (e) {
    throw new Error(`Failed to decode JWT payload: ${e.message}`);
  }
  
  // Validate payload structure
  if (!payload || typeof payload !== 'object') {
    throw new Error('JWT payload is not a valid object');
  }
  
  // Display payload information
  console.log(`- Role: ${payload.role || 'Not specified'}`);
  console.log(`- Project Ref: ${payload.ref || 'Not specified'}`);
  
  if (payload.iat) {
    const issuedDate = new Date(payload.iat * 1000);
    console.log(`- Issued: ${issuedDate.toISOString()}`);
  } else {
    console.log('- Issued: Not specified');
  }
  
  if (payload.exp) {
    const expiryDate = new Date(payload.exp * 1000);
    const isExpired = expiryDate < new Date();
    console.log(`- Expires: ${expiryDate.toISOString()} ${isExpired ? '❌ EXPIRED' : '✅ Valid'}`);
    
    if (isExpired) {
      console.log('\n⚠️  WARNING: Your JWT token has expired!');
      console.log('   Please generate a new anon key from your Supabase dashboard.');
    }
  } else {
    console.log('- Expires: Never');
  }
  
  // Validate signature exists
  if (!parts[2] || parts[2].length === 0) {
    console.log('- Signature: ❌ Missing');
    console.log('\n⚠️  WARNING: JWT has no signature!');
  } else {
    console.log('- Signature: ✅ Present');
  }
  
  // Check if ref matches URL
  if (payload.ref) {
    const urlMatch = envVars.NEXT_PUBLIC_SUPABASE_URL.includes(payload.ref);
    console.log(`- URL/Key Match: ${urlMatch ? '✅ Yes' : '❌ No'}`);
    
    if (!urlMatch) {
      console.log('\n⚠️  WARNING: The project ref in the JWT doesn\'t match the URL!');
      console.log(`   URL contains: ${envVars.NEXT_PUBLIC_SUPABASE_URL}`);
      console.log(`   JWT ref: ${payload.ref}`);
      console.log('   This will cause authentication failures.');
    }
  } else {
    console.log('- URL/Key Match: ⚠️  Cannot verify (no ref in token)');
  }
  
} catch (error) {
  console.log(`❌ JWT validation failed: ${error.message}`);
  console.log('\n💡 This may indicate:');
  console.log('   - The anon key is malformed or corrupted');
  console.log('   - The key was incorrectly copied from Supabase dashboard');
  console.log('   - The environment variable contains extra characters or formatting');
}

// Test different endpoints
console.log('\n🔄 Testing API Endpoints...\n');

async function testEndpoint(path, description) {
  return new Promise((resolve) => {
    const url = new URL(envVars.NEXT_PUBLIC_SUPABASE_URL);
    const options = {
      hostname: url.hostname,
      path: path,
      method: 'GET',
      headers: {
        'apikey': envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`${description}:`);
        console.log(`  Status: ${res.statusCode}`);
        if (res.statusCode !== 200 && data) {
          const preview = data.length > 100 ? data.substring(0, 100) + '...' : data;
          console.log(`  Response: ${preview}`);
        }
        console.log('');
        resolve();
      });
    });

    req.on('error', (error) => {
      console.log(`${description}: ❌ ${error.message}\n`);
      resolve();
    });

    req.end();
  });
}

// Run tests
(async () => {
  await testEndpoint('/rest/v1/', 'REST API Root');
  await testEndpoint('/auth/v1/health', 'Auth Health Check');
  await testEndpoint('/rest/v1/agencies', 'Agencies Table (may not exist yet)');
  
  console.log('📌 Next Steps:');
  console.log('1. If you see 401 errors, verify your anon key in Supabase dashboard');
  console.log('2. If the URL/Key don\'t match, check you\'re using the right project');
  console.log('3. If all endpoints fail, check your internet connection');
})();