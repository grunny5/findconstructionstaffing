# Feature Flags Guide

**Last Updated:** 2025-12-17
**Status:** Active
**Related:** Authentication System (Feature #007)

---

## Overview

The feature flag system allows gradual rollout of authentication features without requiring code deployments. All flags are environment-based and default to `false` for safe, opt-in activation.

---

## Architecture

### Feature Flag Module

**Location:** `lib/feature-flags.ts`

**Key Functions:**

- `getFeatureFlags()` - Returns all feature flags with their current values
- `isFeatureEnabled(feature)` - Check if a specific feature is enabled
- `getFeatureFlagStatus()` - Get debugging information about all flags

### Type-Safe Feature Flags

```typescript
interface FeatureFlags {
  emailVerification: boolean;
  passwordReset: boolean;
  accountSettings: boolean;
  adminDashboard: boolean;
  resendVerification: boolean;
}
```

---

## Available Feature Flags

### 1. Email Verification (`emailVerification`)

**Environment Variable:** `NEXT_PUBLIC_FEATURE_EMAIL_VERIFICATION`

**When Enabled:**

- Users must verify email before login
- Signup shows "Check your email" message instead of auto-login
- Unverified users see error when attempting login

**When Disabled:**

- Users can login immediately after signup
- No email verification required (development mode behavior)

**Affects:**

- Signup flow
- Login flow
- Email verification routes

---

### 2. Password Reset (`passwordReset`)

**Environment Variable:** `NEXT_PUBLIC_FEATURE_PASSWORD_RESET`

**When Enabled:**

- "Forgot password?" link shown on login page
- Users can access `/forgot-password` page
- Password reset emails are sent

**When Disabled:**

- "Forgot password?" link hidden
- Password reset UI inaccessible

**Affects:**

- Login page (forgot password link)
- `/forgot-password` page
- `/reset-password` page

---

### 3. Account Settings (`accountSettings`)

**Environment Variable:** `NEXT_PUBLIC_FEATURE_ACCOUNT_SETTINGS`

**When Enabled:**

- "Account Settings" shown in user menu
- Users can access `/settings` page
- Users can manage profile, email, password, account deletion

**When Disabled:**

- Settings navigation hidden
- `/settings` page inaccessible

**Affects:**

- Header user dropdown menu
- Mobile navigation menu
- `/settings` page and sub-pages

---

### 4. Admin Dashboard (`adminDashboard`)

**Environment Variable:** `NEXT_PUBLIC_FEATURE_ADMIN_DASHBOARD`

**When Enabled:**

- Admin users see "Admin Dashboard" in menu
- Admins can access `/admin/users` page
- Role management UI available

**When Disabled:**

- Admin navigation hidden
- Admin pages inaccessible via UI
- Role changes require direct database access

**Affects:**

- Header user dropdown menu (admin users only)
- Mobile navigation menu (admin users only)
- `/admin/users` page
- Role management features

---

### 5. Resend Verification (`resendVerification`)

**Environment Variable:** `NEXT_PUBLIC_FEATURE_RESEND_VERIFICATION`

**When Enabled:**

- Unverified users can request new verification emails
- "Resend" button shown on login error for unverified accounts

**When Disabled:**

- Resend verification UI hidden
- Users cannot request new verification emails via UI

**Affects:**

- Login page (resend verification form)
- Verification error pages

---

## Configuration

### Setting Feature Flags

Feature flags are controlled via environment variables. Use one of these truthy values:

- `true`
- `1`
- `yes`
- `enabled`

Values are **case-insensitive** and **whitespace is trimmed**.

Any other value (including `false`, empty string, or undefined) = disabled.

### Local Development (`.env.local`)

```bash
# Enable email verification for local testing
NEXT_PUBLIC_FEATURE_EMAIL_VERIFICATION=true

# Enable password reset
NEXT_PUBLIC_FEATURE_PASSWORD_RESET=true

# Enable account settings
NEXT_PUBLIC_FEATURE_ACCOUNT_SETTINGS=true

# Enable admin dashboard
NEXT_PUBLIC_FEATURE_ADMIN_DASHBOARD=true

# Enable resend verification
NEXT_PUBLIC_FEATURE_RESEND_VERIFICATION=true
```

### Production (Vercel)

1. Go to Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each feature flag:
   - **Name:** `NEXT_PUBLIC_FEATURE_EMAIL_VERIFICATION`
   - **Value:** `true` or `false`
   - **Environment:** Production (or All)
4. Click **Save**
5. Redeploy your application

**Note:** Changes require redeployment to take effect.

---

## Usage Examples

### Check Feature Flag in Component

```typescript
import { isFeatureEnabled } from '@/lib/feature-flags';

function LoginPage() {
  return (
    <div>
      {/* ... login form ... */}

      {isFeatureEnabled('passwordReset') && (
        <Link href="/forgot-password">Forgot password?</Link>
      )}
    </div>
  );
}
```

### Get All Feature Flags

```typescript
import { getFeatureFlags } from '@/lib/feature-flags';

function DebugPanel() {
  const flags = getFeatureFlags();

  return (
    <div>
      <h2>Feature Flags</h2>
      <ul>
        <li>Email Verification: {flags.emailVerification ? '✅' : '❌'}</li>
        <li>Password Reset: {flags.passwordReset ? '✅' : '❌'}</li>
        <li>Account Settings: {flags.accountSettings ? '✅' : '❌'}</li>
        <li>Admin Dashboard: {flags.adminDashboard ? '✅' : '❌'}</li>
        <li>Resend Verification: {flags.resendVerification ? '✅' : '❌'}</li>
      </ul>
    </div>
  );
}
```

### Get Debugging Information

```typescript
import { getFeatureFlagStatus } from '@/lib/feature-flags';

function AdminDashboard() {
  const status = getFeatureFlagStatus();

  console.log('Feature Flag Status:', status);
  // Output:
  // {
  //   emailVerification: { enabled: true, envVar: 'NEXT_PUBLIC_FEATURE_EMAIL_VERIFICATION' },
  //   passwordReset: { enabled: false, envVar: 'NEXT_PUBLIC_FEATURE_PASSWORD_RESET' },
  //   ...
  // }
}
```

---

## Rollout Strategy

### Phase 1: Development Testing

**Goal:** Test all features locally before deploying to production

```bash
# .env.local - Enable all features for development
NEXT_PUBLIC_FEATURE_EMAIL_VERIFICATION=true
NEXT_PUBLIC_FEATURE_PASSWORD_RESET=true
NEXT_PUBLIC_FEATURE_ACCOUNT_SETTINGS=true
NEXT_PUBLIC_FEATURE_ADMIN_DASHBOARD=true
NEXT_PUBLIC_FEATURE_RESEND_VERIFICATION=true
```

**Actions:**

- Test complete authentication flows
- Verify all UI components display correctly
- Test error handling and edge cases

---

### Phase 2: Staging Verification

**Goal:** Validate features in production-like environment

**Staging Environment Variables:**

```bash
# Enable all features for final testing
NEXT_PUBLIC_FEATURE_EMAIL_VERIFICATION=true
NEXT_PUBLIC_FEATURE_PASSWORD_RESET=true
NEXT_PUBLIC_FEATURE_ACCOUNT_SETTINGS=true
NEXT_PUBLIC_FEATURE_ADMIN_DASHBOARD=true
NEXT_PUBLIC_FEATURE_RESEND_VERIFICATION=true
```

**Actions:**

- Test with real email delivery (Resend)
- Verify webhook events are received
- Test admin role management with real users
- Monitor for any production-specific issues

---

### Phase 3: Production Gradual Rollout

**Goal:** Incrementally enable features for production users

**Week 1: Core Authentication**

```bash
# Enable basic password reset first
NEXT_PUBLIC_FEATURE_PASSWORD_RESET=true
```

**Monitor:**

- Password reset success rate
- Email delivery rates
- User support requests

**Week 2: Email Verification**

```bash
NEXT_PUBLIC_FEATURE_PASSWORD_RESET=true
NEXT_PUBLIC_FEATURE_EMAIL_VERIFICATION=true
NEXT_PUBLIC_FEATURE_RESEND_VERIFICATION=true
```

**Monitor:**

- Email verification completion rate (target: >90%)
- Bounce/complaint rates
- Signup abandonment rate

**Week 3: Account Settings**

```bash
NEXT_PUBLIC_FEATURE_PASSWORD_RESET=true
NEXT_PUBLIC_FEATURE_EMAIL_VERIFICATION=true
NEXT_PUBLIC_FEATURE_RESEND_VERIFICATION=true
NEXT_PUBLIC_FEATURE_ACCOUNT_SETTINGS=true
```

**Monitor:**

- Settings page engagement
- Profile update success rate
- Account deletion requests

**Week 4: Admin Dashboard**

```bash
# Enable all features
NEXT_PUBLIC_FEATURE_PASSWORD_RESET=true
NEXT_PUBLIC_FEATURE_EMAIL_VERIFICATION=true
NEXT_PUBLIC_FEATURE_RESEND_VERIFICATION=true
NEXT_PUBLIC_FEATURE_ACCOUNT_SETTINGS=true
NEXT_PUBLIC_FEATURE_ADMIN_DASHBOARD=true
```

**Monitor:**

- Admin role change frequency
- Audit log completeness
- Admin user feedback

---

## Quick Rollback

If issues arise, disable the problematic feature immediately:

### Via Vercel Dashboard

1. Go to **Settings** → **Environment Variables**
2. Find the problematic feature flag
3. Set value to `false`
4. Trigger redeployment

**Rollback Time:** ~2-5 minutes (deployment time)

### Emergency Rollback via CLI

```bash
# Set flag to false
vercel env rm NEXT_PUBLIC_FEATURE_EMAIL_VERIFICATION production
vercel env add NEXT_PUBLIC_FEATURE_EMAIL_VERIFICATION production
# Enter value: false

# Redeploy
vercel --prod
```

---

## Testing Feature Flags

### Unit Tests

Feature flag logic is tested in `lib/__tests__/feature-flags.test.ts`:

```bash
npm test lib/__tests__/feature-flags.test.ts
```

**Coverage:** 21 tests covering all flag parsing logic

### Integration Tests

Test feature flag behavior in UI components:

```typescript
// Example: Test login page with feature flag disabled
describe('Login Page - Password Reset Feature Flag', () => {
  it('hides forgot password link when feature is disabled', () => {
    process.env.NEXT_PUBLIC_FEATURE_PASSWORD_RESET = 'false';

    render(<LoginPage />);

    expect(screen.queryByText('Forgot password?')).not.toBeInTheDocument();
  });

  it('shows forgot password link when feature is enabled', () => {
    process.env.NEXT_PUBLIC_FEATURE_PASSWORD_RESET = 'true';

    render(<LoginPage />);

    expect(screen.getByText('Forgot password?')).toBeInTheDocument();
  });
});
```

---

## Monitoring

### Key Metrics by Feature

**Email Verification:**

- Verification completion rate (target: >90% within 24h)
- Email delivery rate (target: >95%)
- Bounce rate (target: <5%)

**Password Reset:**

- Reset request success rate (target: >80%)
- Link click rate (target: >60%)
- Password update completion rate

**Account Settings:**

- Settings page visits
- Profile update success rate
- Account deletion rate

**Admin Dashboard:**

- Role change frequency
- Admin active users
- Audit log entries

### Alert Thresholds

Set up alerts for:

- Email verification rate drops below 80%
- Password reset success rate drops below 70%
- Bounce rate exceeds 10%
- Admin dashboard errors

---

## Troubleshooting

### Feature Flag Not Taking Effect

**Problem:** Changed environment variable but feature still disabled/enabled

**Solutions:**

1. **Verify environment variable name is correct:**
   - Use exact names from `.env.example`
   - Check for typos (e.g., `VERIFCATION` vs `VERIFICATION`)
2. **Restart development server:**
   ```bash
   # Kill dev server (Ctrl+C)
   npm run dev
   ```
3. **Clear Next.js cache:**
   ```bash
   rm -rf .next
   npm run dev
   ```
4. **For production:** Trigger redeployment after changing Vercel env vars

---

### Feature Partially Working

**Problem:** Feature enabled but some UI elements still hidden

**Causes:**

- Multiple feature flags control different parts of the feature
- Example: `resendVerification` requires both `emailVerification` AND `resendVerification` enabled

**Solutions:**

1. Check `getFeatureFlagStatus()` output in console
2. Verify all related flags are enabled
3. Check component logic for nested feature flag conditions

---

### TypeScript Errors

**Problem:** TypeScript complains about feature flag usage

**Solutions:**

1. **Ensure correct key name:**
   ```typescript
   // ✅ Correct
   isFeatureEnabled('emailVerification');
   // ❌ Wrong - TypeScript error
   isFeatureEnabled('email_verification');
   ```
2. **Import correct types:**
   ```typescript
   import { isFeatureEnabled, type FeatureFlags } from '@/lib/feature-flags';
   ```

---

## Future Enhancements

### Percentage-Based Rollout

Enable features for a percentage of users:

```typescript
// Future implementation
export function isFeatureEnabledForUser(
  feature: keyof FeatureFlags,
  userId: string
): boolean {
  const rolloutPercentage = getRolloutPercentage(feature);
  const userBucket = hashUserId(userId) % 100;
  return userBucket < rolloutPercentage;
}
```

### Feature Flag Dashboard

Admin UI to view/toggle flags without Vercel dashboard access:

- View current flag status
- Toggle flags on/off
- View rollout history
- Set rollout percentages

### A/B Testing Support

Run experiments with feature variants:

```typescript
// Future implementation
const variant = getFeatureVariant('emailVerification', userId);
// Returns: 'control' | 'variant_a' | 'variant_b'
```

---

## Support

### Related Documentation

- **Authentication State:** `docs/auth/AUTHENTICATION_STATE.md`
- **Feature Specification:** `docs/features/active/007-production-ready-authentication.md`
- **Task List:** `tasks/007-production-ready-authentication-tasks.md`

### Code References

- **Feature Flags:** `lib/feature-flags.ts`
- **Tests:** `lib/__tests__/feature-flags.test.ts`
- **Environment Config:** `.env.example`
- **Header (Navigation):** `components/Header.tsx`
- **Login Page:** `app/login/page.tsx`

### Questions?

If you need help with feature flags:

1. Review this documentation
2. Check existing tests for usage examples
3. Review component implementations
4. Consult with team lead or DevOps

---

**Document Version:** 1.0
**Last Reviewed:** 2025-12-17
**Next Review:** After production rollout complete
