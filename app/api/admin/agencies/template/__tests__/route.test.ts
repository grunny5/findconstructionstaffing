/**
 * Tests for Admin Agencies CSV Template Download Endpoint
 *
 * @jest-environment node
 */

import { GET } from '../route';
import { createClient } from '@/lib/supabase/server';
import { ERROR_CODES, HTTP_STATUS } from '@/types/api';

jest.mock('@/lib/supabase/server');

const mockedCreateClient = jest.mocked(createClient);

describe('GET /api/admin/agencies/template', () => {
  let mockSupabaseClient: {
    auth: { getUser: jest.Mock };
    from: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabaseClient = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn(),
    };

    mockedCreateClient.mockResolvedValue(mockSupabaseClient as never);
  });

  describe('Authentication', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(data.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
      expect(data.error.message).toBe(
        'You must be logged in to access this endpoint'
      );
    });

    it('should return 401 if auth check fails', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Auth failed'),
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(data.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
    });
  });

  describe('Admin Role Verification', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: {
          user: { id: 'user-123', email: 'user@example.com' },
        },
        error: null,
      });
    });

    it('should return 403 if user is not an admin', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { role: 'user' },
              error: null,
            }),
          }),
        }),
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.FORBIDDEN);
      expect(data.error.code).toBe(ERROR_CODES.FORBIDDEN);
      expect(data.error.message).toBe('Forbidden: Admin access required');
    });

    it('should return 403 if profile fetch fails', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: new Error('Profile not found'),
            }),
          }),
        }),
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.FORBIDDEN);
      expect(data.error.code).toBe(ERROR_CODES.FORBIDDEN);
    });

    it('should return 403 if profile has no role', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.FORBIDDEN);
      expect(data.error.code).toBe(ERROR_CODES.FORBIDDEN);
    });
  });

  describe('CSV Template Download', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: {
          user: { id: 'admin-123', email: 'admin@example.com' },
        },
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null,
            }),
          }),
        }),
      });
    });

    it('should return 200 with CSV content for admin users', async () => {
      const response = await GET();

      expect(response.status).toBe(HTTP_STATUS.OK);
    });

    it('should set correct Content-Type header', async () => {
      const response = await GET();

      expect(response.headers.get('Content-Type')).toBe(
        'text/csv; charset=utf-8'
      );
    });

    it('should set correct Content-Disposition header for download', async () => {
      const response = await GET();

      expect(response.headers.get('Content-Disposition')).toBe(
        'attachment; filename="agency-import-template.csv"'
      );
    });

    it('should include all required column headers', async () => {
      const response = await GET();
      const csvContent = await response.text();
      const lines = csvContent.split('\n');
      const headers = lines[0].split(',');

      const expectedHeaders = [
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

      expect(headers).toEqual(expectedHeaders);
    });

    it('should include exactly 2 example rows', async () => {
      const response = await GET();
      const csvContent = await response.text();
      const lines = csvContent.split('\n');

      // 1 header row + 2 example rows = 3 lines
      expect(lines.length).toBe(3);
    });

    it('should include valid example data in first example row', async () => {
      const response = await GET();
      const csvContent = await response.text();
      const lines = csvContent.split('\n');

      expect(lines[1]).toContain('ABC Staffing');
      expect(lines[1]).toContain('https://abcstaffing.com');
      expect(lines[1]).toContain('Houston');
      expect(lines[1]).toContain('TX');
    });

    it('should include valid example data in second example row', async () => {
      const response = await GET();
      const csvContent = await response.text();
      const lines = csvContent.split('\n');

      expect(lines[2]).toContain('Pacific Construction Workforce');
      expect(lines[2]).toContain('https://pacificworkforce.com');
      expect(lines[2]).toContain('Los Angeles');
      expect(lines[2]).toContain('CA');
    });

    it('should properly escape fields containing commas', async () => {
      const response = await GET();
      const csvContent = await response.text();

      // "Houston, TX" should be quoted
      expect(csvContent).toContain('"Houston, TX"');
      expect(csvContent).toContain('"Los Angeles, CA"');
    });

    it('should include boolean fields as true/false strings', async () => {
      const response = await GET();
      const csvContent = await response.text();

      expect(csvContent).toContain('true');
      expect(csvContent).toContain('false');
    });

    it('should include comma-separated trades', async () => {
      const response = await GET();
      const csvContent = await response.text();

      expect(csvContent).toContain('"Electrician,Welder,Pipefitter"');
      expect(csvContent).toContain(
        '"Carpenter,Plumber,HVAC Technician,Electrician"'
      );
    });

    it('should include comma-separated regions', async () => {
      const response = await GET();
      const csvContent = await response.text();

      expect(csvContent).toContain('"TX,LA,OK"');
      expect(csvContent).toContain('"CA,AZ,NV"');
    });
  });

  describe('Error Handling', () => {
    it('should return 500 on unexpected error', async () => {
      mockedCreateClient.mockRejectedValue(new Error('Unexpected error'));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(data.error.code).toBe(ERROR_CODES.INTERNAL_ERROR);
      expect(data.error.message).toBe('An unexpected error occurred');
    });
  });
});
