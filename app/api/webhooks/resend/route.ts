import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { z } from 'zod';
import { Webhook } from 'svix';
import crypto from 'crypto';

/**
 * Resend Webhook Handler
 *
 * Receives and processes email events from Resend via Svix:
 * - email.sent: Email was accepted by Resend
 * - email.delivered: Email was delivered to recipient
 * - email.bounced: Email bounced (hard or soft)
 * - email.complained: Recipient marked email as spam
 *
 * Uses Svix library for webhook signature verification with replay attack protection.
 * All PII (email addresses, subjects) is redacted from logs for GDPR/CCPA compliance.
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
 * Runtime validation schema for Resend webhook events
 */
const ResendWebhookEventSchema = z.object({
  type: z.enum([
    'email.sent',
    'email.delivered',
    'email.bounced',
    'email.complained',
  ]),
  created_at: z.string(),
  data: z.object({
    email_id: z.string(),
    from: z.string(),
    to: z.array(z.string()),
    subject: z.string(),
    created_at: z.string(),
    bounce_type: z.enum(['hard', 'soft']).optional(),
    complaint_feedback_type: z.string().optional(),
  }),
});

/**
 * Create a privacy-compliant hash of an email address for logging
 * This allows correlation in logs without exposing PII
 */
function hashEmail(email: string): string {
  return crypto.createHash('sha256').update(email).digest('hex').slice(0, 16);
}

/**
 * Extract domain from email for logging (non-PII)
 */
function getEmailDomain(email: string): string {
  const parts = email.split('@');
  return parts.length === 2 ? parts[1] : 'unknown';
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
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    // Get request body as text for signature verification
    const payload = await request.text();

    // Get Svix headers for signature verification
    const headersList = headers();
    const svixId = headersList.get('svix-id');
    const svixTimestamp = headersList.get('svix-timestamp');
    const svixSignature = headersList.get('svix-signature');

    if (!svixId || !svixTimestamp || !svixSignature) {
      console.error('[Resend Webhook] Missing required Svix headers');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Verify webhook signature using Svix
    // This automatically validates timestamp and prevents replay attacks
    const wh = new Webhook(webhookSecret);
    let verifiedPayload;

    try {
      verifiedPayload = wh.verify(payload, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      });
    } catch (err) {
      console.error('[Resend Webhook] Signature verification failed:', {
        error: err instanceof Error ? err.message : 'Unknown error',
      });
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Validate the verified payload structure
    const validationResult =
      ResendWebhookEventSchema.safeParse(verifiedPayload);

    if (!validationResult.success) {
      console.error('[Resend Webhook] Invalid payload structure:', {
        error: validationResult.error.message,
        // Log only non-PII diagnostic info
        eventType: (verifiedPayload as any)?.type,
        emailId: (verifiedPayload as any)?.data?.email_id,
      });
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const event: ResendWebhookEvent = validationResult.data;

    // Log the event for monitoring (NO PII)
    console.log('[Resend Webhook] Event received:', {
      type: event.type,
      email_id: event.data.email_id,
      recipient_count: event.data.to.length,
      recipient_domains: event.data.to.map(getEmailDomain),
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
    console.error('[Resend Webhook] Error processing webhook:', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
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
  // Log without PII - use hashed email for correlation
  console.log('[Resend Webhook] Email sent:', {
    email_id: event.data.email_id,
    recipient_count: event.data.to.length,
    recipient_hashes: event.data.to.map(hashEmail),
  });

  // TODO: Optional - Store email send event in database for tracking
  // IMPORTANT: When storing to DB, either:
  // - Hash/encrypt email addresses
  // - Store in a secure, access-controlled table
  // - Document retention policy for compliance
  //
  // Example (with hashed email):
  // await supabase
  //   .from('email_logs')
  //   .insert({
  //     email_id: event.data.email_id,
  //     recipient_hash: hashEmail(event.data.to[0]),
  //     status: 'sent',
  //     sent_at: event.data.created_at,
  //   });
}

/**
 * Handle email.delivered event
 * Email was successfully delivered to recipient's mail server
 */
async function handleEmailDelivered(event: ResendWebhookEvent) {
  // Log without PII
  console.log('[Resend Webhook] Email delivered:', {
    email_id: event.data.email_id,
    recipient_count: event.data.to.length,
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

  // Log without PII - use hash for correlation
  console.error('[Resend Webhook] Email bounced:', {
    email_id,
    recipient_count: to.length,
    recipient_hash: hashEmail(to[0]),
    recipient_domain: getEmailDomain(to[0]),
    bounce_type,
  });

  // Hard bounce = permanent failure (email doesn't exist, domain invalid)
  if (bounce_type === 'hard') {
    console.error('[Resend Webhook] Hard bounce detected:', {
      email_id,
      recipient_hash: hashEmail(to[0]),
    });

    // TODO: Mark email as invalid in database to prevent future sends
    // Use the actual email address from event.data.to[0] for database update
    // Do NOT log the raw email
    //
    // Example:
    // await supabase
    //   .from('profiles')
    //   .update({
    //     email_valid: false,
    //     email_bounce_reason: 'hard_bounce',
    //     bounced_at: event.created_at
    //   })
    //   .eq('email', to[0]);  // Use raw email for DB query only
  }

  // Soft bounce = temporary failure (mailbox full, server down)
  // Resend will automatically retry soft bounces
  if (bounce_type === 'soft') {
    console.warn('[Resend Webhook] Soft bounce - will retry:', {
      email_id,
      recipient_hash: hashEmail(to[0]),
    });
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

  // Log without PII - use hash for correlation
  console.error('[Resend Webhook] Spam complaint received:', {
    email_id,
    recipient_count: to.length,
    recipient_hash: hashEmail(to[0]),
    complaint_feedback_type,
  });

  // TODO: IMPORTANT - Unsubscribe user to maintain sender reputation
  // Use the actual email address from to[0] for database update
  // Do NOT log the raw email
  //
  // Example:
  // await supabase
  //   .from('profiles')
  //   .update({
  //     email_unsubscribed: true,
  //     unsubscribed_reason: 'spam_complaint',
  //     unsubscribed_at: event.created_at
  //   })
  //   .eq('email', to[0]);  // Use raw email for DB query only

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
