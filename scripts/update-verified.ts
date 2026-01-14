import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateVerifiedAgencies() {
  console.log('Updating verified status for target agencies...');

  // Target agencies to mark as verified
  const agenciesToVerify = [
    'Industrial Staffing Solutions',
    'TradePower Recruiting',
    'Shutdown Specialists Inc',
  ];

  // Fetch only the target agencies by name
  const { data: agencies, error: fetchError } = await supabase
    .from('agencies')
    .select('id, name')
    .in('name', agenciesToVerify);

  if (fetchError) {
    console.error('Error fetching agencies:', fetchError);
    return;
  }

  console.log(`Found ${agencies?.length} of ${agenciesToVerify.length} target agencies`);

  // Check for any missing agencies
  const foundNames = new Set(agencies?.map((a) => a.name) || []);
  const missingAgencies = agenciesToVerify.filter((name) => !foundNames.has(name));
  if (missingAgencies.length > 0) {
    console.warn(`⚠ Missing agencies: ${missingAgencies.join(', ')}`);
  }

  // Update each found agency
  for (const agency of agencies || []) {
    const { error: updateError } = await supabase
      .from('agencies')
      .update({ verified: true })
      .eq('id', agency.id);

    if (updateError) {
      console.error(`Error updating ${agency.name}:`, updateError);
    } else {
      console.log(`✓ Marked ${agency.name} as verified`);
    }
  }

  console.log('Done!');
}

updateVerifiedAgencies();
