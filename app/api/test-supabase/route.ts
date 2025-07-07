import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export interface TestSupabaseResponse {
  success?: boolean;
  message?: string;
  tables?: {
    agencies: {
      connected: boolean;
      count?: number;
    };
  };
  error?: string | any;
  env?: {
    url: string;
    key: string;
  };
}

export async function GET() {
  try {
    if (!supabase) {
      return NextResponse.json<TestSupabaseResponse>(
        {
          error: 'Supabase client not initialized',
          env: {
            url: 'Not set',
            key: 'Not set',
          },
        },
        { status: 500 }
      );
    }

    // Try to query agencies table to test connection
    const { data, error } = await supabase
      .from('agencies')
      .select('id')
      .range(0, 0);

    if (error) {
      return NextResponse.json<TestSupabaseResponse>(
        {
          success: false,
          message: 'Failed to connect to Supabase',
          error: error,
          tables: {
            agencies: {
              connected: false,
            },
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json<TestSupabaseResponse>({
      success: true,
      message: 'Successfully connected to Supabase',
      tables: {
        agencies: {
          connected: true,
          count: data?.length || 0,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json<TestSupabaseResponse>(
      {
        success: false,
        message: 'Connection test failed',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
