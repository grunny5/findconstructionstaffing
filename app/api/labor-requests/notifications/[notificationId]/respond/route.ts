/**
 * Respond to Labor Request Notification API
 *
 * Updates notification status to 'responded' and sets responded_at timestamp.
 * In future: could send email notification to contractor.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
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
    const { data: notification, error: updateError } = await supabaseAdmin
      .from('labor_request_notifications')
      .update({
        status: 'responded',
        responded_at: new Date().toISOString(),
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

    // TODO: Store response details (interested/message) in a separate table
    // TODO: Send email to contractor with agency response

    console.log(
      `Agency responded to notification ${notificationId}: interested=${interested}, message="${message || 'none'}"`
    );

    return NextResponse.json({
      success: true,
      notification: {
        id: notification.id,
        status: notification.status,
        responded_at: notification.responded_at,
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
