#!/usr/bin/env node

/**
 * Validate Test Data Script
 *
 * Ensures test data matches between mock data and test files
 */

import { mockAgencies, allTrades, allStates } from '../../lib/mock-data';
import { createSlug } from '../../lib/supabase';
import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';

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

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

function getValidSlugs(): {
  agencies: string[];
  trades: string[];
  states: string[];
} {
  // Get all valid agency slugs from mock data
  const agencySlugs = mockAgencies.map((agency) => createSlug(agency.name));

  // Get all valid trade slugs
  const tradeSlugs = new Set<string>();
  mockAgencies.forEach((agency) => {
    agency.trades.forEach((trade) => {
      tradeSlugs.add(createSlug(trade));
    });
  });

  // Get all valid state codes
  const stateCodes = allStates.map((state) => state.code);

  return {
    agencies: agencySlugs,
    trades: Array.from(tradeSlugs),
    states: stateCodes,
  };
}

function findHardcodedSlugs(filePath: string): string[] {
  const content = fs.readFileSync(filePath, 'utf-8');

  // Patterns to find hardcoded slugs
  const patterns = [
    // Agency slugs in URLs or tests
    /\/agencies\/([a-z0-9-]+)/g,
    /slug['"]\s*[:=]\s*['"]([a-z0-9-]+)['"]/g,
    /['"]slug['"]\s*,\s*['"]([a-z0-9-]+)['"]/g,

    // Trade slugs
    /trades?['"]\s*[:=]\s*\[?['"]([a-z0-9-]+)['"]/g,
    /trade\.slug\s*===?\s*['"]([a-z0-9-]+)['"]/g,

    // State codes
    /states?\[?\]?\s*[:=]\s*\[?['"]([A-Z]{2})['"]/g,
    /state_code\s*[:=]\s*['"]([A-Z]{2})['"]/g,
  ];

  const foundSlugs: string[] = [];

  patterns.forEach((pattern) => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      if (match[1]) {
        foundSlugs.push(match[1]);
      }
    }
  });

  return foundSlugs;
}

function validateTestFiles(): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  const validSlugs = getValidSlugs();

  // Find all test files
  const testFiles = glob.sync('**/*.test.{ts,tsx,js,jsx}', {
    ignore: ['node_modules/**', '.next/**', 'coverage/**'],
  });

  log.info(`Found ${testFiles.length} test files to validate`);

  testFiles.forEach((file) => {
    const slugs = findHardcodedSlugs(file);

    slugs.forEach((slug) => {
      // Check if it's a valid slug
      let isValid = false;
      let slugType = '';

      // Check if it's an agency slug
      if (validSlugs.agencies.includes(slug)) {
        isValid = true;
        slugType = 'agency';
      }
      // Check if it's a trade slug
      else if (validSlugs.trades.includes(slug)) {
        isValid = true;
        slugType = 'trade';
      }
      // Check if it's a state code (uppercase)
      else if (/^[A-Z]{2}$/.test(slug) && validSlugs.states.includes(slug)) {
        isValid = true;
        slugType = 'state';
      }
      // Check common test slugs that might be mocked
      else if (
        [
          'test-agency',
          'mock-agency',
          'example-agency',
          'invalid-slug',
          // Admin API route endpoints (not slugs)
          'bulk-import',
          // Common test fixture ID patterns
          'agency-123',
          'agency-456',
          'agency-789',
          // Generic test identifiers
          'description',
          'template',
          'route',
          // Test fixture slugs for specific test scenarios
          'non-existent',
          'electricians',
          'full-agency',
          'no-relations',
          'active-agency',
        ].includes(slug)
      ) {
        // These are okay for testing and admin routes
        isValid = true;
        slugType = 'test-mock';
      }

      // Also allow slugs that match test ID patterns (agency-NNN)
      const isTestIdPattern = /^agency-\d+$/.test(slug);

      if (
        !isValid &&
        !slug.includes('test') &&
        !slug.includes('mock') &&
        !isTestIdPattern
      ) {
        result.valid = false;
        result.errors.push(
          `Invalid ${slugType || 'unknown'} slug "${slug}" in ${file}`
        );
      }
    });
  });

  // Check for common issues
  const apiTestFiles = testFiles.filter((f) => f.includes('api/'));

  apiTestFiles.forEach((file) => {
    const content = fs.readFileSync(file, 'utf-8');

    // Check if API tests use real slugs
    if (content.includes('fetch(') || content.includes('GET(')) {
      if (!content.includes('mock') && !content.includes('createMock')) {
        result.warnings.push(
          `API test ${file} might need mocking - ensure it doesn't make real API calls`
        );
      }
    }
  });

  return result;
}

function generateValidSlugsFile(): void {
  const validSlugs = getValidSlugs();

  const content = `// Auto-generated file - DO NOT EDIT
// Generated by: npm run validate:test-data

/**
 * Valid slugs from mock data for use in tests
 */

export const VALID_TEST_SLUGS = {
  agencies: ${JSON.stringify(validSlugs.agencies, null, 2).replace(/"/g, "'")},
  
  trades: ${JSON.stringify(validSlugs.trades, null, 2).replace(/"/g, "'")},
  
  states: ${JSON.stringify(validSlugs.states, null, 2).replace(/"/g, "'")},
} as const;

// Helper to get a random valid slug for testing
export function getRandomAgencySlug(): string {
  const slugs = VALID_TEST_SLUGS.agencies;
  return slugs[Math.floor(Math.random() * slugs.length)];
}

export function getRandomTradeSlug(): string {
  const slugs = VALID_TEST_SLUGS.trades;
  return slugs[Math.floor(Math.random() * slugs.length)];
}

export function getRandomStateCode(): string {
  const codes = VALID_TEST_SLUGS.states;
  return codes[Math.floor(Math.random() * codes.length)];
}
`;

  const outputPath = path.join(
    process.cwd(),
    '__tests__/utils/valid-test-slugs.ts'
  );

  // Ensure directory exists
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(outputPath, content, 'utf-8');
  log.success(`Generated valid slugs file at: ${outputPath}`);
}

// Main execution
async function main() {
  console.log('\n=== Test Data Validation ===\n');

  // Generate valid slugs file
  generateValidSlugsFile();

  // Validate test files
  const result = validateTestFiles();

  // Summary
  console.log('\n=== Summary ===');

  if (result.errors.length > 0) {
    log.error(`Found ${result.errors.length} errors:`);
    result.errors.forEach((error) => console.log(`  - ${error}`));
  }

  if (result.warnings.length > 0) {
    log.warning(`Found ${result.warnings.length} warnings:`);
    result.warnings.forEach((warning) => console.log(`  - ${warning}`));
  }

  if (result.valid) {
    log.success('All test data is valid!');
  } else {
    log.error('Test data validation failed');
    console.log('\nTo fix:');
    console.log('1. Update test files to use valid slugs from mock data');
    console.log('2. Or add the slugs to mock data if they should be valid');
    console.log('3. Use the generated valid-test-slugs.ts file for test data');
  }

  // Exit with appropriate code
  process.exit(result.valid ? 0 : 1);
}

if (require.main === module) {
  main();
}

export { validateTestFiles, getValidSlugs };
