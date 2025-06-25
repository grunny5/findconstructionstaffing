const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');

console.log('🔍 Debugging .env.local file...\n');
console.log(`📁 File path: ${envPath}`);

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  
  console.log('\n📄 Raw file content (with escape characters):');
  console.log(JSON.stringify(content));
  
  console.log('\n📋 File content line by line:');
  const lines = content.split(/\r?\n/);
  lines.forEach((line, index) => {
    console.log(`Line ${index + 1}: "${line}"`);
  });
  
  console.log('\n🔍 Hex dump of first 200 characters:');
  const hexDump = Buffer.from(content.substring(0, 200)).toString('hex');
  console.log(hexDump);
  
} else {
  console.log('❌ .env.local file not found!');
}