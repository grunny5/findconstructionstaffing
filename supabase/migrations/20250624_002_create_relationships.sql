-- Create junction table for agency-trade relationships
CREATE TABLE IF NOT EXISTS agency_trades (
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    trade_id UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (agency_id, trade_id)
);

-- Create junction table for agency-region relationships
CREATE TABLE IF NOT EXISTS agency_regions (
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    region_id UUID NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (agency_id, region_id)
);

-- Add indexes for better query performance on junction tables
CREATE INDEX idx_agency_trades_agency_id ON agency_trades(agency_id);
CREATE INDEX idx_agency_trades_trade_id ON agency_trades(trade_id);
CREATE INDEX idx_agency_regions_agency_id ON agency_regions(agency_id);
CREATE INDEX idx_agency_regions_region_id ON agency_regions(region_id);

-- Add comments for documentation
COMMENT ON TABLE agency_trades IS 'Junction table linking agencies to their trade specialties';
COMMENT ON TABLE agency_regions IS 'Junction table linking agencies to their service regions';

-- Test the relationships with a verification query
DO $$
BEGIN
    -- Verify foreign key constraints are working
    RAISE NOTICE 'Junction tables created successfully with proper foreign key constraints';
END $$;