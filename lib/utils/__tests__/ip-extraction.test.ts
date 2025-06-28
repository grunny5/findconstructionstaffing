import { hashIpForRateLimiting, getClientIp } from '../ip-extraction';
import { NextRequest } from 'next/server';
import { createHash } from 'crypto';

// Mock the IP_HASH_SALT for consistent testing
const TEST_SALT = 'fcs-ip-hash-default-salt-2024';

describe('IP Extraction Utilities', () => {
  describe('hashIpForRateLimiting', () => {
    it('should hash known IP addresses using SHA-256', () => {
      const testIp = '192.168.1.1';
      const hashedIp = hashIpForRateLimiting(testIp);
      
      // Verify it returns a hash, not the raw IP
      expect(hashedIp).not.toBe(testIp);
      expect(hashedIp).toHaveLength(16); // Should be truncated to 16 chars
      
      // Verify the hash is consistent
      const expectedHash = createHash('sha256')
        .update(testIp + TEST_SALT)
        .digest('hex')
        .substring(0, 16);
      expect(hashedIp).toBe(expectedHash);
    });

    it('should produce consistent hashes for the same IP', () => {
      const testIp = '10.0.0.1';
      const hash1 = hashIpForRateLimiting(testIp);
      const hash2 = hashIpForRateLimiting(testIp);
      
      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different IPs', () => {
      const ip1 = '192.168.1.1';
      const ip2 = '192.168.1.2';
      const hash1 = hashIpForRateLimiting(ip1);
      const hash2 = hashIpForRateLimiting(ip2);
      
      expect(hash1).not.toBe(hash2);
    });

    it('should hash unknown IPs with timestamp component', () => {
      // Mock Date.now() for consistent testing
      const mockTime = 1640995200000; // 2022-01-01 00:00:00
      jest.spyOn(Date, 'now').mockReturnValue(mockTime);
      
      const hashedUnknown = hashIpForRateLimiting('unknown');
      
      // Should be a hash, not the literal "unknown-timestamp"
      expect(hashedUnknown).not.toContain('unknown');
      expect(hashedUnknown).toHaveLength(16);
      
      // Verify it uses the time slot in the hash
      const timeSlot = Math.floor(mockTime / (5 * 60 * 1000));
      const expectedHash = createHash('sha256')
        .update(`unknown-${timeSlot}${TEST_SALT}`)
        .digest('hex')
        .substring(0, 16);
      expect(hashedUnknown).toBe(expectedHash);
      
      jest.restoreAllMocks();
    });

    it('should never return raw IP addresses', () => {
      const testIps = [
        '192.168.1.1',
        '10.0.0.1',
        '172.16.0.1',
        '8.8.8.8',
        '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
        '::1',
        'fe80::1'
      ];
      
      testIps.forEach(ip => {
        const hash = hashIpForRateLimiting(ip);
        expect(hash).not.toBe(ip);
        expect(hash).not.toContain(ip);
        expect(hash).toMatch(/^[a-f0-9]{16}$/); // Should be hex string
      });
    });
  });

  describe('getClientIp', () => {
    function createMockRequest(headers: Record<string, string>): NextRequest {
      return {
        headers: {
          get: (name: string) => headers[name.toLowerCase()] || null
        }
      } as NextRequest;
    }

    it('should extract IP from x-forwarded-for header', () => {
      const request = createMockRequest({
        'x-forwarded-for': '203.0.113.1, 10.0.0.1'
      });
      
      const ip = getClientIp(request);
      expect(ip).toBe('203.0.113.1');
    });

    it('should skip private IPs in x-forwarded-for', () => {
      const request = createMockRequest({
        'x-forwarded-for': '10.0.0.1, 192.168.1.1, 203.0.113.1'
      });
      
      const ip = getClientIp(request);
      expect(ip).toBe('203.0.113.1');
    });

    it('should return unknown for invalid IPs', () => {
      const request = createMockRequest({
        'x-forwarded-for': 'not-an-ip'
      });
      
      const ip = getClientIp(request);
      expect(ip).toBe('unknown');
    });

    it('should handle IPv6 addresses with ports', () => {
      const request = createMockRequest({
        'x-forwarded-for': '[2001:db8::1]:8080'
      });
      
      const ip = getClientIp(request);
      expect(ip).toBe('2001:db8::1');
    });

    it('should handle IPv4 addresses with ports', () => {
      const request = createMockRequest({
        'x-forwarded-for': '203.0.113.1:8080'
      });
      
      const ip = getClientIp(request);
      expect(ip).toBe('203.0.113.1');
    });

    it('should handle IPv6 addresses without brackets', () => {
      const request = createMockRequest({
        'x-forwarded-for': '2001:db8::1'
      });
      
      const ip = getClientIp(request);
      expect(ip).toBe('2001:db8::1');
    });

    it('should not confuse IPv6 colons with port separators', () => {
      const request = createMockRequest({
        'x-forwarded-for': '2001:db8:85a3:0000:0000:8a2e:0370:7334'
      });
      
      const ip = getClientIp(request);
      expect(ip).toBe('2001:db8:85a3:0000:0000:8a2e:0370:7334');
    });

    it('should handle IPv6 addresses in brackets without port', () => {
      const request = createMockRequest({
        'x-forwarded-for': '[fe80::1]'
      });
      
      const ip = getClientIp(request);
      expect(ip).toBe('fe80::1');
    });

    it('should handle trailing colon in IPv4', () => {
      const request = createMockRequest({
        'x-forwarded-for': '8.8.8.8:'
      });
      
      const ip = getClientIp(request);
      expect(ip).toBe('8.8.8.8');
    });

    it('should handle trailing colon in bracketed IPv6', () => {
      const request = createMockRequest({
        'x-forwarded-for': '[2001:db8::1]:'
      });
      
      const ip = getClientIp(request);
      expect(ip).toBe('2001:db8::1');
    });

    it('should handle non-numeric port in IPv4', () => {
      const request = createMockRequest({
        'x-forwarded-for': '1.1.1.1:abc'
      });
      
      const ip = getClientIp(request);
      // Non-numeric port means it's not a valid port, so keep the whole thing
      // But this might fail validation, returning 'unknown'
      expect(ip).toBe('unknown');
    });
  });

});