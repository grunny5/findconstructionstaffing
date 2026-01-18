/**
 * Respond to Labor Request Notification API
 *
 * Updates notification status to 'responded' and sets responded_at timestamp.
 * In future: could send email notification to contractor.
 */

import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth/session';
import { secureLog } from '@/lib/utils/secure-logging';
import { z } from 'zod';

// Validation schema for response
const respondSchema = z.object({
  interested: z.boolean(),
  message: z.string().optional(),
});

/**
 * POST /api/labor-requests/notifications/[notificationId]/respond
 *
 * Records agency response to a labor request.
 *
 * Body:
 * - interested: boolean (true if agency wants to pursue, false if declining)
 * - message: string (optional message to contractor)
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
        { error: 'Access denied', details: 'You do not have permission to respond to this notification' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON', details: 'Request body must be valid JSON' },
        { status: 400 }
      );
    }

    const validationResult = respondSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { interested, message } = validationResult.data;

    // Update notification status
    const { data: updatedNotification, error: updateError } = await supabaseAdmin
      .from('labor_request_notifications')
      .update({
        status: 'responded',
        responded_at: new Date().toISOString(),
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

    // TODO: Store response details (interested/message) in a separate table
    // TODO: Send email to contractor with agency response

    // Invalidate cache so dashboard stats update
    revalidateTag('notifications');
    revalidateTag('stats');

    // Secure logging (redacts message content)
    secureLog.info(
      `Agency responded to notification ${notificationId}: interested=${interested}`
    );

    return NextResponse.json({
      success: true,
      notification: {
        id: updatedNotification.id,
        status: updatedNotification.status,
        responded_at: updatedNotification.responded_at,
      },
      message: 'Response recorded successfully',
    });
  } catch (error) {
    console.error('Error in respond notification endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
