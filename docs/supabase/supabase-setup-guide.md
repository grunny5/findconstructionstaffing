# Supabase Infrastructure Setup Guide

This guide provides comprehensive instructions for setting up and maintaining the Supabase database infrastructure for the FindConstructionStaffing platform.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Environment Configuration](#environment-configuration)
4. [Database Schema](#database-schema)
5. [Security Configuration](#security-configuration)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)
8. [Maintenance](#maintenance)

---

## Prerequisites

Before starting, ensure you have:

- Node.js 18+ installed
- npm or yarn package manager
- A Supabase account (free tier is sufficient for development)
- Git for version control
- A code editor (VS Code recommended)

## Initial Setup

### 1. Create Supabase Project

1. Go to [app.supabase.com](https://app.supabase.com)
2. Click "New project"
3. Fill in project details:
   - Project name: `findconstructionstaffing`
   - Database Password: Use a strong password (save it securely)
   - Region: Choose closest to your primary user base
   - Pricing Plan: Free tier for development

4. Wait for project provisioning (usually 2-3 minutes)

### 2. Obtain Project Credentials

Once your project is ready:

1. Go to Settings → API
2. Copy these values:
   - Project URL (looks like: `https://[project-id].supabase.co`)
   - Anon/Public API Key
   - Service Role Key (keep this very secure!)

### 3. Install Supabase CLI (Optional but Recommended)

For Windows:

```bash
# Download from https://github.com/supabase/cli/releases
# Choose supabase_windows_amd64.tar.gz for most systems
# Extract and add to PATH or use directly
.\supabase.exe --version
```

For macOS/Linux:

```bash
brew install supabase/tap/supabase
```

## Environment Configuration

### 1. Create Environment File

Create `.env.local` in your project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 2. Create Example File

Create `.env.example` for team members:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Verify Git Ignore

Ensure `.gitignore` contains:

```
.env.local
.env*.local
```

## Database Schema

### 1. Core Tables Structure

The database consists of three main tables and two junction tables:

```sql
-- Agencies table
CREATE TABLE agencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    rating NUMERIC(3,2) CHECK (rating >= 0 AND rating <= 10),
    review_count INTEGER DEFAULT 0,
    description TEXT,
    website TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    is_active BOOLEAN DEFAULT true,
    featured BOOLEAN DEFAULT false,
    verified BOOLEAN DEFAULT false,
    year_established INTEGER,
    license_number TEXT,
    insurance_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trades table
CREATE TABLE trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Regions table
CREATE TABLE regions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    state_code TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Junction tables
CREATE TABLE agency_trades (
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    trade_id UUID REFERENCES trades(id) ON DELETE CASCADE,
    PRIMARY KEY (agency_id, trade_id)
);

CREATE TABLE agency_regions (
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    region_id UUID REFERENCES regions(id) ON DELETE CASCADE,
    PRIMARY KEY (agency_id, region_id)
);
```

### 2. Apply Migrations

Using Supabase Dashboard:

1. Go to SQL Editor
2. Create a new query
3. Paste the migration SQL
4. Click "Run"

Using Supabase CLI:

```bash
# Initialize Supabase in your project
supabase init

# Create migration file
supabase migration new create_core_tables

# Add SQL to the migration file, then:
supabase db push
```

### 3. Performance Indexes

Apply these indexes for optimal query performance:

```sql
-- Search and lookup indexes
CREATE INDEX idx_agencies_name ON agencies(name);
CREATE INDEX idx_agencies_slug ON agencies(slug);
CREATE INDEX idx_agencies_is_active ON agencies(is_active);
CREATE INDEX idx_trades_slug ON trades(slug);
CREATE INDEX idx_regions_slug ON regions(slug);
CREATE INDEX idx_regions_state_code ON regions(state_code);
```

## Security Configuration

### 1. Enable Row Level Security

```sql
-- Enable RLS on all tables
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_regions ENABLE ROW LEVEL SECURITY;
```

### 2. Create Security Policies

```sql
-- Public read access for active agencies
CREATE POLICY "Public can read active agencies" ON agencies
    FOR SELECT USING (is_active = true);

-- Public read access for trades and regions
CREATE POLICY "Public can read all trades" ON trades
    FOR SELECT USING (true);

CREATE POLICY "Public can read all regions" ON regions
    FOR SELECT USING (true);

-- Junction table policies
CREATE POLICY "Public can read agency trades" ON agency_trades
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM agencies
            WHERE agencies.id = agency_trades.agency_id
            AND agencies.is_active = true
        )
    );

CREATE POLICY "Public can read agency regions" ON agency_regions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM agencies
            WHERE agencies.id = agency_regions.agency_id
            AND agencies.is_active = true
        )
    );
```

## Testing

### 1. Connection Testing

Run the connection test script:

```bash
node scripts/test-supabase-connection.js
```

Expected output:

```
✅ Successfully connected to Supabase!
Project URL: https://your-project-id.supabase.co
Environment: local
```

### 2. Security Testing

Run the security test suite:

```bash
node scripts/security-tests.js
```

All tests should pass:

```
✅ All critical security tests passed
🛡️  The database is properly secured
```

### 3. Manual Testing

Test basic queries in your application:

```javascript
// Test read access
const { data, error } = await supabase.from('agencies').select('*').limit(10);

// Test write access (should fail)
const { error: writeError } = await supabase
  .from('agencies')
  .insert({ name: 'Test Agency' });
// Expected: RLS policy violation error
```

## Troubleshooting

### Common Issues and Solutions

#### 1. "Invalid API Key" Error

- **Cause**: Incorrect or malformed API key
- **Solution**:
  - Verify the key in Supabase dashboard
  - Check for extra spaces or line breaks in .env.local
  - Ensure you're using the anon key, not service role key

#### 2. "relation does not exist" Error

- **Cause**: Tables not created or migrations not run
- **Solution**:
  - Check SQL Editor history in Supabase dashboard
  - Re-run migration scripts
  - Verify table names match exactly (case-sensitive)

#### 3. Empty Query Results

- **Cause**: RLS policies blocking access or no data
- **Solution**:
  - Check if RLS is enabled without policies
  - Verify is_active = true for agencies
  - Test with service role key (development only)

#### 4. Connection Timeouts

- **Cause**: Network issues or incorrect URL
- **Solution**:
  - Verify NEXT_PUBLIC_SUPABASE_URL format
  - Check network connectivity
  - Try different region if persistent

#### 5. Environment Variables Not Loading

- **Cause**: Incorrect file location or format
- **Solution**:
  - Ensure .env.local is in project root
  - Check for typos in variable names
  - Restart development server after changes

### Debug Commands

```bash
# Check current tables
psql $DATABASE_URL -c "\dt"

# View RLS policies
psql $DATABASE_URL -c "SELECT * FROM pg_policies"

# Test connection directly
curl https://your-project-id.supabase.co/rest/v1/agencies \
  -H "apikey: your-anon-key" \
  -H "Authorization: Bearer your-anon-key"
```

## Maintenance

### Regular Tasks

1. **Weekly**
   - Monitor query performance in Supabase dashboard
   - Check for failed queries or errors
   - Review security logs

2. **Monthly**
   - Update dependencies: `npm update @supabase/supabase-js`
   - Review and optimize slow queries
   - Check index usage statistics

3. **Quarterly**
   - Security audit of RLS policies
   - Database backup verification
   - Performance benchmarking

### Backup Strategy

Supabase provides automatic daily backups on paid plans. For additional safety:

1. Export schema regularly:

```bash
supabase db dump -f schema.sql
```

2. Export data for critical tables:

```bash
supabase db dump -f data.sql --data-only
```

### Monitoring

Set up monitoring for:

- Query performance (aim for <100ms)
- Error rates
- Connection pool usage
- Storage growth

## Architecture Decisions

### Why Supabase?

- Built on PostgreSQL for reliability
- Real-time capabilities for future features
- Generous free tier for development
- Excellent TypeScript support
- Built-in authentication (future enhancement)

### Design Choices

1. **UUID Primary Keys**: Globally unique, better for distributed systems
2. **Slugs for URLs**: SEO-friendly, human-readable URLs
3. **Soft Delete Pattern**: is_active flag instead of hard deletes
4. **Junction Tables**: Clean many-to-many relationships
5. **RLS by Default**: Security-first approach

### Performance Considerations

- Indexes on frequently queried columns
- Composite primary keys on junction tables
- NUMERIC type for precise ratings
- Timestamp columns for audit trails

## Next Steps

After completing this setup:

1. Run data migration scripts to import agencies
2. Implement API endpoints using Supabase client
3. Set up real-time subscriptions (optional)
4. Configure authentication (future sprint)

For questions or issues, consult:

- [Supabase Documentation](https://supabase.com/docs)
- Project issue tracker
- Team Slack channel #backend

---

**Last Updated**: 2025-06-25
**Version**: 1.0.0
