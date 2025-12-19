/**
 * @jest-environment node
 */

import {
  extractEmailDomain,
  extractWebsiteDomain,
  verifyEmailDomain,
  isFreeEmailDomain,
  FREE_EMAIL_DOMAINS,
} from '../email-domain-verification';

describe('extractEmailDomain', () => {
  it('should extract domain from valid email', () => {
    expect(extractEmailDomain('user@example.com')).toBe('example.com');
    expect(extractEmailDomain('john.doe@acmestaffing.com')).toBe(
      'acmestaffing.com'
    );
    expect(extractEmailDomain('admin@SUB.DOMAIN.COM')).toBe('sub.domain.com');
  });

  it('should handle emails with special characters', () => {
    expect(extractEmailDomain('user+tag@example.com')).toBe('example.com');
    expect(extractEmailDomain('user.name@example.co.uk')).toBe(
      'example.co.uk'
    );
  });

  it('should throw error for invalid email format', () => {
    expect(() => extractEmailDomain('notanemail')).toThrow('Invalid email format');
    expect(() => extractEmailDomain('user@')).toThrow('Invalid email format');
    expect(() => extractEmailDomain('@example.com')).toThrow(
      'Invalid email format'
    );
    expect(() => extractEmailDomain('user @example.com')).toThrow(
      'Invalid email format'
    );
    expect(() => extractEmailDomain('')).toThrow('Invalid email format');
  });

  it('should convert domain to lowercase', () => {
    expect(extractEmailDomain('USER@EXAMPLE.COM')).toBe('example.com');
    expect(extractEmailDomain('User@Example.Com')).toBe('example.com');
  });
});

describe('extractWebsiteDomain', () => {
  it('should extract domain from URL with protocol', () => {
    expect(extractWebsiteDomain('https://www.example.com')).toBe(
      'example.com'
    );
    expect(extractWebsiteDomain('http://example.com')).toBe('example.com');
    expect(extractWebsiteDomain('https://acmestaffing.com')).toBe(
      'acmestaffing.com'
    );
  });

  it('should extract domain from URL without protocol', () => {
    expect(extractWebsiteDomain('www.example.com')).toBe('example.com');
    expect(extractWebsiteDomain('example.com')).toBe('example.com');
  });

  it('should handle URLs with paths and query strings', () => {
    expect(extractWebsiteDomain('https://www.example.com/about')).toBe(
      'example.com'
    );
    expect(extractWebsiteDomain('https://example.com/path/to/page')).toBe(
      'example.com'
    );
    expect(extractWebsiteDomain('https://example.com?query=value')).toBe(
      'example.com'
    );
    expect(extractWebsiteDomain('https://example.com#fragment')).toBe(
      'example.com'
    );
  });

  it('should handle subdomains', () => {
    expect(extractWebsiteDomain('https://subdomain.example.com')).toBe(
      'subdomain.example.com'
    );
    expect(extractWebsiteDomain('https://www.subdomain.example.com')).toBe(
      'subdomain.example.com'
    );
  });

  it('should convert domain to lowercase', () => {
    expect(extractWebsiteDomain('HTTPS://WWW.EXAMPLE.COM')).toBe(
      'example.com'
    );
    expect(extractWebsiteDomain('Example.Com')).toBe('example.com');
  });

  it('should handle URLs with ports', () => {
    expect(extractWebsiteDomain('https://example.com:8080')).toBe(
      'example.com:8080'
    );
  });

  it('should throw error for empty URL', () => {
    expect(() => extractWebsiteDomain('')).toThrow('Invalid URL format');
  });

  it('should handle whitespace in URLs', () => {
    expect(extractWebsiteDomain('  https://example.com  ')).toBe(
      'example.com'
    );
  });
});

describe('verifyEmailDomain', () => {
  it('should return true when email domain matches website domain', () => {
    expect(
      verifyEmailDomain('john@acmestaffing.com', 'https://www.acmestaffing.com')
    ).toBe(true);
    expect(
      verifyEmailDomain('admin@example.com', 'http://example.com')
    ).toBe(true);
    expect(verifyEmailDomain('user@test.com', 'www.test.com')).toBe(true);
  });

  it('should return false when email domain does not match website domain', () => {
    expect(
      verifyEmailDomain('john@gmail.com', 'https://acmestaffing.com')
    ).toBe(false);
    expect(
      verifyEmailDomain('user@example.com', 'https://different.com')
    ).toBe(false);
  });

  it('should return false when website is null', () => {
    expect(verifyEmailDomain('john@example.com', null)).toBe(false);
  });

  it('should be case-insensitive', () => {
    expect(
      verifyEmailDomain('JOHN@EXAMPLE.COM', 'https://WWW.EXAMPLE.COM')
    ).toBe(true);
    expect(
      verifyEmailDomain('User@Example.Com', 'HTTP://EXAMPLE.COM')
    ).toBe(true);
  });

  it('should handle www prefix correctly', () => {
    expect(
      verifyEmailDomain('john@example.com', 'https://www.example.com')
    ).toBe(true);
    expect(
      verifyEmailDomain('john@example.com', 'https://example.com')
    ).toBe(true);
  });

  it('should handle websites with paths', () => {
    expect(
      verifyEmailDomain('john@example.com', 'https://example.com/about')
    ).toBe(true);
    expect(
      verifyEmailDomain('john@example.com', 'https://example.com/contact-us')
    ).toBe(true);
  });

  it('should return false for invalid email format', () => {
    expect(verifyEmailDomain('notanemail', 'https://example.com')).toBe(
      false
    );
  });

  it('should return false for invalid website format', () => {
    expect(verifyEmailDomain('john@example.com', 'not a website')).toBe(
      false
    );
  });

  it('should handle subdomains correctly', () => {
    // Subdomain in email should not match root domain
    expect(
      verifyEmailDomain('john@subdomain.example.com', 'https://example.com')
    ).toBe(false);

    // Exact subdomain match should work
    expect(
      verifyEmailDomain(
        'john@subdomain.example.com',
        'https://subdomain.example.com'
      )
    ).toBe(true);
  });
});

describe('isFreeEmailDomain', () => {
  it('should return true for common free email providers', () => {
    expect(isFreeEmailDomain('user@gmail.com')).toBe(true);
    expect(isFreeEmailDomain('user@yahoo.com')).toBe(true);
    expect(isFreeEmailDomain('user@hotmail.com')).toBe(true);
    expect(isFreeEmailDomain('user@outlook.com')).toBe(true);
    expect(isFreeEmailDomain('user@aol.com')).toBe(true);
    expect(isFreeEmailDomain('user@icloud.com')).toBe(true);
    expect(isFreeEmailDomain('user@protonmail.com')).toBe(true);
  });

  it('should return false for business email domains', () => {
    expect(isFreeEmailDomain('john@acmestaffing.com')).toBe(false);
    expect(isFreeEmailDomain('admin@example.com')).toBe(false);
    expect(isFreeEmailDomain('user@mybusiness.co.uk')).toBe(false);
  });

  it('should be case-insensitive', () => {
    expect(isFreeEmailDomain('user@GMAIL.COM')).toBe(true);
    expect(isFreeEmailDomain('User@Gmail.Com')).toBe(true);
  });

  it('should return false for invalid email format', () => {
    expect(isFreeEmailDomain('notanemail')).toBe(false);
    expect(isFreeEmailDomain('')).toBe(false);
  });

  it('should check against the FREE_EMAIL_DOMAINS constant', () => {
    // Verify that all domains in the constant are detected
    FREE_EMAIL_DOMAINS.forEach((domain) => {
      expect(isFreeEmailDomain(`user@${domain}`)).toBe(true);
    });
  });
});

describe('FREE_EMAIL_DOMAINS', () => {
  it('should contain common free email providers', () => {
    expect(FREE_EMAIL_DOMAINS).toContain('gmail.com');
    expect(FREE_EMAIL_DOMAINS).toContain('yahoo.com');
    expect(FREE_EMAIL_DOMAINS).toContain('hotmail.com');
    expect(FREE_EMAIL_DOMAINS).toContain('outlook.com');
  });

  it('should be an array', () => {
    expect(Array.isArray(FREE_EMAIL_DOMAINS)).toBe(true);
  });

  it('should have at least common providers', () => {
    expect(FREE_EMAIL_DOMAINS.length).toBeGreaterThan(5);
  });
});

describe('Edge cases and error handling', () => {
  it('should handle emails with multiple @ symbols gracefully', () => {
    expect(() => extractEmailDomain('user@@example.com')).toThrow();
    expect(() => extractEmailDomain('user@domain@example.com')).toThrow();
  });

  it('should handle extremely long domains', () => {
    const longDomain = 'a'.repeat(100) + '.com';
    expect(extractEmailDomain(`user@${longDomain}`)).toBe(
      longDomain.toLowerCase()
    );
  });

  it('should handle URLs with unusual but valid characters', () => {
    expect(extractWebsiteDomain('https://ex-ample.com')).toBe('ex-ample.com');
    expect(extractWebsiteDomain('https://example123.com')).toBe(
      'example123.com'
    );
  });
});
