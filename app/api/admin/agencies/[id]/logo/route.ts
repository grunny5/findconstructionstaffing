/**
 * Admin Agency Logo API Endpoint
 *
 * POST /api/admin/agencies/[id]/logo
 * Uploads a logo image, resizes to 300x300, converts to WebP, and stores in Supabase.
 *
 * DELETE /api/admin/agencies/[id]/logo
 * Removes the agency logo from storage and sets logo_url to null.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ERROR_CODES, HTTP_STATUS } from '@/types/api';
import sharp from 'sharp';

// Force dynamic rendering for authenticated routes
export const dynamic = 'force-dynamic';

const ACCEPTED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const LOGO_SIZE = 300;
const WEBP_QUALITY = 85;
const STORAGE_BUCKET = 'agency-logos';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/admin/agencies/[id]/logo
 * Uploads and processes an agency logo
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const supabase = await createClient();
  const params = await context.params;
  const agencyId = params.id;

  // Validate UUID format
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(agencyId)) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Invalid agency ID format',
        },
      },
      { status: HTTP_STATUS.BAD_REQUEST }
    );
  }

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

  // Check admin authorization
  const { data: userProfile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !userProfile || userProfile.role !== 'admin') {
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

  // Check if agency exists
  const { data: agency, error: agencyError } = await supabase
    .from('agencies')
    .select('id, logo_url')
    .eq('id', agencyId)
    .single();

  if (agencyError || !agency) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
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

  // Validate file type
  if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Invalid file type. Accepted types: PNG, JPG, WebP',
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
          message: 'File too large. Maximum size is 5MB',
        },
      },
      { status: HTTP_STATUS.BAD_REQUEST }
    );
  }

  try {
    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Process image with Sharp: resize to 300x300, crop to fill, convert to WebP
    const processedImage = await sharp(buffer)
      .resize(LOGO_SIZE, LOGO_SIZE, {
        fit: 'cover',
        position: 'center',
      })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${agencyId}/${timestamp}.webp`;

    // Delete old logo if exists
    if (agency.logo_url) {
      // Extract path from URL
      const urlParts = agency.logo_url.split(`/${STORAGE_BUCKET}/`);
      if (urlParts.length > 1) {
        const oldPath = urlParts[1];
        await supabase.storage.from(STORAGE_BUCKET).remove([oldPath]);
      }
    }

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filename, processedImage, {
        contentType: 'image/webp',
        upsert: true,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ERROR_CODES.DATABASE_ERROR,
            message: 'Failed to upload logo',
          },
        },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filename);

    // Update agency logo_url
    const { error: updateError } = await supabase
      .from('agencies')
      .update({
        logo_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', agencyId);

    if (updateError) {
      console.error('Agency update error:', updateError);
      // Try to clean up uploaded file
      await supabase.storage.from(STORAGE_BUCKET).remove([filename]);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ERROR_CODES.DATABASE_ERROR,
            message: 'Failed to update agency',
          },
        },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        logo_url: publicUrl,
      },
    });
  } catch (error) {
    console.error('Logo processing error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: 'Failed to process image',
        },
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

/**
 * DELETE /api/admin/agencies/[id]/logo
 * Removes the agency logo
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const supabase = await createClient();
  const params = await context.params;
  const agencyId = params.id;

  // Validate UUID format
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(agencyId)) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Invalid agency ID format',
        },
      },
      { status: HTTP_STATUS.BAD_REQUEST }
    );
  }

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

  // Check admin authorization
  const { data: userProfile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !userProfile || userProfile.role !== 'admin') {
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

  // Check if agency exists and get current logo_url
  const { data: agency, error: agencyError } = await supabase
    .from('agencies')
    .select('id, logo_url')
    .eq('id', agencyId)
    .single();

  if (agencyError || !agency) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Agency not found',
        },
      },
      { status: HTTP_STATUS.NOT_FOUND }
    );
  }

  // Delete logo file from storage if exists
  if (agency.logo_url) {
    const urlParts = agency.logo_url.split(`/${STORAGE_BUCKET}/`);
    if (urlParts.length > 1) {
      const filePath = urlParts[1];
      const { error: deleteError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([filePath]);

      if (deleteError) {
        console.error('Storage delete error:', deleteError);
        // Continue anyway to clear logo_url
      }
    }
  }

  // Update agency to remove logo_url
  const { error: updateError } = await supabase
    .from('agencies')
    .update({
      logo_url: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', agencyId);

  if (updateError) {
    console.error('Agency update error:', updateError);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: 'Failed to update agency',
        },
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      logo_url: null,
    },
  });
}
