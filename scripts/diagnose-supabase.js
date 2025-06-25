const fs = require('fs');
const path = require('path');
const https = require('https');

// Load environment variables
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  line = line.trim();
  if (!line || line.startsWith('#')) return;
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

console.log('🔍 Supabase Configuration Diagnostic\n');

// Check environment variables
console.log('📋 Environment Variables:');
console.log(`URL: ${envVars.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET'}`);
console.log(`Key length: ${envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY ? envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY.length : 0} characters`);
console.log(`Key preview: ${envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY ? envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 50) + '...' : 'NOT SET'}\n`);

// Decode the JWT to check its contents
if (envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  try {
    const parts = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      console.log('🔐 JWT Token Analysis:');
      console.log(`- Role: ${payload.role}`);
      console.log(`- Ref: ${payload.ref}`);
      console.log(`- Issued: ${new Date(payload.iat * 1000).toISOString()}`);
      console.log(`- Expires: ${new Date(payload.exp * 1000).toISOString()}`);
      
      // Check if ref matches URL
      const urlMatch = envVars.NEXT_PUBLIC_SUPABASE_URL.includes(payload.ref);
      console.log(`- URL/Key Match: ${urlMatch ? '✅ Yes' : '❌ No'}`);
      
      if (!urlMatch) {
        console.log('\n⚠️  WARNING: The project ref in the JWT doesn\'t match the URL!');
        console.log(`   URL contains: ${envVars.NEXT_PUBLIC_SUPABASE_URL}`);
        console.log(`   JWT ref: ${payload.ref}`);
      }
    }
  } catch (e) {
    console.log('❌ Could not decode JWT token');
  }
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