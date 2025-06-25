-- Enable pgcrypto extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create agencies table
CREATE TABLE IF NOT EXISTS agencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    logo_url TEXT,
    website TEXT,
    phone TEXT,
    email TEXT,
    is_claimed BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    offers_per_diem BOOLEAN DEFAULT false,
    is_union BOOLEAN DEFAULT false,
    founded_year INTEGER,
    employee_count TEXT,
    headquarters TEXT,
    rating NUMERIC(4,2) CHECK (rating >= 0 AND rating <= 10),
    review_count INTEGER DEFAULT 0,
    project_count INTEGER DEFAULT 0,
    verified BOOLEAN DEFAULT false,
    featured BOOLEAN DEFAULT false,
    claimed_at TIMESTAMPTZ,
    claimed_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create trades table
CREATE TABLE IF NOT EXISTS trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create regions table
CREATE TABLE IF NOT EXISTS regions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    state_code CHAR(2) NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(name, state_code)
);

-- Create updated_at triggers for all tables
CREATE TRIGGER update_agencies_updated_at BEFORE UPDATE
    ON agencies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trades_updated_at BEFORE UPDATE
    ON trades FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_regions_updated_at BEFORE UPDATE
    ON regions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE agencies IS 'Construction staffing agencies directory';
COMMENT ON TABLE trades IS 'Construction trade specialties (e.g., electrician, plumber)';
COMMENT ON TABLE regions IS 'Service regions for agencies';

COMMENT ON COLUMN agencies.slug IS 'URL-friendly unique identifier';
COMMENT ON COLUMN agencies.is_claimed IS 'Whether agency has claimed their listing';
COMMENT ON COLUMN agencies.is_active IS 'Whether agency is currently active/visible';
COMMENT ON COLUMN agencies.rating IS 'Average rating from 0.00 to 10.00';
COMMENT ON COLUMN regions.state_code IS 'Two-letter US state code';