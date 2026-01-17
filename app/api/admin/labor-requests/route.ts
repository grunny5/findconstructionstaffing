import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const searchParams = request.nextUrl.searchParams;

  // Step 1: Authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (!user || authError) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  // Step 2: Admin role verification
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }

  // Step 3: Parse query parameters
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '25');
  const offset = (page - 1) * limit;
  const statusFilter = searchParams.get('status') || 'all';
  const searchQuery = searchParams.get('search') || '';

  // Step 4: Build query with joins
  let query = supabase
    .from('labor_requests')
    .select(`
      *,
      crafts:labor_request_crafts(
        id,
        trade:trades(id, name),
        region:regions(id, name, state_code),
        worker_count,
        start_date,
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
    `, { count: 'exact' });

  // Apply filters
  if (statusFilter !== 'all') {
    query = query.eq('status', statusFilter);
  }

  if (searchQuery) {
    query = query.or(`project_name.ilike.%${searchQuery}%,company_name.ilike.%${searchQuery}%`);
  }

  // Pagination
  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  // Step 5: Execute query
  const { data, error, count } = await query;

  if (error) {
    console.error('[Admin Labor Requests API] Query error:', error);
    return NextResponse.json({ error: 'DATABASE_ERROR' }, { status: 500 });
  }

  // Step 6: Build pagination metadata
  const pagination = {
    total: count || 0,
    limit,
    offset,
    page,
    totalPages: Math.ceil((count || 0) / limit),
    hasMore: offset + limit < (count || 0),
  };

  // Step 7: Transform data to include computed fields
  const transformedData = data.map((request: any) => ({
    ...request,
    match_count: request.crafts?.reduce((sum: number, craft: any) =>
      sum + (craft.notifications?.length || 0), 0) || 0,
    notification_stats: {
      sent: request.crafts?.reduce((sum: number, craft: any) =>
        sum + (craft.notifications?.filter((n: any) => n.status === 'sent' || n.status === 'new').length || 0), 0) || 0,
      failed: request.crafts?.reduce((sum: number, craft: any) =>
        sum + (craft.notifications?.filter((n: any) => n.status === 'failed').length || 0), 0) || 0,
      responded: request.crafts?.reduce((sum: number, craft: any) =>
        sum + (craft.notifications?.filter((n: any) => n.status === 'responded').length || 0), 0) || 0,
    },
    has_delivery_errors: request.crafts?.some((craft: any) =>
      craft.notifications?.some((n: any) => n.delivery_error)) || false,
  }));

  return NextResponse.json({
    data: transformedData,
    pagination
  }, { status: 200 });
}
