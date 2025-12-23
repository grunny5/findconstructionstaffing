import { isNationwide, US_STATE_CODES, generateStateFilterUrl } from './utils';

describe('isNationwide', () => {
  // Helper to create mock regions from state codes
  const createRegions = (codes: string[]) =>
    codes.map((code, i) => ({
      id: `${i + 1}`,
      name: `State ${i}`,
      code,
    }));

  // Get all 50 valid US state codes as an array
  const all50States = Array.from(US_STATE_CODES);

  it('should return true for 50 unique valid states', () => {
    const regions = createRegions(all50States);
    expect(isNationwide(regions)).toBe(true);
  });

  it('should return true for 50 valid states regardless of case', () => {
    // Mix of lowercase, uppercase, and mixed case
    const mixedCaseStates = all50States.map((code, i) => {
      if (i % 3 === 0) return code.toLowerCase();
      if (i % 3 === 1) return code.toUpperCase();
      return code.charAt(0).toUpperCase() + code.charAt(1).toLowerCase();
    });
    const regions = createRegions(mixedCaseStates);
    expect(isNationwide(regions)).toBe(true);
  });

  it('should return false for 50 duplicate states (same state repeated)', () => {
    const duplicateStates = Array(50).fill('TX');
    const regions = createRegions(duplicateStates);
    expect(isNationwide(regions)).toBe(false);
  });

  it('should return false for 49 unique valid states', () => {
    const regions = createRegions(all50States.slice(0, 49));
    expect(isNationwide(regions)).toBe(false);
  });

  it('should return true for 51 states (one duplicate) since it has 50 unique valid states', () => {
    const states = [...all50States, 'CA']; // Duplicate California - still 50 unique
    const regions = createRegions(states);
    expect(isNationwide(regions)).toBe(true);
  });

  it('should return false if any state code is invalid', () => {
    const invalidStates = [...all50States.slice(0, 49), 'XX']; // Invalid code
    const regions = createRegions(invalidStates);
    expect(isNationwide(regions)).toBe(false);
  });

  it('should return false for null input', () => {
    expect(isNationwide(null as any)).toBe(false);
  });

  it('should return false for undefined input', () => {
    expect(isNationwide(undefined as any)).toBe(false);
  });

  it('should return false for empty array', () => {
    expect(isNationwide([])).toBe(false);
  });

  it('should return false for array with less than 50 elements', () => {
    const regions = createRegions(['CA', 'TX', 'NY']);
    expect(isNationwide(regions)).toBe(false);
  });

  it('should return false for 50 states with some duplicates', () => {
    // 48 unique states + 2 duplicates
    const states = [
      ...all50States.slice(0, 48),
      all50States[0], // Duplicate
      all50States[1], // Duplicate
    ];
    const regions = createRegions(states);
    expect(isNationwide(regions)).toBe(false);
  });
});

describe('generateStateFilterUrl', () => {
  it('should generate correct filter URL for state code', () => {
    expect(generateStateFilterUrl('TX')).toBe('/?states[]=TX');
  });

  it('should URL encode state codes with special characters', () => {
    expect(generateStateFilterUrl('A&B')).toBe('/?states[]=A%26B');
  });
});
