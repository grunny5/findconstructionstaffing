import { calculateProfileCompletion } from '../profile-completion';
import type { Agency } from '@/types/supabase';

/**
 * Helper function to create a minimal agency object with only required fields
 */
const createMinimalAgency = (): Agency => ({
  id: 'test-id',
  name: 'Test Agency',
  slug: 'test-agency',
  is_claimed: false,
  is_active: true,
  offers_per_diem: false,
  is_union: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
});

/**
 * Helper function to create a fully complete agency profile
 */
const createCompleteAgency = (): Agency => ({
  ...createMinimalAgency(),
  name: 'Complete Agency',
  description: 'A comprehensive description of our agency services',
  website: 'https://example.com',
  phone: '+1-555-123-4567',
  email: 'contact@example.com',
  headquarters: 'Houston, TX',
  logo_url: 'https://example.com/logo.png',
  founded_year: 2010,
  employee_count: '50-100',
  company_size: 'Medium',
  trades: [
    { id: '1', name: 'Electrician', slug: 'electrician' },
    { id: '2', name: 'Plumber', slug: 'plumber' },
  ],
  regions: [
    { id: '1', name: 'Texas', state_code: 'TX', slug: 'texas' },
    { id: '2', name: 'Louisiana', state_code: 'LA', slug: 'louisiana' },
  ],
});

describe('calculateProfileCompletion', () => {
  describe('Overall Profile Scoring', () => {
    it('should return 5% for minimal profile (only name)', () => {
      const agency = createMinimalAgency();
      expect(calculateProfileCompletion(agency)).toBe(5);
    });

    it('should return 100% for fully complete profile', () => {
      const agency = createCompleteAgency();
      expect(calculateProfileCompletion(agency)).toBe(100);
    });

    it('should return 0% when name is empty string', () => {
      const agency = { ...createMinimalAgency(), name: '' };
      expect(calculateProfileCompletion(agency)).toBe(0);
    });

    it('should return 0% when name is only whitespace', () => {
      const agency = { ...createMinimalAgency(), name: '   ' };
      expect(calculateProfileCompletion(agency)).toBe(0);
    });
  });

  describe('Basic Info Scoring (20%)', () => {
    describe('Name (5%)', () => {
      it('should award 5% for valid name', () => {
        const agency = createMinimalAgency();
        expect(calculateProfileCompletion(agency)).toBe(5);
      });

      it('should not award points for empty name', () => {
        const agency = { ...createMinimalAgency(), name: '' };
        expect(calculateProfileCompletion(agency)).toBe(0);
      });

      it('should not award points for whitespace-only name', () => {
        const agency = { ...createMinimalAgency(), name: '  \n\t  ' };
        expect(calculateProfileCompletion(agency)).toBe(0);
      });
    });

    describe('Description (10%)', () => {
      it('should award 10% for valid description', () => {
        const agency = {
          ...createMinimalAgency(),
          description: 'We provide quality staffing services',
        };
        expect(calculateProfileCompletion(agency)).toBe(15); // 5% name + 10% description
      });

      it('should not award points for undefined description', () => {
        const agency = createMinimalAgency();
        expect(calculateProfileCompletion(agency)).toBe(5);
      });

      it('should not award points for empty description', () => {
        const agency = { ...createMinimalAgency(), description: '' };
        expect(calculateProfileCompletion(agency)).toBe(5);
      });

      it('should not award points for whitespace-only description', () => {
        const agency = { ...createMinimalAgency(), description: '   ' };
        expect(calculateProfileCompletion(agency)).toBe(5);
      });
    });

    describe('Website (5%)', () => {
      it('should award 5% for valid website', () => {
        const agency = {
          ...createMinimalAgency(),
          website: 'https://example.com',
        };
        expect(calculateProfileCompletion(agency)).toBe(10); // 5% name + 5% website
      });

      it('should not award points for undefined website', () => {
        const agency = createMinimalAgency();
        expect(calculateProfileCompletion(agency)).toBe(5);
      });

      it('should not award points for empty website', () => {
        const agency = { ...createMinimalAgency(), website: '' };
        expect(calculateProfileCompletion(agency)).toBe(5);
      });

      it('should not award points for whitespace-only website', () => {
        const agency = { ...createMinimalAgency(), website: '  ' };
        expect(calculateProfileCompletion(agency)).toBe(5);
      });
    });

    it('should award full 20% when all basic info fields are complete', () => {
      const agency = {
        ...createMinimalAgency(),
        name: 'Test Agency',
        description: 'Description',
        website: 'https://example.com',
      };
      expect(calculateProfileCompletion(agency)).toBe(20);
    });
  });

  describe('Contact Scoring (15%)', () => {
    describe('Phone (5%)', () => {
      it('should award 5% for valid phone', () => {
        const agency = { ...createMinimalAgency(), phone: '+1-555-123-4567' };
        expect(calculateProfileCompletion(agency)).toBe(10); // 5% name + 5% phone
      });

      it('should not award points for undefined phone', () => {
        const agency = createMinimalAgency();
        expect(calculateProfileCompletion(agency)).toBe(5);
      });

      it('should not award points for empty phone', () => {
        const agency = { ...createMinimalAgency(), phone: '' };
        expect(calculateProfileCompletion(agency)).toBe(5);
      });
    });

    describe('Email (5%)', () => {
      it('should award 5% for valid email', () => {
        const agency = { ...createMinimalAgency(), email: 'test@example.com' };
        expect(calculateProfileCompletion(agency)).toBe(10); // 5% name + 5% email
      });

      it('should not award points for undefined email', () => {
        const agency = createMinimalAgency();
        expect(calculateProfileCompletion(agency)).toBe(5);
      });

      it('should not award points for empty email', () => {
        const agency = { ...createMinimalAgency(), email: '' };
        expect(calculateProfileCompletion(agency)).toBe(5);
      });
    });

    describe('Headquarters (5%)', () => {
      it('should award 5% for valid headquarters', () => {
        const agency = {
          ...createMinimalAgency(),
          headquarters: 'Houston, TX',
        };
        expect(calculateProfileCompletion(agency)).toBe(10); // 5% name + 5% headquarters
      });

      it('should not award points for undefined headquarters', () => {
        const agency = createMinimalAgency();
        expect(calculateProfileCompletion(agency)).toBe(5);
      });

      it('should not award points for empty headquarters', () => {
        const agency = { ...createMinimalAgency(), headquarters: '' };
        expect(calculateProfileCompletion(agency)).toBe(5);
      });
    });

    it('should award full 15% when all contact fields are complete', () => {
      const agency = {
        ...createMinimalAgency(),
        phone: '+1-555-123-4567',
        email: 'test@example.com',
        headquarters: 'Houston, TX',
      };
      expect(calculateProfileCompletion(agency)).toBe(20); // 5% name + 15% contact
    });
  });

  describe('Services Scoring (40%)', () => {
    describe('Trades (20%)', () => {
      it('should award 20% for one trade', () => {
        const agency = {
          ...createMinimalAgency(),
          trades: [{ id: '1', name: 'Electrician', slug: 'electrician' }],
        };
        expect(calculateProfileCompletion(agency)).toBe(25); // 5% name + 20% trades
      });

      it('should award 20% for multiple trades', () => {
        const agency = {
          ...createMinimalAgency(),
          trades: [
            { id: '1', name: 'Electrician', slug: 'electrician' },
            { id: '2', name: 'Plumber', slug: 'plumber' },
            { id: '3', name: 'Carpenter', slug: 'carpenter' },
          ],
        };
        expect(calculateProfileCompletion(agency)).toBe(25); // 5% name + 20% trades
      });

      it('should not award points for undefined trades', () => {
        const agency = createMinimalAgency();
        expect(calculateProfileCompletion(agency)).toBe(5);
      });

      it('should not award points for empty trades array', () => {
        const agency = { ...createMinimalAgency(), trades: [] };
        expect(calculateProfileCompletion(agency)).toBe(5);
      });

      it('should not award points for null trades', () => {
        const agency = { ...createMinimalAgency(), trades: null as any };
        expect(calculateProfileCompletion(agency)).toBe(5);
      });

      it('should not award points for non-array trades', () => {
        const agency = { ...createMinimalAgency(), trades: 'invalid' as any };
        expect(calculateProfileCompletion(agency)).toBe(5);
      });
    });

    describe('Regions (20%)', () => {
      it('should award 20% for one region', () => {
        const agency = {
          ...createMinimalAgency(),
          regions: [
            { id: '1', name: 'Texas', state_code: 'TX', slug: 'texas' },
          ],
        };
        expect(calculateProfileCompletion(agency)).toBe(25); // 5% name + 20% regions
      });

      it('should award 20% for multiple regions', () => {
        const agency = {
          ...createMinimalAgency(),
          regions: [
            { id: '1', name: 'Texas', state_code: 'TX', slug: 'texas' },
            { id: '2', name: 'Louisiana', state_code: 'LA', slug: 'louisiana' },
          ],
        };
        expect(calculateProfileCompletion(agency)).toBe(25); // 5% name + 20% regions
      });

      it('should not award points for undefined regions', () => {
        const agency = createMinimalAgency();
        expect(calculateProfileCompletion(agency)).toBe(5);
      });

      it('should not award points for empty regions array', () => {
        const agency = { ...createMinimalAgency(), regions: [] };
        expect(calculateProfileCompletion(agency)).toBe(5);
      });

      it('should not award points for null regions', () => {
        const agency = { ...createMinimalAgency(), regions: null as any };
        expect(calculateProfileCompletion(agency)).toBe(5);
      });
    });

    it('should award full 40% when both trades and regions are present', () => {
      const agency = {
        ...createMinimalAgency(),
        trades: [{ id: '1', name: 'Electrician', slug: 'electrician' }],
        regions: [{ id: '1', name: 'Texas', state_code: 'TX', slug: 'texas' }],
      };
      expect(calculateProfileCompletion(agency)).toBe(45); // 5% name + 40% services
    });
  });

  describe('Additional Scoring (15%)', () => {
    describe('Logo (10%)', () => {
      it('should award 10% for valid logo URL', () => {
        const agency = {
          ...createMinimalAgency(),
          logo_url: 'https://example.com/logo.png',
        };
        expect(calculateProfileCompletion(agency)).toBe(15); // 5% name + 10% logo
      });

      it('should not award points for undefined logo', () => {
        const agency = createMinimalAgency();
        expect(calculateProfileCompletion(agency)).toBe(5);
      });

      it('should not award points for empty logo URL', () => {
        const agency = { ...createMinimalAgency(), logo_url: '' };
        expect(calculateProfileCompletion(agency)).toBe(5);
      });
    });

    describe('Founded Year (5%)', () => {
      it('should award 5% for valid founded year', () => {
        const agency = { ...createMinimalAgency(), founded_year: 2010 };
        expect(calculateProfileCompletion(agency)).toBe(10); // 5% name + 5% founded_year
      });

      it('should award 5% for recent founded year', () => {
        const agency = { ...createMinimalAgency(), founded_year: 2024 };
        expect(calculateProfileCompletion(agency)).toBe(10);
      });

      it('should award 5% for old founded year', () => {
        const agency = { ...createMinimalAgency(), founded_year: 1950 };
        expect(calculateProfileCompletion(agency)).toBe(10);
      });

      it('should not award points for undefined founded year', () => {
        const agency = createMinimalAgency();
        expect(calculateProfileCompletion(agency)).toBe(5);
      });

      it('should not award points for zero founded year', () => {
        const agency = { ...createMinimalAgency(), founded_year: 0 };
        expect(calculateProfileCompletion(agency)).toBe(5);
      });

      it('should not award points for negative founded year', () => {
        const agency = { ...createMinimalAgency(), founded_year: -1 };
        expect(calculateProfileCompletion(agency)).toBe(5);
      });
    });

    it('should award full 15% when logo and founded year are present', () => {
      const agency = {
        ...createMinimalAgency(),
        logo_url: 'https://example.com/logo.png',
        founded_year: 2010,
      };
      expect(calculateProfileCompletion(agency)).toBe(20); // 5% name + 15% additional
    });
  });

  describe('Details Scoring (10%)', () => {
    describe('Employee Count (5%)', () => {
      it('should award 5% for valid employee count', () => {
        const agency = { ...createMinimalAgency(), employee_count: '50-100' };
        expect(calculateProfileCompletion(agency)).toBe(10); // 5% name + 5% employee_count
      });

      it('should not award points for undefined employee count', () => {
        const agency = createMinimalAgency();
        expect(calculateProfileCompletion(agency)).toBe(5);
      });

      it('should not award points for empty employee count', () => {
        const agency = { ...createMinimalAgency(), employee_count: '' };
        expect(calculateProfileCompletion(agency)).toBe(5);
      });
    });

    describe('Company Size (5%)', () => {
      it('should award 5% for valid company size', () => {
        const agency = { ...createMinimalAgency(), company_size: 'Medium' };
        expect(calculateProfileCompletion(agency)).toBe(10); // 5% name + 5% company_size
      });

      it('should not award points for undefined company size', () => {
        const agency = createMinimalAgency();
        expect(calculateProfileCompletion(agency)).toBe(5);
      });

      it('should not award points for empty company size', () => {
        const agency = { ...createMinimalAgency(), company_size: '' };
        expect(calculateProfileCompletion(agency)).toBe(5);
      });
    });

    it('should award full 10% when employee count and company size are present', () => {
      const agency = {
        ...createMinimalAgency(),
        employee_count: '50-100',
        company_size: 'Medium',
      };
      expect(calculateProfileCompletion(agency)).toBe(15); // 5% name + 10% details
    });
  });

  describe('Combination Scenarios', () => {
    it('should calculate correctly for partially complete profile (50%)', () => {
      const agency = {
        ...createMinimalAgency(),
        name: 'Test Agency', // 5%
        description: 'Description', // 10%
        phone: '+1-555-1234', // 5%
        trades: [{ id: '1', name: 'Electrician', slug: 'electrician' }], // 20%
        logo_url: 'https://example.com/logo.png', // 10%
      };
      expect(calculateProfileCompletion(agency)).toBe(50);
    });

    it('should calculate correctly for 75% complete profile', () => {
      const agency = {
        ...createMinimalAgency(),
        name: 'Test Agency', // 5%
        description: 'Description', // 10%
        website: 'https://example.com', // 5%
        phone: '+1-555-1234', // 5%
        email: 'test@example.com', // 5%
        headquarters: 'Houston, TX', // 5%
        trades: [{ id: '1', name: 'Electrician', slug: 'electrician' }], // 20%
        regions: [{ id: '1', name: 'Texas', state_code: 'TX', slug: 'texas' }], // 20%
      };
      expect(calculateProfileCompletion(agency)).toBe(75);
    });

    it('should handle profile with only services complete', () => {
      const agency = {
        ...createMinimalAgency(),
        name: 'Test Agency', // 5%
        trades: [{ id: '1', name: 'Electrician', slug: 'electrician' }], // 20%
        regions: [{ id: '1', name: 'Texas', state_code: 'TX', slug: 'texas' }], // 20%
      };
      expect(calculateProfileCompletion(agency)).toBe(45);
    });

    it('should handle profile with no optional fields', () => {
      const agency = createMinimalAgency();
      expect(calculateProfileCompletion(agency)).toBe(5);
    });
  });

  describe('Edge Cases', () => {
    it('should handle agency with all fields as empty strings', () => {
      const agency = {
        ...createMinimalAgency(),
        name: '',
        description: '',
        website: '',
        phone: '',
        email: '',
        headquarters: '',
        logo_url: '',
        employee_count: '',
        company_size: '',
      };
      expect(calculateProfileCompletion(agency)).toBe(0);
    });

    it('should handle agency with all fields as whitespace', () => {
      const agency = {
        ...createMinimalAgency(),
        name: '  ',
        description: '  ',
        website: '  ',
        phone: '  ',
        email: '  ',
        headquarters: '  ',
        logo_url: '  ',
        employee_count: '  ',
        company_size: '  ',
      };
      expect(calculateProfileCompletion(agency)).toBe(0);
    });

    it('should return an integer (no decimals)', () => {
      const agency = createCompleteAgency();
      const result = calculateProfileCompletion(agency);
      expect(Number.isInteger(result)).toBe(true);
      expect(result % 1).toBe(0);
    });

    it('should never return negative values', () => {
      const agency = {
        ...createMinimalAgency(),
        name: '',
        founded_year: -100,
      };
      expect(calculateProfileCompletion(agency)).toBeGreaterThanOrEqual(0);
    });

    it('should never exceed 100%', () => {
      const agency = createCompleteAgency();
      expect(calculateProfileCompletion(agency)).toBeLessThanOrEqual(100);
    });
  });
});
