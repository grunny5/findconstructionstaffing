// Debug test to check if mocks are working
const { supabase } = require('./lib/supabase');

console.log('Supabase object:', supabase);
console.log('Is supabase null?', supabase === null);
console.log('Environment variables:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log(
  'NEXT_PUBLIC_SUPABASE_ANON_KEY:',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
