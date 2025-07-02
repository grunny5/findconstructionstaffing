import { AgenciesQuerySchema } from '../agencies-query';
import { z } from 'zod';

describe('AgenciesQuerySchema - Complete Tests', () => {
  describe('states parameter', () => {
    it('should accept valid US state codes', () => {
      const result = AgenciesQuerySchema.safeParse({ states: ['CA', 'TX'] });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.states).toEqual(['CA', 'TX']);
      }
    });

    it('should accept single state as string and convert to array', () => {
      const result = AgenciesQuerySchema.safeParse({ states: 'CA' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.states).toEqual(['CA']);
      }
    });

    it('should accept lowercase state codes and convert to uppercase', () => {
      const result = AgenciesQuerySchema.safeParse({ states: ['ca', 'tx'] });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.states).toEqual(['CA', 'TX']);
      }
    });

    it('should handle state with whitespace', () => {
      const result = AgenciesQuerySchema.safeParse({ states: [' NY '] });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.states).toEqual(['NY']);
      }
    });
  });

  describe('trades parameter', () => {
    it('should accept array of trade slugs', () => {
      const result = AgenciesQuerySchema.safeParse({
        trades: ['electrician', 'plumber'],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.trades).toEqual(['electrician', 'plumber']);
      }
    });

    it('should accept single trade as string and convert to array', () => {
      const result = AgenciesQuerySchema.safeParse({ trades: 'electrician' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.trades).toEqual(['electrician']);
      }
    });
  });

  describe('limit parameter', () => {
    it('should accept valid limit values', () => {
      const validLimits = ['1', '10', '50', '100'];

      validLimits.forEach((limit) => {
        const result = AgenciesQuerySchema.safeParse({ limit });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.limit).toBe(parseInt(limit, 10));
        }
      });
    });

    it('should default to 20 if not provided', () => {
      const result = AgenciesQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(20);
      }
    });
  });

  describe('offset parameter', () => {
    it('should accept valid offset values', () => {
      const validOffsets = ['0', '10', '100', '1000'];

      validOffsets.forEach((offset) => {
        const result = AgenciesQuerySchema.safeParse({ offset });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.offset).toBe(parseInt(offset, 10));
        }
      });
    });

    it('should default to 0 if not provided', () => {
      const result = AgenciesQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.offset).toBe(0);
      }
    });
  });

  describe('search parameter', () => {
    it('should accept valid search terms', () => {
      const result = AgenciesQuerySchema.safeParse({ search: 'construction' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.search).toBe('construction');
      }
    });

    it('should trim whitespace from search terms', () => {
      const result = AgenciesQuerySchema.safeParse({
        search: '  construction  ',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.search).toBe('construction');
      }
    });
  });

  describe('combined parameters', () => {
    it('should accept all valid parameters together', () => {
      const query = {
        trades: ['electrician'],
        states: ['TX'],
        search: 'construction',
        limit: '20',
        offset: '40',
      };

      const result = AgenciesQuerySchema.safeParse(query);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          trades: ['electrician'],
          states: ['TX'],
          search: 'construction',
          limit: 20,
          offset: 40,
        });
      }
    });

    it('should handle empty object with defaults', () => {
      const result = AgenciesQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          limit: 20,
          offset: 0,
        });
      }
    });
  });
});
