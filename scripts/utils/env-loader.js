const fs = require('fs');
const path = require('path');

/**
 * Load environment variables from .env.local file
 * @param {string} [envFileName='.env.local'] - Name of the environment file
 * @returns {Object} Object containing loaded environment variables
 */
function loadEnvironmentVariables(envFileName = '.env.local') {
  const envPath = path.join(__dirname, '..', '..', envFileName);
  const loadedVars = {};
  
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      line = line.trim();
      if (!line || line.startsWith('#')) return;
      
      const equalIndex = line.indexOf('=');
      if (equalIndex > 0) {
        const key = line.substring(0, equalIndex).trim();
        let value = line.substring(equalIndex + 1).trim();
        
        // Handle quoted values - remove surrounding quotes if they match
        if (value.length >= 2) {
          const firstChar = value[0];
          const lastChar = value[value.length - 1];
          if ((firstChar === '"' && lastChar === '"') || 
              (firstChar === "'" && lastChar === "'")) {
            // Remove the surrounding quotes
            value = value.substring(1, value.length - 1);
          }
        }
        
        process.env[key] = value;
        loadedVars[key] = value;
      }
    });
    
    if (process.env.NODE_ENV !== 'test') {
      console.log(`✅ Loaded ${Object.keys(loadedVars).length} environment variables from ${envFileName}`);
    }
  } else {
    console.warn(`⚠️  Environment file ${envFileName} not found at ${envPath}`);
  }
  
  return loadedVars;
}

/**
 * Verify required environment variables are present
 * @param {string[]} requiredVars - Array of required variable names
 * @throws {Error} If any required variables are missing
 */
function verifyRequiredVariables(requiredVars) {
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

/**
 * Extract Supabase project reference from URL
 * @param {string} [supabaseUrl] - Supabase URL (defaults to NEXT_PUBLIC_SUPABASE_URL)
 * @returns {string} Project reference or 'your-project-ref' if not found
 */
function extractProjectReference(supabaseUrl) {
  const url = supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
  return match ? match[1] : 'your-project-ref';
}

module.exports = {
  loadEnvironmentVariables,
  verifyRequiredVariables,
  extractProjectReference
};