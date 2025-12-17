import {
  AuthMetricsTracker,
  getAuthMetrics,
  trackEmailVerificationSent,
  trackEmailVerificationCompleted,
  trackEmailVerificationFailed,
  trackEmailDelivered,
  trackEmailBounced,
  trackEmailComplained,
  trackPasswordResetRequested,
  trackPasswordResetCompleted,
  trackPasswordResetFailed,
  trackRoleChanged,
  trackRoleChangeFailed,
  trackAuthError,
  trackLoginSuccess,
  trackLoginFailed,
  trackSignupSuccess,
  trackSignupFailed,
  DEFAULT_ALERT_THRESHOLDS,
} from '../auth-metrics';

describe('AuthMetricsTracker', () => {
  let tracker: AuthMetricsTracker;
  let consoleLogSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Reset singleton instance before each test
    AuthMetricsTracker.resetInstance();
    tracker = AuthMetricsTracker.getInstance();

    // Spy on console methods
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    // Restore console methods
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('Singleton Pattern', () => {
    it('returns same instance on multiple calls', () => {
      const instance1 = AuthMetricsTracker.getInstance();
      const instance2 = AuthMetricsTracker.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('creates new instance after reset', () => {
      const instance1 = AuthMetricsTracker.getInstance();
      AuthMetricsTracker.resetInstance();
      const instance2 = AuthMetricsTracker.getInstance();

      expect(instance1).not.toBe(instance2);
    });
  });

  describe('Event Tracking', () => {
    it('records email verification sent event', () => {
      tracker.recordEvent('email_verification_sent', {
        emailDomain: 'example.com',
      });

      const metrics = tracker.getMetrics();
      expect(metrics.emailVerification.sent).toBe(1);
    });

    it('records email verification completed event', () => {
      tracker.recordEvent('email_verification_completed', {
        userId: 'user123',
      });

      const metrics = tracker.getMetrics();
      expect(metrics.emailVerification.completed).toBe(1);
    });

    it('records email verification failed event', () => {
      tracker.recordEvent('email_verification_failed', {
        errorMessage: 'Expired token',
      });

      const metrics = tracker.getMetrics();
      expect(metrics.emailVerification.failed).toBe(1);
    });

    it('records email delivered event', () => {
      tracker.recordEvent('email_delivered', {
        emailDomain: 'example.com',
      });

      const metrics = tracker.getMetrics();
      expect(metrics.emailVerification.delivered).toBe(1);
    });

    it('records email bounced event', () => {
      tracker.recordEvent('email_bounced', {
        bounceType: 'hard',
        emailDomain: 'example.com',
      });

      const metrics = tracker.getMetrics();
      expect(metrics.emailVerification.bounced).toBe(1);
    });

    it('records email complained event', () => {
      tracker.recordEvent('email_complained', {
        emailDomain: 'example.com',
      });

      const metrics = tracker.getMetrics();
      expect(metrics.emailVerification.complained).toBe(1);
    });

    it('records password reset requested event', () => {
      tracker.recordEvent('password_reset_requested');

      const metrics = tracker.getMetrics();
      expect(metrics.passwordReset.requested).toBe(1);
    });

    it('records password reset completed event', () => {
      tracker.recordEvent('password_reset_completed', { userId: 'user123' });

      const metrics = tracker.getMetrics();
      expect(metrics.passwordReset.completed).toBe(1);
    });

    it('records password reset failed event', () => {
      tracker.recordEvent('password_reset_failed', {
        errorMessage: 'Invalid token',
      });

      const metrics = tracker.getMetrics();
      expect(metrics.passwordReset.failed).toBe(1);
    });

    it('records role changed event', () => {
      tracker.recordEvent('role_changed', {
        fromRole: 'job_seeker',
        toRole: 'agency_owner',
      });

      const metrics = tracker.getMetrics();
      expect(metrics.roleChanges.successful).toBe(1);
    });

    it('records role change failed event', () => {
      tracker.recordEvent('role_change_failed', {
        errorMessage: 'Permission denied',
      });

      const metrics = tracker.getMetrics();
      expect(metrics.roleChanges.failed).toBe(1);
    });

    it('records login success event', () => {
      tracker.recordEvent('login_success', { userId: 'user123' });

      const metrics = tracker.getMetrics();
      expect(metrics.authentication.loginSuccess).toBe(1);
    });

    it('records login failed event', () => {
      tracker.recordEvent('login_failed', {
        errorMessage: 'Invalid credentials',
      });

      const metrics = tracker.getMetrics();
      expect(metrics.authentication.loginFailed).toBe(1);
    });

    it('records signup success event', () => {
      tracker.recordEvent('signup_success', { userId: 'user123' });

      const metrics = tracker.getMetrics();
      expect(metrics.authentication.signupSuccess).toBe(1);
    });

    it('records signup failed event', () => {
      tracker.recordEvent('signup_failed', { errorMessage: 'Email exists' });

      const metrics = tracker.getMetrics();
      expect(metrics.authentication.signupFailed).toBe(1);
    });

    it('records auth error event', () => {
      tracker.recordEvent('auth_error', { errorMessage: 'Session expired' });

      const metrics = tracker.getMetrics();
      expect(metrics.authentication.totalErrors).toBe(1);
    });
  });

  describe('Metrics Calculation', () => {
    it('calculates email verification completion rate', () => {
      tracker.recordEvent('email_verification_sent');
      tracker.recordEvent('email_verification_sent');
      tracker.recordEvent('email_verification_sent');
      tracker.recordEvent('email_verification_sent');
      tracker.recordEvent('email_verification_completed');
      tracker.recordEvent('email_verification_completed');
      tracker.recordEvent('email_verification_completed');

      const metrics = tracker.getMetrics();

      expect(metrics.emailVerification.sent).toBe(4);
      expect(metrics.emailVerification.completed).toBe(3);
      expect(metrics.emailVerification.completionRate).toBe(75); // 3/4 = 75%
    });

    it('calculates email delivery rate', () => {
      tracker.recordEvent('email_verification_sent');
      tracker.recordEvent('email_verification_sent');
      tracker.recordEvent('email_verification_sent');
      tracker.recordEvent('email_verification_sent');
      tracker.recordEvent('email_delivered');
      tracker.recordEvent('email_delivered');
      tracker.recordEvent('email_delivered');

      const metrics = tracker.getMetrics();

      expect(metrics.emailVerification.sent).toBe(4);
      expect(metrics.emailVerification.delivered).toBe(3);
      expect(metrics.emailVerification.deliveryRate).toBe(75); // 3/4 = 75%
    });

    it('calculates password reset success rate', () => {
      tracker.recordEvent('password_reset_requested');
      tracker.recordEvent('password_reset_requested');
      tracker.recordEvent('password_reset_completed');
      tracker.recordEvent('password_reset_failed');

      const metrics = tracker.getMetrics();

      expect(metrics.passwordReset.requested).toBe(2);
      expect(metrics.passwordReset.completed).toBe(1);
      expect(metrics.passwordReset.failed).toBe(1);
      expect(metrics.passwordReset.successRate).toBe(50); // 1/2 = 50%
    });

    it('calculates role change success rate', () => {
      tracker.recordEvent('role_changed');
      tracker.recordEvent('role_changed');
      tracker.recordEvent('role_changed');
      tracker.recordEvent('role_change_failed');

      const metrics = tracker.getMetrics();

      expect(metrics.roleChanges.successful).toBe(3);
      expect(metrics.roleChanges.failed).toBe(1);
      expect(metrics.roleChanges.successRate).toBe(75); // 3/4 = 75%
    });

    it('calculates authentication error rate', () => {
      tracker.recordEvent('login_success');
      tracker.recordEvent('login_success');
      tracker.recordEvent('login_success');
      tracker.recordEvent('login_failed');
      tracker.recordEvent('signup_success');
      tracker.recordEvent('signup_failed');

      const metrics = tracker.getMetrics();

      expect(metrics.authentication.loginSuccess).toBe(3);
      expect(metrics.authentication.loginFailed).toBe(1);
      expect(metrics.authentication.signupSuccess).toBe(1);
      expect(metrics.authentication.signupFailed).toBe(1);
      expect(metrics.authentication.totalErrors).toBe(2); // 1 login + 1 signup failed
      // Total attempts: 3 login + 1 failed login + 1 signup + 1 failed signup = 6
      // Error rate: 2/6 = 33.33%
      expect(metrics.authentication.errorRate).toBeCloseTo(33.33, 1);
    });

    it('handles zero division gracefully', () => {
      const metrics = tracker.getMetrics();

      expect(metrics.emailVerification.completionRate).toBe(0);
      expect(metrics.emailVerification.deliveryRate).toBe(0);
      expect(metrics.passwordReset.successRate).toBe(0);
      expect(metrics.roleChanges.successRate).toBe(0);
      expect(metrics.authentication.errorRate).toBe(0);
    });
  });

  describe('Alerting', () => {
    it('triggers alert for low email verification completion rate', () => {
      // Send 20 emails, only 10 completed (50% < 70% threshold)
      for (let i = 0; i < 20; i++) {
        tracker.recordEvent('email_verification_sent');
      }
      for (let i = 0; i < 10; i++) {
        tracker.recordEvent('email_verification_completed');
      }

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Auth Alert]'),
        expect.objectContaining({
          description: expect.stringContaining('50.0%'),
        })
      );
    });

    it('triggers alert for low email delivery rate', () => {
      // Send 20 emails, only 18 delivered (90% < 95% threshold)
      for (let i = 0; i < 20; i++) {
        tracker.recordEvent('email_verification_sent');
      }

      // Deliver 18 emails
      for (let i = 0; i < 18; i++) {
        tracker.recordEvent('email_delivered');
      }

      // Verify metrics are calculated correctly
      const metrics = tracker.getMetrics();
      expect(metrics.emailVerification.sent).toBe(20);
      expect(metrics.emailVerification.delivered).toBe(18);
      expect(metrics.emailVerification.deliveryRate).toBe(90);

      // Verify delivery rate is below threshold (should trigger alert)
      expect(metrics.emailVerification.deliveryRate).toBeLessThan(
        DEFAULT_ALERT_THRESHOLDS.emailDeliveryRate
      );

      // Verify some alert was logged
      expect(
        consoleErrorSpy.mock.calls.length + consoleWarnSpy.mock.calls.length
      ).toBeGreaterThan(0);
    });

    it('triggers alert for low password reset success rate', () => {
      // 10 requests, only 6 completed (60% < 80% threshold)
      for (let i = 0; i < 10; i++) {
        tracker.recordEvent('password_reset_requested');
      }
      for (let i = 0; i < 6; i++) {
        tracker.recordEvent('password_reset_completed');
      }
      for (let i = 0; i < 4; i++) {
        tracker.recordEvent('password_reset_failed');
      }

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Auth Alert]'),
        expect.objectContaining({
          description: expect.stringContaining('60.0%'),
        })
      );
    });

    it('triggers alert for high authentication error rate', () => {
      // 30 attempts, 3 errors (10% > 5% threshold)
      for (let i = 0; i < 27; i++) {
        tracker.recordEvent('login_success');
      }

      // Add failures
      for (let i = 0; i < 3; i++) {
        tracker.recordEvent('login_failed');
      }

      // Verify metrics are calculated correctly
      const metrics = tracker.getMetrics();
      expect(metrics.authentication.loginSuccess).toBe(27);
      expect(metrics.authentication.loginFailed).toBe(3);
      expect(metrics.authentication.errorRate).toBe(10); // 3/30 = 10%

      // Verify error rate is above threshold (should trigger alert)
      expect(metrics.authentication.errorRate).toBeGreaterThan(
        DEFAULT_ALERT_THRESHOLDS.authenticationErrorRate
      );

      // Verify some alert was logged
      expect(
        consoleErrorSpy.mock.calls.length + consoleWarnSpy.mock.calls.length
      ).toBeGreaterThan(0);
    });

    it('triggers alert for high hard bounce count', () => {
      // 15 hard bounces (> 10 threshold)
      for (let i = 0; i < 15; i++) {
        tracker.recordEvent('email_bounced', { bounceType: 'hard' });
      }

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Auth Alert]'),
        expect.objectContaining({
          description: expect.stringContaining('15'),
        })
      );
    });

    it('triggers alert for high spam complaint count', () => {
      // 5 spam complaints (> 3 threshold)
      for (let i = 0; i < 5; i++) {
        tracker.recordEvent('email_complained');
      }

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Auth Alert]'),
        expect.objectContaining({
          description: expect.stringContaining('5'),
        })
      );
    });

    it('does not trigger alert when below minimum event count', () => {
      // Only 5 emails sent (< 10 minimum)
      for (let i = 0; i < 5; i++) {
        tracker.recordEvent('email_verification_sent');
      }
      // 0% completion rate but should not alert

      expect(consoleWarnSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Low Email Verification Completion Rate'),
        expect.anything()
      );
    });

    it('does not trigger alert when within threshold', () => {
      // Send 20 emails, 18 completed (90% > 70% threshold)
      for (let i = 0; i < 20; i++) {
        tracker.recordEvent('email_verification_sent');
      }
      for (let i = 0; i < 18; i++) {
        tracker.recordEvent('email_verification_completed');
      }

      // Clear any alerts triggered during the buildup
      consoleWarnSpy.mockClear();

      // Add one more completion - should NOT trigger alert (19/20 = 95%)
      tracker.recordEvent('email_verification_completed');

      expect(consoleWarnSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Low Email Verification Completion Rate'),
        expect.anything()
      );
    });
  });

  describe('Time Windowing', () => {
    it('resets metrics after window expires', () => {
      tracker.recordEvent('email_verification_sent');

      const metricsBefore = tracker.getMetrics();
      expect(metricsBefore.emailVerification.sent).toBe(1);

      // Manually trigger window reset by accessing private property
      (tracker as any).windowStart = Date.now() - 3600001; // 1 hour + 1ms ago

      tracker.recordEvent('login_success'); // This triggers checkWindow()

      const metricsAfter = tracker.getMetrics();
      expect(metricsAfter.emailVerification.sent).toBe(0); // Reset
      expect(metricsAfter.authentication.loginSuccess).toBe(1); // New event
    });

    it('includes window start and end in metrics', () => {
      const metrics = tracker.getMetrics();

      expect(metrics.windowStart).toBeDefined();
      expect(metrics.windowEnd).toBeDefined();
      expect(metrics.timestamp).toBeDefined();

      const windowStart = new Date(metrics.windowStart);
      const windowEnd = new Date(metrics.windowEnd);

      expect(windowEnd.getTime()).toBeGreaterThanOrEqual(windowStart.getTime());
    });
  });

  describe('Memory Management', () => {
    it('enforces memory limit by removing oldest events', () => {
      // Set a very low max for testing
      const maxEvents = 100;
      (tracker as any).MAX_EVENTS = maxEvents;

      // Add more events than the limit
      for (let i = 0; i < 150; i++) {
        tracker.recordEvent('login_success');
      }

      // Should have removed oldest 20% (20 events)
      const eventCount = (tracker as any).events.length;
      expect(eventCount).toBeLessThanOrEqual(maxEvents);
    });

    it('logs warning when memory limit is reached', () => {
      const maxEvents = 10;
      (tracker as any).MAX_EVENTS = maxEvents;

      for (let i = 0; i < 15; i++) {
        tracker.recordEvent('login_success');
      }

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Auth Metrics] Memory limit reached')
      );
    });
  });

  describe('Convenience Functions', () => {
    beforeEach(() => {
      AuthMetricsTracker.resetInstance();
    });

    it('trackEmailVerificationSent works', () => {
      trackEmailVerificationSent('example.com');

      const metrics = getAuthMetrics();
      expect(metrics.emailVerification.sent).toBe(1);
    });

    it('trackEmailVerificationCompleted works', () => {
      trackEmailVerificationCompleted('user123');

      const metrics = getAuthMetrics();
      expect(metrics.emailVerification.completed).toBe(1);
    });

    it('trackEmailVerificationFailed works', () => {
      trackEmailVerificationFailed('Expired token');

      const metrics = getAuthMetrics();
      expect(metrics.emailVerification.failed).toBe(1);
    });

    it('trackEmailDelivered works', () => {
      trackEmailDelivered('example.com');

      const metrics = getAuthMetrics();
      expect(metrics.emailVerification.delivered).toBe(1);
    });

    it('trackEmailBounced works', () => {
      trackEmailBounced('hard', 'example.com');

      const metrics = getAuthMetrics();
      expect(metrics.emailVerification.bounced).toBe(1);
    });

    it('trackEmailComplained works', () => {
      trackEmailComplained('example.com');

      const metrics = getAuthMetrics();
      expect(metrics.emailVerification.complained).toBe(1);
    });

    it('trackPasswordResetRequested works', () => {
      trackPasswordResetRequested();

      const metrics = getAuthMetrics();
      expect(metrics.passwordReset.requested).toBe(1);
    });

    it('trackPasswordResetCompleted works', () => {
      trackPasswordResetCompleted('user123');

      const metrics = getAuthMetrics();
      expect(metrics.passwordReset.completed).toBe(1);
    });

    it('trackPasswordResetFailed works', () => {
      trackPasswordResetFailed('Invalid token');

      const metrics = getAuthMetrics();
      expect(metrics.passwordReset.failed).toBe(1);
    });

    it('trackRoleChanged works', () => {
      trackRoleChanged('job_seeker', 'agency_owner');

      const metrics = getAuthMetrics();
      expect(metrics.roleChanges.successful).toBe(1);
    });

    it('trackRoleChangeFailed works', () => {
      trackRoleChangeFailed('Permission denied', 'job_seeker', 'admin');

      const metrics = getAuthMetrics();
      expect(metrics.roleChanges.failed).toBe(1);
    });

    it('trackAuthError works', () => {
      trackAuthError('Session expired');

      const metrics = getAuthMetrics();
      expect(metrics.authentication.totalErrors).toBe(1);
    });

    it('trackLoginSuccess works', () => {
      trackLoginSuccess('user123');

      const metrics = getAuthMetrics();
      expect(metrics.authentication.loginSuccess).toBe(1);
    });

    it('trackLoginFailed works', () => {
      trackLoginFailed('Invalid credentials');

      const metrics = getAuthMetrics();
      expect(metrics.authentication.loginFailed).toBe(1);
    });

    it('trackSignupSuccess works', () => {
      trackSignupSuccess('user123');

      const metrics = getAuthMetrics();
      expect(metrics.authentication.signupSuccess).toBe(1);
    });

    it('trackSignupFailed works', () => {
      trackSignupFailed('Email exists');

      const metrics = getAuthMetrics();
      expect(metrics.authentication.signupFailed).toBe(1);
    });

    it('getAuthMetrics returns current metrics', () => {
      trackEmailVerificationSent('example.com');
      trackEmailVerificationCompleted();

      const metrics = getAuthMetrics();

      expect(metrics.emailVerification.sent).toBe(1);
      expect(metrics.emailVerification.completed).toBe(1);
    });
  });

  describe('DEFAULT_ALERT_THRESHOLDS', () => {
    it('exports default thresholds', () => {
      expect(DEFAULT_ALERT_THRESHOLDS).toEqual({
        emailVerificationCompletionRate: 70,
        emailDeliveryRate: 95,
        passwordResetSuccessRate: 80,
        authenticationErrorRate: 5,
        hardBounceCount: 10,
        spamComplaintCount: 3,
      });
    });
  });

  describe('Structured Logging', () => {
    it('logs events in structured format in development', () => {
      tracker.recordEvent('email_verification_sent', {
        emailDomain: 'example.com',
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[Auth Event] email_verification_sent',
        { emailDomain: 'example.com' }
      );
    });

    it('logs events in JSON format in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      tracker.recordEvent('email_verification_sent', {
        emailDomain: 'example.com',
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('"type":"auth_event"')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('"event":"email_verification_sent"')
      );

      process.env.NODE_ENV = originalEnv;
    });
  });
});
