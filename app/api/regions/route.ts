import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

/**
 * GET /api/regions
 * Returns all regions (US states) for use in labor request forms
 */
export async function GET() {
  try {
    const supabase = createClient();

    const { data: regions, error } = await supabase
      .from('regions')
      .select('id, name, state_code, slug')
      .order('name');

    if (error) {
      console.error('Error fetching regions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch regions' },
        { status: 500 }
      );
    }

    return NextResponse.json({ regions });
  } catch (error) {
    console.error('Unexpected error fetching regions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
