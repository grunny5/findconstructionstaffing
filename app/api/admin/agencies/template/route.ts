/**
 * Admin Agencies CSV Template Download Endpoint
 *
 * GET /api/admin/agencies/template
 *
 * Returns a downloadable CSV template file with correct column headers
 * and example data for bulk agency import.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ERROR_CODES, HTTP_STATUS } from '@/types/api';

export const dynamic = 'force-dynamic';

const CSV_HEADERS = [
  'name',
  'description',
  'website',
  'phone',
  'email',
  'headquarters',
  'founded_year',
  'employee_count',
  'company_size',
  'offers_per_diem',
  'is_union',
  'trades',
  'regions',
];

const EXAMPLE_ROWS = [
  {
    name: 'ABC Staffing',
    description: 'Industrial staffing experts serving the Gulf Coast region',
    website: 'https://abcstaffing.com',
    phone: '555-123-4567',
    email: 'contact@abcstaffing.com',
    headquarters: 'Houston, TX',
    founded_year: '2005',
    employee_count: '50-100',
    company_size: 'Medium',
    offers_per_diem: 'true',
    is_union: 'false',
    trades: 'Electrician,Welder,Pipefitter',
    regions: 'TX,LA,OK',
  },
  {
    name: 'Pacific Construction Workforce',
    description:
      'Skilled trades staffing for commercial and residential projects',
    website: 'https://pacificworkforce.com',
    phone: '555-987-6543',
    email: 'info@pacificworkforce.com',
    headquarters: 'Los Angeles, CA',
    founded_year: '2010',
    employee_count: '100-500',
    company_size: 'Large',
    offers_per_diem: 'false',
    is_union: 'true',
    trades: 'Carpenter,Plumber,HVAC Technician,Electrician',
    regions: 'CA,AZ,NV',
  },
];

function escapeCSVField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

function generateCSVContent(): string {
  const headerRow = CSV_HEADERS.join(',');

  const dataRows = EXAMPLE_ROWS.map((row) =>
    CSV_HEADERS.map((header) =>
      escapeCSVField(row[header as keyof typeof row])
    ).join(',')
  );

  return [headerRow, ...dataRows].join('\n');
}

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.UNAUTHORIZED,
            message: 'You must be logged in to access this endpoint',
          },
        },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.FORBIDDEN,
            message: 'Forbidden: Admin access required',
          },
        },
        { status: HTTP_STATUS.FORBIDDEN }
      );
    }

    const csvContent = generateCSVContent();

    const response = new NextResponse(csvContent, {
      status: HTTP_STATUS.OK,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition':
          'attachment; filename="agency-import-template.csv"',
      },
    });

    return response;
  } catch (error) {
    console.error('Unexpected error in template download handler:', error);
    return NextResponse.json(
      {
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'An unexpected error occurred',
        },
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
