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

console.log('Testing project reference extraction:');
console.log('Supabase URL:', supabaseUrl);
console.log('Extracted Project Reference:', projectRef);
console.log('\nThis value will be used for:');
console.log(`- supabase link --project-ref ${projectRef}`);
console.log(`- supabase gen types typescript --project-ref ${projectRef}`);