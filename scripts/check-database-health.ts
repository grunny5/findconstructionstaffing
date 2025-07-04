#!/usr/bin/env node

/**
 * Database Health Check Script
 *
 * Checks database connectivity and table structure for CI/CD environments
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

const log = {
  info: (msg: string) => console.log(`${colors.blue}ℹ${colors.reset}  ${msg}`),
  success: (msg: string) =>
    console.log(`${colors.green}✓${colors.reset}  ${msg}`),
  warning: (msg: string) =>
    console.log(`${colors.yellow}⚠${colors.reset}  ${msg}`),
  error: (msg: string) =>
    console.error(`${colors.red}✗${colors.reset}  ${msg}`),
};

interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'partial';
  checks: {
    connection: boolean;
    tablesExist: boolean;
    dataPresent: boolean;
    permissions: boolean;
  };
  details: string[];
}

async function checkDatabaseHealth(): Promise<HealthCheckResult> {
  const result: HealthCheckResult = {
    status: 'unhealthy',
    checks: {
      connection: false,
      tablesExist: false,
      dataPresent: false,
      permissions: false,
    },
    details: [],
  };

  try {
    // Get connection details
    const url =
      process.env.SUPABASE_URL ||
      process.env.DATABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      result.details.push('Missing database connection environment variables');
      return result;
    }

    // Create client
    const supabase = createClient(url, key);

    // Test 1: Basic connection
    log.info('Testing database connection...');
    try {
      const { error } = await supabase
        .from('agencies')
        .select('count')
        .limit(1);
      if (!error || error.code === '42P01') {
        // 42P01 = table does not exist
        result.checks.connection = true;
        log.success('Database connection successful');
      } else {
        throw error;
      }
    } catch (error: any) {
      log.error('Database connection failed');
      result.details.push(`Connection error: ${error.message}`);
      return result;
    }

    // Test 2: Check if tables exist
    log.info('Checking table structure...');
    const requiredTables = [
      'agencies',
      'trades',
      'regions',
      'agency_trades',
      'agency_regions',
    ];
    const existingTables: string[] = [];

    for (const table of requiredTables) {
      const { error } = await supabase.from(table).select('count').limit(1);
      if (!error) {
        existingTables.push(table);
      }
    }

    if (existingTables.length === requiredTables.length) {
      result.checks.tablesExist = true;
      log.success('All required tables exist');
    } else {
      const missingTables = requiredTables.filter(
        (t) => !existingTables.includes(t)
      );
      log.warning(`Missing tables: ${missingTables.join(', ')}`);
      result.details.push(`Missing tables: ${missingTables.join(', ')}`);
    }

    // Test 3: Check if data is present
    if (result.checks.tablesExist) {
      log.info('Checking data presence...');

      const { count: agencyCount } = await supabase
        .from('agencies')
        .select('*', { count: 'exact', head: true });

      const { count: tradeCount } = await supabase
        .from('trades')
        .select('*', { count: 'exact', head: true });

      const { count: regionCount } = await supabase
        .from('regions')
        .select('*', { count: 'exact', head: true });

      if (
        (agencyCount || 0) > 0 &&
        (tradeCount || 0) > 0 &&
        (regionCount || 0) > 0
      ) {
        result.checks.dataPresent = true;
        log.success(
          `Data present - Agencies: ${agencyCount}, Trades: ${tradeCount}, Regions: ${regionCount}`
        );
      } else {
        log.warning('No data found in tables');
        result.details.push(
          'Tables exist but contain no data - run seed script'
        );
      }
    }

    // Test 4: Check permissions
    log.info('Checking permissions...');
    try {
      // Try to perform a read operation
      const { data, error } = await supabase
        .from('agencies')
        .select('id, name')
        .limit(1);

      if (!error) {
        result.checks.permissions = true;
        log.success('Read permissions verified');
      } else {
        throw error;
      }
    } catch (error: any) {
      log.error('Permission check failed');
      result.details.push(`Permission error: ${error.message}`);
    }

    // Determine overall status
    const passedChecks = Object.values(result.checks).filter(Boolean).length;
    if (passedChecks === 4) {
      result.status = 'healthy';
    } else if (passedChecks >= 2) {
      result.status = 'partial';
    }

    return result;
  } catch (error: any) {
    log.error('Unexpected error during health check');
    result.details.push(`Unexpected error: ${error.message}`);
    return result;
  }
}

// Main execution
async function main() {
  console.log('\n=== Database Health Check ===\n');

  const result = await checkDatabaseHealth();

  // Summary
  console.log('\n=== Summary ===');
  console.log(`Overall Status: ${result.status.toUpperCase()}`);
  console.log('\nChecks:');
  console.log(`  Connection: ${result.checks.connection ? '✓' : '✗'}`);
  console.log(`  Tables Exist: ${result.checks.tablesExist ? '✓' : '✗'}`);
  console.log(`  Data Present: ${result.checks.dataPresent ? '✓' : '✗'}`);
  console.log(`  Permissions: ${result.checks.permissions ? '✓' : '✗'}`);

  if (result.details.length > 0) {
    console.log('\nDetails:');
    result.details.forEach((detail) => console.log(`  - ${detail}`));
  }

  // Exit with appropriate code
  process.exit(result.status === 'healthy' ? 0 : 1);
}

if (require.main === module) {
  main();
}

export { checkDatabaseHealth };
