const {
  parseAgenciesQuery,
} = require('./dist/lib/validation/agencies-query.js');

// Test the validation function
const params = new URLSearchParams();
const result = parseAgenciesQuery(params);
console.log('Validation result:', result);
