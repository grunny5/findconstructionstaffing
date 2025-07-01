# Development Workflow Guide

This guide outlines common development workflows and best practices for working with the FindConstructionStaffing platform.

## Database Seeding Workflow

### When to Seed the Database

**Always seed when:**
- Setting up the project for the first time
- Switching branches that may have schema changes
- After database migrations or schema updates
- When starting work on features that depend on agency data
- Before running integration tests

**Consider seeding when:**
- API responses seem incomplete or missing data
- Frontend components aren't displaying expected data
- Working on search/filter functionality

### Quick Mode for Development

For faster iteration during development:
```bash
# Seeds only 3 agencies instead of 12
SEED_QUICK_MODE=true npm run seed

# Custom agency count
SEED_AGENCY_COUNT=5 npm run seed

# Skip relationships for basic testing
SEED_SKIP_RELATIONSHIPS=true npm run seed
```

**Note:** These environment variables are planned features. Currently, the script always seeds all 12 agencies.

### Daily Development Routine

```bash
# 1. Pull latest changes
git pull origin main

# 2. Install dependencies (if package.json changed)
npm install

# 3. Seed database with fresh data
npm run seed

# 4. Run CI checks locally before starting work
npm run type-check  # TypeScript compilation
npm run lint        # ESLint checks
npm run format:check # Prettier formatting

# 5. Start development server
npm run dev
```

### Working with Database Changes

#### After Schema Changes
```bash
# 1. Reset and re-seed to ensure schema compatibility
npm run seed:reset

# 2. Verify data integrity
npm run seed:verify
```

#### Testing with Clean Data
```bash
# Reset to known state before testing
npm run seed:reset

# Run your tests
npm test

# Verify seeded data is intact
npm run seed:verify
```

## API Development Workflow

### Testing API Endpoints

The seeded data provides consistent test data for API development:

```bash
# 1. Ensure database is seeded
npm run seed

# 2. Test API endpoints
curl http://localhost:3000/api/agencies
curl "http://localhost:3000/api/agencies?trade=Electrician"
curl "http://localhost:3000/api/agencies?state=TX"

# 3. Verify responses contain expected seeded agencies
```

### Expected Seeded Data

After seeding, you should have:
- **12 agencies** with complete profiles
- **48 unique trades** across all specialties
- **35 regions** (US states where agencies operate)
- **118 relationships** (60 agency-trade + 58 agency-region)

## Frontend Development Workflow

### Component Development
```bash
# 1. Seed database for consistent data
npm run seed

# 2. Start development server
npm run dev

# 3. Components will have access to:
#    - 12 agencies for directory listings
#    - Multiple trades for filter testing
#    - Various states for location filtering
```

### Testing Search and Filters
The seeded data includes agencies with diverse characteristics:
- Union and non-union agencies
- Per diem and non-per diem agencies
- Multiple trades per agency
- Geographic distribution across states

## Feature Development Workflow

### Adding New Agency Fields
1. Update TypeScript interfaces in `lib/supabase.ts`
2. Update mock data in `lib/mock-data.ts`
3. Update seeding script in `scripts/seed-database.ts`
4. Update tests to verify new fields
5. Run `npm run seed:reset` to test with new schema

### Adding New Relationships
1. Define new junction table structure
2. Update seeding script to create relationships
3. Add verification queries for new relationships
4. Update API endpoints to return new relationship data

## Testing Workflow

### Unit Testing
```bash
# Run specific test suites
npm test lib/
npm test components/
npm test scripts/__tests__/
```

### Integration Testing
```bash
# 1. Reset database to known state
npm run seed:reset

# 2. Run integration tests
npm test -- --testPathPattern=integration

# 3. Verify database state after tests
npm run seed:verify
```

### End-to-End Testing
```bash
# 1. Seed database with full dataset
npm run seed

# 2. Start application
npm run build && npm start

# 3. Run E2E tests against seeded data
npm run test:e2e
```

## Troubleshooting Common Issues

### "No agencies found" in API responses
```bash
# Check if database is seeded
npm run seed:verify

# If verification fails, re-seed
npm run seed:reset
```

### Inconsistent test results
```bash
# Reset to clean state before each test run
npm run seed:reset
npm test
```

### Performance issues with seeding
```bash
# Check seeding performance
time npm run seed

# Should complete in under 30 seconds
# If slower, check database connectivity
```

## CI/CD Workflow

### Pre-Push Checklist
Before pushing code:
```bash
# Run all quality checks
npm run type-check    # TypeScript compilation
npm run lint          # ESLint validation
npm run format        # Auto-fix formatting
npm run test          # Run test suite
```

### Pull Request Workflow
1. **Create feature branch**: `git checkout -b feat/your-feature`
2. **Make changes and commit**: Follow conventional commits
3. **Push branch**: `git push origin feat/your-feature`
4. **Open PR**: CI checks will run automatically

### CI Pipeline Checks
Every PR triggers:
- **Code Quality Checks**: TypeScript, ESLint, Prettier
- **Test Suite**: Jest unit tests with coverage
- **Security Scanning**: npm audit
- **Build Verification**: Next.js production build

### Fixing CI Failures
If CI checks fail:
```bash
# TypeScript errors
npm run type-check
# Fix type errors in reported files

# ESLint errors
npm run lint
# Fix linting issues or use:
npm run lint -- --fix

# Prettier errors
npm run format
# This auto-fixes all formatting

# Test failures
npm test
# Fix failing tests
```

## Code Review Checklist

When reviewing PRs:

### Data & API Changes
- [ ] Does the PR update mock data if schema changed?
- [ ] Are seeding scripts updated for new fields/relationships?
- [ ] Do tests account for seeded data structure?
- [ ] Is verification updated for new data requirements?
- [ ] Does documentation reflect data changes?

### CI/CD Requirements
- [ ] All CI checks passing (green status)
- [ ] TypeScript compilation successful
- [ ] No ESLint errors (warnings acceptable)
- [ ] Code properly formatted with Prettier
- [ ] Test coverage maintained or improved
- [ ] No security vulnerabilities introduced

## Best Practices

### Database Seeding
- Always use `npm run seed:verify` after seeding to confirm success
- Use `npm run seed:reset` sparingly - only when you need a clean slate
- Don't modify seeded data manually in database - update mock data instead

### Development Environment
- Keep local environment variables in `.env.local`
- Use development database, never seed production
- Commit changes to mock data when adding test scenarios

### Collaboration
- Document any new required environment variables
- Update README if adding new NPM scripts
- Communicate schema changes that affect seeding to the team

## Environment-Specific Notes

### Development
- Seeding is safe and encouraged
- Use realistic but obviously fake data
- Performance is less critical than data completeness

### Staging
- Should use production-like data volume
- Seeding should be automated in deployment pipeline
- Verify data integrity after deployment

### Production
- Never run seed scripts against production
- Use proper migrations and data management tools
- Maintain separate production data import processes

## Production Safety Guidelines

### Environment Safeguards
The seed script includes multiple safety mechanisms:

1. **Service Role Key Requirement**: Won't run without proper authentication
2. **URL Validation**: Checks for development patterns in database URL
3. **Reset Confirmation**: 3-second pause before destructive operations
4. **Idempotent by Default**: Won't create duplicates if data exists

### Best Practices for Safety

#### Development
- Use `.env.local` for credentials (never commit)
- Run freely - designed for repeated use
- Use `seed:verify` to check data integrity

#### Staging
- Future feature: Will require `--staging` flag
- Currently: Double-check URL before running
- Always verify with `seed:verify` after seeding

#### Production
- **NEVER** run seed scripts in production
- Block service role key access in production
- Use database migrations for schema changes
- Use admin panels or APIs for data entry

### Emergency Procedures

If accidentally run in wrong environment:
1. **DO NOT** run `seed:reset` - it will delete data
2. Check with `npm run seed:verify` to see what was added
3. Manually review and remove test agencies if needed
4. Update credentials to prevent future accidents