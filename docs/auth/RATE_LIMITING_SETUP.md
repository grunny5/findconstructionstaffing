# Rate Limiting Setup Guide

This document explains how to set up production-ready rate limiting for the authentication system.

## Overview

The authentication system uses **Upstash Redis** for rate limiting to:

- ✅ Persist rate limit state across serverless function cold starts
- ✅ Prevent distributed attacks with IP-based rate limiting
- ✅ Scale automatically without connection pooling

## Why Upstash Redis?

Traditional rate limiting using in-memory storage (Maps/Objects) doesn't work in serverless environments because:

- **Cold starts** reset the rate limit state
- **Multiple instances** don't share rate limit data
- **No persistence** means attackers can bypass limits by waiting for cold starts

Upstash Redis solves these problems with:

- HTTP-based REST API (no connection pooling needed)
- Edge-compatible and fast (~50ms latency)
- Free tier available (10,000 requests/day)
- Pay-as-you-go pricing for production

## Setup Instructions

### 1. Create an Upstash Redis Database

1. Go to [https://console.upstash.com/](https://console.upstash.com/)
2. Sign up or log in
3. Click **Create Database**
4. Configure:
   - **Name**: `findconstructionstaffing-rate-limit` (or your preferred name)
   - **Type**: **Regional** (cheaper) or **Global** (lower latency worldwide)
   - **Region**: Choose closest to your Vercel deployment region
   - **TLS**: Enabled (recommended)
5. Click **Create**

### 2. Get Your Credentials

1. After creation, go to **Details** tab
2. Scroll to **REST API** section
3. Copy:
   - **UPSTASH_REDIS_REST_URL**: `https://your-redis-name.upstash.io`
   - **UPSTASH_REDIS_REST_TOKEN**: `AYtaA...` (long token)

### 3. Add Environment Variables

#### Local Development (.env.local)

```bash
# Upstash Redis Configuration
UPSTASH_REDIS_REST_URL=https://your-redis-name.upstash.io
UPSTASH_REDIS_REST_TOKEN=AYtaA...your-token-here
```

#### Production (Vercel)

1. Go to your Vercel project
2. Settings → Environment Variables
3. Add both variables:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
4. Deploy

## Rate Limit Configuration

### Current Limits

#### Email-Based Rate Limiting

- **Limit**: 2 requests per 10 minutes per email address
- **Purpose**: Prevents spam to specific users
- **Bypass Prevention**: Email normalization (removes `+` aliases)

#### IP-Based Rate Limiting

- **Limit**: 10 requests per 10 minutes per IP address
- **Purpose**: Prevents distributed attacks using different emails
- **IP Detection**: Uses `x-forwarded-for` header (Vercel proxy)

### Customizing Limits

Edit `lib/rate-limit.ts`:

```typescript
// Email-based (per email address)
export const emailRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(2, '10 m'), // Change 2 and '10 m'
      analytics: true,
      prefix: 'ratelimit:email',
    })
  : null;

// IP-based (per IP address)
export const ipRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '10 m'), // Change 10 and '10 m'
      analytics: true,
      prefix: 'ratelimit:ip',
    })
  : null;
```

## Testing

### Local Testing (Without Redis)

When Redis is not configured, rate limiting gracefully degrades:

- ⚠️ Warning logged: `Redis not configured - rate limiting disabled`
- ✅ All requests allowed (development mode)
- ✅ Tests pass with mocked rate limiter

### Production Testing (With Redis)

Test rate limits:

```bash
# Test email rate limit (should block after 2 requests)
for i in {1..3}; do
  curl -X POST https://your-app.vercel.app/api/auth/resend-verification \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com"}' \
    -i
done

# Check for 429 status on 3rd request
```

Expected response on rate limit:

```json
{
  "message": "Please wait before requesting another verification email.",
  "retryAfter": 600
}
```

Headers:

```
HTTP/1.1 429 Too Many Requests
Retry-After: 600
X-RateLimit-Limit: 2
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1703001234567
```

## Monitoring

### Upstash Console

1. Go to [Upstash Console](https://console.upstash.com/)
2. Select your database
3. View:
   - **Total Commands**: Number of rate limit checks
   - **Daily Requests**: Trend over time
   - **Storage**: Should be minimal (only recent requests tracked)

### Application Logs

Rate limit events are logged:

```
[Rate Limit] Redis not configured - rate limiting disabled (development only)
```

No logs in production (Redis configured).

## Costs

### Free Tier

- **10,000 requests/day**
- **256 MB storage**
- Perfect for development and small apps

### Paid Tier

- **$0.20 per 100,000 requests**
- **$0.25 per GB storage/month**

**Example**: 1 million verification emails/month

- Rate limit checks: 2 million (email + IP)
- Cost: ~$4/month

## Troubleshooting

### Issue: Rate limiting not working

**Check**:

1. Environment variables set correctly
2. Upstash database active
3. No firewall blocking `*.upstash.io`

**Debug**:

```typescript
// Add to lib/rate-limit.ts temporarily
console.log('Redis configured:', !!redis);
console.log('URL:', process.env.UPSTASH_REDIS_REST_URL);
```

### Issue: 401 Unauthorized from Upstash

**Cause**: Invalid token

**Fix**:

1. Regenerate token in Upstash Console
2. Update `UPSTASH_REDIS_REST_TOKEN`
3. Redeploy

### Issue: High latency

**Cause**: Redis database region far from serverless functions

**Fix**:

1. Create new database in closer region
2. Update environment variables
3. Consider Global Redis for worldwide apps

## Security Considerations

✅ **Token Security**

- Never commit `UPSTASH_REDIS_REST_TOKEN` to git
- Use environment variables only
- Rotate tokens if exposed

✅ **Data Privacy**

- Rate limiter stores: email (hashed), IP (hashed), timestamps
- No PII in plain text
- Data expires automatically after window

✅ **DDoS Protection**

- IP-based limits prevent distributed attacks
- Email normalization prevents `+` alias abuse
- Sliding window prevents burst attacks

## Alternative Solutions

If you prefer not to use Upstash:

### Vercel KV (Alternative)

```bash
npm install @vercel/kv

# .env.local
KV_REST_API_URL=your-vercel-kv-url
KV_REST_API_TOKEN=your-vercel-kv-token
```

Modify `lib/rate-limit.ts` to use Vercel KV instead.

### Upstash Edge Config (Simpler, but less flexible)

- Good for: Simple global counters
- Limited: No per-key expiration

## Support

- **Upstash Docs**: https://docs.upstash.com/redis
- **@upstash/ratelimit**: https://github.com/upstash/ratelimit
- **Issues**: Create GitHub issue in project repo
