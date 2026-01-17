import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await context.params; // Next.js 15 compatibility

  // Authentication & authorization
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (!user || authError) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }

  // Fetch single request with all nested data
  const { data, error } = await supabase
    .from('labor_requests')
    .select(`
      *,
      crafts:labor_request_crafts(
        id,
        trade:trades(id, name),
        region:regions(id, name, state_code),
        worker_count,
        start_date,
        duration_days,
        hours_per_week,
        notes,
        notifications:labor_request_notifications(
          id,
          agency:agencies(id, agency_name, slug),
          status,
          sent_at,
          viewed_at,
          responded_at,
          delivery_error
        )
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('[Admin Labor Request Detail] Query error:', error);
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
    }
    return NextResponse.json({ error: 'DATABASE_ERROR' }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 200 });
}
