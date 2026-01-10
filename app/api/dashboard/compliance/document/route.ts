/**
 * Dashboard Compliance Document API Endpoint
 *
 * POST /api/dashboard/compliance/document
 * Uploads a compliance document (PDF or image) for the authenticated agency owner.
 * The agency is determined from the authenticated user's claimed agency (via claimed_by).
 *
 * DELETE /api/dashboard/compliance/document
 * Removes a compliance document from storage and sets document_url to null.
 * The agency is determined from the authenticated user's claimed agency (via claimed_by).
 *
 * Note: Unlike the admin route, this endpoint does not use route params for agency ID.
 * The agency is automatically resolved from the authenticated user's session.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ERROR_CODES, HTTP_STATUS, COMPLIANCE_TYPES } from '@/types/api';
import type { ComplianceType } from '@/types/api';

export const dynamic = 'force-dynamic';

const ACCEPTED_MIME_TYPES = ['application/pdf', 'image/png', 'image/jpeg'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const STORAGE_BUCKET = 'compliance-documents';

/**
 * POST /api/dashboard/compliance/document
 * Uploads a compliance document
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (!user || authError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'Authentication required',
        },
      },
      { status: HTTP_STATUS.UNAUTHORIZED }
    );
  }

  // Get user's claimed agency
  const { data: agency, error: agencyError } = await supabase
    .from('agencies')
    .select('id')
    .eq('claimed_by', user.id)
    .single();

  if (agencyError || !agency) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.FORBIDDEN,
          message: 'No claimed agency found for this user',
        },
      },
      { status: HTTP_STATUS.FORBIDDEN }
    );
  }

  // Parse form data
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Invalid form data',
        },
      },
      { status: HTTP_STATUS.BAD_REQUEST }
    );
  }

  const file = formData.get('file') as File | null;
  const complianceType = formData.get('compliance_type') as string | null;

  if (!file) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'No file provided',
        },
      },
      { status: HTTP_STATUS.BAD_REQUEST }
    );
  }

  if (
    !complianceType ||
    !COMPLIANCE_TYPES.includes(complianceType as ComplianceType)
  ) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Invalid or missing compliance_type',
        },
      },
      { status: HTTP_STATUS.BAD_REQUEST }
    );
  }

  // Validate file type
  if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Invalid file type. Accepted types: PDF, PNG, JPEG',
        },
      },
      { status: HTTP_STATUS.BAD_REQUEST }
    );
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'File too large. Maximum size is 10MB',
        },
      },
      { status: HTTP_STATUS.BAD_REQUEST }
    );
  }

  try {
    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate unique filename
    // Derive extension from validated MIME type only (never trust file.name)
    const timestamp = Date.now();
    const MIME_TO_EXTENSION: Record<string, string> = {
      'application/pdf': 'pdf',
      'image/png': 'png',
      'image/jpeg': 'jpg',
    };
    const extension = MIME_TO_EXTENSION[file.type] || 'pdf';
    const filename = `${agency.id}/${complianceType}/${timestamp}.${extension}`;

    // Get existing compliance record to check for old document and preserve is_active state
    const { data: existingCompliance } = await supabase
      .from('agency_compliance')
      .select('document_url, is_active')
      .eq('agency_id', agency.id)
      .eq('compliance_type', complianceType)
      .single();

    // Store old document path for cleanup AFTER successful upload
    let oldDocumentPath: string | null = null;
    if (existingCompliance?.document_url) {
      // Handle both old signed URLs (full URLs) and new storage paths (just filename)
      const urlParts = existingCompliance.document_url.split(
        `/${STORAGE_BUCKET}/`
      );
      if (urlParts.length > 1) {
        // Old format: full signed URL - extract path and strip query parameters
        oldDocumentPath = urlParts[1].split('?')[0];
      } else {
        // New format: just the storage path
        oldDocumentPath = existingCompliance.document_url;
      }
    }

    // Upload to Supabase Storage (before deleting old file)
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ERROR_CODES.DATABASE_ERROR,
            message: 'Failed to upload document',
          },
        },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    // Get signed URL (7 days expiry for compliance documents)
    const SIGNED_URL_EXPIRY_SECONDS = 7 * 24 * 60 * 60; // 7 days
    const { data: signedUrlData, error: signedUrlError } =
      await supabase.storage
        .from(STORAGE_BUCKET)
        .createSignedUrl(filename, SIGNED_URL_EXPIRY_SECONDS);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error('Failed to create signed URL:', signedUrlError);
      // Clean up uploaded file
      await supabase.storage.from(STORAGE_BUCKET).remove([filename]);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ERROR_CODES.DATABASE_ERROR,
            message: 'Failed to generate document URL',
          },
        },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    // Store the permanent storage path (filename), not the time-limited signed URL
    // Signed URLs expire after 7 days, so we generate fresh ones on-demand when reading
    const storagePath = filename;

    // Update or insert compliance record
    // Preserve existing is_active state, or default to false for new records
    const { error: upsertError } = await supabase
      .from('agency_compliance')
      .upsert(
        {
          agency_id: agency.id,
          compliance_type: complianceType,
          document_url: storagePath,
          is_active: existingCompliance?.is_active ?? false,
        },
        {
          onConflict: 'agency_id,compliance_type',
        }
      );

    if (upsertError) {
      console.error('Compliance update error:', upsertError);
      // Try to clean up uploaded file
      await supabase.storage.from(STORAGE_BUCKET).remove([filename]);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ERROR_CODES.DATABASE_ERROR,
            message: 'Failed to update compliance record',
          },
        },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    // Delete old document AFTER successful upload and database update
    // This ensures we don't lose the old file if something fails
    if (oldDocumentPath) {
      await supabase.storage.from(STORAGE_BUCKET).remove([oldDocumentPath]);
    }

    return NextResponse.json({
      success: true,
      data: {
        // Return the signed URL for immediate client display
        document_url: signedUrlData.signedUrl,
      },
    });
  } catch (error) {
    console.error('Document upload error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'Failed to process document',
        },
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

/**
 * DELETE /api/dashboard/compliance/document
 * Removes a compliance document
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (!user || authError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'Authentication required',
        },
      },
      { status: HTTP_STATUS.UNAUTHORIZED }
    );
  }

  // Get user's claimed agency
  const { data: agency, error: agencyError } = await supabase
    .from('agencies')
    .select('id')
    .eq('claimed_by', user.id)
    .single();

  if (agencyError || !agency) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.FORBIDDEN,
          message: 'No claimed agency found for this user',
        },
      },
      { status: HTTP_STATUS.FORBIDDEN }
    );
  }

  // Get compliance_type from query params
  const { searchParams } = new URL(request.url);
  const complianceType = searchParams.get('compliance_type');

  if (
    !complianceType ||
    !COMPLIANCE_TYPES.includes(complianceType as ComplianceType)
  ) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Invalid or missing compliance_type',
        },
      },
      { status: HTTP_STATUS.BAD_REQUEST }
    );
  }

  // Get existing compliance record
  const { data: complianceRecord, error: complianceError } = await supabase
    .from('agency_compliance')
    .select('document_url')
    .eq('agency_id', agency.id)
    .eq('compliance_type', complianceType)
    .single();

  if (complianceError && complianceError.code !== 'PGRST116') {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: 'Failed to fetch compliance record',
        },
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }

  // Delete document from storage if exists
  if (complianceRecord?.document_url) {
    // Handle both old signed URLs (full URLs) and new storage paths (just filename)
    let filePath: string;
    const urlParts = complianceRecord.document_url.split(`/${STORAGE_BUCKET}/`);
    if (urlParts.length > 1) {
      // Old format: full signed URL - extract path and strip query parameters
      filePath = urlParts[1].split('?')[0];
    } else {
      // New format: just the storage path (e.g., "agency-id/type/timestamp.pdf")
      filePath = complianceRecord.document_url;
    }

    const { error: deleteError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([filePath]);

    if (deleteError) {
      console.error('Storage delete error:', deleteError);
      // Continue anyway to clear document_url
    }
  }

  // Update compliance record to remove document_url
  const { error: updateError } = await supabase
    .from('agency_compliance')
    .update({
      document_url: null,
    })
    .eq('agency_id', agency.id)
    .eq('compliance_type', complianceType);

  if (updateError) {
    console.error('Compliance update error:', updateError);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: 'Failed to update compliance record',
        },
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      document_url: null,
    },
  });
}
