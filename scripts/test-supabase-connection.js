#!/usr/bin/env node

/**
 * Test script to verify Supabase connection
 * Run with: node scripts/test-supabase-connection.js
 */

const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
console.log(`📁 Looking for .env.local at: ${envPath}`);

if (fs.existsSync(envPath)) {
  console.log('✅ Found .env.local file\n');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split(/\r?\n/);
  
  console.log(`📄 Processing ${lines.length} lines from .env.local...`);
  
  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    
    // Skip empty lines and comments
    if (!trimmedLine || trimmedLine.startsWith('#')) {
      return;
    }
    
    const equalIndex = trimmedLine.indexOf('=');
    if (equalIndex > 0) {
      const key = trimmedLine.substring(0, equalIndex).trim();
      const value = trimmedLine.substring(equalIndex + 1).trim();
      
      // Remove quotes if present
      const cleanValue = value.replace(/^["']|["']$/g, '');
      
      process.env[key] = cleanValue;
      console.log(`✓ Set ${key} = ${cleanValue.substring(0, 20)}...`);
    }
  });
  console.log('');
} else {
  console.error('❌ .env.local file not found!');
  console.log(`Looking for file at: ${envPath}`);
  console.log('\nPlease create a .env.local file with your Supabase credentials.');
  console.log('You can copy from .env.local.template:');
  console.log('  cp .env.local.template .env.local');
  process.exit(1);
}

async function testConnection() {
  console.log('🔍 Testing Supabase connection...\n');

  // Debug: Show loaded environment variables
  console.log('📋 Loaded environment variables:');
  Object.keys(process.env).forEach(key => {
    if (key.includes('SUPABASE')) {
      console.log(`- ${key}: ${process.env[key] ? '✓ Set' : '✗ Not set'}`);
    }
  });
  console.log('');

  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Environment variables missing!');
    console.log('\nPlease ensure the following are set in .env.local:');
    console.log('- NEXT_PUBLIC_SUPABASE_URL');
    console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY');
    console.log('\nExample .env.local format:');
    console.log('NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co');
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here');
    process.exit(1);
  }

  console.log('✅ Environment variables found');
  console.log(`📍 Project URL: ${supabaseUrl}`);

  try {
    // Test connection with a simple HTTP request
    console.log('\n🔄 Attempting to connect to Supabase...');
    const https = require('https');
    const url = require('url');
    
    const startTime = Date.now();
    const parsedUrl = new URL(supabaseUrl);
    
    // Make a simple request to the Supabase REST API
    const options = {
      hostname: parsedUrl.hostname,
      path: '/rest/v1/',
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    };
    
    const req = https.request(options, (res) => {
      const responseTime = Date.now() - startTime;
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 404) {
          console.log('✅ Connection successful!');
          console.log(`⏱️  Response time: ${responseTime}ms`);
          console.log('\n📊 Connection Summary:');
          console.log('- Status: Connected');
          console.log('- Latency: ' + (responseTime < 100 ? '✅ Good' : '⚠️  Slow') + ` (${responseTime}ms)`);
          console.log('- API Response: ' + res.statusCode);
          console.log('- Database: Ready for schema creation');
          
          console.log('\n🎉 Supabase connection test passed!');
          console.log('\nNext steps:');
          console.log('1. Run `npm run dev` to start the application');
          console.log('2. The app will now use Supabase instead of mock data');
          console.log('3. Create the database schema (Task 2.1)');
        } else if (res.statusCode === 401) {
          console.error(`\n❌ Authentication failed (401)`);
          console.error('Response:', data);
          console.log('\nThis usually means:');
          console.log('1. The anon key is incorrect or expired');
          console.log('2. The project URL doesn\'t match the key');
          console.log('\nPlease verify:');
          console.log('- Your Supabase project is active');
          console.log('- The anon key from Settings > API is correct');
          console.log('- You\'re using the anon/public key, not the service role key');
          process.exit(1);
        } else {
          console.error(`\n❌ Unexpected response: ${res.statusCode}`);
          console.error('Response:', data);
          process.exit(1);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('\n❌ Connection failed!');
      console.error('Error:', error.message);
      console.log('\nTroubleshooting tips:');
      console.log('1. Verify your Supabase project is active');
      console.log('2. Check that the URL and anon key are correct');
      console.log('3. Ensure your network can reach Supabase');
      process.exit(1);
    });
    
    req.end();
    
  } catch (error) {
    console.error('\n❌ Connection failed!');
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run the test
testConnection();