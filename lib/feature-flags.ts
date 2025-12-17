/**
 * Feature Flag System
 *
 * Provides environment-based feature flags for gradual rollout of authentication features.
 * All flags default to false for safe, opt-in rollout.
 *
 * Usage:
 *   import { getFeatureFlags, isFeatureEnabled } from '@/lib/feature-flags';
 *
 *   const flags = getFeatureFlags();
 *   if (flags.emailVerification) {
 *     // Show email verification UI
 *   }
 *
 *   // Or use helper:
 *   if (isFeatureEnabled('emailVerification')) {
 *     // Show email verification UI
 *   }
 */

export interface FeatureFlags {
  /**
   * Enable email verification during signup
   * When true: Users must verify email before login
   * When false: Users can login immediately after signup
   */
  emailVerification: boolean;

  /**
   * Enable password reset functionality
   * When true: "Forgot password" link shown on login page
   * When false: Password reset UI hidden
   */
  passwordReset: boolean;

  /**
   * Enable account settings page
   * When true: Users can access /settings to manage profile, email, password
   * When false: Settings navigation hidden
   */
  accountSettings: boolean;

  /**
   * Enable admin dashboard
   * When true: Admin users can access /admin/users for role management
   * When false: Admin UI hidden (role changes require database access)
   */
  adminDashboard: boolean;

  /**
   * Enable resend verification email
   * When true: Users can request new verification emails
   * When false: Resend UI hidden
   */
  resendVerification: boolean;
}

/**
 * Get all feature flags from environment variables
 *
 * Environment variables:
 * - NEXT_PUBLIC_FEATURE_EMAIL_VERIFICATION: Enable email verification (default: false)
 * - NEXT_PUBLIC_FEATURE_PASSWORD_RESET: Enable password reset (default: false)
 * - NEXT_PUBLIC_FEATURE_ACCOUNT_SETTINGS: Enable account settings (default: false)
 * - NEXT_PUBLIC_FEATURE_ADMIN_DASHBOARD: Enable admin dashboard (default: false)
 * - NEXT_PUBLIC_FEATURE_RESEND_VERIFICATION: Enable resend verification (default: false)
 *
 * Values: 'true' | '1' | 'yes' | 'enabled' (case-insensitive) = enabled
 *         Any other value or undefined = disabled
 */
export function getFeatureFlags(): FeatureFlags {
  return {
    emailVerification: parseFeatureFlag(
      process.env.NEXT_PUBLIC_FEATURE_EMAIL_VERIFICATION
    ),
    passwordReset: parseFeatureFlag(
      process.env.NEXT_PUBLIC_FEATURE_PASSWORD_RESET
    ),
    accountSettings: parseFeatureFlag(
      process.env.NEXT_PUBLIC_FEATURE_ACCOUNT_SETTINGS
    ),
    adminDashboard: parseFeatureFlag(
      process.env.NEXT_PUBLIC_FEATURE_ADMIN_DASHBOARD
    ),
    resendVerification: parseFeatureFlag(
      process.env.NEXT_PUBLIC_FEATURE_RESEND_VERIFICATION
    ),
  };
}

/**
 * Check if a specific feature is enabled
 *
 * @param feature - Name of the feature flag to check
 * @returns true if feature is enabled, false otherwise
 */
export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
  const flags = getFeatureFlags();
  return flags[feature];
}

/**
 * Parse feature flag value from environment variable
 *
 * Accepts truthy values: 'true', '1', 'yes', 'enabled' (case-insensitive)
 * All other values (including undefined) return false
 *
 * @param value - Environment variable value
 * @returns true if enabled, false otherwise
 */
function parseFeatureFlag(value: string | undefined): boolean {
  if (!value) return false;

  const normalized = value.toLowerCase().trim();
  return ['true', '1', 'yes', 'enabled'].includes(normalized);
}

/**
 * Get feature flag status for debugging/logging
 *
 * Returns object with all flags and their current values
 * Useful for debugging or displaying in admin dashboards
 */
export function getFeatureFlagStatus(): Record<
  keyof FeatureFlags,
  { enabled: boolean; envVar: string }
> {
  return {
    emailVerification: {
      enabled: isFeatureEnabled('emailVerification'),
      envVar: 'NEXT_PUBLIC_FEATURE_EMAIL_VERIFICATION',
    },
    passwordReset: {
      enabled: isFeatureEnabled('passwordReset'),
      envVar: 'NEXT_PUBLIC_FEATURE_PASSWORD_RESET',
    },
    accountSettings: {
      enabled: isFeatureEnabled('accountSettings'),
      envVar: 'NEXT_PUBLIC_FEATURE_ACCOUNT_SETTINGS',
    },
    adminDashboard: {
      enabled: isFeatureEnabled('adminDashboard'),
      envVar: 'NEXT_PUBLIC_FEATURE_ADMIN_DASHBOARD',
    },
    resendVerification: {
      enabled: isFeatureEnabled('resendVerification'),
      envVar: 'NEXT_PUBLIC_FEATURE_RESEND_VERIFICATION',
    },
  };
}
