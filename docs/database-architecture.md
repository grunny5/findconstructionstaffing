# Database Architecture Documentation

## Overview

The FindConstructionStaffing platform uses Supabase (PostgreSQL) as its primary database. This document outlines the database design, relationships, and architectural decisions.

## Entity Relationship Diagram

```
┌─────────────┐         ┌──────────────┐         ┌────────────┐
│   AGENCIES  │         │ AGENCY_TRADES│         │   TRADES   │
├─────────────┤         ├──────────────┤         ├────────────┤
│ id (PK)     │────┬───▶│ agency_id    │◀────────│ id (PK)    │
│ name        │    │    │ trade_id     │         │ name       │
│ slug        │    │    └──────────────┘         │ slug       │
│ rating      │    │                             └────────────┘
│ ...         │    │    ┌───────────────┐        ┌────────────┐
└─────────────┘    └───▶│ AGENCY_REGIONS│        │  REGIONS   │
                        ├───────────────┤        ├────────────┤
                        │ agency_id     │◀───────│ id (PK)    │
                        │ region_id     │        │ name       │
                        └───────────────┘        │ state_code │
                                                │ slug       │
                                                └────────────┘
```

## Tables Detail

### agencies

Primary table storing staffing agency information.

| Column             | Type         | Constraints     | Description                 |
| ------------------ | ------------ | --------------- | --------------------------- |
| id                 | UUID         | PRIMARY KEY     | Unique identifier           |
| name               | TEXT         | NOT NULL        | Agency business name        |
| slug               | TEXT         | UNIQUE NOT NULL | URL-friendly identifier     |
| rating             | NUMERIC(3,2) | CHECK 0-10      | Average rating (0.00-10.00) |
| review_count       | INTEGER      | DEFAULT 0       | Number of reviews           |
| description        | TEXT         |                 | Business description        |
| website            | TEXT         |                 | Company website URL         |
| phone              | TEXT         |                 | Contact phone               |
| email              | TEXT         |                 | Contact email               |
| address            | TEXT         |                 | Street address              |
| city               | TEXT         |                 | City name                   |
| state              | TEXT         |                 | State abbreviation          |
| zip_code           | TEXT         |                 | Postal code                 |
| is_active          | BOOLEAN      | DEFAULT true    | Soft delete flag            |
| featured           | BOOLEAN      | DEFAULT false   | Premium placement flag      |
| verified           | BOOLEAN      | DEFAULT false   | Verification status         |
| year_established   | INTEGER      |                 | Year founded                |
| license_number     | TEXT         |                 | Business license            |
| insurance_verified | BOOLEAN      | DEFAULT false   | Insurance verification      |
| created_at         | TIMESTAMPTZ  | DEFAULT NOW()   | Creation timestamp          |
| updated_at         | TIMESTAMPTZ  | DEFAULT NOW()   | Last update timestamp       |

### trades

Construction trade specializations.

| Column     | Type        | Constraints     | Description             |
| ---------- | ----------- | --------------- | ----------------------- |
| id         | UUID        | PRIMARY KEY     | Unique identifier       |
| name       | TEXT        | UNIQUE NOT NULL | Trade name              |
| slug       | TEXT        | UNIQUE NOT NULL | URL-friendly identifier |
| created_at | TIMESTAMPTZ | DEFAULT NOW()   | Creation timestamp      |

### regions

Service areas by city/region within states.

| Column     | Type        | Constraints     | Description             |
| ---------- | ----------- | --------------- | ----------------------- |
| id         | UUID        | PRIMARY KEY     | Unique identifier       |
| name       | TEXT        | NOT NULL        | Region/city name        |
| state_code | TEXT        | NOT NULL        | Two-letter state code   |
| slug       | TEXT        | UNIQUE NOT NULL | URL-friendly identifier |
| created_at | TIMESTAMPTZ | DEFAULT NOW()   | Creation timestamp      |

### agency_trades

Junction table for agency-trade relationships.

| Column      | Type | Constraints           | Description              |
| ----------- | ---- | --------------------- | ------------------------ |
| agency_id   | UUID | FOREIGN KEY           | Reference to agencies.id |
| trade_id    | UUID | FOREIGN KEY           | Reference to trades.id   |
| PRIMARY KEY |      | (agency_id, trade_id) | Composite primary key    |

### agency_regions

Junction table for agency-region relationships.

| Column      | Type | Constraints            | Description              |
| ----------- | ---- | ---------------------- | ------------------------ |
| agency_id   | UUID | FOREIGN KEY            | Reference to agencies.id |
| region_id   | UUID | FOREIGN KEY            | Reference to regions.id  |
| PRIMARY KEY |      | (agency_id, region_id) | Composite primary key    |

## Indexes

Performance indexes for common query patterns:

```sql
-- Text search and lookups
CREATE INDEX idx_agencies_name ON agencies(name);
CREATE INDEX idx_agencies_slug ON agencies(slug);

-- Filtering
CREATE INDEX idx_agencies_is_active ON agencies(is_active);

-- Foreign key lookups
CREATE INDEX idx_trades_slug ON trades(slug);
CREATE INDEX idx_regions_slug ON regions(slug);
CREATE INDEX idx_regions_state_code ON regions(state_code);
```

## Row Level Security (RLS)

All tables have RLS enabled with the following policies:

### Read Policies

- **agencies**: Only active agencies visible to public
- **trades**: All trades visible to public
- **regions**: All regions visible to public
- **agency_trades**: Only relationships for active agencies
- **agency_regions**: Only relationships for active agencies

### Write Policies

- No public write access (admin-only through service role)

## Design Decisions

### 1. UUID Primary Keys

- **Reasoning**: Better for distributed systems, no sequence conflicts
- **Trade-off**: Slightly larger storage than integers
- **Alternative considered**: Serial integers

### 2. Soft Delete Pattern

- **Implementation**: `is_active` boolean flag
- **Reasoning**: Preserve data integrity, allow recovery
- **Trade-off**: Requires filtering in all queries

### 3. Separate Junction Tables

- **Reasoning**: Clean many-to-many relationships
- **Benefits**: Flexible, normalized, efficient queries
- **Alternative considered**: Array columns

### 4. NUMERIC for Ratings

- **Type**: NUMERIC(3,2)
- **Reasoning**: Exact decimal precision for ratings
- **Range**: 0.00 to 10.00

### 5. Slug Pattern

- **Purpose**: SEO-friendly URLs
- **Format**: lowercase-with-hyphens
- **Uniqueness**: Enforced at database level

## Query Patterns

### Common Queries

1. **Find agencies by trade and location**

```sql
SELECT DISTINCT a.*
FROM agencies a
JOIN agency_trades at ON a.id = at.agency_id
JOIN trades t ON at.trade_id = t.id
JOIN agency_regions ar ON a.id = ar.agency_id
JOIN regions r ON ar.region_id = r.id
WHERE a.is_active = true
  AND t.slug = 'electrical'
  AND r.slug = 'denver-co';
```

2. **Get agency with all relationships**

```sql
SELECT
  a.*,
  array_agg(DISTINCT t.name) as trades,
  array_agg(DISTINCT r.name || ', ' || r.state_code) as regions
FROM agencies a
LEFT JOIN agency_trades at ON a.id = at.agency_id
LEFT JOIN trades t ON at.trade_id = t.id
LEFT JOIN agency_regions ar ON a.id = ar.agency_id
LEFT JOIN regions r ON ar.region_id = r.id
WHERE a.slug = 'abc-staffing'
  AND a.is_active = true
GROUP BY a.id;
```

## Performance Considerations

### Current Optimizations

- Indexes on all foreign keys
- Indexes on commonly queried columns
- Composite primary keys on junction tables
- RLS policies use indexed columns

### Monitoring Metrics

- Query execution time: Target <100ms
- Index hit rate: Target >95%
- Table bloat: Monitor weekly
- Connection pool usage: Target <80%

### Scaling Strategies

1. **Short term** (10K-100K records)
   - Current indexes sufficient
   - Monitor query patterns

2. **Medium term** (100K-1M records)
   - Partial indexes for active records
   - Query result caching
   - Read replicas

3. **Long term** (1M+ records)
   - Table partitioning by state
   - Elasticsearch for text search
   - CDN for static agency data

## Data Integrity Rules

### Constraints

1. Agencies must have unique slugs
2. Ratings must be between 0 and 10
3. Foreign keys cascade on delete
4. No orphaned junction records

### Triggers

```sql
-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_agencies_updated_at
  BEFORE UPDATE ON agencies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

## Migration Strategy

### Version Control

- Sequential migration files
- Rollback scripts for each migration
- Test migrations on staging first

### Zero-Downtime Deployments

1. All migrations must be backwards compatible
2. Add columns as nullable first
3. Backfill data in separate transaction
4. Add constraints after backfill

## Backup and Recovery

### Automated Backups

- Supabase daily backups (30 day retention)
- Point-in-time recovery available

### Manual Backup Commands

```bash
# Full backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Schema only
pg_dump $DATABASE_URL --schema-only > schema.sql

# Data only
pg_dump $DATABASE_URL --data-only > data.sql
```

## Future Enhancements

### Planned Features

1. **User Authentication**
   - User profiles table
   - Role-based access control
   - API key management

2. **Reviews System**
   - Reviews table with ratings
   - Review moderation queue
   - Aggregate rating updates

3. **Search Enhancement**
   - Full-text search indexes
   - Search suggestions table
   - Popular searches tracking

4. **Analytics**
   - Page view tracking
   - Search query logs
   - Agency profile views

---

**Last Updated**: 2025-06-25
**Version**: 1.0.0
