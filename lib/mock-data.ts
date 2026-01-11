// Enhanced mock data for the directory with more realistic agency profiles
export const mockAgencies = [
  {
    name: 'Industrial Staffing Solutions',
    website: 'https://industrialstaffing.com',
    logo_url:
      'https://images.pexels.com/photos/1181533/pexels-photo-1181533.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
    description:
      'Leading provider of skilled industrial workforce solutions with over 20 years of experience in petrochemical, refinery, and heavy industrial projects. We specialize in turnarounds, shutdowns, and major capital projects across the Gulf Coast.',
    trades: [
      'Millwright',
      'Pipefitter',
      'Welder',
      'Electrician',
      'Boilermaker',
    ],
    regions: ['Texas', 'Louisiana', 'Oklahoma', 'Arkansas'],
    offers_per_diem: true,
    is_union: false,
    founded_year: 2003,
    employee_count: '500-1000',
    headquarters: 'Houston, TX',
  },
  {
    name: 'TradePower Recruiting',
    website: 'https://tradepower.com',
    logo_url:
      'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
    description:
      'Premier construction recruiting firm serving major infrastructure projects nationwide. We connect top-tier skilled trades professionals with leading contractors on high-profile commercial and industrial construction projects.',
    trades: [
      'Equipment Operator',
      'Crane Operator',
      'Ironworker',
      'Carpenter',
      'Concrete Finisher',
    ],
    regions: ['California', 'Nevada', 'Arizona', 'Utah', 'Colorado'],
    offers_per_diem: true,
    is_union: true,
    founded_year: 1998,
    employee_count: '200-500',
    headquarters: 'Los Angeles, CA',
  },
  {
    name: 'Shutdown Specialists Inc',
    website: 'https://shutdownspecialists.com',
    logo_url:
      'https://images.pexels.com/photos/1181772/pexels-photo-1181772.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
    description:
      'Expert turnaround and shutdown crews for refineries and chemical plants. Our specialized teams have completed over 500 major turnarounds with zero safety incidents. We maintain a database of pre-screened, certified professionals.',
    trades: [
      'Scaffold Builder',
      'Insulator',
      'Boilermaker',
      'Pipefitter',
      'Foreman',
    ],
    regions: ['Texas', 'Louisiana', 'Mississippi', 'Alabama', 'Florida'],
    offers_per_diem: true,
    is_union: false,
    founded_year: 2010,
    employee_count: '100-200',
    headquarters: 'Baton Rouge, LA',
  },
  {
    name: 'Elite Construction Staffing',
    website: 'https://eliteconstructionstaffing.com',
    logo_url:
      'https://images.pexels.com/photos/1181263/pexels-photo-1181263.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
    description:
      'High-quality skilled trades staffing for commercial and residential construction. We focus on long-term placements and career development for construction professionals across the Southeast region.',
    trades: ['Electrician', 'Plumber', 'HVAC', 'Carpenter', 'Painter'],
    regions: [
      'Florida',
      'Georgia',
      'South Carolina',
      'North Carolina',
      'Tennessee',
    ],
    offers_per_diem: false,
    is_union: false,
    founded_year: 2015,
    employee_count: '50-100',
    headquarters: 'Atlanta, GA',
  },
  {
    name: 'Union Trades Collective',
    website: 'https://uniontrades.com',
    logo_url:
      'https://images.pexels.com/photos/1181715/pexels-photo-1181715.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
    description:
      'Connecting union contractors with certified journeymen and apprentices across the Midwest. We maintain strong relationships with local unions and provide comprehensive workforce solutions for large-scale projects.',
    trades: [
      'Electrician',
      'Plumber',
      'Ironworker',
      'Equipment Operator',
      'Welder',
    ],
    regions: ['Illinois', 'Wisconsin', 'Indiana', 'Michigan', 'Ohio'],
    offers_per_diem: true,
    is_union: true,
    founded_year: 1985,
    employee_count: '1000+',
    headquarters: 'Chicago, IL',
  },
  {
    name: 'Maritime Construction Crew',
    website: 'https://maritimeconstruction.com',
    logo_url:
      'https://images.pexels.com/photos/1181359/pexels-photo-1181359.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
    description:
      'Specialized marine construction and offshore platform staffing. Our crews are certified for underwater welding, marine construction, and offshore oil & gas projects with extensive safety training and certifications.',
    trades: ['Welder', 'Rigger', 'Crane Operator', 'Safety', 'Shipfitter'],
    regions: ['Louisiana', 'Texas', 'Mississippi', 'Alabama', 'Florida'],
    offers_per_diem: true,
    is_union: false,
    founded_year: 2008,
    employee_count: '100-200',
    headquarters: 'New Orleans, LA',
  },
  {
    name: 'Rocky Mountain Workforce',
    website: 'https://rockymountainworkforce.com',
    logo_url:
      'https://images.pexels.com/photos/1181677/pexels-photo-1181677.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
    description:
      'Premier staffing solutions for mining, energy, and heavy construction projects across the Rocky Mountain region. We specialize in high-altitude and extreme weather construction projects.',
    trades: [
      'Equipment Operator',
      'Underground Operator',
      'Welder',
      'Equipment Mechanic',
      'Laborer',
    ],
    regions: ['Colorado', 'Wyoming', 'Montana', 'Utah', 'New Mexico'],
    offers_per_diem: true,
    is_union: false,
    founded_year: 2012,
    employee_count: '200-500',
    headquarters: 'Denver, CO',
  },
  {
    name: 'Northeast Industrial Partners',
    website: 'https://northeastindustrial.com',
    logo_url:
      'https://images.pexels.com/photos/1181467/pexels-photo-1181467.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
    description:
      'Comprehensive industrial staffing services for manufacturing, power generation, and infrastructure projects. We maintain a network of skilled professionals across the Northeast corridor.',
    trades: [
      'Millwright',
      'Electrician',
      'I&C Technician',
      'Maintenance Technician',
      'Quality',
    ],
    regions: [
      'New York',
      'Pennsylvania',
      'New Jersey',
      'Connecticut',
      'Massachusetts',
    ],
    offers_per_diem: false,
    is_union: true,
    founded_year: 1992,
    employee_count: '500-1000',
    headquarters: 'Newark, NJ',
  },
  {
    name: 'Pacific Coast Builders',
    website: 'https://pacificcoastbuilders.com',
    logo_url:
      'https://images.pexels.com/photos/1181396/pexels-photo-1181396.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
    description:
      'Leading construction staffing agency serving the West Coast with expertise in high-rise construction, infrastructure projects, and green building initiatives. We focus on sustainable construction practices.',
    trades: [
      'Crane Operator',
      'Ironworker',
      'Concrete Finisher',
      'Painter',
      'Laborer',
    ],
    regions: ['California', 'Oregon', 'Washington', 'Nevada'],
    offers_per_diem: true,
    is_union: true,
    founded_year: 2005,
    employee_count: '200-500',
    headquarters: 'San Francisco, CA',
  },
  {
    name: 'Midwest Manufacturing Staffing',
    website: 'https://midwestmanufacturing.com',
    logo_url:
      'https://images.pexels.com/photos/1181562/pexels-photo-1181562.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
    description:
      'Specialized staffing for manufacturing and industrial facilities across the Midwest. We provide both temporary and permanent placements for skilled manufacturing professionals.',
    trades: [
      'Machinist',
      'Maintenance Technician',
      'Quality',
      'Material Handler',
      'Shift Supervisor',
    ],
    regions: ['Illinois', 'Indiana', 'Wisconsin', 'Iowa', 'Missouri'],
    offers_per_diem: false,
    is_union: false,
    founded_year: 2018,
    employee_count: '50-100',
    headquarters: 'Milwaukee, WI',
  },
  {
    name: 'Energy Sector Solutions',
    website: 'https://energysectorsolutions.com',
    logo_url:
      'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
    description:
      'Specialized workforce solutions for renewable energy, oil & gas, and power generation projects. Our professionals are certified for wind, solar, and traditional energy infrastructure projects.',
    trades: [
      'Wind Technician',
      'Solar Installer',
      'Lineman',
      'Electrician',
      'Welder',
    ],
    regions: ['Texas', 'Oklahoma', 'Kansas', 'North Dakota', 'Wyoming'],
    offers_per_diem: true,
    is_union: false,
    founded_year: 2014,
    employee_count: '100-200',
    headquarters: 'Dallas, TX',
  },
  {
    name: 'Southeast Infrastructure Group',
    website: 'https://southeastinfrastructure.com',
    logo_url:
      'https://images.pexels.com/photos/1181425/pexels-photo-1181425.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
    description:
      'Infrastructure and heavy civil construction staffing across the Southeast. We specialize in highway construction, bridge projects, and major infrastructure developments.',
    trades: [
      'Equipment Operator',
      'Structural Fitter',
      'Surveyor',
      'Safety',
      'Laborer',
    ],
    regions: [
      'Georgia',
      'Florida',
      'Alabama',
      'South Carolina',
      'North Carolina',
    ],
    offers_per_diem: true,
    is_union: false,
    founded_year: 2007,
    employee_count: '200-500',
    headquarters: 'Jacksonville, FL',
  },
];

export const allTrades = [
  'Administrator',
  'Assembly',
  'Boilermaker',
  'Carpenter',
  'CDL Driver',
  'Concrete Finisher',
  'Conveyor Technician',
  'Crane Operator',
  'CWI',
  'Directional Drill Operator',
  'Electrician',
  'Equipment Mechanic',
  'Equipment Operator',
  'Fiber Splicer',
  'Fiber Technician',
  'Field Engineer',
  'Firewatch',
  'Foreman',
  'General Foreman',
  'Generator Winder',
  'Hole Watch',
  'HVAC',
  'I&C Technician',
  'Instrument Fitters',
  'Insulator',
  'Intern',
  'Ironworker',
  'Laborer',
  'Lineman',
  'Low Voltage Electrician',
  'Machinist',
  'Maintenance Technician',
  'Material Handler',
  'Military',
  'Millwright',
  'Painter',
  'Pile Driver',
  'Pipefitter',
  'Plumber',
  'Project Manager',
  'Quality',
  'Rigger',
  'Rodbuster',
  'Safety',
  'Scaffold Builder',
  'Scheduler',
  'Shift Supervisor',
  'Shipfitter',
  'Solar Installer',
  'Structural Fitter',
  'Superintendent',
  'Surveyor',
  'Tool Room',
  'Underground Operator',
  'Welder',
  'Wind Blade Technician',
  'Wind Technician',
];

export const allStates = [
  { name: 'Alabama', code: 'AL' },
  { name: 'Alaska', code: 'AK' },
  { name: 'Arizona', code: 'AZ' },
  { name: 'Arkansas', code: 'AR' },
  { name: 'California', code: 'CA' },
  { name: 'Colorado', code: 'CO' },
  { name: 'Connecticut', code: 'CT' },
  { name: 'Delaware', code: 'DE' },
  { name: 'Florida', code: 'FL' },
  { name: 'Georgia', code: 'GA' },
  { name: 'Hawaii', code: 'HI' },
  { name: 'Idaho', code: 'ID' },
  { name: 'Illinois', code: 'IL' },
  { name: 'Indiana', code: 'IN' },
  { name: 'Iowa', code: 'IA' },
  { name: 'Kansas', code: 'KS' },
  { name: 'Kentucky', code: 'KY' },
  { name: 'Louisiana', code: 'LA' },
  { name: 'Maine', code: 'ME' },
  { name: 'Maryland', code: 'MD' },
  { name: 'Massachusetts', code: 'MA' },
  { name: 'Michigan', code: 'MI' },
  { name: 'Minnesota', code: 'MN' },
  { name: 'Mississippi', code: 'MS' },
  { name: 'Missouri', code: 'MO' },
  { name: 'Montana', code: 'MT' },
  { name: 'Nebraska', code: 'NE' },
  { name: 'Nevada', code: 'NV' },
  { name: 'New Hampshire', code: 'NH' },
  { name: 'New Jersey', code: 'NJ' },
  { name: 'New Mexico', code: 'NM' },
  { name: 'New York', code: 'NY' },
  { name: 'North Carolina', code: 'NC' },
  { name: 'North Dakota', code: 'ND' },
  { name: 'Ohio', code: 'OH' },
  { name: 'Oklahoma', code: 'OK' },
  { name: 'Oregon', code: 'OR' },
  { name: 'Pennsylvania', code: 'PA' },
  { name: 'Rhode Island', code: 'RI' },
  { name: 'South Carolina', code: 'SC' },
  { name: 'South Dakota', code: 'SD' },
  { name: 'Tennessee', code: 'TN' },
  { name: 'Texas', code: 'TX' },
  { name: 'Utah', code: 'UT' },
  { name: 'Vermont', code: 'VT' },
  { name: 'Virginia', code: 'VA' },
  { name: 'Washington', code: 'WA' },
  { name: 'West Virginia', code: 'WV' },
  { name: 'Wisconsin', code: 'WI' },
  { name: 'Wyoming', code: 'WY' },
];

export const companySizes = [
  '1-10 employees',
  '11-50 employees',
  '51-100 employees',
  '101-500 employees',
  '501-1000 employees',
  '1000+ employees',
];

export const focusAreas = [
  'Industrial Construction',
  'Commercial Construction',
  'Residential Construction',
  'Infrastructure Projects',
  'Energy & Utilities',
  'Manufacturing',
  'Marine & Offshore',
  'Mining & Resources',
  'Transportation',
  'Government Contracts',
];

/**
 * Mock compliance data for seeding
 * Provides realistic test data across all 12 agencies with various statuses:
 * - Verified items with valid expiration dates
 * - Pending verification (isVerified: false)
 * - Expired items (dates in the past)
 * - Expiring soon (dates within 30 days)
 */
export const mockComplianceData = [
  {
    agencyName: 'Industrial Staffing Solutions',
    complianceItems: [
      { type: 'osha_certified', isActive: true, isVerified: true, expirationDate: '2026-08-15' },
      { type: 'drug_testing', isActive: true, isVerified: true, expirationDate: null },
      { type: 'workers_comp', isActive: true, isVerified: true, expirationDate: '2027-01-31' },
      { type: 'general_liability', isActive: true, isVerified: false, expirationDate: '2026-12-15' },
      { type: 'background_checks', isActive: true, isVerified: true, expirationDate: null },
    ],
  },
  {
    agencyName: 'TradePower Recruiting',
    complianceItems: [
      { type: 'osha_certified', isActive: true, isVerified: true, expirationDate: '2026-05-20' },
      { type: 'bonding', isActive: true, isVerified: false, expirationDate: '2027-03-01' },
      { type: 'workers_comp', isActive: true, isVerified: true, expirationDate: '2026-11-30' },
      { type: 'drug_testing', isActive: true, isVerified: true, expirationDate: null },
    ],
  },
  {
    agencyName: 'Shutdown Specialists Inc',
    complianceItems: [
      { type: 'osha_certified', isActive: true, isVerified: true, expirationDate: '2026-02-10' }, // Expiring soon
      { type: 'workers_comp', isActive: true, isVerified: false, expirationDate: '2026-09-30' },
      { type: 'general_liability', isActive: true, isVerified: true, expirationDate: '2025-12-31' }, // Expired
    ],
  },
  {
    agencyName: 'Elite Construction Staffing',
    complianceItems: [
      { type: 'background_checks', isActive: true, isVerified: true, expirationDate: null },
      { type: 'drug_testing', isActive: true, isVerified: false, expirationDate: null }, // Pending verification
      { type: 'workers_comp', isActive: true, isVerified: true, expirationDate: '2026-11-15' },
      { type: 'general_liability', isActive: true, isVerified: true, expirationDate: '2026-10-01' },
    ],
  },
  {
    agencyName: 'Union Trades Collective',
    complianceItems: [
      { type: 'osha_certified', isActive: true, isVerified: true, expirationDate: '2026-07-20' },
      { type: 'bonding', isActive: true, isVerified: true, expirationDate: '2027-02-28' },
      { type: 'workers_comp', isActive: true, isVerified: true, expirationDate: '2026-12-31' },
      { type: 'general_liability', isActive: true, isVerified: true, expirationDate: '2026-06-30' },
      { type: 'background_checks', isActive: true, isVerified: true, expirationDate: null },
      { type: 'drug_testing', isActive: true, isVerified: true, expirationDate: null },
    ],
  },
  {
    agencyName: 'Maritime Construction Crew',
    complianceItems: [
      { type: 'osha_certified', isActive: true, isVerified: false, expirationDate: '2026-04-15' },
      { type: 'workers_comp', isActive: true, isVerified: true, expirationDate: '2026-08-31' },
      { type: 'general_liability', isActive: true, isVerified: true, expirationDate: '2025-11-30' }, // Expired
    ],
  },
  {
    agencyName: 'Rocky Mountain Workforce',
    complianceItems: [
      { type: 'osha_certified', isActive: true, isVerified: true, expirationDate: '2026-09-10' },
      { type: 'drug_testing', isActive: true, isVerified: true, expirationDate: null },
      { type: 'background_checks', isActive: true, isVerified: true, expirationDate: null },
      { type: 'workers_comp', isActive: true, isVerified: true, expirationDate: '2027-03-15' },
    ],
  },
  {
    agencyName: 'Northeast Industrial Partners',
    complianceItems: [
      { type: 'osha_certified', isActive: true, isVerified: true, expirationDate: '2026-06-25' },
      { type: 'workers_comp', isActive: true, isVerified: false, expirationDate: '2026-10-15' },
      { type: 'general_liability', isActive: true, isVerified: true, expirationDate: '2026-05-30' },
      { type: 'bonding', isActive: true, isVerified: true, expirationDate: '2027-01-20' },
    ],
  },
  {
    agencyName: 'Pacific Coast Builders',
    complianceItems: [
      { type: 'osha_certified', isActive: true, isVerified: true, expirationDate: '2026-03-31' },
      { type: 'drug_testing', isActive: true, isVerified: true, expirationDate: null },
      { type: 'background_checks', isActive: true, isVerified: false, expirationDate: null },
      { type: 'workers_comp', isActive: true, isVerified: true, expirationDate: '2026-09-15' },
      { type: 'general_liability', isActive: true, isVerified: true, expirationDate: '2026-07-31' },
    ],
  },
  {
    agencyName: 'Midwest Manufacturing Staffing',
    complianceItems: [
      { type: 'osha_certified', isActive: true, isVerified: true, expirationDate: '2026-10-20' },
      { type: 'workers_comp', isActive: true, isVerified: true, expirationDate: '2027-02-15' },
      { type: 'general_liability', isActive: true, isVerified: true, expirationDate: '2026-08-25' },
    ],
  },
  {
    agencyName: 'Energy Sector Solutions',
    complianceItems: [
      { type: 'osha_certified', isActive: true, isVerified: true, expirationDate: '2026-05-15' },
      { type: 'drug_testing', isActive: true, isVerified: true, expirationDate: null },
      { type: 'background_checks', isActive: true, isVerified: true, expirationDate: null },
      { type: 'workers_comp', isActive: true, isVerified: false, expirationDate: '2026-11-10' },
      { type: 'general_liability', isActive: true, isVerified: true, expirationDate: '2026-04-30' },
    ],
  },
  {
    agencyName: 'Southeast Infrastructure Group',
    complianceItems: [
      { type: 'osha_certified', isActive: true, isVerified: true, expirationDate: '2026-07-05' },
      { type: 'workers_comp', isActive: true, isVerified: true, expirationDate: '2026-12-20' },
      { type: 'general_liability', isActive: true, isVerified: true, expirationDate: '2026-06-15' },
      { type: 'bonding', isActive: true, isVerified: false, expirationDate: '2027-04-10' },
    ],
  },
];
