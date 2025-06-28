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
  
  // Function to decode Base64URL to Base64
  function base64urlToBase64(base64url) {
    // Replace Base64URL characters with Base64 characters
    let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
    
    // Add padding if necessary
    const padding = base64.length % 4;
    if (padding) {
      base64 += '='.repeat(4 - padding);
    }
    
    return base64;
  }
  
  // Decode header
  let header;
  try {
    const base64Header = base64urlToBase64(parts[0]);
    header = JSON.parse(Buffer.from(base64Header, 'base64').toString());
    console.log(`- Algorithm: ${header.alg || 'Not specified'}`);
    console.log(`- Type: ${header.typ || 'Not specified'}`);
  } catch (e) {
    throw new Error(`Failed to decode JWT header: ${e.message}`);
  }
  
  // Decode payload
  let payload;
  try {
    const base64Payload = base64urlToBase64(parts[1]);
    payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString());
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

// Track if any critical errors occurred
let hasErrors = false;

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
        
        // Handle different status codes
        if (res.statusCode === 401) {
          console.log('  ❌ Unauthorized: Invalid API key or JWT token');
          hasErrors = true;
        } else if (res.statusCode === 403) {
          console.log('  ❌ Forbidden: Access denied to this resource');
          hasErrors = true;
        } else if (res.statusCode === 404) {
          console.log('  ⚠️  Not Found: Resource does not exist (this may be expected)');
        } else if (res.statusCode === 200) {
          // Parse response to check for errors even with 200 status
          try {
            const responseData = JSON.parse(data);
            
            // Check for error in response body
            if (responseData.error) {
              console.log(`  ❌ Error in response: ${responseData.error}`);
              hasErrors = true;
            } else if (responseData.message && responseData.message.includes('Unauthorized')) {
              console.log(`  ❌ Unauthorized response: ${responseData.message}`);
              hasErrors = true;
            } else if (Array.isArray(responseData) && responseData.length === 0) {
              console.log('  ✅ Success (empty array - table may be empty)');
            } else if (responseData.status === 'ok' || responseData.healthy === true) {
              console.log('  ✅ Success (health check passed)');
            } else {
              console.log('  ✅ Success');
            }
          } catch (e) {
            // If response is not JSON, show preview
            const preview = data.length > 100 ? data.substring(0, 100) + '...' : data;
            console.log(`  ⚠️  Non-JSON response: ${preview}`);
          }
        } else {
          // Other status codes
          const preview = data.length > 100 ? data.substring(0, 100) + '...' : data;
          console.log(`  Response: ${preview}`);
          
          if (res.statusCode >= 500) {
            console.log('  ❌ Server error');
            hasErrors = true;
          }
        }
        
        console.log('');
        resolve();
      });
    });

    req.on('error', (error) => {
      console.log(`${description}: ❌ Network error: ${error.message}\n`);
      hasErrors = true;
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
  
  if (hasErrors) {
    console.log('❌ Diagnostic found critical errors!\n');
    console.log('📌 Next Steps:');
    console.log('1. If you see 401 errors, verify your anon key in Supabase dashboard');
    console.log('2. If the URL/Key don\'t match, check you\'re using the right project');
    console.log('3. Check that your Supabase project is active and not paused');
    console.log('4. Ensure environment variables are correctly set');
    
    // Exit with error code for CI
    process.exit(1);
  } else {
    console.log('✅ All diagnostics passed!\n');
    console.log('📌 Next Steps:');
    console.log('1. If agencies table returned 404, run database migrations');
    console.log('2. Your Supabase connection is properly configured');
  }
})();