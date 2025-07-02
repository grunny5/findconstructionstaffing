import {
  Agency,
  Trade,
  Region,
  AgencyRegion,
  AgencyTrade,
  isValidAgency,
  isValidTrade,
  isValidRegion,
} from '../api';

describe('API Types', () => {
  describe('Agency Type', () => {
    const validAgency: Agency = {
      id: '123',
      name: 'Test Agency',
      slug: 'test-agency',
      description: 'A test agency',
      logo_url: 'https://example.com/logo.png',
      website: 'https://example.com',
      phone: '555-123-4567',
      email: 'test@example.com',
      address: '123 Main St',
      city: 'Austin',
      state: 'TX',
      zip_code: '78701',
      trades: [],
      regions: [],
      specialties: ['Commercial', 'Industrial'],
      certifications: ['ISO 9001'],
      rating: 4.5,
      reviews_count: 10,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    };

    it('should validate a complete agency object', () => {
      expect(isValidAgency(validAgency)).toBe(true);
    });

    it('should validate agency with minimal required fields', () => {
      const minimalAgency: Agency = {
        id: '123',
        name: 'Test Agency',
        slug: 'test-agency',
        description: '',
        logo_url: null,
        website: null,
        phone: null,
        email: null,
        address: null,
        city: null,
        state: null,
        zip_code: null,
        trades: [],
        regions: [],
        specialties: [],
        certifications: [],
        rating: null,
        reviews_count: 0,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      expect(isValidAgency(minimalAgency)).toBe(true);
    });

    it('should reject invalid agency objects', () => {
      expect(isValidAgency(null)).toBe(false);
      expect(isValidAgency(undefined)).toBe(false);
      expect(isValidAgency({})).toBe(false);
      expect(isValidAgency({ name: 'Test' })).toBe(false);
    });

    it('should reject agency with wrong types', () => {
      const invalidAgency = {
        ...validAgency,
        id: 123, // Should be string
      };
      expect(isValidAgency(invalidAgency)).toBe(false);
    });
  });

  describe('Trade Type', () => {
    const validTrade: Trade = {
      id: 1,
      name: 'Electrician',
    };

    it('should validate a valid trade object', () => {
      expect(isValidTrade(validTrade)).toBe(true);
    });

    it('should reject invalid trade objects', () => {
      expect(isValidTrade(null)).toBe(false);
      expect(isValidTrade({})).toBe(false);
      expect(isValidTrade({ id: '1', name: 'Electrician' })).toBe(false); // id should be number
      expect(isValidTrade({ id: 1 })).toBe(false); // missing name
    });

    it('should validate trades with different IDs and names', () => {
      const trades: Trade[] = [
        { id: 1, name: 'Electrician' },
        { id: 2, name: 'Plumber' },
        { id: 100, name: 'General Laborer' },
      ];

      trades.forEach(trade => {
        expect(isValidTrade(trade)).toBe(true);
      });
    });
  });

  describe('Region Type', () => {
    const validRegion: Region = {
      id: 1,
      name: 'TX',
      type: 'state',
    };

    it('should validate a valid region object', () => {
      expect(isValidRegion(validRegion)).toBe(true);
    });

    it('should validate regions with different types', () => {
      const stateRegion: Region = { id: 1, name: 'CA', type: 'state' };
      const cityRegion: Region = { id: 2, name: 'Los Angeles', type: 'city' };
      const countyRegion: Region = { id: 3, name: 'Orange County', type: 'county' };

      expect(isValidRegion(stateRegion)).toBe(true);
      expect(isValidRegion(cityRegion)).toBe(true);
      expect(isValidRegion(countyRegion)).toBe(true);
    });

    it('should reject invalid region objects', () => {
      expect(isValidRegion(null)).toBe(false);
      expect(isValidRegion({})).toBe(false);
      expect(isValidRegion({ id: 1, name: 'TX' })).toBe(false); // missing type
      expect(isValidRegion({ id: 1, name: 'TX', type: 'country' })).toBe(false); // invalid type
    });
  });

  describe('AgencyRegion Type', () => {
    const validAgencyRegion: AgencyRegion = {
      agency_id: '123',
      region_id: 1,
    };

    it('should be a valid agency-region relationship', () => {
      expect(validAgencyRegion.agency_id).toBe('123');
      expect(validAgencyRegion.region_id).toBe(1);
    });

    it('should enforce correct types', () => {
      // TypeScript will enforce these at compile time
      // This test documents the expected types
      expect(typeof validAgencyRegion.agency_id).toBe('string');
      expect(typeof validAgencyRegion.region_id).toBe('number');
    });
  });

  describe('AgencyTrade Type', () => {
    const validAgencyTrade: AgencyTrade = {
      agency_id: '456',
      trade_id: 2,
    };

    it('should be a valid agency-trade relationship', () => {
      expect(validAgencyTrade.agency_id).toBe('456');
      expect(validAgencyTrade.trade_id).toBe(2);
    });

    it('should enforce correct types', () => {
      expect(typeof validAgencyTrade.agency_id).toBe('string');
      expect(typeof validAgencyTrade.trade_id).toBe('number');
    });
  });

  describe('Type Guards', () => {
    it('should handle edge cases for isValidAgency', () => {
      // Array should return false
      expect(isValidAgency([])).toBe(false);
      
      // String should return false
      expect(isValidAgency('agency')).toBe(false);
      
      // Number should return false
      expect(isValidAgency(123)).toBe(false);
    });

    it('should validate nested agency data', () => {
      const agencyWithNestedData: Agency = {
        id: '123',
        name: 'Test Agency',
        slug: 'test-agency',
        description: 'Test',
        logo_url: null,
        website: null,
        phone: null,
        email: null,
        address: null,
        city: null,
        state: null,
        zip_code: null,
        trades: [
          { id: 1, name: 'Electrician' },
          { id: 2, name: 'Plumber' },
        ],
        regions: [
          { id: 1, name: 'TX', type: 'state' },
          { id: 2, name: 'CA', type: 'state' },
        ],
        specialties: [],
        certifications: [],
        rating: null,
        reviews_count: 0,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      expect(isValidAgency(agencyWithNestedData)).toBe(true);
    });
  });
});