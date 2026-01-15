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
  console.log('Applying pay rates migration to remote database...\n');

  const sql = `
ALTER TABLE labor_request_crafts
ADD COLUMN IF NOT EXISTS pay_rate_min DECIMAL(10,2) CHECK (pay_rate_min >= 0),
ADD COLUMN IF NOT EXISTS pay_rate_max DECIMAL(10,2) CHECK (pay_rate_max >= 0),
ADD COLUMN IF NOT EXISTS per_diem_rate DECIMAL(10,2) CHECK (per_diem_rate >= 0);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'valid_pay_rate_range'
  ) THEN
    ALTER TABLE labor_request_crafts
    ADD CONSTRAINT valid_pay_rate_range CHECK (
      (pay_rate_min IS NULL AND pay_rate_max IS NULL) OR
      (pay_rate_min IS NOT NULL AND pay_rate_max IS NOT NULL AND pay_rate_max >= pay_rate_min)
    );
  END IF;
END $$;
  `.trim();

  try {
    // Use the REST API to execute SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseServiceKey,
        Authorization: `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ sql }),
    });

    if (!response.ok) {
      // exec_sql RPC might not exist, try direct query approach
      console.log(
        'exec_sql RPC not available, attempting direct column check...\n'
      );

      // Check if columns already exist
      const { data, error } = await supabase
        .from('labor_request_crafts')
        .select('id, pay_rate_min, pay_rate_max, per_diem_rate')
        .limit(1);

      if (error && error.code === '42703') {
        // Column doesn't exist error
        console.error('❌ Columns do not exist and cannot be added via API');
        console.log('\nPlease run this SQL in the Supabase dashboard:');
        console.log('=' .repeat(80));
        console.log(sql);
        console.log('='.repeat(80));
        console.log(
          '\n1. Go to: https://supabase.com/dashboard/project/chyaqualjbhkykgofcov/sql'
        );
        console.log('2. Paste the SQL above');
        console.log('3. Click "Run"\n');
        process.exit(1);
      } else if (!error) {
        console.log('✅ Pay rate columns already exist!');
        console.log('Migration is complete.\n');
        process.exit(0);
      } else {
        throw error;
      }
    } else {
      console.log('✅ Migration executed successfully!');

      // Verify columns were added
      const { data, error: verifyError } = await supabase
        .from('labor_request_crafts')
        .select('id, pay_rate_min, pay_rate_max, per_diem_rate')
        .limit(1);

      if (verifyError) {
        console.error('⚠️  Warning: Could not verify columns:', verifyError);
      } else {
        console.log('✅ Verified: Pay rate columns are accessible\n');
      }
    }
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    console.log('\nPlease run this SQL manually in the Supabase dashboard:');
    console.log('='.repeat(80));
    console.log(sql);
    console.log('='.repeat(80));
    console.log(
      '\n1. Go to: https://supabase.com/dashboard/project/chyaqualjbhkykgofcov/sql'
    );
    console.log('2. Paste the SQL above');
    console.log('3. Click "Run"\n');
    process.exit(1);
  }
}

applyMigration();
