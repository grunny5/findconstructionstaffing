import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { laborRequestFormDataSchema } from '@/lib/validations/labor-request';
import type { LaborRequestFormData } from '@/lib/validations/labor-request';
import type { AgencyMatch } from '@/types/labor-request';
import { randomBytes } from 'crypto';

/**
 * POST /api/labor-requests
 * Submit a new labor request with multiple craft requirements
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        {
          error: 'Invalid JSON',
          details: 'Request body must be valid JSON',
        },
        { status: 400 }
      );
    }

    // Validate request body
    const validationResult = laborRequestFormDataSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    const formData: LaborRequestFormData = validationResult.data;

    // Generate confirmation token
    const confirmationToken = randomBytes(32).toString('hex');
    const confirmationTokenExpires = new Date(
      Date.now() + 24 * 60 * 60 * 1000
    ).toISOString(); // 24 hours from now

    // Insert main labor request
    // Note: Using supabaseAdmin to bypass RLS (server-side only, input is validated)
    const { data: laborRequest, error: requestError } = await supabaseAdmin
      .from('labor_requests')
      .insert({
        project_name: formData.projectName,
        company_name: formData.companyName,
        contact_email: formData.contactEmail,
        contact_phone: formData.contactPhone,
        additional_details: formData.additionalDetails || null,
        status: 'pending',
        confirmation_token: confirmationToken,
        confirmation_token_expires: confirmationTokenExpires,
      })
      .select()
      .single();

    if (requestError || !laborRequest) {
      console.error('Error creating labor request:', requestError);
      return NextResponse.json(
        { error: 'Failed to create labor request' },
        { status: 500 }
      );
    }

    // Insert craft requirements
    const craftInserts = formData.crafts.map((craft) => ({
      labor_request_id: laborRequest.id,
      trade_id: craft.tradeId,
      region_id: craft.regionId,
      experience_level: craft.experienceLevel,
      worker_count: craft.workerCount,
      start_date: craft.startDate,
      duration_days: craft.durationDays,
      hours_per_week: craft.hoursPerWeek,
      notes: craft.notes || null,
      pay_rate_min: craft.payRateMin || null,
      pay_rate_max: craft.payRateMax || null,
      per_diem_rate: craft.perDiemRate || null,
    }));

    const { data: crafts, error: craftsError } = await supabaseAdmin
      .from('labor_request_crafts')
      .insert(craftInserts)
      .select();

    if (craftsError || !crafts) {
      console.error('Error creating craft requirements:', craftsError);
      // Rollback: delete the labor request
      const { error: rollbackError } = await supabaseAdmin
        .from('labor_requests')
        .delete()
        .eq('id', laborRequest.id);

      if (rollbackError) {
        console.error(
          `Failed to rollback labor request ${laborRequest.id}:`,
          rollbackError
        );
      }

      return NextResponse.json(
        { error: 'Failed to create craft requirements' },
        { status: 500 }
      );
    }

    // Match agencies for each craft and create notifications
    let totalMatches = 0;
    const matchesByCraft: Array<{
      craftId: string;
      matches: number;
    }> = [];
    const notificationFailures: Array<{
      craftId: string;
      error: string;
    }> = [];

    for (const craft of crafts) {
      // Call matching function
      // Note: Using supabaseAdmin for consistency (RPC functions have SECURITY DEFINER)
      const { data: matches, error: matchError } = await supabaseAdmin.rpc(
        'match_agencies_to_craft',
        {
          p_trade_id: craft.trade_id,
          p_region_id: craft.region_id,
        }
      );

      if (matchError) {
        console.error('Error matching agencies for craft:', matchError);
        continue; // Continue with other crafts even if one fails
      }

      const agencyMatches = (matches || []) as AgencyMatch[];
      totalMatches += agencyMatches.length;

      matchesByCraft.push({
        craftId: craft.id,
        matches: agencyMatches.length,
      });

      // Create notification records for matched agencies
      // Note: Using supabaseAdmin because RLS policy requires authenticated admin role
      if (agencyMatches.length > 0) {
        const notifications = agencyMatches.map((match: AgencyMatch) => ({
          labor_request_id: laborRequest.id,
          labor_request_craft_id: craft.id,
          agency_id: match.agency_id,
          status: 'pending',
        }));

        const { error: notificationError } = await supabaseAdmin
          .from('labor_request_notifications')
          .insert(notifications);

        if (notificationError) {
          console.error('Error creating notifications:', notificationError);
          notificationFailures.push({
            craftId: craft.id,
            error: notificationError.message || 'Unknown error',
          });
        }
      }
    }

    // Build response with notification failure warnings if any
    const hasNotificationFailures = notificationFailures.length > 0;
    const response: any = {
      success: true,
      requestId: laborRequest.id,
      confirmationToken,
      totalMatches,
      matchesByCraft,
      message:
        totalMatches > 0
          ? `Successfully matched ${totalMatches} agencies across ${crafts.length} craft requirements`
          : 'Labor request created, but no agencies matched the requirements',
    };

    if (hasNotificationFailures) {
      response.notificationWarning =
        'Some agencies could not be notified. Please contact support.';
      response.notificationErrors = notificationFailures;
    }

    // Return success response
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in labor request submission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
