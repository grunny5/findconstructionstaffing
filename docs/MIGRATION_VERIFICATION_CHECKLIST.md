# Migration Verification Checklist

## Overview

This checklist ensures data migration from mock data to Supabase is complete and accurate.

> **Note:** For detailed task definitions and implementation steps, see [`tasks/0001-supabase-infrastructure-tasks.md`](../tasks/0001-supabase-infrastructure-tasks.md)

## Pre-Migration Checklist

- [ ] Database schema created
- [ ] Junction tables created
- [ ] Indexes applied
- [ ] RLS policies configured
- [ ] Schema compatibility validated

## Post-Migration Verification

### 1. Data Counts

Expected after full mock data migration:

| Table          | Expected Count | Actual Count | Status |
| -------------- | -------------- | ------------ | ------ |
| agencies       | 12             | \_\_\_       | ⬜     |
| trades         | ~30 unique     | \_\_\_       | ⬜     |
| regions        | ~20 states     | \_\_\_       | ⬜     |
| agency_trades  | ~60 links      | \_\_\_       | ⬜     |
| agency_regions | ~48 links      | \_\_\_       | ⬜     |

### 2. Relationship Integrity

- [ ] All agencies have at least one trade
- [ ] All agencies have at least one region
- [ ] No orphaned trades (trades not linked to any agency)
- [ ] No orphaned regions (regions not linked to any agency)

### 3. Data Integrity

- [ ] All agency slugs are unique
- [ ] All trade slugs are unique
- [ ] All region slugs are unique
- [ ] No NULL values in required fields (name, slug)
- [ ] Boolean fields have valid values (true/false, not null)

### 4. Sample Data Verification

Verify these specific agencies from mock data:

- [ ] "Industrial Staffing Solutions" exists
  - [ ] Has 5 trades (Millwright, Pipefitter, Welder, Electrician, Boilermaker)
  - [ ] Has 4 regions (Texas, Louisiana, Oklahoma, Arkansas)
  - [ ] offers_per_diem = true
  - [ ] is_union = false

- [ ] "TradePower Recruiting" exists
  - [ ] Has 5 trades
  - [ ] Has 5 regions (California, Nevada, Arizona, Utah, Colorado)
  - [ ] is_union = true

- [ ] "Shutdown Specialists Inc" exists
  - [ ] Headquarters = "Baton Rouge, LA"
  - [ ] founded_year = 2010

### 5. Query Performance

Run these queries and verify response time < 100ms:

```sql
-- Basic agency search
SELECT * FROM agencies WHERE is_active = true LIMIT 10;

-- Agency with trades
SELECT a.*, array_agg(t.name) as trades
FROM agencies a
JOIN agency_trades at ON a.id = at.agency_id
JOIN trades t ON at.trade_id = t.id
WHERE a.is_active = true
GROUP BY a.id
LIMIT 5;

-- Filter by trade
SELECT DISTINCT a.*
FROM agencies a
JOIN agency_trades at ON a.id = at.agency_id
JOIN trades t ON at.trade_id = t.id
WHERE t.slug = 'electrician'
AND a.is_active = true;

-- Filter by region
SELECT DISTINCT a.*
FROM agencies a
JOIN agency_regions ar ON a.id = ar.agency_id
JOIN regions r ON ar.region_id = r.id
WHERE r.state_code = 'TX'
AND a.is_active = true;
```

### 6. API Access Verification

Test via application:

- [ ] Anonymous users can read agencies
- [ ] Anonymous users can filter by trade
- [ ] Anonymous users can filter by region
- [ ] Anonymous users cannot create/update/delete

## Verification Queries

Run the verification script:

```bash
node scripts/data-verification-queries.js
```

Or run SQL queries directly:

```sql
-- See: docs/migration-verification-queries.sql
```

## Sign-off

- [ ] All data counts match expected values
- [ ] All relationships properly established
- [ ] No data integrity issues found
- [ ] Performance meets requirements
- [ ] Security policies working correctly

**Verified by:** **\*\***\_\_\_**\*\***  
**Date:** **\*\***\_\_\_**\*\***  
**Notes:** **\*\***\_\_\_**\*\***
