const fs = require('fs');
const path = require('path');

// Load environment variables
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    line = line.trim();
    if (!line || line.startsWith('#')) return;
    
    const equalIndex = line.indexOf('=');
    if (equalIndex > 0) {
      const key = line.substring(0, equalIndex).trim();
      const value = line.substring(equalIndex + 1).trim();
      process.env[key] = value;
    }
  });
}

async function runVerificationQueries() {
  console.log('🔍 Data Migration Verification Queries\n');
  
  const { createClient } = require('@supabase/supabase-js');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  
  const results = {};
  
  // Query 1: Count agencies and related data
  console.log('📊 Query 1: Data Counts\n');
  
  try {
    // Count agencies
    const { count: agencyCount } = await supabase
      .from('agencies')
      .select('*', { count: 'exact', head: true });
    
    results.agencyCount = agencyCount || 0;
    console.log(`   Agencies: ${results.agencyCount}`);
    
    // Count trades
    const { count: tradeCount } = await supabase
      .from('trades')
      .select('*', { count: 'exact', head: true });
    
    results.tradeCount = tradeCount || 0;
    console.log(`   Trades: ${results.tradeCount}`);
    
    // Count regions
    const { count: regionCount } = await supabase
      .from('regions')
      .select('*', { count: 'exact', head: true });
    
    results.regionCount = regionCount || 0;
    console.log(`   Regions: ${results.regionCount}`);
    
    // Count agency-trade relationships
    const { count: agencyTradeCount } = await supabase
      .from('agency_trades')
      .select('*', { count: 'exact', head: true });
    
    results.agencyTradeCount = agencyTradeCount || 0;
    console.log(`   Agency-Trade Links: ${results.agencyTradeCount}`);
    
    // Count agency-region relationships
    const { count: agencyRegionCount } = await supabase
      .from('agency_regions')
      .select('*', { count: 'exact', head: true });
    
    results.agencyRegionCount = agencyRegionCount || 0;
    console.log(`   Agency-Region Links: ${results.agencyRegionCount}`);
    
  } catch (error) {
    console.error('Error counting data:', error.message);
  }
  
  // Query 2: Verify all trades are linked
  console.log('\n📊 Query 2: Trade Linkage Verification\n');
  
  try {
    // Get agencies with their trade counts
    const { data: agenciesWithTrades, error } = await supabase
      .from('agencies')
      .select(`
        id,
        name,
        agency_trades (count)
      `)
      .limit(10);
    
    if (!error && agenciesWithTrades) {
      console.log('   Agencies with trade counts:');
      agenciesWithTrades.forEach(agency => {
        const tradeCount = agency.agency_trades?.[0]?.count || 0;
        console.log(`   - ${agency.name}: ${tradeCount} trades`);
      });
      
      // Check for agencies without trades
      const agenciesWithoutTrades = agenciesWithTrades.filter(a => 
        !a.agency_trades || a.agency_trades[0]?.count === 0
      );
      
      if (agenciesWithoutTrades.length > 0) {
        console.log(`\n   ⚠️  ${agenciesWithoutTrades.length} agencies without trades`);
      } else {
        console.log('\n   ✅ All agencies have trades');
      }
    }
  } catch (error) {
    console.error('Error checking trade linkage:', error.message);
  }
  
  // Query 3: Check region assignments
  console.log('\n📊 Query 3: Region Assignment Verification\n');
  
  try {
    // Get agencies with their region counts
    const { data: agenciesWithRegions, error } = await supabase
      .from('agencies')
      .select(`
        id,
        name,
        agency_regions (count)
      `)
      .limit(10);
    
    if (!error && agenciesWithRegions) {
      console.log('   Agencies with region counts:');
      agenciesWithRegions.forEach(agency => {
        const regionCount = agency.agency_regions?.[0]?.count || 0;
        console.log(`   - ${agency.name}: ${regionCount} regions`);
      });
      
      // Check for agencies without regions
      const agenciesWithoutRegions = agenciesWithRegions.filter(a => 
        !a.agency_regions || a.agency_regions[0]?.count === 0
      );
      
      if (agenciesWithoutRegions.length > 0) {
        console.log(`\n   ⚠️  ${agenciesWithoutRegions.length} agencies without regions`);
      } else {
        console.log('\n   ✅ All agencies have regions');
      }
    }
  } catch (error) {
    console.error('Error checking region assignments:', error.message);
  }
  
  // Query 4: Find orphaned records
  console.log('\n📊 Query 4: Orphaned Records Check\n');
  
  try {
    // Check for trades not linked to any agency
    const { data: allTrades } = await supabase
      .from('trades')
      .select('id, name');
    
    const { data: linkedTrades } = await supabase
      .from('agency_trades')
      .select('trade_id');
    
    if (allTrades && linkedTrades) {
      const linkedTradeIds = new Set(linkedTrades.map(lt => lt.trade_id));
      const orphanedTrades = allTrades.filter(t => !linkedTradeIds.has(t.id));
      
      if (orphanedTrades.length > 0) {
        console.log(`   ⚠️  ${orphanedTrades.length} orphaned trades found:`);
        orphanedTrades.forEach(t => console.log(`      - ${t.name}`));
      } else {
        console.log('   ✅ No orphaned trades');
      }
    }
    
    // Check for regions not linked to any agency
    const { data: allRegions } = await supabase
      .from('regions')
      .select('id, name, state_code');
    
    const { data: linkedRegions } = await supabase
      .from('agency_regions')
      .select('region_id');
    
    if (allRegions && linkedRegions) {
      const linkedRegionIds = new Set(linkedRegions.map(lr => lr.region_id));
      const orphanedRegions = allRegions.filter(r => !linkedRegionIds.has(r.id));
      
      if (orphanedRegions.length > 0) {
        console.log(`   ⚠️  ${orphanedRegions.length} orphaned regions found:`);
        orphanedRegions.forEach(r => console.log(`      - ${r.name} (${r.state_code})`));
      } else {
        console.log('   ✅ No orphaned regions');
      }
    }
  } catch (error) {
    console.error('Error checking orphaned records:', error.message);
  }
  
  // Query 5: Data integrity checks
  console.log('\n📊 Query 5: Data Integrity Checks\n');
  
  try {
    // Check for duplicate slugs
    const { data: agencies } = await supabase
      .from('agencies')
      .select('slug');
    
    if (agencies) {
      const slugs = agencies.map(a => a.slug);
      const uniqueSlugs = new Set(slugs);
      
      if (slugs.length !== uniqueSlugs.size) {
        console.log(`   ⚠️  Duplicate agency slugs found`);
      } else {
        console.log('   ✅ All agency slugs are unique');
      }
    }
    
    // Check for missing required fields
    const { data: incompleteAgencies } = await supabase
      .from('agencies')
      .select('name')
      .or('name.is.null,slug.is.null');
    
    if (incompleteAgencies && incompleteAgencies.length > 0) {
      console.log(`   ⚠️  ${incompleteAgencies.length} agencies with missing required fields`);
    } else {
      console.log('   ✅ All agencies have required fields');
    }
    
    // Check boolean field consistency
    const { data: booleanStats } = await supabase
      .from('agencies')
      .select('is_active, is_claimed, is_union, offers_per_diem');
    
    if (booleanStats && booleanStats.length > 0) {
      const activeCount = booleanStats.filter(a => a.is_active).length;
      const claimedCount = booleanStats.filter(a => a.is_claimed).length;
      const unionCount = booleanStats.filter(a => a.is_union).length;
      const perDiemCount = booleanStats.filter(a => a.offers_per_diem).length;
      
      console.log(`   📊 Boolean field statistics:`);
      console.log(`      - Active: ${activeCount}/${booleanStats.length}`);
      console.log(`      - Claimed: ${claimedCount}/${booleanStats.length}`);
      console.log(`      - Union: ${unionCount}/${booleanStats.length}`);
      console.log(`      - Per Diem: ${perDiemCount}/${booleanStats.length}`);
    }
  } catch (error) {
    console.error('Error checking data integrity:', error.message);
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📋 Verification Summary:\n');
  
  if (results.agencyCount === 0) {
    console.log('⚠️  No data found - database is empty');
    console.log('   Run the data migration first to populate the database');
  } else {
    console.log('✅ Database contains data:');
    console.log(`   - ${results.agencyCount} agencies`);
    console.log(`   - ${results.tradeCount} trades`);
    console.log(`   - ${results.regionCount} regions`);
    console.log(`   - ${results.agencyTradeCount} trade relationships`);
    console.log(`   - ${results.agencyRegionCount} region relationships`);
    
    console.log('\n📊 Expected Results After Migration:');
    console.log('   - 12 agencies (from mock data)');
    console.log('   - ~30 unique trades');
    console.log('   - ~20 US states as regions');
    console.log('   - ~60 trade relationships (5 per agency avg)');
    console.log('   - ~48 region relationships (4 per agency avg)');
  }
  
  // Save verification queries for reuse
  const queries = {
    dataCounts: `
      SELECT 
        (SELECT COUNT(*) FROM agencies) as agency_count,
        (SELECT COUNT(*) FROM trades) as trade_count,
        (SELECT COUNT(*) FROM regions) as region_count,
        (SELECT COUNT(*) FROM agency_trades) as agency_trade_count,
        (SELECT COUNT(*) FROM agency_regions) as agency_region_count;
    `,
    agenciesWithoutTrades: `
      SELECT a.id, a.name 
      FROM agencies a
      LEFT JOIN agency_trades at ON a.id = at.agency_id
      WHERE at.agency_id IS NULL;
    `,
    agenciesWithoutRegions: `
      SELECT a.id, a.name 
      FROM agencies a
      LEFT JOIN agency_regions ar ON a.id = ar.agency_id
      WHERE ar.agency_id IS NULL;
    `,
    orphanedTrades: `
      SELECT t.id, t.name 
      FROM trades t
      LEFT JOIN agency_trades at ON t.id = at.trade_id
      WHERE at.trade_id IS NULL;
    `,
    orphanedRegions: `
      SELECT r.id, r.name, r.state_code 
      FROM regions r
      LEFT JOIN agency_regions ar ON r.id = ar.region_id
      WHERE ar.region_id IS NULL;
    `,
    duplicateSlugs: `
      SELECT slug, COUNT(*) as count 
      FROM agencies 
      GROUP BY slug 
      HAVING COUNT(*) > 1;
    `,
    dataIntegrity: `
      SELECT 
        COUNT(*) as total_agencies,
        SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as active_count,
        SUM(CASE WHEN is_claimed THEN 1 ELSE 0 END) as claimed_count,
        SUM(CASE WHEN is_union THEN 1 ELSE 0 END) as union_count,
        SUM(CASE WHEN offers_per_diem THEN 1 ELSE 0 END) as per_diem_count
      FROM agencies;
    `
  };
  
  const queriesPath = path.join(__dirname, '..', 'docs', 'migration-verification-queries.sql');
  let sqlContent = '-- Migration Verification Queries\n-- Run these after data migration to verify integrity\n\n';
  
  Object.entries(queries).forEach(([name, query]) => {
    sqlContent += `-- ${name.replace(/([A-Z])/g, ' $1').trim()}\n${query.trim()}\n\n`;
  });
  
  fs.writeFileSync(queriesPath, sqlContent);
  console.log(`\n✅ Verification queries saved to: ${queriesPath}`);
}

runVerificationQueries();