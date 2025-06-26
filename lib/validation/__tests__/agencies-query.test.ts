/**
 * Tests for agencies query validation and sanitization
 */

import { sanitizeSearchInput, parseAgenciesQuery, AgenciesQuerySchema } from '../agencies-query';

describe('sanitizeSearchInput', () => {
  describe('Valid inputs', () => {
    it('should preserve valid business names', () => {
      expect(sanitizeSearchInput('Elite Construction Staffing')).toBe('Elite Construction Staffing');
      expect(sanitizeSearchInput("Bob's Staffing, Inc.")).toBe("Bob's Staffing, Inc.");
      expect(sanitizeSearchInput('ABC-123 Services')).toBe('ABC-123 Services');
      expect(sanitizeSearchInput('Staff_Pro')).toBe('Staff_Pro');
    });

    it('should trim whitespace', () => {
      expect(sanitizeSearchInput('  test  ')).toBe('test');
      expect(sanitizeSearchInput('\n\ttest\r\n')).toBe('test');
    });

    it('should collapse multiple spaces', () => {
      expect(sanitizeSearchInput('test    multiple   spaces')).toBe('test multiple spaces');
    });

    it('should handle empty strings', () => {
      expect(sanitizeSearchInput('')).toBe('');
      expect(sanitizeSearchInput('   ')).toBe('');
    });
  });

  describe('SQL injection prevention', () => {
    it('should remove SQL keywords as whole words', () => {
      expect(sanitizeSearchInput('SELECT * FROM users')).toBe('FROM users');
      expect(sanitizeSearchInput('DROP TABLE agencies')).toBe('TABLE agencies');
      expect(sanitizeSearchInput('Construction UNION Labor')).toBe('Construction Labor');
    });

    it('should preserve SQL keywords within words', () => {
      expect(sanitizeSearchInput('Selection Staffing')).toBe('Selection Staffing');
      expect(sanitizeSearchInput('Executive Search')).toBe('Executive Search');
      expect(sanitizeSearchInput('Dropbox Integration')).toBe('Dropbox Integration');
    });

    it('should remove SQL comment indicators', () => {
      expect(sanitizeSearchInput('test--comment')).toBe('testcomment');
      expect(sanitizeSearchInput('test /* comment */ value')).toBe('test comment value');
    });

    it('should remove dangerous special characters', () => {
      expect(sanitizeSearchInput("test'; DROP TABLE--")).toBe("test' TABLE");
      expect(sanitizeSearchInput('test" OR 1=1--')).toBe('test OR 11');
      expect(sanitizeSearchInput('test<script>alert(1)</script>')).toBe('test1');
    });
  });

  describe('XSS prevention', () => {
    it('should remove HTML tags and script keywords', () => {
      expect(sanitizeSearchInput('<script>alert("xss")</script>')).toBe('xss');
      expect(sanitizeSearchInput('test<img src=x onerror=alert(1)>')).toBe('testimg srcx 1');
      expect(sanitizeSearchInput('onclick=alert(1)')).toBe('1');
    });

    it('should remove javascript protocol', () => {
      expect(sanitizeSearchInput('javascript:alert(1)')).toBe('1');
    });
  });

  describe('Control character prevention', () => {
    it('should remove null bytes and control characters', () => {
      expect(sanitizeSearchInput('test\x00null')).toBe('testnull');
      expect(sanitizeSearchInput('test\x1Fcontrol')).toBe('testcontrol');
      expect(sanitizeSearchInput('test\x7Fdel')).toBe('testdel');
    });
  });

  describe('Length limiting', () => {
    it('should truncate very long inputs', () => {
      const longInput = 'a'.repeat(150);
      const result = sanitizeSearchInput(longInput);
      expect(result.length).toBe(100);
      expect(result).toBe('a'.repeat(100));
    });

    it('should trim after truncation', () => {
      const longInput = 'a'.repeat(99) + ' test';
      const result = sanitizeSearchInput(longInput);
      expect(result.length).toBe(99);
      expect(result).toBe('a'.repeat(99));
    });
  });

  describe('Complex attack patterns', () => {
    it('should handle combined attack attempts', () => {
      expect(sanitizeSearchInput("'; UNION SELECT * FROM users--")).toBe("' FROM users");
      expect(sanitizeSearchInput('"><script>alert(1)</script>')).toBe('1');
      expect(sanitizeSearchInput("admin'--")).toBe("admin'");
      expect(sanitizeSearchInput('1; DROP TABLE agencies; --')).toBe('1 TABLE agencies');
    });

    it('should handle encoded attacks', () => {
      // URL encoded characters are not decoded by this function
      // They should be decoded before sanitization in the API layer
      expect(sanitizeSearchInput('test%27OR%271%27%3D%271')).toBe('test27OR271273D271');
    });
  });
});

describe('parseAgenciesQuery', () => {
  it('should parse valid query parameters', () => {
    const params = new URLSearchParams({
      search: 'test',
      limit: '10',
      offset: '20'
    });

    const result = parseAgenciesQuery(params);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.search).toBe('test');
      expect(result.data.limit).toBe(10);
      expect(result.data.offset).toBe(20);
    }
  });

  it('should handle array parameters', () => {
    const params = new URLSearchParams();
    params.append('trades[]', 'electricians');
    params.append('trades[]', 'plumbers');
    params.append('states[]', 'TX');
    params.append('states[]', 'CA');

    const result = parseAgenciesQuery(params);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.trades).toEqual(['electricians', 'plumbers']);
      expect(result.data.states).toEqual(['TX', 'CA']);
    }
  });

  it('should handle multiple values for same key without brackets', () => {
    const params = new URLSearchParams();
    params.append('trades', 'electricians');
    params.append('trades', 'plumbers');
    params.append('trades', 'carpenters');

    const result = parseAgenciesQuery(params);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.trades).toEqual(['electricians', 'plumbers', 'carpenters']);
    }
  });

  it('should handle mixed array notation', () => {
    const params = new URLSearchParams();
    // Some frameworks send first value without brackets, then subsequent with brackets
    params.append('trades', 'electricians');
    params.append('trades[]', 'plumbers');

    const result = parseAgenciesQuery(params);
    expect(result.success).toBe(true);
    if (result.success) {
      // Both should be treated as the same parameter
      expect(result.data.trades).toEqual(['electricians', 'plumbers']);
    }
  });

  it('should validate search length', () => {
    const params = new URLSearchParams({
      search: 'a'.repeat(101)
    });

    const result = parseAgenciesQuery(params);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('less than 100 characters');
    }
  });

  it('should validate state code format', () => {
    const params = new URLSearchParams();
    params.append('states[]', 'Texas'); // Should be 2 letters

    const result = parseAgenciesQuery(params);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('2 letters');
    }
  });

  it('should apply default pagination values', () => {
    const params = new URLSearchParams();

    const result = parseAgenciesQuery(params);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(20); // DEFAULT_LIMIT
      expect(result.data.offset).toBe(0); // DEFAULT_OFFSET
    }
  });
});