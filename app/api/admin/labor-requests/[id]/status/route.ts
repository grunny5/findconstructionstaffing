import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
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

  // Parse request body
  let body;
  let status;
  try {
    body = await request.json();
    status = body.status;
  } catch (error) {
    return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 });
  }

  // Validate status
  const validStatuses = ['pending', 'active', 'fulfilled', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: 'INVALID_STATUS' }, { status: 400 });
  }

  // Update with audit trail
  const { data, error } = await supabase
    .from('labor_requests')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[Admin Labor Request Status] Update error:', error);
    return NextResponse.json({ error: 'UPDATE_FAILED' }, { status: 500 });
  }

  // Check if record was found and updated
  if (!data) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  }

  return NextResponse.json({ data }, { status: 200 });
}
