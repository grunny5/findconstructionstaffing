import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    if (!supabase) {
      return NextResponse.json({ 
        error: 'Supabase client not initialized',
        env: {
          url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set',
          key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set'
        }
      }, { status: 500 });
    }

    // Try a simple query
    const { data, error } = await supabase
      .from('test')
      .select('*')
      .limit(1);

    if (error && error.message.includes('relation "public.test" does not exist')) {
      // This is actually good - it means we connected but the table doesn't exist
      return NextResponse.json({ 
        status: 'Connected',
        message: 'Successfully connected to Supabase (table does not exist yet, which is expected)'
      });
    }

    if (error) {
      return NextResponse.json({ 
        status: 'Error',
        error: error.message,
        code: error.code,
        details: error
      }, { status: 401 });
    }

    return NextResponse.json({ 
      status: 'Connected',
      message: 'Successfully connected to Supabase',
      data 
    });
  } catch (error: any) {
    return NextResponse.json({ 
      status: 'Error',
      error: error.message 
    }, { status: 500 });
  }
}