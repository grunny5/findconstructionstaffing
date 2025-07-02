import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    if (!supabase) {
      return NextResponse.json(
        {
          error: 'Supabase client not initialized',
          env: {
            url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set',
            key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set',
          },
        },
        { status: 500 }
      );
    }

    // Try to query agencies table to test connection
    const { data, error } = await supabase
      .from('agencies')
      .select('*')
      .limit(1);

    if (error) {
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to connect to Supabase',
          error: error,
          tables: {
            agencies: {
              connected: false,
              error: error,
            },
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
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
    return NextResponse.json(
      {
        success: false,
        message: 'Connection test failed',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
