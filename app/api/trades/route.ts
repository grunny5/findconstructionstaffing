import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

/**
 * GET /api/trades
 * Returns all trades for use in labor request forms
 */
export async function GET() {
  try {
    const supabase = createClient();

    const { data: trades, error } = await supabase
      .from('trades')
      .select('id, name, slug')
      .order('name');

    if (error) {
      console.error('Error fetching trades:', error);
      return NextResponse.json(
        { error: 'Failed to fetch trades' },
        { status: 500 }
      );
    }

    return NextResponse.json({ trades });
  } catch (error) {
    console.error('Unexpected error fetching trades:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
