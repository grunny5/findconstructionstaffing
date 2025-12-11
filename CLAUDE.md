# Claude Context: FindConstructionStaffing

This file provides essential context for AI assistants working on the FindConstructionStaffing project.

## Project Overview

**FindConstructionStaffing** is a Next.js-based directory platform connecting construction companies with specialized staffing agencies across North America.

### Technology Stack

- **Framework**: Next.js 13.5.1 with App Router
- **Language**: TypeScript with strict mode
- **Database**: Supabase (PostgreSQL)
- **UI**: Tailwind CSS + Shadcn/ui components
- **Testing**: Jest with 85%+ coverage requirement

## Essential Commands

### Database Seeding

```bash
npm run seed         # Seed database with mock data
npm run seed:reset   # Clear and re-seed (destructive)
npm run seed:verify  # Verify data integrity
```

### Development

```bash
npm run dev         # Start development server
npm run build       # Build for production
npm run test        # Run test suite
npm run lint        # Run ESLint
```

## Key Project Structure

```
findconstructionstaffing/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Home page with agency directory
│   ├── api/               # API routes
│   └── recruiters/[slug]/ # Dynamic agency profiles
├── components/            # React components
│   ├── ui/               # Shadcn/ui components (47 total)
│   └── *.tsx             # Custom components
├── lib/                  # Core utilities
│   ├── mock-data.ts      # Mock agency data (12 agencies)
│   ├── supabase.ts       # Database client & types
│   └── utils.ts          # Helper functions
├── scripts/              # Database seeding
│   ├── seed-database.ts  # Main seeding script
│   └── __tests__/        # Comprehensive test suite
└── docs/                 # Project documentation
```

## Data Model

### Core Entities

- **Agencies**: 12 staffing companies with complete profiles
- **Trades**: 48 construction specialties (electrician, plumber, etc.)
- **Regions**: US states where agencies operate
- **Relationships**: Many-to-many (agency-trade, agency-region)

### Seeded Data Counts

- 12 agencies
- 48 trades
- 35 regions
- 60 agency-trade relationships
- 58 agency-region relationships

## Important Files

### Configuration

- **`.env.local`**: Environment variables (never commit)
- **`package.json`**: Dependencies and scripts
- **`tailwind.config.js`**: Tailwind configuration
- **`tsconfig.json`**: TypeScript strict mode

### Core Business Logic

- **`lib/mock-data.ts`**: Source of truth for agency data
- **`lib/supabase.ts`**: Database types and client configuration
- **`app/api/agencies/route.ts`**: Main API endpoint
- **`components/AgencyCard.tsx`**: Agency display component

### Documentation

- **`README.md`**: Setup and usage instructions
- **`docs/features/002-database-seed-script.md`**: Seeding feature spec
- **`docs/development-workflow.md`**: Daily development guide

## Common Tasks

### Adding New Agency Data

1. Update `lib/mock-data.ts`
2. Run `npm run seed:reset`
3. Verify with `npm run seed:verify`

### API Development

1. Seed database: `npm run seed`
2. Test endpoint: `curl http://localhost:3000/api/agencies`
3. Check filters: `?trade=Electrician&state=TX`

### Component Development

1. Ensure database is seeded
2. Start dev server: `npm run dev`
3. Components have access to 12 agencies with diverse characteristics

### Testing

1. Unit tests: `npm test lib/` or `npm test components/`
2. Seed tests: `npm test scripts/__tests__/`
3. Coverage: `npm test -- --coverage`

## Development Principles

### Code Standards

- TypeScript strict mode required
- 80%+ test coverage required
- No unnecessary comments in code
- Use existing UI components from Shadcn/ui

### Database

- Always use seeded data for development
- Never modify database directly - update mock data
- Verify integrity after schema changes
- Use idempotent operations

### Performance

- Seed script completes in <30 seconds
- API responses optimized for search/filtering
- Components use lazy loading where appropriate

## Troubleshooting

### Common Issues

- **No agencies in API**: Run `npm run seed:verify`
- **Database connection issues**: Check `.env.local` variables
- **Test failures**: Reset with `npm run seed:reset`
- **TypeScript errors**: Ensure strict mode compliance

### Environment Variables Required

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key  # For seeding
```

## Feature Status

### Completed ✅

- Agency directory with search/filtering
- Database seeding with comprehensive test suite
- API endpoints for agency data
- Responsive UI with Shadcn/ui components
- TypeScript interfaces and validation

### In Progress 🚧

- Agency profile enhancements
- Lead generation forms
- Review system

### Planned 📋

- User authentication
- Agency dashboards
- Payment integration
- Mobile app

## AI Assistant Guidelines

When working on this project:

1. **Always check if database is seeded** before debugging API/frontend issues
2. **Use existing TypeScript interfaces** - don't create duplicate types
3. **Follow Shadcn/ui patterns** for new components
4. **Update tests** when modifying core functionality
5. **Check mock data** when adding new agency scenarios
6. **Verify changes** with `npm run seed:verify` after schema updates

## Quick Reference

```bash
# Fresh start
npm run seed:reset && npm run dev

# Test everything
npm test && npm run seed:verify

# Deploy prep
npm run build && npm run test

# Debug API
npm run seed && curl http://localhost:3000/api/agencies
```

This project follows strict development standards with comprehensive testing. The seeded data provides consistent, realistic test scenarios for all development work.
