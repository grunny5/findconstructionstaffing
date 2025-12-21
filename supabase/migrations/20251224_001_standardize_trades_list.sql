-- Migration: Standardize Trades List
-- Date: 2025-12-24
-- Description: Replace existing trades with standardized list of 57 construction trades
--
-- This migration:
-- 1. Removes all existing trades
-- 2. Inserts the standardized list of trades
-- 3. Is idempotent (safe to run multiple times)

-- Begin transaction
BEGIN;

-- Delete all existing trades and their relationships
-- Note: This will cascade to agency_trades if foreign key constraints exist
DELETE FROM agency_trades;
DELETE FROM trades;

-- Insert standardized trades list (57 trades)
INSERT INTO trades (name, slug, description) VALUES
  ('Administrator', 'administrator', 'Administrative and office management roles'),
  ('Assembly', 'assembly', 'Assembly and installation work'),
  ('Boilermaker', 'boilermaker', 'Boiler construction and repair'),
  ('Carpenter', 'carpenter', 'Carpentry and woodworking'),
  ('CDL Driver', 'cdl-driver', 'Commercial driver''s license holder'),
  ('Concrete Finisher', 'concrete-finisher', 'Concrete finishing and surface work'),
  ('Conveyor Technician', 'conveyor-technician', 'Conveyor system installation and maintenance'),
  ('Crane Operator', 'crane-operator', 'Crane operation and rigging'),
  ('CWI', 'cwi', 'Certified Welding Inspector'),
  ('Directional Drill Operator', 'directional-drill-operator', 'Directional drilling operations'),
  ('Electrician', 'electrician', 'Electrical installation and maintenance'),
  ('Equipment Mechanic', 'equipment-mechanic', 'Heavy equipment repair and maintenance'),
  ('Equipment Operator', 'equipment-operator', 'Heavy equipment operation'),
  ('Fiber Splicer', 'fiber-splicer', 'Fiber optic cable splicing'),
  ('Fiber Technician', 'fiber-technician', 'Fiber optic installation and maintenance'),
  ('Field Engineer', 'field-engineer', 'On-site engineering and technical support'),
  ('Firewatch', 'firewatch', 'Fire safety monitoring and prevention'),
  ('Foreman', 'foreman', 'Crew supervision and project coordination'),
  ('General Foreman', 'general-foreman', 'Senior crew supervision and oversight'),
  ('Generator Winder', 'generator-winder', 'Generator and motor winding'),
  ('Hole Watch', 'hole-watch', 'Confined space monitoring and safety'),
  ('HVAC', 'hvac', 'Heating, ventilation, and air conditioning'),
  ('I&C Technician', 'i-c-technician', 'Instrumentation and controls technician'),
  ('Instrument Fitters', 'instrument-fitters', 'Instrument installation and calibration'),
  ('Insulator', 'insulator', 'Thermal and acoustic insulation'),
  ('Intern', 'intern', 'Student or entry-level trainee'),
  ('Ironworker', 'ironworker', 'Structural steel and rebar work'),
  ('Laborer', 'laborer', 'General construction labor'),
  ('Lineman', 'lineman', 'Electrical power line installation and maintenance'),
  ('Low Voltage Electrician', 'low-voltage-electrician', 'Low voltage electrical systems'),
  ('Machinist', 'machinist', 'Precision machining and metalworking'),
  ('Maintenance Technician', 'maintenance-technician', 'General maintenance and repair'),
  ('Material Handler', 'material-handler', 'Material movement and warehouse operations'),
  ('Military', 'military', 'Military personnel and veterans'),
  ('Millwright', 'millwright', 'Industrial machinery installation and maintenance'),
  ('Painter', 'painter', 'Industrial and commercial painting'),
  ('Pile Driver', 'pile-driver', 'Foundation pile driving'),
  ('Pipefitter', 'pipefitter', 'Pipe installation and fitting'),
  ('Plumber', 'plumber', 'Plumbing installation and repair'),
  ('Project Manager', 'project-manager', 'Project planning and management'),
  ('Quality', 'quality', 'Quality control and assurance'),
  ('Rigger', 'rigger', 'Load rigging and heavy lifting'),
  ('Rodbuster', 'rodbuster', 'Rebar installation and tying'),
  ('Safety', 'safety', 'Safety coordination and compliance'),
  ('Scaffold Builder', 'scaffold-builder', 'Scaffolding erection and dismantling'),
  ('Scheduler', 'scheduler', 'Project scheduling and planning'),
  ('Shift Supervisor', 'shift-supervisor', 'Shift operations supervision'),
  ('Shipfitter', 'shipfitter', 'Marine vessel construction and repair'),
  ('Solar Installer', 'solar-installer', 'Solar panel installation'),
  ('Structural Fitter', 'structural-fitter', 'Structural steel fitting and assembly'),
  ('Superintendent', 'superintendent', 'Project oversight and management'),
  ('Surveyor', 'surveyor', 'Land and construction surveying'),
  ('Tool Room', 'tool-room', 'Tool management and distribution'),
  ('Underground Operator', 'underground-operator', 'Underground construction and mining equipment operation'),
  ('Welder', 'welder', 'Welding and metal joining'),
  ('Wind Blade Technician', 'wind-blade-technician', 'Wind turbine blade maintenance and repair'),
  ('Wind Technician', 'wind-technician', 'Wind turbine installation and maintenance')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Commit transaction
COMMIT;

-- Verify the migration
DO $$
DECLARE
  trade_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO trade_count FROM trades;

  IF trade_count != 57 THEN
    RAISE EXCEPTION 'Migration verification failed: Expected 57 trades, found %', trade_count;
  END IF;

  RAISE NOTICE 'Migration successful: % standardized trades inserted', trade_count;
END $$;
