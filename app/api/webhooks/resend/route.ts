import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

/**
 * Resend Webhook Handler
 *
 * Receives and processes email events from Resend:
 * - email.sent: Email was accepted by Resend
 * - email.delivered: Email was delivered to recipient
 * - email.bounced: Email bounced (hard or soft)
 * - email.complained: Recipient marked email as spam
 *
 * Webhook signature verification ensures events are from Resend.
 */

interface ResendWebhookEvent {
  type: 'email.sent' | 'email.delivered' | 'email.bounced' | 'email.complained';
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    created_at: string;
    // Additional fields based on event type
    bounce_type?: 'hard' | 'soft'; // For bounced events
    complaint_feedback_type?: string; // For complained events
  };
}

/**
 * Verify webhook signature using HMAC
 */
function verifySignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const crypto = require('crypto');
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  return digest === signature;
}

/**
 * POST /api/webhooks/resend
 * Handle incoming webhook events from Resend
 */
export async function POST(request: NextRequest) {
  try {
    // Get webhook secret from environment variable
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('[Resend Webhook] RESEND_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    // Get request body as text for signature verification
    const payload = await request.text();

    // Get signature from headers
    const headersList = headers();
    const signature =
      headersList.get('svix-signature') ||
      headersList.get('x-resend-signature') ||
      '';

    // Verify webhook signature
    if (!verifySignature(payload, signature, webhookSecret)) {
      console.error('[Resend Webhook] Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Parse the verified payload
    const event: ResendWebhookEvent = JSON.parse(payload);

    // Log the event for monitoring
    console.log('[Resend Webhook] Event received:', {
      type: event.type,
      email_id: event.data.email_id,
      to: event.data.to,
      created_at: event.created_at,
    });

    // Handle different event types
    switch (event.type) {
      case 'email.sent':
        await handleEmailSent(event);
        break;

      case 'email.delivered':
        await handleEmailDelivered(event);
        break;

      case 'email.bounced':
        await handleEmailBounced(event);
        break;

      case 'email.complained':
        await handleEmailComplained(event);
        break;

      default:
        console.log('[Resend Webhook] Unknown event type:', event.type);
    }

    // Return 200 to acknowledge receipt
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Resend Webhook] Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle email.sent event
 * Email was accepted by Resend and queued for delivery
 */
async function handleEmailSent(event: ResendWebhookEvent) {
  console.log('[Resend Webhook] Email sent:', {
    email_id: event.data.email_id,
    to: event.data.to,
    subject: event.data.subject,
  });

  // TODO: Optional - Store email send event in database for tracking
  // Example:
  // await supabase
  //   .from('email_logs')
  //   .insert({
  //     email_id: event.data.email_id,
  //     recipient: event.data.to[0],
  //     status: 'sent',
  //     sent_at: event.data.created_at,
  //   });
}

/**
 * Handle email.delivered event
 * Email was successfully delivered to recipient's mail server
 */
async function handleEmailDelivered(event: ResendWebhookEvent) {
  console.log('[Resend Webhook] Email delivered:', {
    email_id: event.data.email_id,
    to: event.data.to,
  });

  // TODO: Optional - Update email status in database
  // Example:
  // await supabase
  //   .from('email_logs')
  //   .update({ status: 'delivered', delivered_at: event.created_at })
  //   .eq('email_id', event.data.email_id);
}

/**
 * Handle email.bounced event
 * Email bounced - either hard bounce (permanent) or soft bounce (temporary)
 */
async function handleEmailBounced(event: ResendWebhookEvent) {
  const { email_id, to, bounce_type } = event.data;

  console.error('[Resend Webhook] Email bounced:', {
    email_id,
    to,
    bounce_type,
  });

  // Hard bounce = permanent failure (email doesn't exist, domain invalid)
  if (bounce_type === 'hard') {
    console.error(
      '[Resend Webhook] Hard bounce detected - mark email as invalid:',
      to[0]
    );

    // TODO: Mark email as invalid in database to prevent future sends
    // Example:
    // await supabase
    //   .from('profiles')
    //   .update({ email_valid: false, email_bounce_reason: 'hard_bounce' })
    //   .eq('email', to[0]);
  }

  // Soft bounce = temporary failure (mailbox full, server down)
  // Resend will automatically retry soft bounces
  if (bounce_type === 'soft') {
    console.warn('[Resend Webhook] Soft bounce - will retry:', to[0]);
  }

  // TODO: Optional - Log bounce in database
  // Example:
  // await supabase
  //   .from('email_logs')
  //   .update({
  //     status: 'bounced',
  //     bounce_type,
  //     bounced_at: event.created_at
  //   })
  //   .eq('email_id', email_id);
}

/**
 * Handle email.complained event
 * Recipient marked email as spam
 */
async function handleEmailComplained(event: ResendWebhookEvent) {
  const { email_id, to, complaint_feedback_type } = event.data;

  console.error('[Resend Webhook] Spam complaint received:', {
    email_id,
    to,
    complaint_feedback_type,
  });

  // TODO: IMPORTANT - Unsubscribe user to maintain sender reputation
  // Example:
  // await supabase
  //   .from('profiles')
  //   .update({
  //     email_unsubscribed: true,
  //     unsubscribed_reason: 'spam_complaint',
  //     unsubscribed_at: event.created_at
  //   })
  //   .eq('email', to[0]);

  // TODO: Optional - Log complaint in database
  // Example:
  // await supabase
  //   .from('email_logs')
  //   .update({
  //     status: 'complained',
  //     complaint_type: complaint_feedback_type,
  //     complained_at: event.created_at
  //   })
  //   .eq('email_id', email_id);
}
