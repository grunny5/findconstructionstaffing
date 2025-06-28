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
  
  // Note: Supabase count aggregates can return in different formats depending on the query:
  // - Array format: [{ count: 5 }] - most common
  // - Direct number: 5 - when using specific aggregations
  // - Object format: { count: 5 } - in some edge cases
  // This script handles all three formats for robustness
  
  const { createClient } = require('@supabase/supabase-js');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  const results = {};
  
  // Query 1: Count agencies and related data
  console.log('📊 Query 1: Data Counts\n');
  
  try {
    // Count agencies
    const { count: agencyCount, error: agencyError } = await supabase
      .from('agencies')
      .select('*', { count: 'exact', head: true });
    
    if (agencyError) {
      throw new Error(`Failed to count agencies: ${agencyError.message}`);
    }
    
    results.agencyCount = agencyCount || 0;
    console.log(`   Agencies: ${results.agencyCount}`);
    
    // Count trades
    const { count: tradeCount, error: tradeError } = await supabase
      .from('trades')
      .select('*', { count: 'exact', head: true });
    
    if (tradeError) {
      throw new Error(`Failed to count trades: ${tradeError.message}`);
    }
    
    results.tradeCount = tradeCount || 0;
    console.log(`   Trades: ${results.tradeCount}`);
    
    // Count regions
    const { count: regionCount, error: regionError } = await supabase
      .from('regions')
      .select('*', { count: 'exact', head: true });
    
    if (regionError) {
      throw new Error(`Failed to count regions: ${regionError.message}`);
    }
    
    results.regionCount = regionCount || 0;
    console.log(`   Regions: ${results.regionCount}`);
    
    // Count agency-trade relationships
    const { count: agencyTradeCount, error: agencyTradeError } = await supabase
      .from('agency_trades')
      .select('*', { count: 'exact', head: true });
    
    if (agencyTradeError) {
      throw new Error(`Failed to count agency-trade relationships: ${agencyTradeError.message}`);
    }
    
    results.agencyTradeCount = agencyTradeCount || 0;
    console.log(`   Agency-Trade Links: ${results.agencyTradeCount}`);
    
    // Count agency-region relationships
    const { count: agencyRegionCount, error: agencyRegionError } = await supabase
      .from('agency_regions')
      .select('*', { count: 'exact', head: true });
    
    if (agencyRegionError) {
      throw new Error(`Failed to count agency-region relationships: ${agencyRegionError.message}`);
    }
    
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
    
    if (error) {
      throw new Error(`Failed to get agencies with trades: ${error.message}`);
    }
    
    if (agenciesWithTrades) {
      console.log('   Agencies with trade counts:');
      agenciesWithTrades.forEach(agency => {
        // Safely extract count from agency_trades
        let tradeCount = 0;
        if (agency.agency_trades) {
          if (Array.isArray(agency.agency_trades) && agency.agency_trades.length > 0) {
            // Handle array format
            tradeCount = agency.agency_trades[0]?.count || 0;
          } else if (typeof agency.agency_trades === 'number') {
            // Handle direct count format
            tradeCount = agency.agency_trades;
          } else if (agency.agency_trades.count !== undefined) {
            // Handle object format
            tradeCount = agency.agency_trades.count;
          }
        }
        console.log(`   - ${agency.name}: ${tradeCount} trades`);
      });
      
      // Check for agencies without trades
      const agenciesWithoutTrades = agenciesWithTrades.filter(a => {
        if (!a.agency_trades) return true;
        if (Array.isArray(a.agency_trades) && a.agency_trades.length > 0) {
          return a.agency_trades[0]?.count === 0;
        }
        if (typeof a.agency_trades === 'number') {
          return a.agency_trades === 0;
        }
        if (a.agency_trades.count !== undefined) {
          return a.agency_trades.count === 0;
        }
        return true;
      });
      
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
    
    if (error) {
      throw new Error(`Failed to get agencies with regions: ${error.message}`);
    }
    
    if (agenciesWithRegions) {
      console.log('   Agencies with region counts:');
      agenciesWithRegions.forEach(agency => {
        // Safely extract count from agency_regions
        let regionCount = 0;
        if (agency.agency_regions) {
          if (Array.isArray(agency.agency_regions) && agency.agency_regions.length > 0) {
            // Handle array format
            regionCount = agency.agency_regions[0]?.count || 0;
          } else if (typeof agency.agency_regions === 'number') {
            // Handle direct count format
            regionCount = agency.agency_regions;
          } else if (agency.agency_regions.count !== undefined) {
            // Handle object format
            regionCount = agency.agency_regions.count;
          }
        }
        console.log(`   - ${agency.name}: ${regionCount} regions`);
      });
      
      // Check for agencies without regions
      const agenciesWithoutRegions = agenciesWithRegions.filter(a => {
        if (!a.agency_regions) return true;
        if (Array.isArray(a.agency_regions) && a.agency_regions.length > 0) {
          return a.agency_regions[0]?.count === 0;
        }
        if (typeof a.agency_regions === 'number') {
          return a.agency_regions === 0;
        }
        if (a.agency_regions.count !== undefined) {
          return a.agency_regions.count === 0;
        }
        return true;
      });
      
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
    const { data: allTrades, error: allTradesError } = await supabase
      .from('trades')
      .select('id, name');
    
    if (allTradesError) {
      throw new Error(`Failed to get all trades: ${allTradesError.message}`);
    }
    
    const { data: linkedTrades, error: linkedTradesError } = await supabase
      .from('agency_trades')
      .select('trade_id');
    
    if (linkedTradesError) {
      throw new Error(`Failed to get linked trades: ${linkedTradesError.message}`);
    }
    
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
    const { data: allRegions, error: allRegionsError } = await supabase
      .from('regions')
      .select('id, name, state_code');
    
    if (allRegionsError) {
      throw new Error(`Failed to get all regions: ${allRegionsError.message}`);
    }
    
    const { data: linkedRegions, error: linkedRegionsError } = await supabase
      .from('agency_regions')
      .select('region_id');
    
    if (linkedRegionsError) {
      throw new Error(`Failed to get linked regions: ${linkedRegionsError.message}`);
    }
    
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
    const { data: agencies, error: slugError } = await supabase
      .from('agencies')
      .select('slug');
    
    if (slugError) {
      throw new Error(`Failed to get agency slugs: ${slugError.message}`);
    }
    
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
    const { data: incompleteAgencies, error: incompleteError } = await supabase
      .from('agencies')
      .select('name')
      .or('name.is.null,slug.is.null');
    
    if (incompleteError) {
      throw new Error(`Failed to check incomplete agencies: ${incompleteError.message}`);
    }
    
    if (incompleteAgencies && incompleteAgencies.length > 0) {
      console.log(`   ⚠️  ${incompleteAgencies.length} agencies with missing required fields`);
    } else {
      console.log('   ✅ All agencies have required fields');
    }
    
    // Check boolean field consistency
    const { data: booleanStats, error: booleanError } = await supabase
      .from('agencies')
      .select('is_active, is_claimed, is_union, offers_per_diem');
    
    if (booleanError) {
      throw new Error(`Failed to get boolean stats: ${booleanError.message}`);
    }
    
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
  
  try {
    fs.writeFileSync(queriesPath, sqlContent);
    console.log(`\n✅ Verification queries saved to: ${queriesPath}`);
  } catch (error) {
    console.error(`\n❌ Failed to save verification queries to ${queriesPath}`);
    console.error(`   Error: ${error.message}`);
    
    // Attempt to create directory if it doesn't exist
    if (error.code === 'ENOENT') {
      try {
        const docsDir = path.dirname(queriesPath);
        fs.mkdirSync(docsDir, { recursive: true });
        fs.writeFileSync(queriesPath, sqlContent);
        console.log(`\n✅ Created directory and saved queries to: ${queriesPath}`);
      } catch (retryError) {
        console.error(`\n❌ Retry failed: ${retryError.message}`);
        process.exit(1);
      }
    } else {
      process.exit(1);
    }
  }
}

runVerificationQueries();