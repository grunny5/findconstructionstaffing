import {
  Agency,
  Trade,
  Region,
  isErrorResponse,
  API_CONSTANTS,
  HTTP_STATUS,
  ERROR_CODES,
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
      is_claimed: true,
      offers_per_diem: true,
      is_union: false,
      founded_year: 2020,
      employee_count: '50-100',
      headquarters: 'Austin, TX',
      rating: 4.5,
      review_count: 10,
      project_count: 100,
      verified: true,
      featured: false,
      trades: [],
      regions: [],
    };

    it('should have correct properties for a complete agency object', () => {
      expect(validAgency.id).toBe('123');
      expect(validAgency.name).toBe('Test Agency');
      expect(validAgency.slug).toBe('test-agency');
      expect(validAgency.is_claimed).toBe(true);
    });

    it('should accept agency with minimal required fields', () => {
      const minimalAgency: Agency = {
        id: '123',
        name: 'Test Agency',
        slug: 'test-agency',
        description: null,
        logo_url: null,
        website: null,
        phone: null,
        email: null,
        is_claimed: false,
        offers_per_diem: false,
        is_union: false,
        founded_year: null,
        employee_count: null,
        headquarters: null,
        rating: null,
        review_count: 0,
        project_count: 0,
        verified: false,
        featured: false,
        trades: [],
        regions: [],
      };

      expect(minimalAgency.id).toBeDefined();
      expect(minimalAgency.name).toBeDefined();
    });
  });

  describe('Trade Type', () => {
    const validTrade: Trade = {
      id: '1',
      name: 'Electrician',
      slug: 'electrician',
      description: 'Electrical work specialists',
    };

    it('should have correct properties for trade', () => {
      expect(validTrade.id).toBe('1');
      expect(validTrade.name).toBe('Electrician');
      expect(validTrade.slug).toBe('electrician');
    });

    it('should handle trade without description', () => {
      const trade: Trade = {
        id: '1',
        name: 'Plumber',
        slug: 'plumber',
      };

      expect(trade.description).toBeUndefined();
    });
  });

  describe('Region Type', () => {
    const validRegion: Region = {
      id: '1',
      name: 'Texas',
      code: 'TX',
    };

    it('should have correct properties for region', () => {
      expect(validRegion.id).toBe('1');
      expect(validRegion.name).toBe('Texas');
      expect(validRegion.code).toBe('TX');
    });
  });

  describe('Agency with relations', () => {
    it('should handle agency with trades and regions', () => {
      const agencyWithRelations: Agency = {
        ...{
          id: '123',
          name: 'Test Agency',
          slug: 'test-agency',
          description: 'A test agency',
          logo_url: 'https://example.com/logo.png',
          website: 'https://example.com',
          phone: '555-123-4567',
          email: 'test@example.com',
          is_claimed: true,
          offers_per_diem: true,
          is_union: false,
          founded_year: 2020,
          employee_count: '50-100',
          headquarters: 'Austin, TX',
          rating: 4.5,
          review_count: 10,
          project_count: 100,
          verified: true,
          featured: false,
        },
        trades: [
          { id: '1', name: 'Electrician', slug: 'electrician' },
          { id: '2', name: 'Plumber', slug: 'plumber' },
        ],
        regions: [
          { id: '1', name: 'Texas', code: 'TX' },
          { id: '2', name: 'California', code: 'CA' },
        ],
      };

      expect(agencyWithRelations.trades).toHaveLength(2);
      expect(agencyWithRelations.regions).toHaveLength(2);
    });
  });

  describe('Error handling', () => {
    it('should detect error responses', () => {
      const errorResponse = {
        error: {
          code: 'NOT_FOUND',
          message: 'Agency not found',
        },
      };

      expect(isErrorResponse(errorResponse)).toBe(true);
    });

    it('should not detect valid responses as errors', () => {
      const validResponse = {
        data: { id: '123', name: 'Test' },
      };

      expect(isErrorResponse(validResponse)).toBe(false);
    });
  });

  describe('Constants', () => {
    it('should have correct API constants', () => {
      expect(API_CONSTANTS.DEFAULT_LIMIT).toBe(20);
      expect(API_CONSTANTS.MAX_LIMIT).toBe(100);
      expect(API_CONSTANTS.DEFAULT_OFFSET).toBe(0);
    });

    it('should have correct HTTP status codes', () => {
      expect(HTTP_STATUS.OK).toBe(200);
      expect(HTTP_STATUS.BAD_REQUEST).toBe(400);
      expect(HTTP_STATUS.NOT_FOUND).toBe(404);
      expect(HTTP_STATUS.INTERNAL_SERVER_ERROR).toBe(500);
    });

    it('should have correct error codes', () => {
      expect(ERROR_CODES.INVALID_PARAMS).toBe('INVALID_PARAMS');
      expect(ERROR_CODES.DATABASE_ERROR).toBe('DATABASE_ERROR');
      expect(ERROR_CODES.INTERNAL_ERROR).toBe('INTERNAL_ERROR');
      expect(ERROR_CODES.NOT_FOUND).toBe('NOT_FOUND');
    });
  });
});
