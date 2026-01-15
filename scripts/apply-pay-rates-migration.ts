import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration(): Promise<void> {
  console.log('Applying pay rates migration...');

  try {
    // Read the migration file
    const migrationPath: string = path.join(
      __dirname,
      '../supabase/migrations/applied_20260126_001_add_pay_rates_to_crafts.sql'
    );
    const sql: string = fs.readFileSync(migrationPath, 'utf-8');

    // Remove comments and split into statements
    const statements: string[] = sql
      .split('\n')
      .filter((line: string) => !line.trim().startsWith('--'))
      .join('\n')
      .split(';')
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0);

    // Track execution failures
    let hasErrors = false;
    const errors: string[] = [];

    // Execute each statement
    for (const statement of statements) {
      if (statement.includes('ALTER TABLE')) {
        console.log('Executing:', statement.substring(0, 50) + '...');
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        if (error) {
          hasErrors = true;
          const errorMsg = `Failed to execute statement: ${error.message}`;
          errors.push(errorMsg);
          console.error('Error executing statement:', error);
        }
      }
    }

    // Check if any RPC calls failed
    if (hasErrors) {
      console.error('\n❌ Migration failed with the following errors:');
      errors.forEach((err: string, idx: number) => {
        console.error(`  ${idx + 1}. ${err}`);
      });
      console.log(
        '\nNote: exec_sql RPC may not exist. Use supabase CLI instead.'
      );
      console.log('Alternative: supabase db push --include-all');
      console.log('Or apply manually using Supabase dashboard SQL editor');
      process.exit(1);
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
  } catch (error: unknown) {
    console.error('Migration failed:', error);
    console.log(
      '\nPlease apply migration manually using Supabase dashboard SQL editor'
    );
    process.exit(1);
  }
}

applyMigration();
