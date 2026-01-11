/**
 * Compliance Helper Functions
 *
 * Utilities for handling compliance document URLs and storage operations.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { AgencyComplianceRow, ComplianceItemFull } from '@/types/api';
import { toComplianceItemFull } from '@/types/api';

const STORAGE_BUCKET = 'compliance-documents';
const SIGNED_URL_EXPIRY_SECONDS = 7 * 24 * 60 * 60; // 7 days

/**
 * Check if a document URL is a storage path (not a full URL)
 */
function isStoragePath(url: string | null): boolean {
  if (!url) return false;
  // Storage paths don't start with http/https
  return !url.startsWith('http://') && !url.startsWith('https://');
}

/**
 * Generate a signed URL for a storage path
 *
 * @param supabase - Supabase client instance
 * @param storagePath - The storage path (e.g., "agency-id/type/timestamp.pdf")
 * @returns Signed URL or null if generation fails
 */
export async function generateSignedUrl(
  supabase: SupabaseClient,
  storagePath: string
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_EXPIRY_SECONDS);

  if (error || !data?.signedUrl) {
    console.error('Failed to generate signed URL for:', storagePath, error);
    return null;
  }

  return data.signedUrl;
}

/**
 * Transform compliance rows to ComplianceItemFull with signed URLs
 *
 * For each compliance item that has a document_url stored as a storage path,
 * this function generates a fresh signed URL for client access.
 *
 * @param supabase - Supabase client instance
 * @param rows - Array of compliance database rows
 * @returns Array of ComplianceItemFull with accessible document URLs
 */
export async function transformComplianceWithSignedUrls(
  supabase: SupabaseClient,
  rows: AgencyComplianceRow[]
): Promise<ComplianceItemFull[]> {
  const items = await Promise.all(
    rows.map(async (row) => {
      const item = toComplianceItemFull(row);

      // If document_url is a storage path, generate a signed URL
      if (item.documentUrl && isStoragePath(item.documentUrl)) {
        const signedUrl = await generateSignedUrl(supabase, item.documentUrl);
        return {
          ...item,
          documentUrl: signedUrl, // Will be null if generation failed
        };
      }

      return item;
    })
  );

  return items;
}
