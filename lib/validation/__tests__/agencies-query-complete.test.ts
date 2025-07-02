import { agenciesQuerySchema } from '../agencies-query';
import { z } from 'zod';

describe('agenciesQuerySchema - Complete Tests', () => {
  describe('state parameter', () => {
    it('should accept valid US state codes', () => {
      const validStates = ['CA', 'TX', 'NY', 'FL', 'AZ'];
      
      validStates.forEach(state => {
        const result = agenciesQuerySchema.safeParse({ state });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.state).toBe(state);
        }
      });
    });

    it('should accept lowercase state codes and convert to uppercase', () => {
      const result = agenciesQuerySchema.safeParse({ state: 'ca' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.state).toBe('CA');
      }
    });

    it('should accept mixed case state codes', () => {
      const result = agenciesQuerySchema.safeParse({ state: 'Tx' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.state).toBe('TX');
      }
    });

    it('should handle state with whitespace', () => {
      const result = agenciesQuerySchema.safeParse({ state: ' NY ' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.state).toBe('NY');
      }
    });
  });

  describe('limit parameter', () => {
    it('should accept valid limit values', () => {
      const validLimits = [1, 10, 50, 100];
      
      validLimits.forEach(limit => {
        const result = agenciesQuerySchema.safeParse({ limit });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.limit).toBe(limit);
        }
      });
    });

    it('should reject limit less than 1', () => {
      const result = agenciesQuerySchema.safeParse({ limit: 0 });
      expect(result.success).toBe(false);
    });

    it('should reject limit greater than 100', () => {
      const result = agenciesQuerySchema.safeParse({ limit: 101 });
      expect(result.success).toBe(false);
    });

    it('should convert string numbers to integers', () => {
      const result = agenciesQuerySchema.safeParse({ limit: '25' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(25);
        expect(typeof result.data.limit).toBe('number');
      }
    });

    it('should default to 10 if not provided', () => {
      const result = agenciesQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(10);
      }
    });
  });

  describe('offset parameter', () => {
    it('should accept valid offset values', () => {
      const validOffsets = [0, 10, 100, 1000];
      
      validOffsets.forEach(offset => {
        const result = agenciesQuerySchema.safeParse({ offset });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.offset).toBe(offset);
        }
      });
    });

    it('should reject negative offset', () => {
      const result = agenciesQuerySchema.safeParse({ offset: -1 });
      expect(result.success).toBe(false);
    });

    it('should default to 0 if not provided', () => {
      const result = agenciesQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.offset).toBe(0);
      }
    });
  });

  describe('combined parameters', () => {
    it('should accept all valid parameters together', () => {
      const query = {
        trade: 'electrician',
        state: 'TX',
        search: 'construction',
        limit: 20,
        offset: 40,
      };

      const result = agenciesQuerySchema.safeParse(query);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          trade: 'electrician',
          state: 'TX',
          search: 'construction',
          limit: 20,
          offset: 40,
        });
      }
    });

    it('should handle empty object with defaults', () => {
      const result = agenciesQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          limit: 10,
          offset: 0,
        });
      }
    });

    it('should strip unknown parameters', () => {
      const query = {
        trade: 'plumber',
        unknownParam: 'should be removed',
        anotherUnknown: 123,
      };

      const result = agenciesQuerySchema.safeParse(query);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          trade: 'plumber',
          limit: 10,
          offset: 0,
        });
        expect('unknownParam' in result.data).toBe(false);
      }
    });
  });

  describe('error handling', () => {
    it('should provide meaningful error for invalid types', () => {
      const result = agenciesQuerySchema.safeParse({
        limit: 'not-a-number',
        offset: 'also-not-a-number',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toHaveLength(2);
        expect(result.error.issues[0].path).toContain('limit');
        expect(result.error.issues[1].path).toContain('offset');
      }
    });

    it('should handle null values', () => {
      const result = agenciesQuerySchema.safeParse({
        trade: null,
        state: null,
      });

      // null values should be ignored (optional fields)
      expect(result.success).toBe(true);
    });
  });
});