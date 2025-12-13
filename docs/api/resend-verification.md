# Resend Verification Email API

## Endpoint

```
POST /api/auth/resend-verification
```

## Description

Resends the email verification link to users who have registered but not yet verified their email address. This endpoint implements rate limiting and security measures to prevent abuse and email enumeration attacks.

## Request

### Headers

```
Content-Type: application/json
```

### Body

```json
{
  "email": "user@example.com"
}
```

### Parameters

| Field | Type   | Required | Description                                   |
| ----- | ------ | -------- | --------------------------------------------- |
| email | string | Yes      | The email address to send verification link to |

## Response

### Success Response (200 OK)

Always returns the same response regardless of whether the email exists or not, to prevent email enumeration attacks.

```json
{
  "message": "If this email exists, we sent a verification link. Please check your inbox."
}
```

### Rate Limit Response (429 Too Many Requests)

Returned when the user has exceeded the rate limit of 2 requests per 10 minutes.

```json
{
  "message": "Please wait before requesting another verification email.",
  "retryAfter": 540
}
```

**Headers:**

```
Retry-After: 540
```

The `retryAfter` field and `Retry-After` header indicate the number of seconds to wait before trying again.

## Rate Limiting

- **Limit:** 2 requests per 10 minutes per email address
- **Window:** 10 minutes (600 seconds)
- **Tracking:** By email address
- **Response:** 429 status code when limit exceeded
- **Retry Information:** Included in response body and `Retry-After` header

### Rate Limit Examples

```bash
# First request - Success
curl -X POST http://localhost:3000/api/auth/resend-verification \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'
# Response: 200 OK

# Second request (within 10 minutes) - Success
curl -X POST http://localhost:3000/api/auth/resend-verification \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'
# Response: 200 OK

# Third request (within 10 minutes) - Rate Limited
curl -X POST http://localhost:3000/api/auth/resend-verification \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'
# Response: 429 Too Many Requests
# {
#   "message": "Please wait before requesting another verification email.",
#   "retryAfter": 540
# }
```

## Security Features

### Email Enumeration Prevention

The API always returns a success response (200 OK) regardless of:

- Whether the email exists in the system
- Whether the email is already verified
- Whether the Supabase API call succeeds or fails
- Whether the email format is valid

This prevents attackers from using the endpoint to discover which email addresses are registered.

### Error Handling

All errors are logged server-side but not exposed to the client. The client always receives the same generic success message, preventing information leakage.

## Examples

### Valid Request

```bash
curl -X POST http://localhost:3000/api/auth/resend-verification \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'
```

**Response:**

```json
{
  "message": "If this email exists, we sent a verification link. Please check your inbox."
}
```

### Invalid Email Format

```bash
curl -X POST http://localhost:3000/api/auth/resend-verification \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid-email"}'
```

**Response:** (Same as valid request to prevent enumeration)

```json
{
  "message": "If this email exists, we sent a verification link. Please check your inbox."
}
```

### Rate Limited Request

```bash
curl -X POST http://localhost:3000/api/auth/resend-verification \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'
```

**Response:**

```json
{
  "message": "Please wait before requesting another verification email.",
  "retryAfter": 540
}
```

**Status Code:** 429 Too Many Requests

**Headers:**

```
Retry-After: 540
```

## Error Codes

| Status Code | Meaning                                                                |
| ----------- | ---------------------------------------------------------------------- |
| 200         | Request processed (email may or may not have been sent)                |
| 429         | Rate limit exceeded (see `retryAfter` for wait time)                   |

Note: Even validation errors return 200 to prevent email enumeration.

## Implementation Details

### Rate Limit Storage

- **Development:** In-memory Map
- **Production:** Consider using Redis or database for distributed rate limiting across multiple server instances

### Supabase Integration

Uses Supabase Admin Client (service role) to call:

```typescript
supabase.auth.resend({
  type: 'signup',
  email: email,
});
```

### Environment Variables Required

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Testing

Run the test suite:

```bash
npm test -- app/api/auth/resend-verification
```

Test coverage includes:

- Email format validation
- Rate limiting (1st, 2nd, and 3rd requests)
- Supabase integration
- Error handling
- Security (email enumeration prevention)
- Retry-After header validation

## Related Documentation

- [Email Verification Flow](../auth/AUTHENTICATION_STATE.md)
- [Production-Ready Authentication Feature](../features/active/007-production-ready-authentication.md)
- [Task 1.2.1: Create Resend Verification API Route](../../tasks/007-production-ready-authentication-tasks.md#task-121-create-resend-verification-api-route)

## Security Considerations

1. **Email Enumeration:** Always returns success response to prevent attackers from discovering registered emails
2. **Rate Limiting:** Prevents abuse and spam by limiting requests to 2 per 10 minutes
3. **Error Suppression:** Internal errors are logged but not exposed to clients
4. **Service Role Security:** Service role key must be kept secret and never exposed to client-side code
5. **Production Rate Limiting:** In-memory storage is suitable for development, but production should use Redis or database for distributed rate limiting

## Future Improvements

- [ ] Migrate rate limiting to Redis for distributed systems
- [ ] Add monitoring/alerting for rate limit violations
- [ ] Consider implementing CAPTCHA for additional abuse prevention
- [ ] Add metrics collection for request volume and rate limit hits
