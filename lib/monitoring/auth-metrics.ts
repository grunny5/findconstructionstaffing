/**
 * Authentication Metrics Tracking
 *
 * Provides structured monitoring for authentication-related events:
 * - Email verification flow (sent, completed, failed)
 * - Password reset flow (requested, completed, failed)
 * - Role changes (success, failure)
 * - Authentication errors
 * - Email delivery status (from webhooks)
 *
 * Metrics are tracked in a time-windowed fashion (1-hour windows)
 * and can be queried for dashboards and alerting.
 */

export type AuthEventType =
  | 'email_verification_sent'
  | 'email_verification_completed'
  | 'email_verification_failed'
  | 'email_delivered'
  | 'email_bounced'
  | 'email_complained'
  | 'password_reset_requested'
  | 'password_reset_completed'
  | 'password_reset_failed'
  | 'role_changed'
  | 'role_change_failed'
  | 'auth_error'
  | 'login_success'
  | 'login_failed'
  | 'signup_success'
  | 'signup_failed';

export interface AuthEvent {
  type: AuthEventType;
  timestamp: string;
  metadata?: {
    userId?: string;
    errorMessage?: string;
    emailDomain?: string;
    fromRole?: string;
    toRole?: string;
    bounceType?: 'hard' | 'soft';
    [key: string]: any;
  };
}

export interface AuthMetrics {
  emailVerification: {
    sent: number;
    completed: number;
    failed: number;
    completionRate: number; // percentage
    delivered: number;
    bounced: number;
    complained: number;
    deliveryRate: number; // percentage
  };
  passwordReset: {
    requested: number;
    completed: number;
    failed: number;
    successRate: number; // percentage
  };
  roleChanges: {
    successful: number;
    failed: number;
    successRate: number; // percentage
  };
  authentication: {
    loginSuccess: number;
    loginFailed: number;
    signupSuccess: number;
    signupFailed: number;
    totalErrors: number;
    errorRate: number; // percentage
  };
  timestamp: string;
  windowStart: string;
  windowEnd: string;
}

/**
 * Alert configuration for auth metrics
 */
export interface AuthAlertThresholds {
  emailVerificationCompletionRate: number; // Alert if below this percentage
  emailDeliveryRate: number; // Alert if below this percentage
  passwordResetSuccessRate: number; // Alert if below this percentage
  authenticationErrorRate: number; // Alert if above this percentage
  hardBounceCount: number; // Alert if hard bounces exceed this count
  spamComplaintCount: number; // Alert if spam complaints exceed this count
}

/**
 * Default alert thresholds
 */
export const DEFAULT_ALERT_THRESHOLDS: AuthAlertThresholds = {
  emailVerificationCompletionRate: 70, // Alert if <70% complete verification
  emailDeliveryRate: 95, // Alert if <95% emails delivered
  passwordResetSuccessRate: 80, // Alert if <80% complete password reset
  authenticationErrorRate: 5, // Alert if >5% auth errors
  hardBounceCount: 10, // Alert if >10 hard bounces in window
  spamComplaintCount: 3, // Alert if >3 spam complaints in window
};

/**
 * Auth Metrics Tracker - Singleton instance for tracking auth events
 *
 * IMPORTANT: This tracker is per-process and does NOT synchronize across multiple
 * workers or processes. For production with multiple workers, consider:
 * - External metrics storage (Redis, Prometheus)
 * - Aggregation at load balancer level
 * - Centralized logging solutions (Datadog, New Relic)
 */
export class AuthMetricsTracker {
  private static instance?: AuthMetricsTracker;
  private events: AuthEvent[] = [];
  private windowStart: number = Date.now();
  private readonly WINDOW_SIZE = 3600000; // 1 hour window
  private readonly MAX_EVENTS = 10000; // Max events to keep in memory

  private constructor() {}

  static getInstance(): AuthMetricsTracker {
    if (!AuthMetricsTracker.instance) {
      AuthMetricsTracker.instance = new AuthMetricsTracker();
    }
    return AuthMetricsTracker.instance;
  }

  /**
   * Record an authentication event
   */
  recordEvent(type: AuthEventType, metadata?: AuthEvent['metadata']): void {
    this.checkWindow();
    this.enforceMemoryLimit();

    const event: AuthEvent = {
      type,
      timestamp: new Date().toISOString(),
      metadata,
    };

    this.events.push(event);

    // Log event in structured format
    this.logEvent(event);

    // Check for alerts
    this.checkAlerts();
  }

  /**
   * Get current metrics for the active window
   */
  getMetrics(): AuthMetrics {
    this.checkWindow();

    const now = new Date();
    const windowStartDate = new Date(this.windowStart);

    // Count events by type
    const counts = this.countEventsByType();

    // Calculate email verification metrics
    const emailVerificationSent = counts.email_verification_sent || 0;
    const emailVerificationCompleted = counts.email_verification_completed || 0;
    const emailVerificationFailed = counts.email_verification_failed || 0;
    const emailDelivered = counts.email_delivered || 0;
    const emailBounced = counts.email_bounced || 0;
    const emailComplained = counts.email_complained || 0;

    const emailVerificationTotal =
      emailVerificationCompleted + emailVerificationFailed;
    const emailVerificationCompletionRate =
      emailVerificationSent > 0
        ? (emailVerificationCompleted / emailVerificationSent) * 100
        : 0;

    const emailsSent = emailVerificationSent;
    const emailDeliveryRate =
      emailsSent > 0 ? (emailDelivered / emailsSent) * 100 : 0;

    // Calculate password reset metrics
    const passwordResetRequested = counts.password_reset_requested || 0;
    const passwordResetCompleted = counts.password_reset_completed || 0;
    const passwordResetFailed = counts.password_reset_failed || 0;
    const passwordResetTotal = passwordResetCompleted + passwordResetFailed;
    const passwordResetSuccessRate =
      passwordResetTotal > 0
        ? (passwordResetCompleted / passwordResetTotal) * 100
        : 0;

    // Calculate role change metrics
    const roleChangeSuccessful = counts.role_changed || 0;
    const roleChangeFailed = counts.role_change_failed || 0;
    const roleChangeTotal = roleChangeSuccessful + roleChangeFailed;
    const roleChangeSuccessRate =
      roleChangeTotal > 0 ? (roleChangeSuccessful / roleChangeTotal) * 100 : 0;

    // Calculate authentication metrics
    const loginSuccess = counts.login_success || 0;
    const loginFailed = counts.login_failed || 0;
    const signupSuccess = counts.signup_success || 0;
    const signupFailed = counts.signup_failed || 0;
    const authErrors = counts.auth_error || 0;

    const totalAuthAttempts =
      loginSuccess + loginFailed + signupSuccess + signupFailed;
    const totalAuthErrors = loginFailed + signupFailed + authErrors;
    const authErrorRate =
      totalAuthAttempts > 0 ? (totalAuthErrors / totalAuthAttempts) * 100 : 0;

    return {
      emailVerification: {
        sent: emailVerificationSent,
        completed: emailVerificationCompleted,
        failed: emailVerificationFailed,
        completionRate: Math.round(emailVerificationCompletionRate * 100) / 100,
        delivered: emailDelivered,
        bounced: emailBounced,
        complained: emailComplained,
        deliveryRate: Math.round(emailDeliveryRate * 100) / 100,
      },
      passwordReset: {
        requested: passwordResetRequested,
        completed: passwordResetCompleted,
        failed: passwordResetFailed,
        successRate: Math.round(passwordResetSuccessRate * 100) / 100,
      },
      roleChanges: {
        successful: roleChangeSuccessful,
        failed: roleChangeFailed,
        successRate: Math.round(roleChangeSuccessRate * 100) / 100,
      },
      authentication: {
        loginSuccess,
        loginFailed,
        signupSuccess,
        signupFailed,
        totalErrors: totalAuthErrors,
        errorRate: Math.round(authErrorRate * 100) / 100,
      },
      timestamp: now.toISOString(),
      windowStart: windowStartDate.toISOString(),
      windowEnd: now.toISOString(),
    };
  }

  /**
   * Count events by type
   */
  private countEventsByType(): Record<AuthEventType, number> {
    const counts: Partial<Record<AuthEventType, number>> = {};

    for (const event of this.events) {
      counts[event.type] = (counts[event.type] || 0) + 1;
    }

    return counts as Record<AuthEventType, number>;
  }

  /**
   * Get hard bounce count (for alerting)
   */
  private getHardBounceCount(): number {
    return this.events.filter(
      (e) => e.type === 'email_bounced' && e.metadata?.bounceType === 'hard'
    ).length;
  }

  /**
   * Get spam complaint count (for alerting)
   */
  private getSpamComplaintCount(): number {
    return this.events.filter((e) => e.type === 'email_complained').length;
  }

  /**
   * Check for alert conditions
   */
  private checkAlerts(
    thresholds: AuthAlertThresholds = DEFAULT_ALERT_THRESHOLDS
  ): void {
    const metrics = this.getMetrics();

    // Email verification completion rate
    if (
      metrics.emailVerification.sent > 10 &&
      metrics.emailVerification.completionRate <
        thresholds.emailVerificationCompletionRate
    ) {
      this.sendAlert({
        severity: 'warning',
        title: 'Low Email Verification Completion Rate',
        description: `Email verification completion rate is ${metrics.emailVerification.completionRate.toFixed(1)}% (threshold: ${thresholds.emailVerificationCompletionRate}%)`,
        metrics: {
          completionRate: metrics.emailVerification.completionRate,
          sent: metrics.emailVerification.sent,
          completed: metrics.emailVerification.completed,
        },
      });
    }

    // Email delivery rate
    if (
      metrics.emailVerification.sent > 10 &&
      metrics.emailVerification.deliveryRate < thresholds.emailDeliveryRate
    ) {
      this.sendAlert({
        severity: 'error',
        title: 'Low Email Delivery Rate',
        description: `Email delivery rate is ${metrics.emailVerification.deliveryRate.toFixed(1)}% (threshold: ${thresholds.emailDeliveryRate}%)`,
        metrics: {
          deliveryRate: metrics.emailVerification.deliveryRate,
          sent: metrics.emailVerification.sent,
          delivered: metrics.emailVerification.delivered,
          bounced: metrics.emailVerification.bounced,
        },
      });
    }

    // Password reset success rate
    if (
      metrics.passwordReset.requested > 5 &&
      metrics.passwordReset.successRate < thresholds.passwordResetSuccessRate
    ) {
      this.sendAlert({
        severity: 'warning',
        title: 'Low Password Reset Success Rate',
        description: `Password reset success rate is ${metrics.passwordReset.successRate.toFixed(1)}% (threshold: ${thresholds.passwordResetSuccessRate}%)`,
        metrics: {
          successRate: metrics.passwordReset.successRate,
          requested: metrics.passwordReset.requested,
          completed: metrics.passwordReset.completed,
          failed: metrics.passwordReset.failed,
        },
      });
    }

    // Authentication error rate
    const totalAttempts =
      metrics.authentication.loginSuccess +
      metrics.authentication.loginFailed +
      metrics.authentication.signupSuccess +
      metrics.authentication.signupFailed;

    if (
      totalAttempts > 20 &&
      metrics.authentication.errorRate > thresholds.authenticationErrorRate
    ) {
      this.sendAlert({
        severity: 'error',
        title: 'High Authentication Error Rate',
        description: `Authentication error rate is ${metrics.authentication.errorRate.toFixed(1)}% (threshold: ${thresholds.authenticationErrorRate}%)`,
        metrics: {
          errorRate: metrics.authentication.errorRate,
          totalErrors: metrics.authentication.totalErrors,
          totalAttempts,
        },
      });
    }

    // Hard bounce count
    const hardBounces = this.getHardBounceCount();
    if (hardBounces > thresholds.hardBounceCount) {
      this.sendAlert({
        severity: 'critical',
        title: 'High Hard Bounce Count',
        description: `Hard bounce count is ${hardBounces} (threshold: ${thresholds.hardBounceCount})`,
        metrics: {
          hardBounces,
          totalBounces: metrics.emailVerification.bounced,
        },
      });
    }

    // Spam complaint count
    const spamComplaints = this.getSpamComplaintCount();
    if (spamComplaints > thresholds.spamComplaintCount) {
      this.sendAlert({
        severity: 'critical',
        title: 'High Spam Complaint Count',
        description: `Spam complaint count is ${spamComplaints} (threshold: ${thresholds.spamComplaintCount})`,
        metrics: {
          spamComplaints,
        },
      });
    }
  }

  /**
   * Log event in structured format
   */
  private logEvent(event: AuthEvent): void {
    const logData = {
      type: 'auth_event',
      event: event.type,
      timestamp: event.timestamp,
      ...event.metadata,
    };

    if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify(logData));
    } else {
      console.log(`[Auth Event] ${event.type}`, event.metadata || {});
    }
  }

  /**
   * Send alert to monitoring service
   */
  private sendAlert(alert: {
    severity: 'warning' | 'error' | 'critical';
    title: string;
    description: string;
    metrics: Record<string, any>;
  }): void {
    const alertData = {
      type: 'auth_alert',
      ...alert,
      timestamp: new Date().toISOString(),
    };

    // Log alert
    const logLevel = alert.severity === 'critical' ? 'error' : 'warn';
    if (process.env.NODE_ENV === 'production') {
      console[logLevel](JSON.stringify(alertData));
    } else {
      console[logLevel](`[Auth Alert] ${alert.title}`, {
        description: alert.description,
        metrics: alert.metrics,
      });
    }

    // TODO: Integrate with external alerting service
    // Examples:
    // - Sentry: Sentry.captureMessage(alert.title, { level: alert.severity, extra: alert.metrics })
    // - Datadog: dogstatsd.increment('auth.alert', { severity: alert.severity })
    // - Slack: webhook.send({ text: alert.title, attachments: [...] })
    // - PagerDuty: client.trigger({ title: alert.title, severity: alert.severity })
  }

  /**
   * Check if we need to reset the window
   */
  private checkWindow(): void {
    const now = Date.now();
    if (now - this.windowStart > this.WINDOW_SIZE) {
      // Archive old events (in production, send to long-term storage)
      if (process.env.NODE_ENV === 'production' && this.events.length > 0) {
        console.log(
          JSON.stringify({
            type: 'auth_metrics_archive',
            windowStart: new Date(this.windowStart).toISOString(),
            windowEnd: new Date(now).toISOString(),
            metrics: this.getMetrics(),
            eventCount: this.events.length,
          })
        );
      }

      // Reset window
      this.events = [];
      this.windowStart = now;
    }
  }

  /**
   * Enforce memory limits
   */
  private enforceMemoryLimit(): void {
    if (this.events.length >= this.MAX_EVENTS) {
      // Remove oldest 20% of events
      const toRemove = Math.ceil(this.MAX_EVENTS * 0.2);
      this.events = this.events.slice(toRemove);

      console.warn(
        `[Auth Metrics] Memory limit reached, removed ${toRemove} oldest events`
      );
    }
  }

  /**
   * Reset tracker - useful for testing
   */
  reset(): void {
    this.events = [];
    this.windowStart = Date.now();
  }

  /**
   * Reset singleton instance - for testing
   */
  static resetInstance(): void {
    AuthMetricsTracker.instance = undefined;
  }
}

/**
 * Convenience functions for tracking common auth events
 */

export function trackEmailVerificationSent(emailDomain?: string): void {
  AuthMetricsTracker.getInstance().recordEvent('email_verification_sent', {
    emailDomain,
  });
}

export function trackEmailVerificationCompleted(userId?: string): void {
  AuthMetricsTracker.getInstance().recordEvent('email_verification_completed', {
    userId,
  });
}

export function trackEmailVerificationFailed(errorMessage?: string): void {
  AuthMetricsTracker.getInstance().recordEvent('email_verification_failed', {
    errorMessage,
  });
}

export function trackEmailDelivered(emailDomain?: string): void {
  AuthMetricsTracker.getInstance().recordEvent('email_delivered', {
    emailDomain,
  });
}

export function trackEmailBounced(
  bounceType: 'hard' | 'soft',
  emailDomain?: string
): void {
  AuthMetricsTracker.getInstance().recordEvent('email_bounced', {
    bounceType,
    emailDomain,
  });
}

export function trackEmailComplained(emailDomain?: string): void {
  AuthMetricsTracker.getInstance().recordEvent('email_complained', {
    emailDomain,
  });
}

export function trackPasswordResetRequested(): void {
  AuthMetricsTracker.getInstance().recordEvent('password_reset_requested');
}

export function trackPasswordResetCompleted(userId?: string): void {
  AuthMetricsTracker.getInstance().recordEvent('password_reset_completed', {
    userId,
  });
}

export function trackPasswordResetFailed(errorMessage?: string): void {
  AuthMetricsTracker.getInstance().recordEvent('password_reset_failed', {
    errorMessage,
  });
}

export function trackRoleChanged(fromRole: string, toRole: string): void {
  AuthMetricsTracker.getInstance().recordEvent('role_changed', {
    fromRole,
    toRole,
  });
}

export function trackRoleChangeFailed(
  errorMessage: string,
  fromRole?: string,
  toRole?: string
): void {
  AuthMetricsTracker.getInstance().recordEvent('role_change_failed', {
    errorMessage,
    fromRole,
    toRole,
  });
}

export function trackAuthError(errorMessage: string): void {
  AuthMetricsTracker.getInstance().recordEvent('auth_error', {
    errorMessage,
  });
}

export function trackLoginSuccess(userId?: string): void {
  AuthMetricsTracker.getInstance().recordEvent('login_success', {
    userId,
  });
}

export function trackLoginFailed(errorMessage?: string): void {
  AuthMetricsTracker.getInstance().recordEvent('login_failed', {
    errorMessage,
  });
}

export function trackSignupSuccess(userId?: string): void {
  AuthMetricsTracker.getInstance().recordEvent('signup_success', {
    userId,
  });
}

export function trackSignupFailed(errorMessage?: string): void {
  AuthMetricsTracker.getInstance().recordEvent('signup_failed', {
    errorMessage,
  });
}

/**
 * Get current auth metrics
 */
export function getAuthMetrics(): AuthMetrics {
  return AuthMetricsTracker.getInstance().getMetrics();
}
