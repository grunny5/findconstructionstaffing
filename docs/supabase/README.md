# Supabase Setup & Configuration

Consolidated guide for setting up and configuring Supabase for FindConstructionStaffing.

## Quick Links

- [Setup Guide](./supabase-setup-guide.md) - Complete setup instructions
- [CLI Setup](./SUPABASE_CLI_SETUP.md) - Command-line tool installation
- [Key Guide](./SUPABASE_KEY_GUIDE.md) - API keys and authentication
- [Basic Setup](./SUPABASE_SETUP.md) - Getting started guide

## Prerequisites

- Supabase account ([sign up](https://supabase.com))
- Node.js 18+ installed
- Git repository cloned locally

## Quick Setup

### 1. Environment Variables

Copy `.env.example` to `.env.local` and add your Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Find these values in your Supabase project dashboard under **Settings > API**.

### 2. Database Schema

Run migrations:

```bash
# Using Supabase CLI (recommended)
supabase db push

# Or use the seed script
npm run seed
```

### 3. Verify Setup

```bash
npm run check:db
```

## Common Tasks

### Seeding Database

```bash
npm run seed          # Seed with mock data
npm run seed:reset    # Clear and re-seed
npm run seed:verify   # Verify data integrity
```

### Running Migrations

```bash
supabase migration new migration_name
supabase db push
```

### Testing Connection

```bash
node scripts/test-supabase-connection.js
```

## Troubleshooting

See individual guides for detailed troubleshooting:

- Connection issues → [supabase-setup-guide.md](./supabase-setup-guide.md#troubleshooting)
- CLI problems → [SUPABASE_CLI_SETUP.md](./SUPABASE_CLI_SETUP.md)
- Authentication → [SUPABASE_KEY_GUIDE.md](./SUPABASE_KEY_GUIDE.md)

## Related Documentation

- [Database Architecture](../database-architecture.md)
- [Schema Mapping](../SCHEMA_MAPPING.md)
- [Migration Verification](../MIGRATION_VERIFICATION_CHECKLIST.md)

---

**Last Updated**: 2025-12-11
