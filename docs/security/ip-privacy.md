# IP Address Privacy Protection

## Overview

This document describes how FindConstructionStaffing protects user privacy by securely hashing IP addresses instead of storing them in plain text.

## Implementation

### Hashing Algorithm

We use SHA-256 cryptographic hashing with salt to ensure:
- **One-way transformation**: IP addresses cannot be reverse-engineered from the hash
- **Consistency**: The same IP always produces the same hash (necessary for rate limiting)
- **Security**: Different salts produce different hashes

### Code Implementation

```typescript
// lib/utils/ip-extraction.ts
const hash = createHash('sha256')
  .update(ip + IP_HASH_SALT)
  .digest('hex')
  .substring(0, 16); // First 16 chars for efficiency
```

### Salt Configuration

The salt is configured via environment variable:
```bash
IP_HASH_SALT=your-random-salt-here
```

**Important**: 
- Generate a unique, random salt for each environment
- Never use the default salt in production
- Keep the salt secret - it should be treated like a password

### Hash Format

- **Length**: 16 characters (truncated SHA-256 hex)
- **Character set**: Hexadecimal (0-9, a-f)
- **Example**: `a3f5d8c2b1e9f4a7`

## Security Benefits

1. **Privacy Protection**: Raw IP addresses are never stored
2. **GDPR Compliance**: Hashed IPs are pseudonymized data
3. **Rate Limiting**: Still functional with hashed IPs
4. **Audit Trail**: Can track patterns without exposing IPs

## Unknown IPs

For requests where the IP cannot be determined:
- A time-based component is added (5-minute windows)
- This prevents all unknown IPs from being treated as one user
- Format: Hash of `unknown-{timeSlot}` + salt

## Best Practices

1. **Salt Management**:
   - Use a strong, random salt (minimum 32 characters)
   - Different salt per environment (dev, staging, prod)
   - Rotate salt periodically (requires clearing rate limit data)

2. **Monitoring**:
   - Log hash collisions if detected
   - Monitor for unusual patterns in hashed IPs

3. **Testing**:
   - Verify consistent hashing in tests
   - Test with various IP formats (IPv4, IPv6)

## Example Usage

```typescript
import { hashIpForRateLimiting, getClientIp } from '@/lib/utils/ip-extraction';

// In an API route
export async function GET(request: NextRequest) {
  const clientIp = getClientIp(request);
  const hashedIp = hashIpForRateLimiting(clientIp);
  
  // Use hashedIp for rate limiting, logging, etc.
  await rateLimiter.check(hashedIp);
}
```

## Migration Guide

If migrating from plain IP storage:

1. Generate and set `IP_HASH_SALT` environment variable
2. Update code to use `hashIpForRateLimiting()`
3. Clear existing rate limit data (incompatible formats)
4. Deploy and monitor

## Compliance Notes

- Hashed IPs are considered pseudonymized under GDPR
- Still personal data if combinable with other information
- Implement appropriate retention policies
- Document the hashing in your privacy policy