const fs = require('fs');
const path = require('path');

// Try to load dotenv if available
try {
  require('dotenv').config();
} catch (error) {
  // dotenv not available, continue without it
}

console.log('🌐 Web-Based Migration Helper\n');

// Get Supabase project URL from environment variable or use default
const SUPABASE_PROJECT_URL =
  process.env.SUPABASE_PROJECT_URL ||
  'https://supabase.com/dashboard/project/YOUR_PROJECT_ID';

// Read all migration files with error handling
const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
let migrationFiles = [];

try {
  migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();
} catch (error) {
  console.error('❌ Error reading migrations directory:', error.message);
  console.error(`   Make sure the directory exists: ${migrationsDir}`);
  process.exit(1);
}

console.log('📋 Migration files found:');
migrationFiles.forEach((file) => {
  console.log(`  - ${file}`);
});

console.log('\n' + '='.repeat(60));
console.log('📌 INSTRUCTIONS:');
console.log('='.repeat(60) + '\n');

console.log('1. Go to your Supabase Dashboard:');
console.log(`   ${SUPABASE_PROJECT_URL}\n`);

console.log('2. Navigate to SQL Editor (left sidebar)\n');

console.log('3. Create a new query\n');

console.log('4. Copy and paste ALL the SQL below:\n');

console.log('='.repeat(60));
console.log('-- COMBINED MIGRATION SCRIPT');
console.log('-- Generated:', new Date().toISOString());
console.log('='.repeat(60) + '\n');

// Combine all migrations
migrationFiles.forEach((file, index) => {
  try {
    const content = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    console.log(`-- Migration ${index + 1}: ${file}`);
    console.log('-- ' + '-'.repeat(56));
    console.log(content);
    console.log('\n');
  } catch (error) {
    console.error(`❌ Error reading migration file ${file}:`, error.message);
    console.error('   Skipping this file and continuing with others...\n');
  }
});

console.log('='.repeat(60));
console.log('\n5. Click "Run" to execute all migrations\n');

console.log('6. After running, verify with:');
console.log('   node scripts/verify-tables.js\n');

// Create a combined migration file for easy copying
const combinedPath = path.join(migrationsDir, 'combined_migration.sql');
let combinedContent = '-- COMBINED MIGRATION SCRIPT\n';
combinedContent += `-- Generated: ${new Date().toISOString()}\n\n`;

migrationFiles.forEach((file, index) => {
  try {
    const content = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    combinedContent += `-- Migration ${index + 1}: ${file}\n`;
    combinedContent += '-- ' + '-'.repeat(56) + '\n';
    combinedContent += content + '\n\n';
  } catch (error) {
    console.error(`❌ Error reading migration file ${file}:`, error.message);
    combinedContent += `-- ERROR: Could not read ${file}\n\n`;
  }
});

try {
  fs.writeFileSync(combinedPath, combinedContent);
  console.log(`✅ Combined migration saved to: ${combinedPath}`);
} catch (error) {
  console.error('❌ Error writing combined migration file:', error.message);
  console.error(`   Failed to write to: ${combinedPath}`);
}
