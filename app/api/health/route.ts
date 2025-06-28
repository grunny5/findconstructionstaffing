import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  checks: {
    api: boolean;
    database: boolean;
    environment: boolean;
  };
  details: {
    environment: string;
    version?: string;
    uptime?: number;
    message?: string;
  };
}

/**
 * Health check endpoint for load testing and monitoring
 * Returns 200 if all checks pass, 503 if any check fails
 */
export async function GET(): Promise<NextResponse<HealthCheckResponse>> {
  const startTime = Date.now();
  const checks = {
    api: true,
    database: false,
    environment: false,
  };
  
  let overallStatus: 'healthy' | 'unhealthy' = 'healthy';
  let message: string | undefined;

  // Check environment variables
  try {
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY'
    ];
    
    const missingVars = requiredEnvVars.filter(
      varName => !process.env[varName]
    );
    
    if (missingVars.length === 0) {
      checks.environment = true;
    } else {
      overallStatus = 'unhealthy';
      message = `Missing environment variables: ${missingVars.join(', ')}`;
    }
  } catch (error) {
    checks.environment = false;
    overallStatus = 'unhealthy';
    message = 'Failed to check environment variables';
  }

  // Check database connection
  try {
    if (supabase && checks.environment) {
      // Perform a simple query to verify database connectivity
      const { error } = await supabase
        .from('agencies')
        .select('id')
        .limit(1);
      
      if (!error) {
        checks.database = true;
      } else {
        checks.database = false;
        overallStatus = 'unhealthy';
        message = `Database check failed: ${error.message}`;
      }
    } else {
      checks.database = false;
      overallStatus = 'unhealthy';
      if (!message) {
        message = 'Database client not initialized';
      }
    }
  } catch (error) {
    checks.database = false;
    overallStatus = 'unhealthy';
    message = `Database check error: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }

  const response: HealthCheckResponse = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    checks,
    details: {
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version,
      uptime: process.uptime ? Math.floor(process.uptime()) : undefined,
      message
    }
  };

  // Return appropriate status code based on health
  return NextResponse.json(
    response,
    { 
      status: overallStatus === 'healthy' ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Response-Time': `${Date.now() - startTime}ms`
      }
    }
  );
}