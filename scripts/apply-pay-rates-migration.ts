import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log('Applying pay rates migration...');

  try {
    // Read the migration file
    const fs = require('fs');
    const path = require('path');
    const migrationPath = path.join(
      __dirname,
      '../supabase/migrations/20260115235900_add_pay_rates_to_crafts.sql'
    );
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    // Remove comments and split into statements
    const statements = sql
      .split('\n')
      .filter((line) => !line.trim().startsWith('--'))
      .join('\n')
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    // Execute each statement
    for (const statement of statements) {
      if (statement.includes('ALTER TABLE')) {
        console.log('Executing:', statement.substring(0, 50) + '...');
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        if (error) {
          console.error('Error executing statement:', error);
          // Try alternative method - direct connection needed
          console.log(
            'Note: exec_sql RPC may not exist. Use supabase CLI instead.'
          );
        }
      }
    }

    // Verify columns were added
    const { data, error } = await supabase
      .from('labor_request_crafts')
      .select('pay_rate_min, pay_rate_max, per_diem_rate')
      .limit(1);

    if (error) {
      console.error('Verification failed:', error);
      console.log(
        '\nPlease run migration manually using Supabase dashboard SQL editor'
      );
      console.log('Or use: supabase db push --include-all');
      process.exit(1);
    } else {
      console.log('✅ Migration verified successfully!');
      console.log('Pay rate columns added to labor_request_crafts table');
    }
  } catch (error) {
    console.error('Migration failed:', error);
    console.log(
      '\nPlease apply migration manually using Supabase dashboard SQL editor'
    );
    process.exit(1);
  }
}

applyMigration();
