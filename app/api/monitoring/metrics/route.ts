import { NextRequest, NextResponse } from 'next/server';
import { ErrorRateTracker } from '@/lib/monitoring/performance';
import { HTTP_STATUS } from '@/types/api';

/**
 * GET /api/monitoring/metrics
 * 
 * Returns current performance metrics and error rates
 * This endpoint should be protected in production
 */
export async function GET(request: NextRequest) {
  // In production, add authentication check here
  // For now, only allow in development
  const monitoringKey = process.env.MONITORING_API_KEY;
  const providedKey = request.headers.get('x-monitoring-key');
  
  if (process.env.NODE_ENV === 'production' && (!monitoringKey || providedKey !== monitoringKey)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const errorTracker = ErrorRateTracker.getInstance();
  const errorRates = errorTracker.getAllErrorRates();

  const metrics = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    errorRates,
    // In a real implementation, we would aggregate performance data from logs
    // For now, we'll return the structure that would be populated
    performance: {
      agencies: {
        p50: 0, // Would be calculated from logged metrics
        p95: 0,
        p99: 0,
        avgResponseTime: 0,
        avgQueryTime: 0,
        requestCount: errorRates['/api/agencies']?.totalRequests || 0
      }
    },
    alerts: {
      // Would be populated from alert history
      recent: [],
      active: []
    }
  };

  return NextResponse.json(metrics, {
    status: HTTP_STATUS.OK,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  });
}