/**
 * @jest-environment node
 */

import {
  agencyCreationSchema,
  parseFoundedYear,
  normalizeOptionalString,
  prepareAgencyDataForDatabase,
  isValidAgencyName,
  isValidE164Phone,
  isValidWebsiteUrl,
  NAME_MIN_LENGTH,
  NAME_MAX_LENGTH,
  DESCRIPTION_MAX_LENGTH,
  HEADQUARTERS_MAX_LENGTH,
  MIN_FOUNDED_YEAR,
  MAX_FOUNDED_YEAR,
  EMPLOYEE_COUNT_VALUES,
  COMPANY_SIZE_VALUES,
  EMPLOYEE_COUNT_OPTIONS,
  COMPANY_SIZE_OPTIONS,
  FOUNDED_YEAR_OPTIONS,
} from '../agency-creation';

describe('agencyCreationSchema', () => {
  // ===========================================================================
  // NAME FIELD VALIDATION
  // ===========================================================================

  describe('name validation', () => {
    it('should accept valid name', () => {
      const result = agencyCreationSchema.parse({ name: 'Test Agency' });
      expect(result.name).toBe('Test Agency');
    });

    it('should trim whitespace from name', () => {
      const result = agencyCreationSchema.parse({ name: '  Test Agency  ' });
      expect(result.name).toBe('Test Agency');
    });

    it('should accept name at minimum length', () => {
      const name = 'A'.repeat(NAME_MIN_LENGTH);
      const result = agencyCreationSchema.parse({ name });
      expect(result.name).toBe(name);
    });

    it('should accept name at maximum length', () => {
      const name = 'A'.repeat(NAME_MAX_LENGTH);
      const result = agencyCreationSchema.parse({ name });
      expect(result.name).toBe(name);
    });

    it('should reject empty name', () => {
      expect(() => agencyCreationSchema.parse({ name: '' })).toThrow(
        `Company name must be at least ${NAME_MIN_LENGTH} characters`
      );
    });

    it('should reject name that is too short', () => {
      expect(() => agencyCreationSchema.parse({ name: 'A' })).toThrow(
        `Company name must be at least ${NAME_MIN_LENGTH} characters`
      );
    });

    it('should reject name that is too long', () => {
      const name = 'A'.repeat(NAME_MAX_LENGTH + 1);
      expect(() => agencyCreationSchema.parse({ name })).toThrow(
        `Company name must be less than ${NAME_MAX_LENGTH} characters`
      );
    });

    it('should reject missing name', () => {
      expect(() => agencyCreationSchema.parse({})).toThrow();
    });
  });

  // ===========================================================================
  // DESCRIPTION FIELD VALIDATION
  // ===========================================================================

  describe('description validation', () => {
    it('should accept valid description', () => {
      const result = agencyCreationSchema.parse({
        name: 'Test Agency',
        description: 'A great staffing agency',
      });
      expect(result.description).toBe('A great staffing agency');
    });

    it('should accept empty description', () => {
      const result = agencyCreationSchema.parse({
        name: 'Test Agency',
        description: '',
      });
      expect(result.description).toBe('');
    });

    it('should accept undefined description', () => {
      const result = agencyCreationSchema.parse({ name: 'Test Agency' });
      expect(result.description).toBeUndefined();
    });

    it('should accept description at maximum length', () => {
      const description = 'A'.repeat(DESCRIPTION_MAX_LENGTH);
      const result = agencyCreationSchema.parse({
        name: 'Test Agency',
        description,
      });
      expect(result.description).toBe(description);
    });

    it('should reject description that is too long', () => {
      const description = 'A'.repeat(DESCRIPTION_MAX_LENGTH + 1);
      expect(() =>
        agencyCreationSchema.parse({ name: 'Test Agency', description })
      ).toThrow(
        `Description must be less than ${DESCRIPTION_MAX_LENGTH} characters`
      );
    });

    it('should trim whitespace from description', () => {
      const result = agencyCreationSchema.parse({
        name: 'Test Agency',
        description: '  A description  ',
      });
      expect(result.description).toBe('A description');
    });
  });

  // ===========================================================================
  // WEBSITE FIELD VALIDATION
  // ===========================================================================

  describe('website validation', () => {
    it('should accept valid https URL', () => {
      const result = agencyCreationSchema.parse({
        name: 'Test Agency',
        website: 'https://example.com',
      });
      expect(result.website).toBe('https://example.com');
    });

    it('should accept valid http URL', () => {
      const result = agencyCreationSchema.parse({
        name: 'Test Agency',
        website: 'http://example.com',
      });
      expect(result.website).toBe('http://example.com');
    });

    it('should accept URL with path', () => {
      const result = agencyCreationSchema.parse({
        name: 'Test Agency',
        website: 'https://example.com/about/us',
      });
      expect(result.website).toBe('https://example.com/about/us');
    });

    it('should accept empty website', () => {
      const result = agencyCreationSchema.parse({
        name: 'Test Agency',
        website: '',
      });
      expect(result.website).toBe('');
    });

    it('should accept undefined website', () => {
      const result = agencyCreationSchema.parse({ name: 'Test Agency' });
      expect(result.website).toBeUndefined();
    });

    it('should reject invalid URL format', () => {
      expect(() =>
        agencyCreationSchema.parse({
          name: 'Test Agency',
          website: 'not-a-url',
        })
      ).toThrow('Must be a valid URL');
    });

    it('should reject URL without protocol', () => {
      expect(() =>
        agencyCreationSchema.parse({
          name: 'Test Agency',
          website: 'example.com',
        })
      ).toThrow();
    });

    it('should reject ftp URL', () => {
      expect(() =>
        agencyCreationSchema.parse({
          name: 'Test Agency',
          website: 'ftp://example.com',
        })
      ).toThrow();
    });

    it('should trim whitespace from website', () => {
      const result = agencyCreationSchema.parse({
        name: 'Test Agency',
        website: '  https://example.com  ',
      });
      expect(result.website).toBe('https://example.com');
    });
  });

  // ===========================================================================
  // PHONE FIELD VALIDATION
  // ===========================================================================

  describe('phone validation', () => {
    it('should accept valid E.164 phone with plus sign', () => {
      const result = agencyCreationSchema.parse({
        name: 'Test Agency',
        phone: '+12345678900',
      });
      expect(result.phone).toBe('+12345678900');
    });

    it('should accept valid phone without plus sign', () => {
      const result = agencyCreationSchema.parse({
        name: 'Test Agency',
        phone: '12345678900',
      });
      expect(result.phone).toBe('12345678900');
    });

    it('should accept empty phone', () => {
      const result = agencyCreationSchema.parse({
        name: 'Test Agency',
        phone: '',
      });
      expect(result.phone).toBe('');
    });

    it('should accept undefined phone', () => {
      const result = agencyCreationSchema.parse({ name: 'Test Agency' });
      expect(result.phone).toBeUndefined();
    });

    it('should reject phone with letters', () => {
      expect(() =>
        agencyCreationSchema.parse({
          name: 'Test Agency',
          phone: 'invalid-phone',
        })
      ).toThrow('Phone must be in E.164 format');
    });

    it('should reject phone with special characters', () => {
      expect(() =>
        agencyCreationSchema.parse({
          name: 'Test Agency',
          phone: '(123) 456-7890',
        })
      ).toThrow('Phone must be in E.164 format');
    });

    it('should reject phone starting with zero', () => {
      expect(() =>
        agencyCreationSchema.parse({
          name: 'Test Agency',
          phone: '012345678900',
        })
      ).toThrow('Phone must be in E.164 format');
    });

    it('should trim whitespace from phone', () => {
      const result = agencyCreationSchema.parse({
        name: 'Test Agency',
        phone: '  +12345678900  ',
      });
      expect(result.phone).toBe('+12345678900');
    });
  });

  // ===========================================================================
  // EMAIL FIELD VALIDATION
  // ===========================================================================

  describe('email validation', () => {
    it('should accept valid email', () => {
      const result = agencyCreationSchema.parse({
        name: 'Test Agency',
        email: 'contact@example.com',
      });
      expect(result.email).toBe('contact@example.com');
    });

    it('should accept email with subdomain', () => {
      const result = agencyCreationSchema.parse({
        name: 'Test Agency',
        email: 'user@mail.example.com',
      });
      expect(result.email).toBe('user@mail.example.com');
    });

    it('should accept empty email', () => {
      const result = agencyCreationSchema.parse({
        name: 'Test Agency',
        email: '',
      });
      expect(result.email).toBe('');
    });

    it('should accept undefined email', () => {
      const result = agencyCreationSchema.parse({ name: 'Test Agency' });
      expect(result.email).toBeUndefined();
    });

    it('should reject invalid email format', () => {
      expect(() =>
        agencyCreationSchema.parse({
          name: 'Test Agency',
          email: 'not-an-email',
        })
      ).toThrow('Must be a valid email address');
    });

    it('should reject email without domain', () => {
      expect(() =>
        agencyCreationSchema.parse({
          name: 'Test Agency',
          email: 'user@',
        })
      ).toThrow('Must be a valid email address');
    });

    it('should reject email without @', () => {
      expect(() =>
        agencyCreationSchema.parse({
          name: 'Test Agency',
          email: 'userexample.com',
        })
      ).toThrow('Must be a valid email address');
    });

    it('should trim whitespace from email', () => {
      const result = agencyCreationSchema.parse({
        name: 'Test Agency',
        email: '  contact@example.com  ',
      });
      expect(result.email).toBe('contact@example.com');
    });
  });

  // ===========================================================================
  // HEADQUARTERS FIELD VALIDATION
  // ===========================================================================

  describe('headquarters validation', () => {
    it('should accept valid headquarters', () => {
      const result = agencyCreationSchema.parse({
        name: 'Test Agency',
        headquarters: 'Houston, TX',
      });
      expect(result.headquarters).toBe('Houston, TX');
    });

    it('should accept empty headquarters', () => {
      const result = agencyCreationSchema.parse({
        name: 'Test Agency',
        headquarters: '',
      });
      expect(result.headquarters).toBe('');
    });

    it('should accept undefined headquarters', () => {
      const result = agencyCreationSchema.parse({ name: 'Test Agency' });
      expect(result.headquarters).toBeUndefined();
    });

    it('should accept headquarters at maximum length', () => {
      const headquarters = 'A'.repeat(HEADQUARTERS_MAX_LENGTH);
      const result = agencyCreationSchema.parse({
        name: 'Test Agency',
        headquarters,
      });
      expect(result.headquarters).toBe(headquarters);
    });

    it('should reject headquarters that is too long', () => {
      const headquarters = 'A'.repeat(HEADQUARTERS_MAX_LENGTH + 1);
      expect(() =>
        agencyCreationSchema.parse({ name: 'Test Agency', headquarters })
      ).toThrow(
        `Headquarters must be less than ${HEADQUARTERS_MAX_LENGTH} characters`
      );
    });

    it('should trim whitespace from headquarters', () => {
      const result = agencyCreationSchema.parse({
        name: 'Test Agency',
        headquarters: '  Houston, TX  ',
      });
      expect(result.headquarters).toBe('Houston, TX');
    });
  });

  // ===========================================================================
  // FOUNDED_YEAR FIELD VALIDATION
  // ===========================================================================

  describe('founded_year validation', () => {
    it('should accept valid year', () => {
      const result = agencyCreationSchema.parse({
        name: 'Test Agency',
        founded_year: '2010',
      });
      expect(result.founded_year).toBe('2010');
    });

    it('should accept minimum year', () => {
      const result = agencyCreationSchema.parse({
        name: 'Test Agency',
        founded_year: String(MIN_FOUNDED_YEAR),
      });
      expect(result.founded_year).toBe(String(MIN_FOUNDED_YEAR));
    });

    it('should accept current year', () => {
      const result = agencyCreationSchema.parse({
        name: 'Test Agency',
        founded_year: String(MAX_FOUNDED_YEAR),
      });
      expect(result.founded_year).toBe(String(MAX_FOUNDED_YEAR));
    });

    it('should accept empty founded_year', () => {
      const result = agencyCreationSchema.parse({
        name: 'Test Agency',
        founded_year: '',
      });
      expect(result.founded_year).toBe('');
    });

    it('should accept undefined founded_year', () => {
      const result = agencyCreationSchema.parse({ name: 'Test Agency' });
      expect(result.founded_year).toBeUndefined();
    });

    it('should reject year before minimum', () => {
      expect(() =>
        agencyCreationSchema.parse({
          name: 'Test Agency',
          founded_year: '1799',
        })
      ).toThrow(
        `Year must be between ${MIN_FOUNDED_YEAR} and ${MAX_FOUNDED_YEAR}`
      );
    });

    it('should reject year after current year', () => {
      const futureYear = String(MAX_FOUNDED_YEAR + 1);
      expect(() =>
        agencyCreationSchema.parse({
          name: 'Test Agency',
          founded_year: futureYear,
        })
      ).toThrow(
        `Year must be between ${MIN_FOUNDED_YEAR} and ${MAX_FOUNDED_YEAR}`
      );
    });

    it('should reject non-numeric year', () => {
      expect(() =>
        agencyCreationSchema.parse({
          name: 'Test Agency',
          founded_year: 'abcd',
        })
      ).toThrow('Must be a valid 4-digit year');
    });

    it('should reject 2-digit year', () => {
      expect(() =>
        agencyCreationSchema.parse({
          name: 'Test Agency',
          founded_year: '99',
        })
      ).toThrow('Must be a valid 4-digit year');
    });

    it('should reject 5-digit year', () => {
      expect(() =>
        agencyCreationSchema.parse({
          name: 'Test Agency',
          founded_year: '20100',
        })
      ).toThrow('Must be a valid 4-digit year');
    });
  });

  // ===========================================================================
  // EMPLOYEE_COUNT FIELD VALIDATION
  // ===========================================================================

  describe('employee_count validation', () => {
    it.each(EMPLOYEE_COUNT_VALUES)(
      'should accept valid employee count: %s',
      (value) => {
        const result = agencyCreationSchema.parse({
          name: 'Test Agency',
          employee_count: value,
        });
        expect(result.employee_count).toBe(value);
      }
    );

    it('should accept empty employee_count', () => {
      const result = agencyCreationSchema.parse({
        name: 'Test Agency',
        employee_count: '',
      });
      expect(result.employee_count).toBe('');
    });

    it('should accept undefined employee_count', () => {
      const result = agencyCreationSchema.parse({ name: 'Test Agency' });
      expect(result.employee_count).toBeUndefined();
    });

    it('should reject invalid employee_count', () => {
      expect(() =>
        agencyCreationSchema.parse({
          name: 'Test Agency',
          employee_count: 'invalid',
        })
      ).toThrow('Employee count must be one of');
    });
  });

  // ===========================================================================
  // COMPANY_SIZE FIELD VALIDATION
  // ===========================================================================

  describe('company_size validation', () => {
    it.each(COMPANY_SIZE_VALUES)(
      'should accept valid company size: %s',
      (value) => {
        const result = agencyCreationSchema.parse({
          name: 'Test Agency',
          company_size: value,
        });
        expect(result.company_size).toBe(value);
      }
    );

    it('should accept empty company_size', () => {
      const result = agencyCreationSchema.parse({
        name: 'Test Agency',
        company_size: '',
      });
      expect(result.company_size).toBe('');
    });

    it('should accept undefined company_size', () => {
      const result = agencyCreationSchema.parse({ name: 'Test Agency' });
      expect(result.company_size).toBeUndefined();
    });

    it('should reject invalid company_size', () => {
      expect(() =>
        agencyCreationSchema.parse({
          name: 'Test Agency',
          company_size: 'Huge',
        })
      ).toThrow('Company size must be one of');
    });
  });

  // ===========================================================================
  // BOOLEAN FIELD VALIDATION
  // ===========================================================================

  describe('offers_per_diem validation', () => {
    it('should accept true', () => {
      const result = agencyCreationSchema.parse({
        name: 'Test Agency',
        offers_per_diem: true,
      });
      expect(result.offers_per_diem).toBe(true);
    });

    it('should accept false', () => {
      const result = agencyCreationSchema.parse({
        name: 'Test Agency',
        offers_per_diem: false,
      });
      expect(result.offers_per_diem).toBe(false);
    });

    it('should default to false when undefined', () => {
      const result = agencyCreationSchema.parse({ name: 'Test Agency' });
      expect(result.offers_per_diem).toBe(false);
    });
  });

  describe('is_union validation', () => {
    it('should accept true', () => {
      const result = agencyCreationSchema.parse({
        name: 'Test Agency',
        is_union: true,
      });
      expect(result.is_union).toBe(true);
    });

    it('should accept false', () => {
      const result = agencyCreationSchema.parse({
        name: 'Test Agency',
        is_union: false,
      });
      expect(result.is_union).toBe(false);
    });

    it('should default to false when undefined', () => {
      const result = agencyCreationSchema.parse({ name: 'Test Agency' });
      expect(result.is_union).toBe(false);
    });
  });

  // ===========================================================================
  // COMPLETE FORM DATA
  // ===========================================================================

  describe('complete form data', () => {
    it('should accept all fields with valid data', () => {
      const result = agencyCreationSchema.parse({
        name: 'Complete Agency',
        description: 'A full description',
        website: 'https://complete.com',
        phone: '+12345678900',
        email: 'contact@complete.com',
        headquarters: 'New York, NY',
        founded_year: '2015',
        employee_count: '51-100',
        company_size: 'Medium',
        offers_per_diem: true,
        is_union: true,
      });

      expect(result).toMatchObject({
        name: 'Complete Agency',
        description: 'A full description',
        website: 'https://complete.com',
        phone: '+12345678900',
        email: 'contact@complete.com',
        headquarters: 'New York, NY',
        founded_year: '2015',
        employee_count: '51-100',
        company_size: 'Medium',
        offers_per_diem: true,
        is_union: true,
      });
    });

    it('should accept minimal data (only required fields)', () => {
      const result = agencyCreationSchema.parse({ name: 'Minimal Agency' });

      expect(result.name).toBe('Minimal Agency');
      expect(result.offers_per_diem).toBe(false);
      expect(result.is_union).toBe(false);
    });
  });
});

// =============================================================================
// HELPER FUNCTION TESTS
// =============================================================================

describe('parseFoundedYear', () => {
  it('should parse valid year string', () => {
    expect(parseFoundedYear('2010')).toBe(2010);
  });

  it('should return null for empty string', () => {
    expect(parseFoundedYear('')).toBeNull();
  });

  it('should return null for undefined', () => {
    expect(parseFoundedYear(undefined)).toBeNull();
  });

  it('should return null for invalid string', () => {
    expect(parseFoundedYear('invalid')).toBeNull();
  });
});

describe('normalizeOptionalString', () => {
  it('should return trimmed string', () => {
    expect(normalizeOptionalString('  test  ')).toBe('test');
  });

  it('should return null for empty string', () => {
    expect(normalizeOptionalString('')).toBeNull();
  });

  it('should return null for whitespace-only string', () => {
    expect(normalizeOptionalString('   ')).toBeNull();
  });

  it('should return null for undefined', () => {
    expect(normalizeOptionalString(undefined)).toBeNull();
  });
});

describe('prepareAgencyDataForDatabase', () => {
  it('should prepare complete data correctly', () => {
    const formData = {
      name: 'Test Agency',
      description: 'A description',
      website: 'https://test.com',
      phone: '+12345678900',
      email: 'test@test.com',
      headquarters: 'Houston, TX',
      founded_year: '2010',
      employee_count: '51-100' as const,
      company_size: 'Medium' as const,
      offers_per_diem: true,
      is_union: false,
    };

    const result = prepareAgencyDataForDatabase(formData);

    expect(result).toEqual({
      name: 'Test Agency',
      description: 'A description',
      website: 'https://test.com',
      phone: '+12345678900',
      email: 'test@test.com',
      headquarters: 'Houston, TX',
      founded_year: 2010,
      employee_count: '51-100',
      company_size: 'Medium',
      offers_per_diem: true,
      is_union: false,
    });
  });

  it('should convert empty strings to null', () => {
    const formData = {
      name: 'Test Agency',
      description: '',
      website: '',
      phone: '',
      email: '',
      headquarters: '',
      founded_year: '',
      employee_count: '' as const,
      company_size: '' as const,
      offers_per_diem: false,
      is_union: false,
    };

    const result = prepareAgencyDataForDatabase(formData);

    expect(result).toEqual({
      name: 'Test Agency',
      description: null,
      website: null,
      phone: null,
      email: null,
      headquarters: null,
      founded_year: null,
      employee_count: null,
      company_size: null,
      offers_per_diem: false,
      is_union: false,
    });
  });
});

describe('isValidAgencyName', () => {
  it('should return true for valid name', () => {
    expect(isValidAgencyName('Test Agency')).toBe(true);
  });

  it('should return true for name at minimum length', () => {
    expect(isValidAgencyName('AB')).toBe(true);
  });

  it('should return false for empty name', () => {
    expect(isValidAgencyName('')).toBe(false);
  });

  it('should return false for name that is too short', () => {
    expect(isValidAgencyName('A')).toBe(false);
  });

  it('should return false for name that is too long', () => {
    expect(isValidAgencyName('A'.repeat(201))).toBe(false);
  });

  it('should handle whitespace correctly', () => {
    expect(isValidAgencyName('  AB  ')).toBe(true);
    expect(isValidAgencyName('  A  ')).toBe(false);
  });
});

describe('isValidE164Phone', () => {
  it('should return true for valid E.164 phone', () => {
    expect(isValidE164Phone('+12345678900')).toBe(true);
  });

  it('should return true for phone without plus', () => {
    expect(isValidE164Phone('12345678900')).toBe(true);
  });

  it('should return true for empty string', () => {
    expect(isValidE164Phone('')).toBe(true);
  });

  it('should return false for invalid phone', () => {
    expect(isValidE164Phone('(123) 456-7890')).toBe(false);
  });

  it('should return false for phone with letters', () => {
    expect(isValidE164Phone('123-ABC-7890')).toBe(false);
  });
});

describe('isValidWebsiteUrl', () => {
  it('should return true for valid https URL', () => {
    expect(isValidWebsiteUrl('https://example.com')).toBe(true);
  });

  it('should return true for valid http URL', () => {
    expect(isValidWebsiteUrl('http://example.com')).toBe(true);
  });

  it('should return true for empty string', () => {
    expect(isValidWebsiteUrl('')).toBe(true);
  });

  it('should return false for ftp URL', () => {
    expect(isValidWebsiteUrl('ftp://example.com')).toBe(false);
  });

  it('should return false for invalid URL', () => {
    expect(isValidWebsiteUrl('not-a-url')).toBe(false);
  });
});

// =============================================================================
// CONSTANTS TESTS
// =============================================================================

describe('constants', () => {
  it('should have correct number of employee count options', () => {
    expect(EMPLOYEE_COUNT_OPTIONS).toHaveLength(7);
    expect(EMPLOYEE_COUNT_VALUES).toHaveLength(7);
  });

  it('should have correct number of company size options', () => {
    expect(COMPANY_SIZE_OPTIONS).toHaveLength(4);
    expect(COMPANY_SIZE_VALUES).toHaveLength(4);
  });

  it('should have founded year options from current year to 1800', () => {
    expect(FOUNDED_YEAR_OPTIONS.length).toBe(
      MAX_FOUNDED_YEAR - MIN_FOUNDED_YEAR + 1
    );
    expect(FOUNDED_YEAR_OPTIONS[0].value).toBe(String(MAX_FOUNDED_YEAR));
    expect(FOUNDED_YEAR_OPTIONS[FOUNDED_YEAR_OPTIONS.length - 1].value).toBe(
      String(MIN_FOUNDED_YEAR)
    );
  });

  it('should have valid length constants', () => {
    expect(NAME_MIN_LENGTH).toBe(2);
    expect(NAME_MAX_LENGTH).toBe(200);
    expect(DESCRIPTION_MAX_LENGTH).toBe(5000);
    expect(HEADQUARTERS_MAX_LENGTH).toBe(200);
    expect(MIN_FOUNDED_YEAR).toBe(1800);
  });
});
