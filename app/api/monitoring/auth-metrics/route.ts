import { NextRequest, NextResponse } from 'next/server';
import {
  getAuthMetrics,
  DEFAULT_ALERT_THRESHOLDS,
} from '@/lib/monitoring/auth-metrics';

/**
 * GET /api/monitoring/auth-metrics
 * Returns current authentication metrics
 *
 * Authentication:
 * - Development: No authentication required
 * - Production: Requires MONITORING_API_KEY header
 *
 * Response includes:
 * - Email verification metrics (sent, completed, failed, completion rate)
 * - Email delivery metrics (delivered, bounced, complained, delivery rate)
 * - Password reset metrics (requested, completed, failed, success rate)
 * - Role change metrics (successful, failed, success rate)
 * - Authentication metrics (login/signup success/failure, error rate)
 * - Alert thresholds configuration
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  // In production, require API key for security
  if (process.env.NODE_ENV === 'production') {
    const apiKey = request.headers.get('x-monitoring-key');
    const expectedKey = process.env.MONITORING_API_KEY;

    if (!expectedKey) {
      console.warn(
        '[Auth Metrics] MONITORING_API_KEY not configured in production'
      );
      return NextResponse.json(
        { error: 'Monitoring not configured' },
        { status: 500 }
      );
    }

    if (apiKey !== expectedKey) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid or missing API key' },
        { status: 401 }
      );
    }
  }

  try {
    // Get current metrics
    const metrics = getAuthMetrics();

    // Include alert thresholds for reference
    const response = {
      metrics,
      alertThresholds: DEFAULT_ALERT_THRESHOLDS,
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('[Auth Metrics] Error fetching metrics:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch auth metrics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/monitoring/auth-metrics/test
 * Test endpoint to trigger sample events (development only)
 *
 * This allows testing the monitoring system without real user activity.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Test endpoint not available in production' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { eventType, count = 1 } = body;

    const {
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
    } = await import('@/lib/monitoring/auth-metrics');

    // Track the specified event type
    for (let i = 0; i < count; i++) {
      switch (eventType) {
        case 'email_verification_sent':
          trackEmailVerificationSent('example.com');
          break;
        case 'email_verification_completed':
          trackEmailVerificationCompleted();
          break;
        case 'email_verification_failed':
          trackEmailVerificationFailed('Test failure');
          break;
        case 'email_delivered':
          trackEmailDelivered('example.com');
          break;
        case 'email_bounced_hard':
          trackEmailBounced('hard', 'example.com');
          break;
        case 'email_bounced_soft':
          trackEmailBounced('soft', 'example.com');
          break;
        case 'email_complained':
          trackEmailComplained('example.com');
          break;
        case 'password_reset_requested':
          trackPasswordResetRequested();
          break;
        case 'password_reset_completed':
          trackPasswordResetCompleted();
          break;
        case 'password_reset_failed':
          trackPasswordResetFailed('Test failure');
          break;
        case 'role_changed':
          trackRoleChanged('job_seeker', 'agency_owner');
          break;
        case 'role_change_failed':
          trackRoleChangeFailed('Test failure', 'job_seeker', 'agency_owner');
          break;
        case 'auth_error':
          trackAuthError('Test error');
          break;
        case 'login_success':
          trackLoginSuccess();
          break;
        case 'login_failed':
          trackLoginFailed('Test failure');
          break;
        case 'signup_success':
          trackSignupSuccess();
          break;
        case 'signup_failed':
          trackSignupFailed('Test failure');
          break;
        default:
          return NextResponse.json(
            { error: `Unknown event type: ${eventType}` },
            { status: 400 }
          );
      }
    }

    // Get updated metrics
    const metrics = getAuthMetrics();

    return NextResponse.json({
      message: `Tracked ${count} ${eventType} event(s)`,
      metrics,
    });
  } catch (error) {
    console.error('[Auth Metrics] Error in test endpoint:', error);

    return NextResponse.json(
      {
        error: 'Failed to process test event',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
