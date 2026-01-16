/**
 * Agency Labor Requests API
 *
 * Returns all labor request notifications for a specific agency.
 * Used by agency dashboard to display inbox of matched requests.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser, verifyAgencyAccess } from '@/lib/auth/session';
import { maskEmail, maskPhone } from '@/lib/utils/masking';
import type { InboxNotification } from '@/types/labor-request';

/**
 * GET /api/agencies/[agencyId]/labor-requests
 *
 * Returns all labor request notifications for an agency with filters.
 *
 * Query params:
 * - status: Filter by notification status (new, viewed, responded, archived)
 * - search: Search in project name or company name
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { agencyId: string } }
) {
  try {
    const { agencyId } = params;

    // Validate agency ID
    if (!agencyId) {
      return NextResponse.json(
        { error: 'Agency ID is required' },
        { status: 400 }
      );
    }

    // Authenticate user
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Authorize agency access
    if (!verifyAgencyAccess(user, agencyId)) {
      return NextResponse.json(
        { error: 'Access denied', details: 'You do not have permission to view this agency\'s labor requests' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const statusFilter = searchParams.get('status');
    const searchQuery = searchParams.get('search');

    // Build query
    let query = supabaseAdmin
      .from('labor_request_notifications')
      .select(`
        id,
        status,
        sent_at,
        viewed_at,
        responded_at,
        created_at,
        labor_request:labor_request_id (
          id,
          project_name,
          company_name,
          contact_email,
          contact_phone,
          additional_details
        ),
        craft:labor_request_craft_id (
          id,
          worker_count,
          start_date,
          duration_days,
          hours_per_week,
          experience_level,
          pay_rate_min,
          pay_rate_max,
          per_diem_rate,
          notes,
          trade:trade_id (
            name
          ),
          region:region_id (
            name,
            state_code
          )
        )
      `)
      .eq('agency_id', agencyId)
      .order('created_at', { ascending: false });

    // Apply status filter
    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }

    // Execute query
    const { data: notifications, error: queryError } = await query;

    if (queryError) {
      console.error('Error fetching labor requests:', queryError);
      return NextResponse.json(
        { error: 'Failed to fetch labor requests' },
        { status: 500 }
      );
    }

    // Transform data to match InboxNotification type
    const formattedNotifications: InboxNotification[] = (notifications || [])
      .filter((n: any) => n.labor_request && n.craft) // Filter out any with missing relations
      .map((n: any) => ({
        id: n.id,
        status: n.status,
        sent_at: n.sent_at,
        viewed_at: n.viewed_at,
        responded_at: n.responded_at,
        created_at: n.created_at,
        labor_request: {
          id: n.labor_request.id,
          project_name: n.labor_request.project_name,
          company_name: n.labor_request.company_name,
          contact_email: maskEmail(n.labor_request.contact_email),
          contact_phone: maskPhone(n.labor_request.contact_phone),
          additional_details: n.labor_request.additional_details,
        },
        craft: {
          id: n.craft.id,
          trade: { name: n.craft.trade?.name || 'Unknown Trade' },
          region: {
            name: n.craft.region?.name || 'Unknown Region',
            state_code: n.craft.region?.state_code || 'XX',
          },
          worker_count: n.craft.worker_count,
          start_date: n.craft.start_date,
          duration_days: n.craft.duration_days,
          hours_per_week: n.craft.hours_per_week,
          experience_level: n.craft.experience_level,
          pay_rate_min: n.craft.pay_rate_min,
          pay_rate_max: n.craft.pay_rate_max,
          per_diem_rate: n.craft.per_diem_rate,
          notes: n.craft.notes,
        },
      }));

    // Apply search filter (client-side for simplicity)
    let filteredNotifications = formattedNotifications;
    if (searchQuery) {
      const lowerSearch = searchQuery.toLowerCase();
      filteredNotifications = formattedNotifications.filter((n) =>
        n.labor_request.project_name.toLowerCase().includes(lowerSearch) ||
        n.labor_request.company_name.toLowerCase().includes(lowerSearch)
      );
    }

    return NextResponse.json({
      success: true,
      notifications: filteredNotifications,
      total: filteredNotifications.length,
    });
  } catch (error) {
    console.error('Error in agency labor requests endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
