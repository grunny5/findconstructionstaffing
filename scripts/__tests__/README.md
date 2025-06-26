# Database Seed Script Test Suite

This directory contains comprehensive tests for the database seeding functionality.

## Test Coverage

Current coverage: **85.87%** (exceeds PKD requirement of 80%)

## Test Files

### Core Functionality Tests

1. **seed-database.test.ts**
   - Environment validation
   - Database connection testing
   - Main function orchestration
   - Command-line argument handling

2. **seed-trades.test.ts**
   - Trade extraction from mock data
   - Trade seeding with deduplication
   - Batch processing performance
   - Error handling and recovery

3. **seed-regions.test.ts**
   - State extraction and mapping
   - Region seeding with validation
   - Invalid state handling
   - Slug generation

4. **seed-agencies.test.ts**
   - Agency data transformation
   - Field mapping and defaults
   - Timestamp generation
   - Batch processing

5. **seed-relationships.test.ts**
   - Agency-trade relationship creation
   - Agency-region relationship creation
   - Foreign key validation
   - Batch processing for performance

### Advanced Feature Tests

6. **seed-reset.test.ts**
   - Database reset functionality
   - Deletion order validation
   - Foreign key constraint handling
   - Safety mechanisms

7. **seed-verification.test.ts**
   - Data integrity verification
   - Count validation
   - Relationship verification
   - Sample data checks

8. **seed-idempotency.test.ts**
   - Multiple run safety
   - Duplicate prevention
   - State consistency
   - Performance on repeated runs

9. **seed-performance.test.ts**
   - Batch size optimization
   - Overall execution time
   - Resource efficiency

## Test Patterns

### Mocking Strategy
- Supabase client mocking for unit tests
- Controlled data responses
- Error simulation

### Test Organization
- Describe blocks for each function
- Clear test names
- Comprehensive coverage of:
  - Happy path scenarios
  - Error conditions
  - Edge cases
  - Performance requirements

### Assertions
- Data integrity checks
- Count validations
- Performance benchmarks
- Error message validation

## Running Tests

```bash
# Run all seed script tests
npm test scripts/__tests__

# Run with coverage
npm test scripts/__tests__ -- --coverage

# Run specific test file
npm test scripts/__tests__/seed-trades.test.ts

# Run in watch mode
npm test scripts/__tests__ -- --watch
```

## Key Test Scenarios

### Idempotency
- Running seed script multiple times produces identical results
- No duplicates created
- Existing data preserved

### Error Handling
- Database connection failures
- Foreign key violations
- Invalid data handling
- Graceful error recovery

### Performance
- Batch processing efficiency
- Sub-second execution for most operations
- Scalable to larger datasets

### Data Integrity
- All relationships maintained
- Correct data transformations
- Validation of seeded data

## Continuous Integration

These tests should be run in CI/CD pipeline to ensure:
- No regressions in seeding functionality
- Consistent behavior across environments
- Performance standards maintained