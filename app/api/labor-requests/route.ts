import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { laborRequestFormDataSchema } from '@/lib/validations/labor-request';
import type { LaborRequestFormData } from '@/lib/validations/labor-request';
import type { AgencyMatch } from '@/types/labor-request';
import { randomBytes } from 'crypto';
import { sendLaborRequestNotificationEmail } from '@/lib/emails/send-labor-request-notification';

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
    const matchFailures: Array<{
      craftId: string;
      error: string;
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
        matchFailures.push({
          craftId: craft.id,
          error: matchError.message || 'Failed to match agencies',
        });
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

    // Send email notifications to matched agencies
    // Consolidate by agency (one email per agency with all matched crafts)
    const emailFailures: Array<{
      agencyId: string;
      error: string;
    }> = [];

    if (totalMatches > 0) {
      // Group notifications by agency
      const agencyNotifications = new Map<string, string[]>();

      for (const craft of crafts) {
        const { data: notifications } = await supabaseAdmin
          .from('labor_request_notifications')
          .select('agency_id')
          .eq('labor_request_craft_id', craft.id);

        if (notifications) {
          for (const notif of notifications) {
            if (!agencyNotifications.has(notif.agency_id)) {
              agencyNotifications.set(notif.agency_id, []);
            }
            agencyNotifications.get(notif.agency_id)!.push(craft.id);
          }
        }
      }

      // Send one email per agency
      for (const [agencyId, craftIds] of agencyNotifications) {
        try {
          // Fetch agency details
          const { data: agency } = await supabaseAdmin
            .from('agencies')
            .select('id, name, email')
            .eq('id', agencyId)
            .single();

          if (!agency || !agency.email) {
            console.warn(`No email for agency ${agencyId}, skipping notification`);
            emailFailures.push({
              agencyId,
              error: 'No email address configured',
            });
            continue;
          }

          // Fetch craft details for this agency
          const { data: agencyCrafts } = await supabaseAdmin
            .from('labor_request_crafts')
            .select(
              `
              id,
              trade_id,
              region_id,
              experience_level,
              worker_count,
              start_date,
              duration_days,
              hours_per_week,
              notes,
              pay_rate_min,
              pay_rate_max,
              per_diem_rate,
              trades:trade_id(name),
              regions:region_id(name)
            `
            )
            .in('id', craftIds);

          if (!agencyCrafts || agencyCrafts.length === 0) {
            console.warn(`No craft details found for agency ${agencyId}`);
            continue;
          }

          // Transform craft data for email
          const craftRequirements = agencyCrafts.map((craft: any) => ({
            tradeId: craft.trade_id,
            tradeName: craft.trades?.name || 'Unknown Trade',
            regionName: craft.regions?.name || 'Unknown Region',
            experienceLevel: craft.experience_level,
            workerCount: craft.worker_count,
            startDate: craft.start_date,
            durationDays: craft.duration_days,
            hoursPerWeek: craft.hours_per_week,
            notes: craft.notes,
            payRateMin: craft.pay_rate_min,
            payRateMax: craft.pay_rate_max,
            perDiemRate: craft.per_diem_rate,
          }));

          // Send email
          const emailResult = await sendLaborRequestNotificationEmail({
            agencyId: agency.id,
            agencyEmail: agency.email,
            agencyName: agency.name,
            projectName: laborRequest.project_name,
            companyName: laborRequest.company_name,
            contactEmail: laborRequest.contact_email,
            contactPhone: laborRequest.contact_phone,
            additionalDetails: laborRequest.additional_details || undefined,
            crafts: craftRequirements,
            laborRequestId: laborRequest.id,
          });

          if (!emailResult.sent) {
            console.error(
              `Failed to send email to agency ${agencyId}:`,
              emailResult.reason
            );
            emailFailures.push({
              agencyId,
              error: emailResult.reason || 'Unknown error',
            });
          }
        } catch (error) {
          console.error(`Error sending email to agency ${agencyId}:`, error);
          emailFailures.push({
            agencyId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    }

    // Build response with match and notification failure warnings if any
    const hasMatchFailures = matchFailures.length > 0;
    const hasNotificationFailures = notificationFailures.length > 0;
    const hasEmailFailures = emailFailures.length > 0;
    const hasAnyFailures =
      hasMatchFailures || hasNotificationFailures || hasEmailFailures;

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

    // Add match failure warnings
    if (hasMatchFailures) {
      response.matchWarning =
        'Some craft requirements could not be matched. Please contact support.';
      response.matchErrors = matchFailures;
    }

    // Add notification failure warnings
    if (hasNotificationFailures) {
      response.notificationWarning =
        'Some agencies could not be notified. Please contact support.';
      response.notificationErrors = notificationFailures;
    }

    // Add email failure warnings
    if (hasEmailFailures) {
      response.emailWarning =
        'Some notification emails could not be sent. Please contact support.';
      response.emailErrors = emailFailures;
    }

    // Update message if there are any failures
    if (hasAnyFailures) {
      const failureCount =
        matchFailures.length +
        notificationFailures.length +
        emailFailures.length;
      response.message += ` However, ${failureCount} issue(s) occurred during processing.`;
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
