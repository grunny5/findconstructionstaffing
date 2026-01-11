#!/usr/bin/env tsx
/**
 * Environment Variable Validation Script
 *
 * Validates that all required environment variables are present and configured correctly.
 * Decodes JWT tokens to verify they match the expected Supabase project.
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

interface ValidationResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
}

/**
 * Decode JWT token to extract project reference
 * Uses base64url decoding (JWT standard)
 */
function decodeJWT(token: string): { ref?: string; role?: string; exp?: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    // Convert base64url to base64: replace '-' with '+', '_' with '/'
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');

    // Add padding to make length a multiple of 4
    while (base64.length % 4 !== 0) {
      base64 += '=';
    }

    const payload = Buffer.from(base64, 'base64').toString('utf8');
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

/**
 * Extract project ID from Supabase URL
 */
function extractProjectId(url: string): string | null {
  try {
    const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Validate environment variables
 */
function validateEnvironment(): ValidationResult[] {
  const results: ValidationResult[] = [];

  // Check NEXT_PUBLIC_SUPABASE_URL
  const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!publicUrl) {
    results.push({
      name: 'NEXT_PUBLIC_SUPABASE_URL',
      status: 'fail',
      message: 'Missing from .env.local'
    });
  } else {
    const projectId = extractProjectId(publicUrl);
    results.push({
      name: 'NEXT_PUBLIC_SUPABASE_URL',
      status: 'pass',
      message: `Found: ${publicUrl} (Project: ${projectId})`
    });
  }

  // Check SUPABASE_URL
  const supabaseUrl = process.env.SUPABASE_URL;
  if (!supabaseUrl) {
    results.push({
      name: 'SUPABASE_URL',
      status: 'fail',
      message: 'Missing from .env.local (required for seed script)'
    });
  } else if (supabaseUrl !== publicUrl) {
    results.push({
      name: 'SUPABASE_URL',
      status: 'warning',
      message: `Mismatch: ${supabaseUrl} !== ${publicUrl}`
    });
  } else {
    results.push({
      name: 'SUPABASE_URL',
      status: 'pass',
      message: `Matches NEXT_PUBLIC_SUPABASE_URL`
    });
  }

  // Check NEXT_PUBLIC_SUPABASE_ANON_KEY
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!anonKey) {
    results.push({
      name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      status: 'fail',
      message: 'Missing from .env.local'
    });
  } else {
    const decoded = decodeJWT(anonKey);
    if (!decoded) {
      results.push({
        name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        status: 'fail',
        message: 'Invalid JWT format'
      });
    } else {
      const expectedProjectId = extractProjectId(publicUrl || '');
      const keyProjectId = decoded.ref;

      if (keyProjectId !== expectedProjectId) {
        results.push({
          name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
          status: 'fail',
          message: `Project mismatch: Key is for '${keyProjectId}' but URL is '${expectedProjectId}'`
        });
      } else {
        results.push({
          name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
          status: 'pass',
          message: `Valid for project: ${keyProjectId} (role: ${decoded.role})`
        });
      }
    }
  }

  // Check SUPABASE_SERVICE_ROLE_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    results.push({
      name: 'SUPABASE_SERVICE_ROLE_KEY',
      status: 'fail',
      message: 'Missing from .env.local (required for seed script)'
    });
  } else {
    const decoded = decodeJWT(serviceKey);
    if (!decoded) {
      results.push({
        name: 'SUPABASE_SERVICE_ROLE_KEY',
        status: 'fail',
        message: 'Invalid JWT format'
      });
    } else {
      const expectedProjectId = extractProjectId(publicUrl || '');
      const keyProjectId = decoded.ref;

      if (keyProjectId !== expectedProjectId) {
        results.push({
          name: 'SUPABASE_SERVICE_ROLE_KEY',
          status: 'fail',
          message: `Project mismatch: Key is for '${keyProjectId}' but URL is '${expectedProjectId}'`
        });
      } else {
        results.push({
          name: 'SUPABASE_SERVICE_ROLE_KEY',
          status: 'pass',
          message: `Valid for project: ${keyProjectId} (role: ${decoded.role})`
        });
      }
    }
  }

  return results;
}

/**
 * Print validation results
 */
function printResults(results: ValidationResult[]): void {
  console.log('\n🔍 Environment Variable Validation\n');
  console.log('═'.repeat(80));

  let hasFailures = false;
  let hasWarnings = false;

  results.forEach(result => {
    const symbol = result.status === 'pass' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
    console.log(`\n${symbol} ${result.name}`);
    console.log(`   ${result.message}`);

    if (result.status === 'fail') hasFailures = true;
    if (result.status === 'warning') hasWarnings = true;
  });

  console.log('\n' + '═'.repeat(80));

  if (!hasFailures && !hasWarnings) {
    console.log('\n✅ All environment variables are valid!\n');
    process.exit(0);
  } else if (hasFailures) {
    console.log('\n❌ Validation failed. Please fix the issues above.\n');
    console.log('💡 To get the correct SUPABASE_SERVICE_ROLE_KEY:');
    const projectId = extractProjectId(process.env.NEXT_PUBLIC_SUPABASE_URL || '');
    if (projectId) {
      console.log(`   1. Visit: https://supabase.com/dashboard/project/${projectId}/settings/api`);
      console.log('   2. Copy the "service_role" key (not the anon key)');
      console.log('   3. Update SUPABASE_SERVICE_ROLE_KEY in .env.local');
      console.log('   4. Run this script again to verify\n');
    }
    process.exit(1);
  } else {
    console.log('\n⚠️  Validation passed with warnings. Review the messages above.\n');
    process.exit(0);
  }
}

// Run validation
const results = validateEnvironment();
printResults(results);
