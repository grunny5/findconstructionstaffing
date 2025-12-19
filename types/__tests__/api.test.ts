import {
  isErrorResponse,
  API_CONSTANTS,
  HTTP_STATUS,
  ERROR_CODES,
  type Agency,
  type Trade,
  type Region,
  type AgenciesApiResponse,
  type ErrorResponse,
  type AgenciesQueryParams,
} from '../api';

describe('API Types', () => {
  describe('Type Guards', () => {
    describe('isErrorResponse', () => {
      it('should return true for valid error response', () => {
        const errorResponse: ErrorResponse = {
          error: {
            code: 'TEST_ERROR',
            message: 'Test error message',
          },
        };
        expect(isErrorResponse(errorResponse)).toBe(true);
      });

      it('should return true for error response with details', () => {
        const errorResponse: ErrorResponse = {
          error: {
            code: 'TEST_ERROR',
            message: 'Test error message',
            details: { field: 'value' },
          },
        };
        expect(isErrorResponse(errorResponse)).toBe(true);
      });

      it('should return false for non-error response', () => {
        const successResponse = {
          data: [],
          pagination: {
            total: 0,
            limit: 20,
            offset: 0,
            hasMore: false,
          },
        };
        expect(isErrorResponse(successResponse)).toBe(false);
      });

      it('should return false for null', () => {
        expect(isErrorResponse(null)).toBe(false);
      });

      it('should return false for undefined', () => {
        expect(isErrorResponse(undefined)).toBe(false);
      });

      it('should return false for non-object', () => {
        expect(isErrorResponse('error')).toBe(false);
        expect(isErrorResponse(123)).toBe(false);
        expect(isErrorResponse(true)).toBe(false);
      });

      it('should return false for object without error property', () => {
        expect(isErrorResponse({ message: 'error' })).toBe(false);
      });
    });
  });

  describe('Constants', () => {
    it('should have correct API_CONSTANTS values', () => {
      expect(API_CONSTANTS.DEFAULT_LIMIT).toBe(20);
      expect(API_CONSTANTS.MAX_LIMIT).toBe(100);
      expect(API_CONSTANTS.DEFAULT_OFFSET).toBe(0);
      expect(API_CONSTANTS.CACHE_MAX_AGE).toBe(300);
    });

    it('should have correct HTTP_STATUS values', () => {
      expect(HTTP_STATUS.OK).toBe(200);
      expect(HTTP_STATUS.BAD_REQUEST).toBe(400);
      expect(HTTP_STATUS.INTERNAL_SERVER_ERROR).toBe(500);
    });

    it('should have correct ERROR_CODES values', () => {
      expect(ERROR_CODES.INVALID_PARAMS).toBe('INVALID_PARAMS');
      expect(ERROR_CODES.DATABASE_ERROR).toBe('DATABASE_ERROR');
      expect(ERROR_CODES.INTERNAL_ERROR).toBe('INTERNAL_ERROR');
    });
  });

  describe('Type Compliance', () => {
    it('should allow valid Agency object', () => {
      const agency: Agency = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Agency',
        slug: 'test-agency',
        description: 'A test agency',
        logo_url: 'https://example.com/logo.png',
        website: 'https://example.com',
        phone: '(555) 123-4567',
        email: 'test@example.com',
        is_claimed: true,
        offers_per_diem: false,
        is_union: true,
        founded_year: 2000,
        employee_count: '10-50',
        headquarters: 'New York, NY',
        rating: 4.5,
        review_count: 10,
        project_count: 25,
        verified: true,
        featured: false,
        profile_completion_percentage: 85,
        last_edited_at: '2024-01-01T00:00:00Z',
        last_edited_by: '123e4567-e89b-12d3-a456-426614174001',
        trades: [],
        regions: [],
      };
      expect(agency).toBeDefined();
    });

    it('should allow valid Trade object', () => {
      const trade: Trade = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Electricians',
        slug: 'electricians',
        description: 'Electrical work specialists',
      };
      expect(trade).toBeDefined();
    });

    it('should allow valid Region object', () => {
      const region: Region = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Texas',
        code: 'TX',
      };
      expect(region).toBeDefined();
    });

    it('should allow valid AgenciesApiResponse', () => {
      const response: AgenciesApiResponse = {
        data: [],
        pagination: {
          total: 100,
          limit: 20,
          offset: 0,
          hasMore: true,
        },
      };
      expect(response).toBeDefined();
    });

    it('should allow valid AgenciesQueryParams', () => {
      const params: AgenciesQueryParams = {
        search: 'test',
        trades: ['electricians', 'plumbers'],
        states: ['TX', 'CA'],
        limit: 50,
        offset: 20,
      };
      expect(params).toBeDefined();
    });

    it('should allow partial AgenciesQueryParams', () => {
      const params1: AgenciesQueryParams = { search: 'test' };
      const params2: AgenciesQueryParams = { trades: ['electricians'] };
      const params3: AgenciesQueryParams = { limit: 10, offset: 0 };
      const params4: AgenciesQueryParams = {};

      expect(params1).toBeDefined();
      expect(params2).toBeDefined();
      expect(params3).toBeDefined();
      expect(params4).toBeDefined();
    });
  });
});
