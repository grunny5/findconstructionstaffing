/**
 * Mark Notification as Viewed API
 *
 * Updates notification status to 'viewed' and sets viewed_at timestamp.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

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

    // Update notification status
    const { data: notification, error: updateError } = await supabaseAdmin
      .from('labor_request_notifications')
      .update({
        status: 'viewed',
        viewed_at: new Date().toISOString(),
      })
      .eq('id', notificationId)
      .select()
      .single();

    if (updateError || !notification) {
      console.error('Error updating notification:', updateError);
      return NextResponse.json(
        { error: 'Failed to update notification' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      notification: {
        id: notification.id,
        status: notification.status,
        viewed_at: notification.viewed_at,
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
