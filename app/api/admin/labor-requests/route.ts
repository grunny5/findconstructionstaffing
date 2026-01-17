import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Type definitions
interface Notification {
  id: string;
  agency: {
    id: string;
    agency_name: string;
    slug: string;
  };
  status: 'pending' | 'sent' | 'failed' | 'new' | 'viewed' | 'responded' | 'archived';
  sent_at: string | null;
  viewed_at: string | null;
  responded_at: string | null;
  delivery_error: string | null;
}

interface Craft {
  id: string;
  trade: {
    id: string;
    name: string;
  };
  region: {
    id: string;
    name: string;
    state_code: string;
  };
  worker_count: number;
  start_date: string;
  notifications: Notification[];
}

interface LaborRequest {
  id: string;
  project_name: string;
  company_name: string;
  contact_email: string;
  contact_phone: string;
  status: 'pending' | 'active' | 'fulfilled' | 'cancelled';
  created_at: string;
  updated_at: string;
  crafts: Craft[];
}

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

  // Step 3: Parse query parameters with validation
  let page = parseInt(searchParams.get('page') || '1');
  let limit = parseInt(searchParams.get('limit') || '25');

  // Validate pagination values
  if (!Number.isInteger(page) || page < 1) {
    page = 1;
  }
  if (!Number.isInteger(limit) || limit < 1) {
    limit = 25;
  }

  const offset = (page - 1) * limit;
  const statusFilter = searchParams.get('status') || 'all';
  const searchQuery = (searchParams.get('search') || '').trim();

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
    // Sanitize search query to prevent PostgREST injection
    // Allow only alphanumerics, spaces, and common punctuation
    const sanitizedQuery = searchQuery.replace(/[^a-zA-Z0-9\s\-_.,'&]/g, '');
    if (sanitizedQuery) {
      // Escape special PostgREST characters (%, _)
      const escapedQuery = sanitizedQuery.replace(/%/g, '\\%').replace(/_/g, '\\_');
      query = query.or(`project_name.ilike.%${escapedQuery}%,company_name.ilike.%${escapedQuery}%`);
    }
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
  const transformedData = (data as LaborRequest[]).map((request) => ({
    ...request,
    match_count: request.crafts?.reduce((sum: number, craft: Craft) =>
      sum + (craft.notifications?.length || 0), 0) || 0,
    notification_stats: {
      sent: request.crafts?.reduce((sum: number, craft: Craft) =>
        sum + (craft.notifications?.filter((n: Notification) => n.status === 'sent' || n.status === 'new').length || 0), 0) || 0,
      failed: request.crafts?.reduce((sum: number, craft: Craft) =>
        sum + (craft.notifications?.filter((n: Notification) => n.status === 'failed').length || 0), 0) || 0,
      responded: request.crafts?.reduce((sum: number, craft: Craft) =>
        sum + (craft.notifications?.filter((n: Notification) => n.status === 'responded').length || 0), 0) || 0,
    },
    has_delivery_errors: request.crafts?.some((craft: Craft) =>
      craft.notifications?.some((n: Notification) => n.delivery_error)) || false,
  }));

  return NextResponse.json({
    data: transformedData,
    pagination
  }, { status: 200 });
}
