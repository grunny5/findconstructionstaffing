import {
  getFeatureFlags,
  isFeatureEnabled,
  getFeatureFlagStatus,
  type FeatureFlags,
} from '../feature-flags';

describe('Feature Flags', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('getFeatureFlags', () => {
    it('returns all flags as false when no environment variables are set', () => {
      delete process.env.NEXT_PUBLIC_FEATURE_EMAIL_VERIFICATION;
      delete process.env.NEXT_PUBLIC_FEATURE_PASSWORD_RESET;
      delete process.env.NEXT_PUBLIC_FEATURE_ACCOUNT_SETTINGS;
      delete process.env.NEXT_PUBLIC_FEATURE_ADMIN_DASHBOARD;
      delete process.env.NEXT_PUBLIC_FEATURE_RESEND_VERIFICATION;

      const flags = getFeatureFlags();

      expect(flags).toEqual({
        emailVerification: false,
        passwordReset: false,
        accountSettings: false,
        adminDashboard: false,
        resendVerification: false,
      });
    });

    it('returns true for flags set to "true"', () => {
      process.env.NEXT_PUBLIC_FEATURE_EMAIL_VERIFICATION = 'true';
      process.env.NEXT_PUBLIC_FEATURE_PASSWORD_RESET = 'true';

      const flags = getFeatureFlags();

      expect(flags.emailVerification).toBe(true);
      expect(flags.passwordReset).toBe(true);
      expect(flags.accountSettings).toBe(false);
    });

    it('returns true for flags set to "1"', () => {
      process.env.NEXT_PUBLIC_FEATURE_ACCOUNT_SETTINGS = '1';

      const flags = getFeatureFlags();

      expect(flags.accountSettings).toBe(true);
    });

    it('returns true for flags set to "yes"', () => {
      process.env.NEXT_PUBLIC_FEATURE_ADMIN_DASHBOARD = 'yes';

      const flags = getFeatureFlags();

      expect(flags.adminDashboard).toBe(true);
    });

    it('returns true for flags set to "enabled"', () => {
      process.env.NEXT_PUBLIC_FEATURE_RESEND_VERIFICATION = 'enabled';

      const flags = getFeatureFlags();

      expect(flags.resendVerification).toBe(true);
    });

    it('is case-insensitive for truthy values', () => {
      process.env.NEXT_PUBLIC_FEATURE_EMAIL_VERIFICATION = 'TRUE';
      process.env.NEXT_PUBLIC_FEATURE_PASSWORD_RESET = 'Yes';
      process.env.NEXT_PUBLIC_FEATURE_ACCOUNT_SETTINGS = 'ENABLED';

      const flags = getFeatureFlags();

      expect(flags.emailVerification).toBe(true);
      expect(flags.passwordReset).toBe(true);
      expect(flags.accountSettings).toBe(true);
    });

    it('ignores whitespace in environment variables', () => {
      process.env.NEXT_PUBLIC_FEATURE_EMAIL_VERIFICATION = '  true  ';
      process.env.NEXT_PUBLIC_FEATURE_PASSWORD_RESET = ' enabled ';

      const flags = getFeatureFlags();

      expect(flags.emailVerification).toBe(true);
      expect(flags.passwordReset).toBe(true);
    });

    it('returns false for invalid truthy values', () => {
      process.env.NEXT_PUBLIC_FEATURE_EMAIL_VERIFICATION = 'on';
      process.env.NEXT_PUBLIC_FEATURE_PASSWORD_RESET = '2';
      process.env.NEXT_PUBLIC_FEATURE_ACCOUNT_SETTINGS = 'active';

      const flags = getFeatureFlags();

      expect(flags.emailVerification).toBe(false);
      expect(flags.passwordReset).toBe(false);
      expect(flags.accountSettings).toBe(false);
    });

    it('returns false for "false" string value', () => {
      process.env.NEXT_PUBLIC_FEATURE_EMAIL_VERIFICATION = 'false';

      const flags = getFeatureFlags();

      expect(flags.emailVerification).toBe(false);
    });

    it('returns false for empty string', () => {
      process.env.NEXT_PUBLIC_FEATURE_EMAIL_VERIFICATION = '';

      const flags = getFeatureFlags();

      expect(flags.emailVerification).toBe(false);
    });
  });

  describe('isFeatureEnabled', () => {
    it('returns true when feature is enabled', () => {
      process.env.NEXT_PUBLIC_FEATURE_EMAIL_VERIFICATION = 'true';

      expect(isFeatureEnabled('emailVerification')).toBe(true);
    });

    it('returns false when feature is disabled', () => {
      delete process.env.NEXT_PUBLIC_FEATURE_EMAIL_VERIFICATION;

      expect(isFeatureEnabled('emailVerification')).toBe(false);
    });

    it('works for all feature flags', () => {
      process.env.NEXT_PUBLIC_FEATURE_EMAIL_VERIFICATION = 'true';
      process.env.NEXT_PUBLIC_FEATURE_PASSWORD_RESET = '1';
      process.env.NEXT_PUBLIC_FEATURE_ACCOUNT_SETTINGS = 'yes';
      process.env.NEXT_PUBLIC_FEATURE_ADMIN_DASHBOARD = 'enabled';
      process.env.NEXT_PUBLIC_FEATURE_RESEND_VERIFICATION = 'true';

      expect(isFeatureEnabled('emailVerification')).toBe(true);
      expect(isFeatureEnabled('passwordReset')).toBe(true);
      expect(isFeatureEnabled('accountSettings')).toBe(true);
      expect(isFeatureEnabled('adminDashboard')).toBe(true);
      expect(isFeatureEnabled('resendVerification')).toBe(true);
    });

    it('returns false for mixed enabled/disabled features', () => {
      process.env.NEXT_PUBLIC_FEATURE_EMAIL_VERIFICATION = 'true';
      delete process.env.NEXT_PUBLIC_FEATURE_PASSWORD_RESET;

      expect(isFeatureEnabled('emailVerification')).toBe(true);
      expect(isFeatureEnabled('passwordReset')).toBe(false);
    });
  });

  describe('getFeatureFlagStatus', () => {
    it('returns status object with all flags', () => {
      process.env.NEXT_PUBLIC_FEATURE_EMAIL_VERIFICATION = 'true';
      process.env.NEXT_PUBLIC_FEATURE_PASSWORD_RESET = 'false';
      delete process.env.NEXT_PUBLIC_FEATURE_ACCOUNT_SETTINGS;

      const status = getFeatureFlagStatus();

      expect(status).toHaveProperty('emailVerification');
      expect(status).toHaveProperty('passwordReset');
      expect(status).toHaveProperty('accountSettings');
      expect(status).toHaveProperty('adminDashboard');
      expect(status).toHaveProperty('resendVerification');

      expect(status.emailVerification).toEqual({
        enabled: true,
        envVar: 'NEXT_PUBLIC_FEATURE_EMAIL_VERIFICATION',
      });
      expect(status.passwordReset).toEqual({
        enabled: false,
        envVar: 'NEXT_PUBLIC_FEATURE_PASSWORD_RESET',
      });
      expect(status.accountSettings).toEqual({
        enabled: false,
        envVar: 'NEXT_PUBLIC_FEATURE_ACCOUNT_SETTINGS',
      });
    });

    it('includes environment variable names for debugging', () => {
      const status = getFeatureFlagStatus();

      expect(status.emailVerification.envVar).toBe(
        'NEXT_PUBLIC_FEATURE_EMAIL_VERIFICATION'
      );
      expect(status.passwordReset.envVar).toBe(
        'NEXT_PUBLIC_FEATURE_PASSWORD_RESET'
      );
      expect(status.accountSettings.envVar).toBe(
        'NEXT_PUBLIC_FEATURE_ACCOUNT_SETTINGS'
      );
      expect(status.adminDashboard.envVar).toBe(
        'NEXT_PUBLIC_FEATURE_ADMIN_DASHBOARD'
      );
      expect(status.resendVerification.envVar).toBe(
        'NEXT_PUBLIC_FEATURE_RESEND_VERIFICATION'
      );
    });

    it('reflects current flag status', () => {
      process.env.NEXT_PUBLIC_FEATURE_ADMIN_DASHBOARD = 'enabled';
      process.env.NEXT_PUBLIC_FEATURE_RESEND_VERIFICATION = '1';

      const status = getFeatureFlagStatus();

      expect(status.adminDashboard.enabled).toBe(true);
      expect(status.resendVerification.enabled).toBe(true);
      expect(status.emailVerification.enabled).toBe(false);
    });
  });

  describe('Type Safety', () => {
    it('getFeatureFlags returns FeatureFlags interface', () => {
      const flags = getFeatureFlags();

      // Type assertion test - if this compiles, types are correct
      const typedFlags: FeatureFlags = flags;
      expect(typedFlags).toBeDefined();
    });

    it('isFeatureEnabled accepts valid feature flag keys', () => {
      // These should compile without errors
      isFeatureEnabled('emailVerification');
      isFeatureEnabled('passwordReset');
      isFeatureEnabled('accountSettings');
      isFeatureEnabled('adminDashboard');
      isFeatureEnabled('resendVerification');

      // TypeScript will prevent invalid keys at compile time
      // @ts-expect-error - invalid feature flag key
      // isFeatureEnabled('invalidFeature');
    });
  });

  describe('Default Behavior', () => {
    it('defaults to false for safe opt-in rollout', () => {
      const flags = getFeatureFlags();

      // All flags should be false by default
      Object.values(flags).forEach((flag) => {
        expect(flag).toBe(false);
      });
    });

    it('only enables features that are explicitly set', () => {
      process.env.NEXT_PUBLIC_FEATURE_EMAIL_VERIFICATION = 'true';

      const flags = getFeatureFlags();

      expect(flags.emailVerification).toBe(true);
      expect(flags.passwordReset).toBe(false);
      expect(flags.accountSettings).toBe(false);
      expect(flags.adminDashboard).toBe(false);
      expect(flags.resendVerification).toBe(false);
    });
  });
});
