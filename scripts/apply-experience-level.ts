import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function applyMigration() {
  console.log('Adding experience_level column to labor_request_crafts...\n');

  // Check if column already exists
  const { data, error } = await supabase
    .from('labor_request_crafts')
    .select('id, experience_level')
    .limit(1);

  if (!error) {
    console.log('✅ experience_level column already exists!');
    console.log('Migration is complete.\n');
    process.exit(0);
  }

  if (error && error.code !== '42703') {
    // 42703 is "column does not exist" error
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }

  // Column doesn't exist, provide SQL to run manually
  const sql = `
ALTER TABLE labor_request_crafts
ADD COLUMN IF NOT EXISTS experience_level TEXT NOT NULL DEFAULT 'Journeyman'
  CHECK (experience_level IN (
    'Helper',
    'Apprentice',
    'Journeyman',
    'Foreman',
    'General Foreman',
    'Superintendent',
    'Project Manager'
  ));
  `.trim();

  console.error('❌ Column does not exist and cannot be added via API');
  console.log('\nPlease run this SQL in the Supabase dashboard:');
  console.log('='.repeat(80));
  console.log(sql);
  console.log('='.repeat(80));
  console.log('\n1. Go to: https://supabase.com/dashboard/project/chyaqualjbhkykgofcov/sql');
  console.log('2. Paste the SQL above');
  console.log('3. Click "Run"\n');
  process.exit(1);
}

applyMigration();
