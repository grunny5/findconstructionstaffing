#!/usr/bin/env node

/**
 * Database Seed Script
 *
 * Seeds the Supabase database with mock agency data for development and testing.
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.
 *
 * Usage:
 *   npm run seed         - Seeds with safety checks
 *   npm run seed:reset   - Clears and re-seeds
 *   npm run seed:verify  - Runs verification queries
 */

import { createClient } from '@supabase/supabase-js';
import { mockAgencies, allStates, allTrades, mockComplianceData } from '../../lib/mock-data';
import { createSlug } from '../../lib/supabase';

// Helper to check if we're in test environment
const isTestEnvironment = (): boolean => {
  // Use a more robust check that avoids TypeScript's NODE_ENV type restrictions
  const env = process.env.NODE_ENV;
  return env !== undefined && env.toLowerCase() === 'test';
};

// Validate mock data is available
if (
  !mockAgencies ||
  !Array.isArray(mockAgencies) ||
  mockAgencies.length === 0
) {
  throw new Error('Mock agencies data is not available or empty');
}
if (!allStates || !Array.isArray(allStates) || allStates.length === 0) {
  throw new Error('All states data is not available or empty');
}
import type { Agency, Trade, Region } from '../../lib/supabase';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Logging utilities
const log = {
  info: (msg: string) => console.log(`${colors.blue}ℹ${colors.reset}  ${msg}`),
  success: (msg: string) =>
    console.log(`${colors.green}✓${colors.reset}  ${msg}`),
  warning: (msg: string) =>
    console.log(`${colors.yellow}⚠${colors.reset}  ${msg}`),
  error: (msg: string) =>
    console.error(`${colors.red}✗${colors.reset}  ${msg}`),
  section: (msg: string) =>
    console.log(`\n${colors.cyan}▶${colors.reset}  ${msg}\n`),
};

// Command line arguments
const args = process.argv.slice(2);
const isReset = args.includes('--reset');
const isVerifyOnly = args.includes('--verify');

// Validate environment variables
function validateEnvironment(forceValidation = false): {
  url: string;
  key: string;
} {
  // Support both SUPABASE_URL and DATABASE_URL for flexibility
  const url = process.env.SUPABASE_URL || process.env.DATABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // In test environment, use test defaults if not provided (unless forced to validate)
  if (isTestEnvironment() && !forceValidation) {
    return {
      url: url || 'http://localhost:54321',
      key: key || 'test-service-role-key',
    };
  }

  if (!url || !key) {
    log.error('Missing required environment variables');
    log.info('Please ensure the following are set:');
    log.info('  - SUPABASE_URL (or DATABASE_URL)');
    log.info('  - SUPABASE_SERVICE_ROLE_KEY');
    log.info('');
    log.info('You can set these in a .env.local file in the project root.');
    process.exit(1);
  }

  // Basic validation of URL format
  try {
    new URL(url);
  } catch {
    log.error(`Invalid SUPABASE_URL format: ${url}`);
    process.exit(1);
  }

  // Basic validation of key format (JWT structure)
  // Skip validation in test environment unless forced
  if (
    (!isTestEnvironment() || forceValidation) &&
    (!key.includes('.') || key.split('.').length !== 3)
  ) {
    log.error('Invalid SUPABASE_SERVICE_ROLE_KEY format');
    log.info(
      'The service role key should be a JWT token with three parts separated by dots.'
    );
    process.exit(1);
  }

  return { url, key };
}

// Create Supabase client with service role key
function createSupabaseClient(url: string, key: string) {
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Test database connection with retry logic
async function testConnection(
  supabase: ReturnType<typeof createSupabaseClient>,
  retries = 5,
  retryDelay = 1000
): Promise<boolean> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      log.info(
        `Testing database connection... (attempt ${attempt}/${retries})`
      );

      // Try a simple query to test connectivity
      const { error } = await supabase
        .from('agencies')
        .select('id', { head: true, count: 'exact' });

      if (error) {
        // If table doesn't exist, that's okay - connection works
        if (error.code === '42P01') {
          log.warning('Tables not yet created - this is expected on first run');
          return true;
        }

        // Handle common connection errors with helpful messages
        if (error.message?.includes('Failed to fetch')) {
          log.error('Connection failed: Unable to reach database');
          log.info('Please check:');
          log.info('  1. Database service is running');
          log.info('  2. Network connectivity to database');
          log.info('  3. Firewall rules allow connection');
          return false;
        }

        if (error.message?.includes('Invalid API key')) {
          log.error('Authentication failed: Invalid service role key');
          log.info('Please check your SUPABASE_SERVICE_ROLE_KEY');
          return false;
        }

        throw error;
      }

      log.success('Database connection successful');
      return true;
    } catch (error) {
      // If this is not the last attempt, retry
      if (attempt < retries) {
        log.warning(`Connection failed, retrying in ${retryDelay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        continue;
      }

      // Final attempt failed
      log.error('Failed to connect to database');
      if (error instanceof Error) {
        log.error(`Error: ${error.message}`);

        // Provide additional context for common errors
        if (error.message?.includes('ECONNREFUSED')) {
          log.info('Connection refused. Is the database service running?');
        } else if (error.message?.includes('ETIMEDOUT')) {
          log.info('Connection timeout. Check network and firewall settings.');
        }
      }
      return false;
    }
  }

  // Should never reach here
  return false;
}

// Extract unique trades from mock data
// Combines trades referenced by agencies with the standardized allTrades catalog
function extractUniqueTrades(): string[] {
  const tradesSet = new Set<string>();

  // Include all trades referenced by agencies
  mockAgencies.forEach((agency) => {
    agency.trades.forEach((trade) => {
      tradesSet.add(trade);
    });
  });

  // Also include all standardized trades for completeness
  allTrades.forEach((trade) => {
    tradesSet.add(trade);
  });

  return Array.from(tradesSet).sort();
}

// Seed trades table
async function seedTrades(
  supabase: ReturnType<typeof createSupabaseClient>
): Promise<Map<string, string>> {
  const startTime = Date.now();
  log.info('Seeding trades table...');

  const uniqueTrades = extractUniqueTrades();
  log.info(`Found ${uniqueTrades.length} unique trades to seed`);

  const tradeIdMap = new Map<string, string>();
  let created = 0;
  let skipped = 0;

  try {
    // Process trades in batches for better performance
    const batchSize = 10;
    for (let i = 0; i < uniqueTrades.length; i += batchSize) {
      const batch = uniqueTrades.slice(i, i + batchSize);

      // Check existing trades
      const { data: existingTrades, error: fetchError } = await supabase
        .from('trades')
        .select('id, name')
        .in('name', batch);

      if (fetchError) {
        throw new Error(
          `Failed to fetch existing trades: ${fetchError.message}`
        );
      }

      // Map existing trades
      const existingMap = new Map(
        (existingTrades || []).map((t) => [t.name, t.id])
      );

      // Prepare new trades to insert
      const newTrades = batch
        .filter((name) => !existingMap.has(name))
        .map((name) => ({
          name,
          slug: createSlug(name),
        }));

      // Insert new trades if any
      if (newTrades.length > 0) {
        const { data: insertedTrades, error: insertError } = await supabase
          .from('trades')
          .insert(newTrades)
          .select('id, name');

        if (insertError) {
          throw new Error(`Failed to insert trades: ${insertError.message}`);
        }

        // Add to map
        (insertedTrades || []).forEach((trade) => {
          tradeIdMap.set(trade.name, trade.id);
          created++;
        });
      }

      // Add existing trades to map
      existingMap.forEach((id, name) => {
        tradeIdMap.set(name, id);
        skipped++;
      });
    }

    const duration = Date.now() - startTime;
    log.success(`Trade seeding completed in ${duration}ms`);
    log.info(
      `Created: ${created}, Skipped: ${skipped}, Total: ${tradeIdMap.size}`
    );

    return tradeIdMap;
  } catch (error) {
    log.error('Failed to seed trades');
    if (error instanceof Error) {
      log.error(`Details: ${error.message}`);

      // Provide context-specific error messages
      if (error.message?.includes('duplicate key')) {
        log.info('This might be due to duplicate trade names in the data');
      } else if (error.message?.includes('permission denied')) {
        log.info('Check that the service role key has proper permissions');
      }
    }
    throw error;
  }
}

// Extract unique states from mock data
function extractUniqueStates(): string[] {
  const statesSet = new Set<string>();

  // Collect all states from all agencies
  mockAgencies.forEach((agency) => {
    agency.regions.forEach((state) => {
      statesSet.add(state);
    });
  });

  return Array.from(statesSet).sort();
}

// Create state name to code mapping
function createStateMapping(): Map<string, string> {
  const mapping = new Map<string, string>();
  allStates.forEach((state) => {
    mapping.set(state.name, state.code);
  });
  return mapping;
}

// Seed regions table
async function seedRegions(
  supabase: ReturnType<typeof createSupabaseClient>
): Promise<Map<string, string>> {
  const startTime = Date.now();
  log.info('Seeding regions table...');

  const uniqueStates = extractUniqueStates();
  const stateMapping = createStateMapping();
  log.info(`Found ${uniqueStates.length} unique states to seed`);

  const regionIdMap = new Map<string, string>();
  let created = 0;
  let skipped = 0;
  let invalid = 0;

  try {
    // Process states in batches for better performance
    const batchSize = 10;
    for (let i = 0; i < uniqueStates.length; i += batchSize) {
      const batch = uniqueStates.slice(i, i + batchSize);

      // Get state codes for batch
      const stateRecords = batch
        .map((stateName) => {
          const code = stateMapping.get(stateName);
          if (!code) {
            log.warning(`Unknown state name: "${stateName}" - skipping`);
            invalid++;
            return null;
          }
          return { name: stateName, code };
        })
        .filter(
          (record): record is { name: string; code: string } => record !== null
        );

      if (stateRecords.length === 0) {
        continue;
      }

      // Check existing regions by state code
      const stateCodes = stateRecords.map((r) => r.code);
      const { data: existingRegions, error: fetchError } = await supabase
        .from('regions')
        .select('id, name, state_code')
        .in('state_code', stateCodes);

      if (fetchError) {
        throw new Error(
          `Failed to fetch existing regions: ${fetchError.message}`
        );
      }

      // Map existing regions by state code
      const existingMap = new Map(
        (existingRegions || []).map((r) => [r.state_code, r.id])
      );

      // Prepare new regions to insert
      const newRegions = stateRecords
        .filter((record) => !existingMap.has(record.code))
        .map((record) => ({
          name: record.name,
          state_code: record.code,
          slug: createSlug(record.code),
        }));

      // Insert new regions if any
      if (newRegions.length > 0) {
        const { data: insertedRegions, error: insertError } = await supabase
          .from('regions')
          .insert(newRegions)
          .select('id, state_code');

        if (insertError) {
          throw new Error(`Failed to insert regions: ${insertError.message}`);
        }

        // Add to map using state code
        (insertedRegions || []).forEach((region) => {
          regionIdMap.set(region.state_code, region.id);
          created++;
        });
      }

      // Add existing regions to map
      existingMap.forEach((id, stateCode) => {
        regionIdMap.set(stateCode, id);
        skipped++;
      });
    }

    const duration = Date.now() - startTime;
    log.success(`Region seeding completed in ${duration}ms`);
    log.info(
      `Created: ${created}, Skipped: ${skipped}, Invalid: ${invalid}, Total: ${regionIdMap.size}`
    );

    return regionIdMap;
  } catch (error) {
    log.error('Failed to seed regions');
    if (error instanceof Error) {
      log.error(`Details: ${error.message}`);

      // Provide context-specific error messages
      if (error.message?.includes('duplicate key')) {
        log.info('This might be due to duplicate state codes in the data');
      } else if (error.message?.includes('permission denied')) {
        log.info('Check that the service role key has proper permissions');
      }
    }
    throw error;
  }
}

// Seed agencies table
async function seedAgencies(
  supabase: ReturnType<typeof createSupabaseClient>
): Promise<Map<string, string>> {
  const startTime = Date.now();
  log.info('Seeding agencies table...');

  log.info(`Found ${mockAgencies.length} agencies to seed`);

  const agencyIdMap = new Map<string, string>();
  let created = 0;
  let skipped = 0;

  try {
    // Process agencies in batches for better performance
    const batchSize = 20;
    for (let i = 0; i < mockAgencies.length; i += batchSize) {
      const batch = mockAgencies.slice(i, i + batchSize);

      // Check existing agencies by name
      const agencyNames = batch.map((a) => a.name);
      const { data: existingAgencies, error: fetchError } = await supabase
        .from('agencies')
        .select('id, name')
        .in('name', agencyNames);

      if (fetchError) {
        throw new Error(
          `Failed to fetch existing agencies: ${fetchError.message}`
        );
      }

      // Map existing agencies
      const existingMap = new Map(
        (existingAgencies || []).map((a) => [a.name, a.id])
      );

      // Prepare new agencies to insert
      const timestamp = new Date().toISOString();
      const newAgencies = batch
        .filter((agency) => !existingMap.has(agency.name))
        .map((agency) => ({
          name: agency.name,
          slug: createSlug(agency.name),
          description: agency.description,
          logo_url: agency.logo_url,
          website: agency.website,
          phone: null, // Not available in mock data
          email: null, // Not available in mock data
          is_claimed: false, // Default per FSD
          is_active: true, // Default per FSD
          offers_per_diem: agency.offers_per_diem,
          is_union: agency.is_union,
          founded_year: agency.founded_year || null,
          employee_count: agency.employee_count || null,
          headquarters: agency.headquarters || null,
          created_at: timestamp,
          updated_at: timestamp,
        }));

      // Insert new agencies if any
      if (newAgencies.length > 0) {
        const { data: insertedAgencies, error: insertError } = await supabase
          .from('agencies')
          .insert(newAgencies)
          .select('id, name');

        if (insertError) {
          throw new Error(`Failed to insert agencies: ${insertError.message}`);
        }

        // Add to map
        (insertedAgencies || []).forEach((agency) => {
          agencyIdMap.set(agency.name, agency.id);
          created++;
        });
      }

      // Add existing agencies to map
      existingMap.forEach((id, name) => {
        agencyIdMap.set(name, id);
        skipped++;
      });
    }

    const duration = Date.now() - startTime;
    log.success(`Agency seeding completed in ${duration}ms`);
    log.info(
      `Created: ${created}, Skipped: ${skipped}, Total: ${agencyIdMap.size}`
    );

    return agencyIdMap;
  } catch (error) {
    log.error('Failed to seed agencies');
    if (error instanceof Error) {
      log.error(`Details: ${error.message}`);

      // Provide context-specific error messages
      if (error.message?.includes('duplicate key')) {
        log.info('This might be due to duplicate agency names or slugs');
      } else if (error.message?.includes('permission denied')) {
        log.info('Check that the service role key has proper permissions');
      } else if (error.message?.includes('foreign key')) {
        log.info(
          'This might be due to missing trades or regions referenced by agencies'
        );
      }
    }
    throw error;
  }
}

// Seed agency compliance data
async function seedCompliance(
  supabase: ReturnType<typeof createSupabaseClient>,
  agencyIdMap: Map<string, string>
): Promise<void> {
  const startTime = Date.now();
  log.info('Seeding agency compliance data...');

  let created = 0;
  let skipped = 0;

  try {
    const complianceRecords = [];

    // Build compliance records from mock data
    for (const agencyCompliance of mockComplianceData) {
      const agencyId = agencyIdMap.get(agencyCompliance.agencyName);
      if (!agencyId) {
        log.warning(`Agency ID not found for: ${agencyCompliance.agencyName}`);
        continue;
      }

      for (const item of agencyCompliance.complianceItems) {
        complianceRecords.push({
          agency_id: agencyId,
          compliance_type: item.type,
          is_active: item.isActive,
          is_verified: item.isVerified,
          expiration_date: item.expirationDate,
        });
      }
    }

    log.info(`Found ${complianceRecords.length} compliance records to seed`);

    // Process in batches for better performance
    const batchSize = 50;
    for (let i = 0; i < complianceRecords.length; i += batchSize) {
      const batch = complianceRecords.slice(i, i + batchSize);

      // Check existing records
      const agencyIds = Array.from(new Set(batch.map((r) => r.agency_id)));
      const { data: existingRecords, error: fetchError } = await supabase
        .from('agency_compliance')
        .select('agency_id, compliance_type')
        .in('agency_id', agencyIds);

      if (fetchError) {
        throw new Error(
          `Failed to fetch existing compliance: ${fetchError.message}`
        );
      }

      // Create set of existing combinations
      const existingSet = new Set(
        (existingRecords || []).map((r) => `${r.agency_id}-${r.compliance_type}`)
      );

      // Filter new records
      const newRecords = batch.filter(
        (rec) => !existingSet.has(`${rec.agency_id}-${rec.compliance_type}`)
      );

      // Insert new records if any
      if (newRecords.length > 0) {
        const { error: insertError } = await supabase
          .from('agency_compliance')
          .insert(newRecords);

        if (insertError) {
          throw new Error(
            `Failed to insert compliance: ${insertError.message}`
          );
        }

        created += newRecords.length;
      }

      skipped += batch.length - newRecords.length;
    }

    const duration = Date.now() - startTime;
    log.success(`Compliance seeding completed in ${duration}ms`);
    log.info(`Created: ${created}, Skipped: ${skipped}`);
  } catch (error) {
    log.error('Failed to seed compliance data');
    if (error instanceof Error) {
      log.error(`Details: ${error.message}`);
    }
    throw error;
  }
}

// Create agency-trade relationships
async function createAgencyTradeRelationships(
  supabase: ReturnType<typeof createSupabaseClient>,
  agencyIdMap: Map<string, string>,
  tradeIdMap: Map<string, string>
): Promise<void> {
  const startTime = Date.now();
  log.info('Creating agency-trade relationships...');

  let created = 0;
  let skipped = 0;
  let errors = 0;

  try {
    // Collect all relationships to create
    const relationships: Array<{ agency_id: string; trade_id: string }> = [];

    for (const agency of mockAgencies) {
      const agencyId = agencyIdMap.get(agency.name);
      if (!agencyId) {
        log.warning(`Agency ID not found for: ${agency.name}`);
        errors++;
        continue;
      }

      for (const tradeName of agency.trades) {
        const tradeId = tradeIdMap.get(tradeName);
        if (!tradeId) {
          log.warning(
            `Trade ID not found for: ${tradeName} (agency: ${agency.name})`
          );
          errors++;
          continue;
        }

        relationships.push({
          agency_id: agencyId,
          trade_id: tradeId,
        });
      }
    }

    log.info(`Found ${relationships.length} relationships to create`);

    // Process in batches for better performance
    const batchSize = 50;
    for (let i = 0; i < relationships.length; i += batchSize) {
      const batch = relationships.slice(i, i + batchSize);

      // Check existing relationships
      const agencyIds = Array.from(new Set(batch.map((r) => r.agency_id)));
      const { data: existingRelations, error: fetchError } = await supabase
        .from('agency_trades')
        .select('agency_id, trade_id')
        .in('agency_id', agencyIds);

      if (fetchError) {
        throw new Error(
          `Failed to fetch existing relationships: ${fetchError.message}`
        );
      }

      // Create a set of existing relationships for quick lookup
      const existingSet = new Set(
        (existingRelations || []).map((r) => `${r.agency_id}-${r.trade_id}`)
      );

      // Filter out existing relationships
      const newRelationships = batch.filter(
        (rel) => !existingSet.has(`${rel.agency_id}-${rel.trade_id}`)
      );

      if (newRelationships.length > 0) {
        const { error: insertError } = await supabase
          .from('agency_trades')
          .insert(newRelationships);

        if (insertError) {
          throw new Error(
            `Failed to insert relationships: ${insertError.message}`
          );
        }

        created += newRelationships.length;
      }

      skipped += batch.length - newRelationships.length;
    }

    const duration = Date.now() - startTime;
    log.success(`Agency-trade relationships created in ${duration}ms`);
    log.info(`Created: ${created}, Skipped: ${skipped}, Errors: ${errors}`);
  } catch (error) {
    log.error('Failed to create agency-trade relationships');
    throw error;
  }
}

// Create agency-region relationships
async function createAgencyRegionRelationships(
  supabase: ReturnType<typeof createSupabaseClient>,
  agencyIdMap: Map<string, string>,
  regionIdMap: Map<string, string>
): Promise<void> {
  const startTime = Date.now();
  log.info('Creating agency-region relationships...');

  let created = 0;
  let skipped = 0;
  let errors = 0;

  // Create state name to code mapping for lookups
  const stateMapping = createStateMapping();

  try {
    // Collect all relationships to create
    const relationships: Array<{ agency_id: string; region_id: string }> = [];

    for (const agency of mockAgencies) {
      const agencyId = agencyIdMap.get(agency.name);
      if (!agencyId) {
        log.warning(`Agency ID not found for: ${agency.name}`);
        errors++;
        continue;
      }

      for (const stateName of agency.regions) {
        // Convert state name to state code
        const stateCode = stateMapping.get(stateName);
        if (!stateCode) {
          log.warning(
            `State code not found for: ${stateName} (agency: ${agency.name})`
          );
          errors++;
          continue;
        }

        // Get region ID using state code
        const regionId = regionIdMap.get(stateCode);
        if (!regionId) {
          log.warning(
            `Region ID not found for state code: ${stateCode} (${stateName}, agency: ${agency.name})`
          );
          errors++;
          continue;
        }

        relationships.push({
          agency_id: agencyId,
          region_id: regionId,
        });
      }
    }

    log.info(`Found ${relationships.length} relationships to create`);

    // Process in batches for better performance
    const batchSize = 50;
    for (let i = 0; i < relationships.length; i += batchSize) {
      const batch = relationships.slice(i, i + batchSize);

      // Check existing relationships
      const agencyIds = Array.from(new Set(batch.map((r) => r.agency_id)));
      const { data: existingRelations, error: fetchError } = await supabase
        .from('agency_regions')
        .select('agency_id, region_id')
        .in('agency_id', agencyIds);

      if (fetchError) {
        throw new Error(
          `Failed to fetch existing relationships: ${fetchError.message}`
        );
      }

      // Create a set of existing relationships for quick lookup
      const existingSet = new Set(
        (existingRelations || []).map((r) => `${r.agency_id}-${r.region_id}`)
      );

      // Filter out existing relationships
      const newRelationships = batch.filter(
        (rel) => !existingSet.has(`${rel.agency_id}-${rel.region_id}`)
      );

      if (newRelationships.length > 0) {
        const { error: insertError } = await supabase
          .from('agency_regions')
          .insert(newRelationships);

        if (insertError) {
          throw new Error(
            `Failed to insert relationships: ${insertError.message}`
          );
        }

        created += newRelationships.length;
      }

      skipped += batch.length - newRelationships.length;
    }

    const duration = Date.now() - startTime;
    log.success(`Agency-region relationships created in ${duration}ms`);
    log.info(`Created: ${created}, Skipped: ${skipped}, Errors: ${errors}`);
  } catch (error) {
    log.error('Failed to create agency-region relationships');
    throw error;
  }
}

// Reset database - clear all seeded data
async function resetDatabase(
  supabase: ReturnType<typeof createSupabaseClient>
): Promise<void> {
  const startTime = Date.now();
  log.info('Starting database reset...');

  try {
    // Track deletion counts
    const deletions: Array<{ table: string; count: number }> = [];

    // 0. First, check for and delete any integration-related tables that might reference agencies
    // These tables might exist if integrations have been set up
    const integrationTables = [
      'roaddog_jobs_configs',
      'sync_logs',
      'integration_configs',
      'jobs',
      'placements',
      'staff',
    ];

    for (const tableName of integrationTables) {
      try {
        log.info(`Checking for ${tableName} table...`);
        const { count, error } = await supabase
          .from(tableName)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

        if (!error) {
          log.info(`Deleted ${count || 0} records from ${tableName}`);
          deletions.push({ table: tableName, count: count || 0 });
        } else if (error.code !== '42P01') {
          // 42P01 = table does not exist
          log.warning(`Could not delete from ${tableName}: ${error.message}`);
        }
      } catch (err) {
        // Table might not exist, which is fine
        log.info(`Table ${tableName} does not exist or is not accessible`);
      }
    }

    // 1. Delete junction tables first (many-to-many relationships)
    log.info('Deleting agency-trade relationships...');
    const { count: agencyTradeCount, error: agencyTradeError } = await supabase
      .from('agency_trades')
      .delete()
      .neq('agency_id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (agencyTradeError) {
      throw new Error(
        `Failed to delete agency-trade relationships: ${agencyTradeError.message}`
      );
    }
    deletions.push({ table: 'agency_trades', count: agencyTradeCount || 0 });

    log.info('Deleting agency-region relationships...');
    const { count: agencyRegionCount, error: agencyRegionError } =
      await supabase
        .from('agency_regions')
        .delete()
        .neq('agency_id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (agencyRegionError) {
      throw new Error(
        `Failed to delete agency-region relationships: ${agencyRegionError.message}`
      );
    }
    deletions.push({ table: 'agency_regions', count: agencyRegionCount || 0 });

    // 2. Delete agencies (depends on junction tables)
    log.info('Deleting agencies...');
    const { count: agencyCount, error: agencyError } = await supabase
      .from('agencies')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (agencyError) {
      // If we still get a foreign key error, list the specific constraint
      if (agencyError.message.includes('foreign key constraint')) {
        log.error('Foreign key constraint violation when deleting agencies.');
        log.error(
          'There may be additional tables referencing agencies that need to be cleared first.'
        );
        log.error(`Error details: ${agencyError.message}`);

        // Try to provide more helpful information
        if (agencyError.message.includes('referenced from table')) {
          const match = agencyError.message.match(
            /referenced from table "([^"]+)"/
          );
          if (match) {
            log.error(
              `The table "${match[1]}" has references to agencies that must be deleted first.`
            );
          }
        }
      }
      throw new Error(`Failed to delete agencies: ${agencyError.message}`);
    }
    deletions.push({ table: 'agencies', count: agencyCount || 0 });

    // 3. Delete trades (independent)
    log.info('Deleting trades...');
    const { count: tradeCount, error: tradeError } = await supabase
      .from('trades')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (tradeError) {
      throw new Error(`Failed to delete trades: ${tradeError.message}`);
    }
    deletions.push({ table: 'trades', count: tradeCount || 0 });

    // 4. Delete regions (independent)
    log.info('Deleting regions...');
    const { count: regionCount, error: regionError } = await supabase
      .from('regions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (regionError) {
      throw new Error(`Failed to delete regions: ${regionError.message}`);
    }
    deletions.push({ table: 'regions', count: regionCount || 0 });

    const duration = Date.now() - startTime;

    // Log summary
    log.section('Reset Summary');
    deletions.forEach(({ table, count }) => {
      log.success(`${table}: Deleted ${count} records`);
    });

    const totalDeleted = deletions.reduce((sum, d) => sum + d.count, 0);
    log.info(`Total records deleted: ${totalDeleted}`);
    log.success(`Database reset completed in ${duration}ms`);
  } catch (error) {
    log.error('Failed to reset database');
    if (error instanceof Error) {
      log.error(error.message);
      log.warning(
        'Database may be in an inconsistent state. Manual cleanup may be required.'
      );
    }
    throw error;
  }
}

// Verify seeded data
async function verifySeededData(
  supabase: ReturnType<typeof createSupabaseClient>
): Promise<boolean> {
  const startTime = Date.now();
  log.info('Verifying seeded data...');

  let allPassed = true;
  const results: Array<{ check: string; passed: boolean; details: string }> =
    [];

  try {
    // 1. Verify agency count
    const { count: agencyCount, error: agencyCountError } = await supabase
      .from('agencies')
      .select('*', { count: 'exact', head: true });

    if (agencyCountError) {
      results.push({
        check: 'Agency count',
        passed: false,
        details: `Error: ${agencyCountError.message}`,
      });
      allPassed = false;
    } else {
      const expectedCount = mockAgencies.length;
      const passed = agencyCount === expectedCount;
      results.push({
        check: 'Agency count',
        passed,
        details: `Expected: ${expectedCount}, Found: ${agencyCount}`,
      });
      if (!passed) allPassed = false;
    }

    // 2. Verify trade count
    const uniqueTrades = extractUniqueTrades();
    const { count: tradeCount, error: tradeCountError } = await supabase
      .from('trades')
      .select('*', { count: 'exact', head: true });

    if (tradeCountError) {
      results.push({
        check: 'Trade count',
        passed: false,
        details: `Error: ${tradeCountError.message}`,
      });
      allPassed = false;
    } else {
      const expectedCount = uniqueTrades.length;
      const passed = tradeCount === expectedCount;
      results.push({
        check: 'Trade count',
        passed,
        details: `Expected: ${expectedCount}, Found: ${tradeCount}`,
      });
      if (!passed) allPassed = false;
    }

    // 3. Verify region count
    const uniqueStates = extractUniqueStates();
    const { count: regionCount, error: regionCountError } = await supabase
      .from('regions')
      .select('*', { count: 'exact', head: true });

    if (regionCountError) {
      results.push({
        check: 'Region count',
        passed: false,
        details: `Error: ${regionCountError.message}`,
      });
      allPassed = false;
    } else {
      const expectedCount = uniqueStates.length;
      const passed = regionCount === expectedCount;
      results.push({
        check: 'Region count',
        passed,
        details: `Expected: ${expectedCount}, Found: ${regionCount}`,
      });
      if (!passed) allPassed = false;
    }

    // 4. Verify agency-trade relationships
    const expectedTradeRelationships = mockAgencies.reduce(
      (sum, agency) => sum + agency.trades.length,
      0
    );
    const { count: tradeRelCount, error: tradeRelError } = await supabase
      .from('agency_trades')
      .select('*', { count: 'exact', head: true });

    if (tradeRelError) {
      results.push({
        check: 'Agency-trade relationships',
        passed: false,
        details: `Error: ${tradeRelError.message}`,
      });
      allPassed = false;
    } else {
      const passed = tradeRelCount === expectedTradeRelationships;
      results.push({
        check: 'Agency-trade relationships',
        passed,
        details: `Expected: ${expectedTradeRelationships}, Found: ${tradeRelCount}`,
      });
      if (!passed) allPassed = false;
    }

    // 5. Verify agency-region relationships
    const expectedRegionRelationships = mockAgencies.reduce(
      (sum, agency) => sum + agency.regions.length,
      0
    );
    const { count: regionRelCount, error: regionRelError } = await supabase
      .from('agency_regions')
      .select('*', { count: 'exact', head: true });

    if (regionRelError) {
      results.push({
        check: 'Agency-region relationships',
        passed: false,
        details: `Error: ${regionRelError.message}`,
      });
      allPassed = false;
    } else {
      const passed = regionRelCount === expectedRegionRelationships;
      results.push({
        check: 'Agency-region relationships',
        passed,
        details: `Expected: ${expectedRegionRelationships}, Found: ${regionRelCount}`,
      });
      if (!passed) allPassed = false;
    }

    // 6. Verify compliance records
    const expectedComplianceCount = mockComplianceData.reduce(
      (sum, agency) => sum + agency.complianceItems.length,
      0
    );
    const { count: complianceCount, error: complianceCountError } = await supabase
      .from('agency_compliance')
      .select('*', { count: 'exact', head: true });

    if (complianceCountError) {
      results.push({
        check: 'Compliance records',
        passed: false,
        details: `Error: ${complianceCountError.message}`,
      });
      allPassed = false;
    } else {
      const passed = complianceCount === expectedComplianceCount;
      results.push({
        check: 'Compliance records',
        passed,
        details: `Expected: ${expectedComplianceCount}, Found: ${complianceCount}`,
      });
      if (!passed) allPassed = false;
    }

    // 7. Verify specific agency has correct trades (using first agency)
    const { data: sampleAgency, error: sampleError } = await supabase
      .from('agencies')
      .select(
        `
        name,
        trades:agency_trades(
          trade:trades(name)
        )
      `
      )
      .eq('name', mockAgencies[0].name)
      .single();

    if (sampleError) {
      results.push({
        check: 'Sample agency trades',
        passed: false,
        details: `Error: ${sampleError.message}`,
      });
      allPassed = false;
    } else if (sampleAgency) {
      const expectedTrades = mockAgencies[0].trades || [];
      const foundTrades = (
        (sampleAgency.trades || []) as unknown as Array<{
          trade: { name: string };
        }>
      )
        .map((t) => t.trade.name)
        .sort();
      const passed =
        expectedTrades.length === foundTrades.length &&
        expectedTrades.every((t) => foundTrades.includes(t));
      results.push({
        check: 'Sample agency trades',
        passed,
        details: `Expected: [${expectedTrades.join(', ')}], Found: [${foundTrades.join(', ')}]`,
      });
      if (!passed) allPassed = false;
    }

    const duration = Date.now() - startTime;

    // Output results
    log.section('Verification Results');
    results.forEach((result) => {
      if (result.passed) {
        log.success(`${result.check}: ${result.details}`);
      } else {
        log.error(`${result.check}: ${result.details}`);
      }
    });

    log.info(`Verification completed in ${duration}ms`);

    if (allPassed) {
      log.success('All verification checks passed!');
    } else {
      log.error('Some verification checks failed');
    }

    return allPassed;
  } catch (error) {
    log.error('Verification failed with unexpected error');
    if (error instanceof Error) {
      log.error(error.message);
    }
    return false;
  }
}

// Main entry point
async function main() {
  try {
    log.section('Database Seed Script');

    // Validate environment
    const { url, key } = validateEnvironment();

    // Create Supabase client
    const supabase = createSupabaseClient(url, key);

    // Test connection with retries
    let connected = false;
    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      connected = await testConnection(supabase);
      if (connected) {
        break;
      }

      if (attempt < maxRetries) {
        log.warning(
          `Connection attempt ${attempt} failed. Retrying in 5 seconds...`
        );
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }

    if (!connected) {
      log.error(`Failed to connect after ${maxRetries} attempts`);
      process.exit(1);
    }

    // Handle different modes
    if (isVerifyOnly) {
      log.section('Verification Mode');
      const verificationPassed = await verifySeededData(supabase);
      process.exit(verificationPassed ? 0 : 1);
    } else if (isReset) {
      log.section('Reset Mode');
      log.warning('This will clear all existing data before seeding');
      log.warning('Press Ctrl+C within 3 seconds to cancel...');

      // Give user time to cancel
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Perform reset
      await resetDatabase(supabase);

      // Continue with seeding after reset
      log.section('Seeding after reset');
    }

    // Perform seeding (for both normal mode and after reset)
    if (!isVerifyOnly) {
      log.section('Seed Mode');

      // Seed trades
      const tradeIdMap = await seedTrades(supabase);

      // Seed regions
      const regionIdMap = await seedRegions(supabase);

      // Seed agencies
      const agencyIdMap = await seedAgencies(supabase);

      // Create agency-trade relationships
      await createAgencyTradeRelationships(supabase, agencyIdMap, tradeIdMap);

      // Create agency-region relationships
      await createAgencyRegionRelationships(supabase, agencyIdMap, regionIdMap);

      // Seed compliance data
      await seedCompliance(supabase, agencyIdMap);
    }

    log.success('Script completed successfully');
  } catch (error) {
    log.error('Unexpected error occurred');
    if (error instanceof Error) {
      log.error(error.message);
      if (error.stack) {
        console.error(error.stack);
      }
    }
    process.exit(1);
  }
}

// Error handling for unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  log.error('Unhandled Rejection at:');
  console.error(promise);
  log.error(`Reason: ${reason}`);
  process.exit(1);
});

// Run the script
if (require.main === module) {
  main();
}

// Export types and utilities for testing
export {
  log,
  validateEnvironment,
  createSupabaseClient,
  testConnection,
  extractUniqueTrades,
  seedTrades,
  extractUniqueStates,
  createStateMapping,
  seedRegions,
  seedAgencies,
  createAgencyTradeRelationships,
  createAgencyRegionRelationships,
  resetDatabase,
  verifySeededData,
};
