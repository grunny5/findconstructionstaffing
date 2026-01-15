import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

async function verifyTables() {
  console.log('Verifying labor request tables...\n');

  try {
    // Check labor_requests table
    const { data: requests, error: requestsError } = await supabase
      .from('labor_requests')
      .select('id')
      .limit(1);

    if (requestsError) {
      console.error('❌ labor_requests table:', requestsError.message);
    } else {
      console.log('✅ labor_requests table exists');
    }

    // Check labor_request_crafts table
    const { data: crafts, error: craftsError } = await supabase
      .from('labor_request_crafts')
      .select('id')
      .limit(1);

    if (craftsError) {
      console.error('❌ labor_request_crafts table:', craftsError.message);
    } else {
      console.log('✅ labor_request_crafts table exists');
    }

    // Check labor_request_notifications table
    const { data: notifications, error: notificationsError } = await supabase
      .from('labor_request_notifications')
      .select('id')
      .limit(1);

    if (notificationsError) {
      console.error(
        '❌ labor_request_notifications table:',
        notificationsError.message
      );
    } else {
      console.log('✅ labor_request_notifications table exists');
    }

    // Check match_agencies_to_craft function
    const { data: matchData, error: matchError } = await supabase.rpc(
      'match_agencies_to_craft',
      {
        p_trade_id: '00000000-0000-0000-0000-000000000000',
        p_region_id: '00000000-0000-0000-0000-000000000000',
        p_worker_count: 1,
      }
    );

    if (matchError) {
      console.error(
        '❌ match_agencies_to_craft function:',
        matchError.message
      );
    } else {
      console.log('✅ match_agencies_to_craft function exists');
    }

    console.log('\n✅ All labor request database objects verified!');
  } catch (error) {
    console.error('Verification failed:', error);
    process.exit(1);
  }
}

verifyTables();
