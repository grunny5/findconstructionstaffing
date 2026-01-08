/**
 * Admin Compliance Document API Endpoint
 *
 * POST /api/admin/agencies/[id]/compliance/document
 * Admin uploads a compliance document (PDF or image) for any agency
 *
 * DELETE /api/admin/agencies/[id]/compliance/document
 * Admin removes a compliance document from storage and sets document_url to null
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
 * POST /api/admin/agencies/[id]/compliance/document
 * Admin uploads a compliance document for an agency
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id: agencyId } = await params;
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

  // Check admin role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: 'Failed to fetch user profile',
        },
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }

  if (profile.role !== 'admin') {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.FORBIDDEN,
          message: 'Admin access required',
        },
      },
      { status: HTTP_STATUS.FORBIDDEN }
    );
  }

  // Validate agency exists
  const { data: agency, error: agencyError } = await supabase
    .from('agencies')
    .select('id')
    .eq('id', agencyId)
    .single();

  if (agencyError || !agency) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.NOT_FOUND,
          message: 'Agency not found',
        },
      },
      { status: HTTP_STATUS.NOT_FOUND }
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
    const timestamp = Date.now();
    let extension = 'pdf';
    if (file.name.includes('.')) {
      const lastSegment = file.name.split('.').pop();
      if (lastSegment && lastSegment !== '') {
        extension = lastSegment.toLowerCase();
      }
    } else {
      // Fallback to MIME type mapping when filename has no extension
      const mimeExtensions: Record<string, string> = {
        'application/pdf': 'pdf',
        'image/png': 'png',
        'image/jpeg': 'jpg',
      };
      extension = mimeExtensions[file.type] || 'pdf';
    }
    const filename = `${agencyId}/${complianceType}/${timestamp}.${extension}`;

    // Get existing compliance record to check for old document and preserve is_active state
    const { data: existingCompliance } = await supabase
      .from('agency_compliance')
      .select('document_url, is_active')
      .eq('agency_id', agencyId)
      .eq('compliance_type', complianceType)
      .single();

    // Delete old document if exists
    if (existingCompliance?.document_url) {
      const urlParts = existingCompliance.document_url.split(
        `/${STORAGE_BUCKET}/`
      );
      if (urlParts.length > 1) {
        const oldPath = urlParts[1];
        await supabase.storage.from(STORAGE_BUCKET).remove([oldPath]);
      }
    }

    // Upload to Supabase Storage
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

    const documentUrl = signedUrlData.signedUrl;

    // Update or insert compliance record
    // Preserve existing is_active state, or default to false for new records
    const { error: upsertError } = await supabase
      .from('agency_compliance')
      .upsert(
        {
          agency_id: agencyId,
          compliance_type: complianceType,
          document_url: documentUrl,
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

    return NextResponse.json({
      success: true,
      data: {
        document_url: documentUrl,
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
 * DELETE /api/admin/agencies/[id]/compliance/document
 * Admin removes a compliance document
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id: agencyId } = await params;
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

  // Check admin role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: 'Failed to fetch user profile',
        },
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }

  if (profile.role !== 'admin') {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.FORBIDDEN,
          message: 'Admin access required',
        },
      },
      { status: HTTP_STATUS.FORBIDDEN }
    );
  }

  // Validate agency exists
  const { data: agency, error: agencyError } = await supabase
    .from('agencies')
    .select('id')
    .eq('id', agencyId)
    .single();

  if (agencyError || !agency) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.NOT_FOUND,
          message: 'Agency not found',
        },
      },
      { status: HTTP_STATUS.NOT_FOUND }
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
    .eq('agency_id', agencyId)
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
    const urlParts = complianceRecord.document_url.split(`/${STORAGE_BUCKET}/`);
    if (urlParts.length > 1) {
      const filePath = urlParts[1];
      const { error: deleteError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([filePath]);

      if (deleteError) {
        console.error('Storage delete error:', deleteError);
        // Continue anyway to clear document_url
      }
    }
  }

  // Update compliance record to remove document_url
  const { error: updateError } = await supabase
    .from('agency_compliance')
    .update({
      document_url: null,
    })
    .eq('agency_id', agencyId)
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
