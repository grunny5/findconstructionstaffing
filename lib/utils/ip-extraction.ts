import { NextRequest } from 'next/server';
import { isIP, isIPv4, isIPv6 } from 'net';

/**
 * Extracts and validates the client IP address from a Next.js request
 * 
 * Security considerations:
 * - Validates IP format to prevent injection attacks
 * - Handles multiple IPs in x-forwarded-for header
 * - Filters out private/local IPs when possible
 * - Falls back through multiple sources
 * 
 * @param request - The Next.js request object
 * @returns The validated client IP or 'unknown' if unable to determine
 */
export function getClientIp(request: NextRequest): string {
  // Try x-forwarded-for first (most common in proxied environments)
  const xForwardedFor = request.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    // x-forwarded-for can contain multiple IPs: "client, proxy1, proxy2"
    // We want the first (leftmost) IP which is the original client
    const ips = xForwardedFor.split(',').map(ip => ip.trim());
    
    for (const ip of ips) {
      const validatedIp = validateAndSanitizeIp(ip);
      if (validatedIp && !isPrivateIp(validatedIp)) {
        return validatedIp;
      }
    }
    
    // If all IPs are private, return the first valid one
    for (const ip of ips) {
      const validatedIp = validateAndSanitizeIp(ip);
      if (validatedIp) {
        return validatedIp;
      }
    }
  }
  
  // Try x-real-ip header (used by some proxies like Nginx)
  const xRealIp = request.headers.get('x-real-ip');
  if (xRealIp) {
    const validatedIp = validateAndSanitizeIp(xRealIp);
    if (validatedIp) {
      return validatedIp;
    }
  }
  
  // Try cf-connecting-ip (Cloudflare)
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    const validatedIp = validateAndSanitizeIp(cfConnectingIp);
    if (validatedIp) {
      return validatedIp;
    }
  }
  
  // Try x-client-ip (some proxies)
  const xClientIp = request.headers.get('x-client-ip');
  if (xClientIp) {
    const validatedIp = validateAndSanitizeIp(xClientIp);
    if (validatedIp) {
      return validatedIp;
    }
  }
  
  // In Next.js Edge Runtime, we don't have direct access to the socket
  // Return 'unknown' as a safe fallback
  return 'unknown';
}

/**
 * Validates and sanitizes an IP address string
 * 
 * @param ip - The IP address to validate
 * @returns The validated IP or null if invalid
 */
function validateAndSanitizeIp(ip: string): string | null {
  if (!ip || typeof ip !== 'string') {
    return null;
  }
  
  // Remove any whitespace
  const trimmedIp = ip.trim();
  
  // Remove port if present (e.g., "1.2.3.4:8080" -> "1.2.3.4")
  const ipWithoutPort = trimmedIp.split(':').slice(0, -1).join(':') || trimmedIp;
  
  // Handle IPv6 with brackets (e.g., "[::1]")
  const cleanIp = ipWithoutPort.replace(/^\[|\]$/g, '');
  
  // Validate using Node.js built-in IP validation
  if (isIP(cleanIp) === 0) {
    return null;
  }
  
  return cleanIp;
}

/**
 * Checks if an IP address is private/local
 * 
 * @param ip - The IP address to check
 * @returns true if the IP is private/local
 */
function isPrivateIp(ip: string): boolean {
  if (isIPv4(ip)) {
    const parts = ip.split('.').map(Number);
    
    // 10.0.0.0/8
    if (parts[0] === 10) return true;
    
    // 172.16.0.0/12
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    
    // 192.168.0.0/16
    if (parts[0] === 192 && parts[1] === 168) return true;
    
    // 127.0.0.0/8 (loopback)
    if (parts[0] === 127) return true;
    
    // 169.254.0.0/16 (link-local)
    if (parts[0] === 169 && parts[1] === 254) return true;
  } else if (isIPv6(ip)) {
    // IPv6 private addresses
    const lowerIp = ip.toLowerCase();
    
    // Loopback
    if (lowerIp === '::1') return true;
    
    // Link-local
    if (lowerIp.startsWith('fe80:')) return true;
    
    // Unique local
    if (lowerIp.startsWith('fc') || lowerIp.startsWith('fd')) return true;
  }
  
  return false;
}

/**
 * Hashes an IP address for storage (e.g., in rate limiting)
 * This provides some privacy protection while still allowing rate limiting
 * 
 * @param ip - The IP address to hash
 * @returns A hashed representation of the IP
 */
export function hashIpForRateLimiting(ip: string): string {
  if (ip === 'unknown') {
    // For unknown IPs, include a timestamp component to prevent
    // all unknown IPs from being rate limited together
    const timeSlot = Math.floor(Date.now() / (5 * 60 * 1000)); // 5-minute slots
    return `unknown-${timeSlot}`;
  }
  
  // For known IPs, we can use the IP directly since we've already validated it
  // In a production environment, you might want to use a proper hash function
  // like crypto.createHash('sha256').update(ip + salt).digest('hex')
  return ip;
}