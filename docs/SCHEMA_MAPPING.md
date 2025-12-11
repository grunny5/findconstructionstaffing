# Schema Mapping: Mock Data to Database

## Overview

This document details the exact mapping between mock data fields and database columns for the agency migration.

## Field Mapping Table

| Mock Data Field | Database Column | Data Type | Transformation Required | Notes                           |
| --------------- | --------------- | --------- | ----------------------- | ------------------------------- |
| name            | name            | TEXT      | None                    | Direct mapping                  |
| website         | website         | TEXT      | None                    | Direct mapping                  |
| logo_url        | logo_url        | TEXT      | None                    | Direct mapping                  |
| description     | description     | TEXT      | None                    | Direct mapping                  |
| offers_per_diem | offers_per_diem | BOOLEAN   | None                    | Direct mapping                  |
| is_union        | is_union        | BOOLEAN   | None                    | Direct mapping                  |
| founded_year    | founded_year    | INTEGER   | None                    | Direct mapping                  |
| employee_count  | employee_count  | TEXT      | None                    | Direct mapping (stored as text) |
| headquarters    | headquarters    | TEXT      | None                    | Direct mapping                  |
| trades[]        | agency_trades   | Junction  | Array → Records         | See "Relationship Mapping"      |
| regions[]       | agency_regions  | Junction  | Array → Records         | See "Relationship Mapping"      |

## Auto-Generated Fields

These fields are automatically populated by the database:

| Field         | Default Value | Generation Method      |
| ------------- | ------------- | ---------------------- |
| id            | UUID          | gen_random_uuid()      |
| slug          | from name     | createSlug(name)       |
| phone         | NULL          | Optional - not in mock |
| email         | NULL          | Optional - not in mock |
| is_claimed    | false         | Default value          |
| is_active     | true          | Default value          |
| rating        | NULL          | No reviews yet         |
| review_count  | 0             | Default value          |
| project_count | 0             | Default value          |
| verified      | false         | Default value          |
| featured      | false         | Default value          |
| claimed_at    | NULL          | Not claimed            |
| claimed_by    | NULL          | Not claimed            |
| created_at    | NOW()         | Automatic timestamp    |
| updated_at    | NOW()         | Automatic timestamp    |

## Relationship Mapping

### Trades Array → agency_trades Junction Table

Mock data format:

```javascript
trades: ['Millwright', 'Pipefitter', 'Welder'];
```

Database structure:

```sql
-- trades table
id | name | slug
---|------|-----
uuid1 | Millwright | millwright
uuid2 | Pipefitter | pipefitter
uuid3 | Welder | welder

-- agency_trades junction
agency_id | trade_id
----------|----------
agency1 | uuid1
agency1 | uuid2
agency1 | uuid3
```

### Regions Array → agency_regions Junction Table

Mock data format:

```javascript
regions: ['Texas', 'Louisiana', 'Oklahoma'];
```

Database structure:

```sql
-- regions table
id | name | state_code | slug
---|------|------------|-----
uuid1 | Texas | TX | texas-tx
uuid2 | Louisiana | LA | louisiana-la
uuid3 | Oklahoma | OK | oklahoma-ok

-- agency_regions junction
agency_id | region_id
----------|----------
agency1 | uuid1
agency1 | uuid2
agency1 | uuid3
```

## Data Type Compatibility

| Mock Type | Database Type  | Compatible | Notes              |
| --------- | -------------- | ---------- | ------------------ |
| string    | TEXT           | ✅ Yes     | Direct mapping     |
| boolean   | BOOLEAN        | ✅ Yes     | Direct mapping     |
| number    | INTEGER        | ✅ Yes     | For founded_year   |
| string    | TEXT           | ✅ Yes     | For employee_count |
| array     | Junction Table | ✅ Yes     | Via relationships  |

## Migration Steps

1. **Pre-populate lookup tables**
   - Insert all unique trades into trades table
   - Insert all US states into regions table

2. **Process each agency**
   - Map direct fields
   - Generate slug from name
   - Set default values

3. **Create relationships**
   - Look up trade IDs by name
   - Look up region IDs by state name
   - Insert junction records

## Validation Checklist

- [x] All mock fields have database columns
- [x] Data types are compatible
- [x] Required transformations identified
- [x] Default values defined
- [x] Relationship mapping documented
- [x] No data truncation risk
- [x] Slug generation function available

## Sample Migration Code Structure

```javascript
// 1. Pre-populate trades
const uniqueTrades = [...new Set(mockAgencies.flatMap((a) => a.trades))];
for (const trade of uniqueTrades) {
  await insertTrade({ name: trade, slug: createSlug(trade) });
}

// 2. Pre-populate regions
const uniqueRegions = [...new Set(mockAgencies.flatMap((a) => a.regions))];
for (const region of uniqueRegions) {
  const stateCode = getStateCode(region);
  await insertRegion({
    name: region,
    state_code: stateCode,
    slug: createSlug(`${region}-${stateCode}`),
  });
}

// 3. Migrate agencies
for (const mockAgency of mockAgencies) {
  // Insert agency
  const agency = await insertAgency({
    name: mockAgency.name,
    slug: createSlug(mockAgency.name),
    ...directMappings,
  });

  // Create trade relationships
  for (const tradeName of mockAgency.trades) {
    const trade = await getTradeByName(tradeName);
    await insertAgencyTrade(agency.id, trade.id);
  }

  // Create region relationships
  for (const regionName of mockAgency.regions) {
    const region = await getRegionByName(regionName);
    await insertAgencyRegion(agency.id, region.id);
  }
}
```

## Conclusion

The schema is **100% compatible** with the mock data. All fields can be mapped without data loss, and the migration process is straightforward with proper transformations.
