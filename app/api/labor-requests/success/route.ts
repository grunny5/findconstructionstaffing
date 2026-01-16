/**
 * Labor Request Success Page API
 *
 * Validates confirmation token and returns labor request details for the success page.
 * Uses service role client to bypass RLS (prevents vulnerability where any non-null token could query all requests).
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * GET /api/labor-requests/success?token=...
 *
 * Validates confirmation token and returns labor request summary for success page.
 */
export async function GET(request: NextRequest) {
  try {
    // Get token from query params
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    // Validate token format
    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Token should be 64 hex characters (32 bytes)
    if (!/^[0-9a-f]{64}$/i.test(token)) {
      return NextResponse.json(
        { error: 'Invalid token format' },
        { status: 400 }
      );
    }

    // Fetch labor request with token validation
    // Note: Using supabaseAdmin (service role) to bypass RLS
    const { data: laborRequest, error: requestError } = await supabaseAdmin
      .from('labor_requests')
      .select(
        `
        id,
        project_name,
        company_name,
        contact_email,
        contact_phone,
        created_at,
        confirmation_token_expires
      `
      )
      .eq('confirmation_token', token)
      .single();

    if (requestError || !laborRequest) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 404 }
      );
    }

    // Check token expiration
    // Guard against null or invalid expiration date
    if (!laborRequest.confirmation_token_expires) {
      return NextResponse.json(
        { error: 'Token has expired' },
        { status: 410 } // 410 Gone
      );
    }

    const now = new Date();
    const expiresAt = new Date(laborRequest.confirmation_token_expires);

    // Verify the date is valid (not NaN)
    if (isNaN(expiresAt.getTime())) {
      return NextResponse.json(
        { error: 'Token has expired' },
        { status: 410 } // 410 Gone
      );
    }

    if (now > expiresAt) {
      return NextResponse.json(
        { error: 'Token has expired' },
        { status: 410 } // 410 Gone
      );
    }

    // Fetch craft requirements count
    const { count: craftCount, error: craftCountError } = await supabaseAdmin
      .from('labor_request_crafts')
      .select('id', { count: 'exact', head: true })
      .eq('labor_request_id', laborRequest.id);

    if (craftCountError) {
      console.error('Error counting crafts:', craftCountError);
    }

    // Fetch matched agencies count
    const { count: totalMatches, error: matchCountError } = await supabaseAdmin
      .from('labor_request_notifications')
      .select('id', { count: 'exact', head: true })
      .eq('labor_request_id', laborRequest.id);

    if (matchCountError) {
      console.error('Error counting matches:', matchCountError);
    }

    // Fetch match breakdown by craft
    const { data: craftMatches, error: craftMatchesError } = await supabaseAdmin
      .from('labor_request_crafts')
      .select(
        `
        id,
        trades:trade_id(name),
        labor_request_notifications(count)
      `
      )
      .eq('labor_request_id', laborRequest.id);

    if (craftMatchesError) {
      console.error('Error fetching craft matches:', craftMatchesError);
    }

    // Build match breakdown
    const matchesByCraft = craftMatches?.map((craft: any) => ({
      craftName: craft.trades?.name || 'Unknown Trade',
      matches: craft.labor_request_notifications?.[0]?.count || 0,
    })) || [];

    // Mask email (show first char and domain)
    const maskEmail = (email: string): string => {
      const [local, domain] = email.split('@');
      if (!local || !domain) return email;
      return `${local[0]}***@${domain}`;
    };

    // Mask phone (show only last 4 digits)
    const maskPhone = (phone: string | null | undefined): string => {
      if (!phone) return '***-***-****';
      // Extract only digits
      const digits = phone.replace(/\D/g, '');
      if (digits.length < 4) return '***-***-****';
      // Show last 4 digits only
      const lastFour = digits.slice(-4);
      return `***-***-${lastFour}`;
    };

    // Return sanitized data
    return NextResponse.json({
      success: true,
      request: {
        id: laborRequest.id,
        projectName: laborRequest.project_name,
        companyName: laborRequest.company_name,
        contactEmail: maskEmail(laborRequest.contact_email),
        contactPhone: maskPhone(laborRequest.contact_phone),
        submittedAt: laborRequest.created_at,
        craftCount: craftCount || 0,
      },
      matches: {
        total: totalMatches || 0,
        byCraft: matchesByCraft,
      },
      expiresAt: laborRequest.confirmation_token_expires,
    });
  } catch (error) {
    console.error('Error in labor request success endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
