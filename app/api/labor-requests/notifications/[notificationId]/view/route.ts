/**
 * Mark Notification as Viewed API
 *
 * Updates notification status to 'viewed' and sets viewed_at timestamp.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth/session';

/**
 * POST /api/labor-requests/notifications/[notificationId]/view
 *
 * Marks a notification as viewed.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { notificationId: string } }
) {
  try {
    const { notificationId } = params;

    // Validate notification ID
    if (!notificationId) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
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

    // Fetch notification to verify ownership
    const { data: notification, error: fetchError } = await supabaseAdmin
      .from('labor_request_notifications')
      .select('agency_id')
      .eq('id', notificationId)
      .single();

    if (fetchError || !notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    // Verify agency ownership
    if (notification.agency_id !== user.agencyId) {
      return NextResponse.json(
        { error: 'Access denied', details: 'You do not have permission to view this notification' },
        { status: 403 }
      );
    }

    // Update notification status
    const { data: updatedNotification, error: updateError } = await supabaseAdmin
      .from('labor_request_notifications')
      .update({
        status: 'viewed',
        viewed_at: new Date().toISOString(),
      })
      .eq('id', notificationId)
      .select()
      .single();

    if (updateError || !updatedNotification) {
      console.error('Error updating notification:', updateError);
      return NextResponse.json(
        { error: 'Failed to update notification' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      notification: {
        id: updatedNotification.id,
        status: updatedNotification.status,
        viewed_at: updatedNotification.viewed_at,
      },
    });
  } catch (error) {
    console.error('Error in view notification endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
