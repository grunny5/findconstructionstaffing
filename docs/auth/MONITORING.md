# Authentication Monitoring and Alerting

**Purpose:** Track authentication system health, email delivery, and user flows to ensure reliable user experience and identify issues early.

---

## Overview

The authentication monitoring system provides:

- **Real-time metrics** for email verification, password reset, and authentication flows
- **Automatic alerting** when metrics fall below thresholds
- **Privacy-compliant logging** (GDPR/CCPA compliant - no PII in logs)
- **Dashboard API** for monitoring auth system health
- **Time-windowed tracking** (1-hour rolling windows)

---

## Architecture

### Components

1. **Auth Metrics Tracker** (`lib/monitoring/auth-metrics.ts`)
   - Centralized event tracking
   - Automatic alert checking
   - Time-windowed metrics (1-hour windows)
   - Memory-bounded (max 10,000 events)

2. **Dashboard API** (`/api/monitoring/auth-metrics`)
   - GET: Fetch current metrics
   - POST: Test events (development only)
   - Protected by API key in production

3. **Instrumented Endpoints**
   - Email verification: `/auth/verify-email`
   - Resend verification: `/api/auth/resend-verification`
   - Webhook handler: `/api/webhooks/resend`

---

## Tracked Metrics

### Email Verification

| Metric           | Description                   | Alert Threshold  |
| ---------------- | ----------------------------- | ---------------- |
| `sent`           | Verification emails sent      | -                |
| `completed`      | Email verifications completed | -                |
| `failed`         | Email verification failures   | -                |
| `completionRate` | % of sent emails verified     | Alert if <70%    |
| `delivered`      | Emails delivered to inbox     | -                |
| `bounced`        | Email bounces (hard + soft)   | -                |
| `complained`     | Spam complaints received      | Alert if >3/hour |
| `deliveryRate`   | % of emails delivered         | Alert if <95%    |

### Password Reset

| Metric        | Description               | Alert Threshold |
| ------------- | ------------------------- | --------------- |
| `requested`   | Password resets requested | -               |
| `completed`   | Password resets completed | -               |
| `failed`      | Password reset failures   | -               |
| `successRate` | % of requests completed   | Alert if <80%   |

### Role Changes

| Metric        | Description             | Alert Threshold |
| ------------- | ----------------------- | --------------- |
| `successful`  | Successful role changes | -               |
| `failed`      | Failed role changes     | -               |
| `successRate` | % of successful changes | -               |

### Authentication

| Metric          | Description               | Alert Threshold |
| --------------- | ------------------------- | --------------- |
| `loginSuccess`  | Successful logins         | -               |
| `loginFailed`   | Failed login attempts     | -               |
| `signupSuccess` | Successful signups        | -               |
| `signupFailed`  | Failed signup attempts    | -               |
| `totalErrors`   | Total auth errors         | -               |
| `errorRate`     | % of attempts with errors | Alert if >5%    |

---

## Alert Thresholds

Default thresholds are defined in `lib/monitoring/auth-metrics.ts`:

```typescript
{
  emailVerificationCompletionRate: 70,  // Alert if <70%
  emailDeliveryRate: 95,                // Alert if <95%
  passwordResetSuccessRate: 80,         // Alert if <80%
  authenticationErrorRate: 5,           // Alert if >5%
  hardBounceCount: 10,                  // Alert if >10/hour
  spamComplaintCount: 3,                // Alert if >3/hour
}
```

### When Alerts Fire

Alerts are checked automatically on every event. Conditions:

1. **Email Verification Completion Rate**
   - Requires: >10 emails sent in window
   - Fires when: completion rate < threshold
   - Severity: `warning`

2. **Email Delivery Rate**
   - Requires: >10 emails sent in window
   - Fires when: delivery rate < threshold
   - Severity: `error`

3. **Password Reset Success Rate**
   - Requires: >5 resets requested in window
   - Fires when: success rate < threshold
   - Severity: `warning`

4. **Authentication Error Rate**
   - Requires: >20 auth attempts in window
   - Fires when: error rate > threshold
   - Severity: `error`

5. **Hard Bounce Count**
   - Fires when: hard bounces > threshold
   - Severity: `critical`

6. **Spam Complaint Count**
   - Fires when: complaints > threshold
   - Severity: `critical`

---

## Using the Dashboard API

### Development

```bash
# Get current auth metrics
curl http://localhost:3000/api/monitoring/auth-metrics

# Test tracking events
curl -X POST http://localhost:3000/api/monitoring/auth-metrics \
  -H "Content-Type: application/json" \
  -d '{"eventType": "email_verification_sent", "count": 10}'

# Test tracking email delivery
curl -X POST http://localhost:3000/api/monitoring/auth-metrics \
  -H "Content-Type: application/json" \
  -d '{"eventType": "email_delivered", "count": 9}'

# Test triggering alerts (low completion rate)
curl -X POST http://localhost:3000/api/monitoring/auth-metrics \
  -H "Content-Type: application/json" \
  -d '{"eventType": "email_verification_completed", "count": 3}'
```

### Production

```bash
# Set MONITORING_API_KEY in environment variables
# Then include in requests:
curl -H "x-monitoring-key: YOUR_API_KEY" \
  https://your-domain.com/api/monitoring/auth-metrics
```

### Response Format

```json
{
  "metrics": {
    "emailVerification": {
      "sent": 100,
      "completed": 85,
      "failed": 5,
      "completionRate": 85.0,
      "delivered": 95,
      "bounced": 3,
      "complained": 1,
      "deliveryRate": 95.0
    },
    "passwordReset": {
      "requested": 20,
      "completed": 18,
      "failed": 2,
      "successRate": 90.0
    },
    "roleChanges": {
      "successful": 5,
      "failed": 0,
      "successRate": 100.0
    },
    "authentication": {
      "loginSuccess": 200,
      "loginFailed": 5,
      "signupSuccess": 50,
      "signupFailed": 2,
      "totalErrors": 7,
      "errorRate": 2.8
    },
    "timestamp": "2025-12-17T...",
    "windowStart": "2025-12-17T...",
    "windowEnd": "2025-12-17T..."
  },
  "alertThresholds": { ... },
  "environment": "production",
  "timestamp": "2025-12-17T..."
}
```

---

## Instrumentation Guide

### Tracking Events

Import tracking functions from `lib/monitoring/auth-metrics`:

```typescript
import {
  trackEmailVerificationSent,
  trackEmailVerificationCompleted,
  trackEmailVerificationFailed,
  trackEmailDelivered,
  trackEmailBounced,
  trackEmailComplained,
  // ... other tracking functions
} from '@/lib/monitoring/auth-metrics';
```

### Email Verification Flow

```typescript
// When sending verification email
trackEmailVerificationSent(emailDomain);

// When user clicks verification link (success)
trackEmailVerificationCompleted(userId);

// When verification fails (expired, invalid, etc.)
trackEmailVerificationFailed(errorMessage);
```

### Email Webhook Events

```typescript
// Email delivered (from Resend webhook)
trackEmailDelivered(emailDomain);

// Email bounced
trackEmailBounced(bounceType, emailDomain); // bounceType: 'hard' | 'soft'

// Spam complaint
trackEmailComplained(emailDomain);
```

### Password Reset Flow

```typescript
// When user requests password reset
trackPasswordResetRequested();

// When password reset completes successfully
trackPasswordResetCompleted(userId);

// When password reset fails
trackPasswordResetFailed(errorMessage);
```

### Role Changes

```typescript
// When role change succeeds
trackRoleChanged(fromRole, toRole);

// When role change fails
trackRoleChangeFailed(errorMessage, fromRole, toRole);
```

### Authentication Events

```typescript
// Login events
trackLoginSuccess(userId);
trackLoginFailed(errorMessage);

// Signup events
trackSignupSuccess(userId);
trackSignupFailed(errorMessage);

// Generic auth errors
trackAuthError(errorMessage);
```

---

## Privacy and Compliance

### GDPR/CCPA Compliance

The monitoring system is designed for privacy:

✅ **No PII in logs**

- Email addresses are hashed (SHA-256) for correlation
- Only email domains are stored (non-PII)
- No email subjects in logs
- No password information

✅ **Time-bounded storage**

- Metrics in 1-hour rolling windows
- Old events automatically archived
- In-memory only (no persistent storage)

✅ **Structured logging**

- Consistent JSON format in production
- Easy to audit and filter

### Example Safe Logging

```typescript
// ❌ Bad - Logs PII
console.log('Email sent to:', user.email);

// ✅ Good - No PII
trackEmailVerificationSent(emailDomain); // Only domain
```

---

## Integration with External Services

### Current Implementation

Currently uses `console.log` with structured JSON output. Logs can be consumed by:

- **Vercel Logs** (automatic for Vercel deployments)
- **CloudWatch** (via log forwarding)
- **Datadog** (via log agent)
- **Sentry** (via console transport)

### Recommended Integrations

#### Option 1: Sentry

```typescript
// In sendAlert() function:
import * as Sentry from '@sentry/nextjs';

Sentry.captureMessage(alert.title, {
  level: alert.severity,
  extra: alert.metrics,
  tags: { type: 'auth_alert' },
});
```

#### Option 2: Datadog

```typescript
// In sendAlert() function:
const { StatsD } = require('hot-shots');
const dogstatsd = new StatsD();

dogstatsd.increment('auth.alert', {
  severity: alert.severity,
  type: alert.title,
});
```

#### Option 3: Slack Webhooks

```typescript
// In sendAlert() function:
await fetch(process.env.SLACK_WEBHOOK_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: `🚨 ${alert.title}`,
    attachments: [
      {
        color: alert.severity === 'critical' ? 'danger' : 'warning',
        text: alert.description,
        fields: Object.entries(alert.metrics).map(([key, value]) => ({
          title: key,
          value: String(value),
          short: true,
        })),
      },
    ],
  }),
});
```

#### Option 4: PagerDuty

```typescript
// In sendAlert() function:
const pdClient = require('node-pagerduty');
const pd = new pdClient(process.env.PAGERDUTY_API_KEY);

await pd.events.sendEvent({
  routing_key: process.env.PAGERDUTY_ROUTING_KEY,
  event_action: 'trigger',
  payload: {
    summary: alert.title,
    severity: alert.severity,
    source: 'auth-monitoring',
    custom_details: alert.metrics,
  },
});
```

---

## Testing

### Unit Tests

```bash
npm test lib/monitoring/auth-metrics.test.ts
```

### Integration Testing

```bash
# Start dev server
npm run dev

# In another terminal, run test events
curl -X POST http://localhost:3000/api/monitoring/auth-metrics \
  -H "Content-Type: application/json" \
  -d '{"eventType": "email_verification_sent", "count": 100}'

curl -X POST http://localhost:3000/api/monitoring/auth-metrics \
  -H "Content-Type: application/json" \
  -d '{"eventType": "email_verification_completed", "count": 60}'

# Check metrics
curl http://localhost:3000/api/monitoring/auth-metrics

# Should show ~60% completion rate and trigger alert
```

### Load Testing

Test with high volume to verify memory limits:

```bash
# Send 15,000 events (exceeds 10,000 limit)
for i in {1..15}; do
  curl -X POST http://localhost:3000/api/monitoring/auth-metrics \
    -H "Content-Type: application/json" \
    -d '{"eventType": "login_success", "count": 1000}'
done

# Verify memory enforcement (should have ~10,000 events)
curl http://localhost:3000/api/monitoring/auth-metrics
```

---

## Production Setup

### 1. Configure API Key

```bash
# Add to Vercel environment variables
MONITORING_API_KEY=<generate_secure_random_key>

# Generate secure key:
openssl rand -base64 32
```

### 2. Set Up Log Forwarding

Configure Vercel to forward logs to your monitoring service:

**Vercel Dashboard → Project → Settings → Integrations**

Available integrations:

- Datadog
- New Relic
- Sentry
- LogDNA
- Logtail

### 3. Configure Alerts (Optional)

Customize alert thresholds based on your SLA:

```typescript
// In auth-metrics.ts, update DEFAULT_ALERT_THRESHOLDS:
export const DEFAULT_ALERT_THRESHOLDS: AuthAlertThresholds = {
  emailVerificationCompletionRate: 80, // Stricter: 80% instead of 70%
  emailDeliveryRate: 98, // Stricter: 98% instead of 95%
  passwordResetSuccessRate: 85, // Stricter: 85% instead of 80%
  authenticationErrorRate: 3, // Stricter: 3% instead of 5%
  hardBounceCount: 5, // Stricter: 5 instead of 10
  spamComplaintCount: 1, // Stricter: 1 instead of 3
};
```

### 4. Create Dashboard (Optional)

Use metrics API to create a custom dashboard:

- **Grafana**: Use JSON API datasource
- **Datadog**: Create custom dashboard from logs
- **Vercel Analytics**: Use existing analytics
- **Custom**: Build with Next.js + Chart.js

---

## Monitoring Checklist

### Daily

- [ ] Check email delivery rate (should be >95%)
- [ ] Review any critical alerts (bounces, spam complaints)
- [ ] Verify no spike in auth errors

### Weekly

- [ ] Review email verification completion rate trend
- [ ] Check for hard bounce patterns (specific domains?)
- [ ] Analyze password reset success rate
- [ ] Review login/signup failure reasons

### Monthly

- [ ] Audit alert thresholds (too sensitive? too lenient?)
- [ ] Review monitoring coverage (any gaps?)
- [ ] Check memory usage (within limits?)
- [ ] Update documentation if processes changed

---

## Troubleshooting

### Metrics Not Updating

**Symptom:** Dashboard shows 0 for all metrics

**Possible Causes:**

1. Events not being tracked (missing import)
2. Metrics window reset recently (1-hour window)
3. API route not instrumented

**Solution:**

```bash
# Verify tracking is working
curl -X POST http://localhost:3000/api/monitoring/auth-metrics \
  -H "Content-Type: application/json" \
  -d '{"eventType": "login_success", "count": 10}'

# Check metrics immediately
curl http://localhost:3000/api/monitoring/auth-metrics
```

### Alerts Not Firing

**Symptom:** Metrics below threshold but no alerts in logs

**Possible Causes:**

1. Minimum event count not reached (e.g., <10 emails for verification rate)
2. Alert logging not visible (check log level)
3. Threshold too lenient

**Solution:**

```bash
# Check logs for alert output
grep -i "auth alert" logs/*.log

# Lower thresholds temporarily for testing
# Edit DEFAULT_ALERT_THRESHOLDS in auth-metrics.ts
```

### Memory Warnings

**Symptom:** `[Auth Metrics] Memory limit reached` in logs

**Expected Behavior:** This is normal under high load. System automatically removes oldest 20% of events.

**Action Needed:** None, unless warnings are constant (every few minutes).

**If Constant:** Consider:

- Increasing `MAX_EVENTS` (currently 10,000)
- Implementing external metrics storage (Redis, Prometheus)
- Reducing window size (currently 1 hour)

---

## API Reference

### GET /api/monitoring/auth-metrics

Returns current authentication metrics.

**Headers:**

- `x-monitoring-key`: API key (production only)

**Response:** 200 OK

```json
{
  "metrics": { ... },
  "alertThresholds": { ... },
  "environment": "production",
  "timestamp": "2025-12-17T..."
}
```

**Errors:**

- `401 Unauthorized`: Invalid/missing API key (production)
- `500 Internal Server Error`: Metrics fetch failed

### POST /api/monitoring/auth-metrics (Development Only)

Test endpoint for simulating auth events.

**Request:**

```json
{
  "eventType": "email_verification_sent",
  "count": 10
}
```

**Valid Event Types:**

- `email_verification_sent`
- `email_verification_completed`
- `email_verification_failed`
- `email_delivered`
- `email_bounced_hard`
- `email_bounced_soft`
- `email_complained`
- `password_reset_requested`
- `password_reset_completed`
- `password_reset_failed`
- `role_changed`
- `role_change_failed`
- `auth_error`
- `login_success`
- `login_failed`
- `signup_success`
- `signup_failed`

**Response:** 200 OK

```json
{
  "message": "Tracked 10 email_verification_sent event(s)",
  "metrics": { ... }
}
```

**Errors:**

- `400 Bad Request`: Unknown event type
- `403 Forbidden`: Production environment (not allowed)

---

## Future Enhancements

### Planned

- [ ] **Long-term metrics storage** (database or time-series DB)
- [ ] **Historical trend analysis** (daily/weekly/monthly reports)
- [ ] **Custom alert rules** (user-configurable thresholds)
- [ ] **Multi-region support** (track metrics per region)
- [ ] **A/B test tracking** (compare email template performance)

### Under Consideration

- [ ] **Real-time dashboard** (WebSocket updates)
- [ ] **Anomaly detection** (ML-based pattern recognition)
- [ ] **Cost tracking** (email send costs, Resend API usage)
- [ ] **User journey tracking** (verification → login → usage)

---

## Support

For questions or issues with auth monitoring:

1. Check this documentation
2. Review `/lib/monitoring/auth-metrics.ts` source code
3. Test with development endpoint: `POST /api/monitoring/auth-metrics`
4. Check application logs for errors
5. Create issue in project repository

---

## Related Documentation

- [Authentication State](./AUTHENTICATION_STATE.md) - Overall auth system architecture
- [Email Webhook Setup](../email/WEBHOOK_SETUP.md) - Resend webhook configuration
- [API Monitoring](../api/monitoring.md) - General API performance monitoring
- [Feature Flags](../features/FEATURE_FLAGS.md) - Feature flag system
