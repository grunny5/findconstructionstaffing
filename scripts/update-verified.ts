import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateVerifiedAgencies() {
  console.log('Updating verified status for first 3 agencies...');

  // Get all agencies
  const { data: agencies, error: fetchError } = await supabase
    .from('agencies')
    .select('id, name')
    .order('created_at', { ascending: true })
    .limit(12);

  if (fetchError) {
    console.error('Error fetching agencies:', fetchError);
    return;
  }

  console.log(`Found ${agencies?.length} agencies`);

  // Mark first 3 as verified
  const agenciesToVerify = [
    'Industrial Staffing Solutions',
    'TradePower Recruiting',
    'Shutdown Specialists Inc',
  ];

  for (const name of agenciesToVerify) {
    const agency = agencies?.find((a) => a.name === name);
    if (agency) {
      const { error: updateError } = await supabase
        .from('agencies')
        .update({ verified: true })
        .eq('id', agency.id);

      if (updateError) {
        console.error(`Error updating ${name}:`, updateError);
      } else {
        console.log(`✓ Marked ${name} as verified`);
      }
    } else {
      console.warn(`⚠ Could not find agency: ${name}`);
    }
  }

  console.log('Done!');
}

updateVerifiedAgencies();
