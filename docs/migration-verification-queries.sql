-- Migration Verification Queries
-- Run these after data migration to verify integrity

-- data Counts
SELECT 
        (SELECT COUNT(*) FROM agencies) as agency_count,
        (SELECT COUNT(*) FROM trades) as trade_count,
        (SELECT COUNT(*) FROM regions) as region_count,
        (SELECT COUNT(*) FROM agency_trades) as agency_trade_count,
        (SELECT COUNT(*) FROM agency_regions) as agency_region_count;

-- agencies Without Trades
SELECT a.id, a.name 
      FROM agencies a
      LEFT JOIN agency_trades at ON a.id = at.agency_id
      WHERE at.agency_id IS NULL;

-- agencies Without Regions
SELECT a.id, a.name 
      FROM agencies a
      LEFT JOIN agency_regions ar ON a.id = ar.agency_id
      WHERE ar.agency_id IS NULL;

-- orphaned Trades
SELECT t.id, t.name 
      FROM trades t
      LEFT JOIN agency_trades at ON t.id = at.trade_id
      WHERE at.trade_id IS NULL;

-- orphaned Regions
SELECT r.id, r.name, r.state_code 
      FROM regions r
      LEFT JOIN agency_regions ar ON r.id = ar.region_id
      WHERE ar.region_id IS NULL;

-- duplicate Slugs
SELECT slug, COUNT(*) as count 
      FROM agencies 
      GROUP BY slug 
      HAVING COUNT(*) > 1;

-- data Integrity
SELECT 
        COUNT(*) as total_agencies,
        SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as active_count,
        SUM(CASE WHEN is_claimed THEN 1 ELSE 0 END) as claimed_count,
        SUM(CASE WHEN is_union THEN 1 ELSE 0 END) as union_count,
        SUM(CASE WHEN offers_per_diem THEN 1 ELSE 0 END) as per_diem_count
      FROM agencies;

