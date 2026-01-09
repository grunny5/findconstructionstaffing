/**
 * Tests for compliance expiration cron job
 */

import { GET } from '../route';
import { NextRequest } from 'next/server';
import { Resend } from 'resend';

// Mock @supabase/supabase-js createClient
const mockSupabaseFrom = jest.fn();
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: mockSupabaseFrom,
  })),
}));

// Mock Resend
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest
        .fn()
        .mockResolvedValue({ data: { id: 'email-123' }, error: null }),
    },
  })),
}));

// Mock email generators
jest.mock('@/lib/emails/compliance-expiring-30', () => ({
  generateComplianceExpiring30HTML: jest
    .fn()
    .mockReturnValue('<html>30 day reminder</html>'),
  generateComplianceExpiring30Text: jest
    .fn()
    .mockReturnValue('30 day reminder text'),
}));

jest.mock('@/lib/emails/compliance-expiring-7', () => ({
  generateComplianceExpiring7HTML: jest
    .fn()
    .mockReturnValue('<html>7 day reminder</html>'),
  generateComplianceExpiring7Text: jest
    .fn()
    .mockReturnValue('7 day reminder text'),
}));

describe('GET /api/cron/compliance-expiration', () => {
  let mockResendSend: jest.Mock;

  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();

    // Set up environment variables
    process.env = {
      ...originalEnv,
      CRON_SECRET: 'test-cron-secret',
      RESEND_API_KEY: 'test-resend-key',
      NEXT_PUBLIC_SITE_URL: 'https://test.com',
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
    };

    // Set up Resend mock
    mockResendSend = jest
      .fn()
      .mockResolvedValue({ data: { id: 'email-123' }, error: null });
    (Resend as jest.Mock).mockImplementation(() => ({
      emails: { send: mockResendSend },
    }));
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Authentication', () => {
    it('should return 500 if CRON_SECRET is not configured', async () => {
      delete process.env.CRON_SECRET;

      const request = new NextRequest(
        'http://localhost:3000/api/cron/compliance-expiration'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Cron job not configured');
    });

    it('should return 401 if authorization header is missing', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/cron/compliance-expiration'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 401 if authorization header is invalid', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/cron/compliance-expiration',
        {
          headers: {
            authorization: 'Bearer wrong-secret',
          },
        }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 500 if SUPABASE_SERVICE_ROLE_KEY is not configured', async () => {
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      const request = new NextRequest(
        'http://localhost:3000/api/cron/compliance-expiration',
        {
          headers: {
            authorization: 'Bearer test-cron-secret',
          },
        }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Database configuration error');
    });

    it('should return 500 if RESEND_API_KEY is not configured', async () => {
      delete process.env.RESEND_API_KEY;

      // Mock empty compliance items to get past DB check
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            not: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/cron/compliance-expiration',
        {
          headers: {
            authorization: 'Bearer test-cron-secret',
          },
        }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Email service not configured');
    });
  });

  describe('Database Errors', () => {
    it('should return 500 if database fetch fails', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            not: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/cron/compliance-expiration',
        {
          headers: {
            authorization: 'Bearer test-cron-secret',
          },
        }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Database error');
    });
  });

  describe('No Expiring Items', () => {
    it('should return success with zero reminders when no items are expiring', async () => {
      // Mock empty result
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            not: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/cron/compliance-expiration',
        {
          headers: {
            authorization: 'Bearer test-cron-secret',
          },
        }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.summary.sent30DayReminders).toBe(0);
      expect(data.summary.sent7DayReminders).toBe(0);
      expect(data.summary.totalAgenciesNotified).toBe(0);
    });
  });

  describe('30-Day Reminders', () => {
    it('should send 30-day reminder for items expiring in 30 days', async () => {
      const now = new Date();
      const expirationDate = new Date(now);
      expirationDate.setDate(now.getDate() + 30);

      const mockComplianceItem = {
        id: 'comp-1',
        agency_id: 'agency-1',
        compliance_type: 'osha_certified',
        expiration_date: expirationDate.toISOString().split('T')[0],
        last_30_day_reminder_sent: null,
        last_7_day_reminder_sent: null,
      };

      // Mock fetching compliance items
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          not: jest.fn().mockResolvedValue({
            data: [mockComplianceItem],
            error: null,
          }),
        }),
      });

      // Mock fetching agencies (uses .in().not() for batch query)
      const mockAgencySelect = jest.fn().mockReturnValue({
        in: jest.fn().mockReturnValue({
          not: jest.fn().mockResolvedValue({
            data: [
              {
                id: 'agency-1',
                name: 'Test Agency',
                slug: 'test-agency',
                claimed_by: 'owner-1',
              },
            ],
            error: null,
          }),
        }),
      });

      // Mock fetching profiles (uses .in() for batch query)
      const mockProfileSelect = jest.fn().mockReturnValue({
        in: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'owner-1',
              email: 'owner@test.com',
              full_name: 'Test Owner',
            },
          ],
          error: null,
        }),
      });

      // Mock update (uses .in() for batch updates)
      const mockUpdate = jest.fn().mockReturnValue({
        in: jest.fn().mockResolvedValue({
          data: {},
          error: null,
        }),
      });

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'agency_compliance') {
          return {
            select: mockSelect,
            update: mockUpdate,
          };
        } else if (table === 'agencies') {
          return {
            select: mockAgencySelect,
          };
        } else if (table === 'profiles') {
          return {
            select: mockProfileSelect,
          };
        }
      });

      const request = new NextRequest(
        'http://localhost:3000/api/cron/compliance-expiration',
        {
          headers: {
            authorization: 'Bearer test-cron-secret',
          },
        }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.summary.sent30DayReminders).toBe(1);
      expect(data.summary.sent7DayReminders).toBe(0);
      expect(data.summary.totalAgenciesNotified).toBe(1);

      // Verify email was sent
      expect(mockResendSend).toHaveBeenCalledTimes(1);
      expect(mockResendSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'owner@test.com',
          subject: expect.stringContaining('30 Days'),
        })
      );

      // Verify tracking was updated
      expect(mockUpdate).toHaveBeenCalledWith({
        last_30_day_reminder_sent: expect.any(String),
      });
    });

    it('should not send 30-day reminder if already sent within 24 hours', async () => {
      const now = new Date();
      const expirationDate = new Date(now);
      expirationDate.setDate(now.getDate() + 30);

      const recentlySent = new Date(now);
      recentlySent.setHours(now.getHours() - 12); // 12 hours ago

      const mockComplianceItem = {
        id: 'comp-1',
        agency_id: 'agency-1',
        compliance_type: 'osha_certified',
        expiration_date: expirationDate.toISOString().split('T')[0],
        last_30_day_reminder_sent: recentlySent.toISOString(),
        last_7_day_reminder_sent: null,
      };

      // Mock fetching compliance items - returns item with recent reminder
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          not: jest.fn().mockResolvedValue({
            data: [mockComplianceItem],
            error: null,
          }),
        }),
      });

      // Mock agencies - return the agency even though reminder won't be sent
      // (the filtering happens in groupItemsByAgency based on wasRecentlySent)
      const mockAgencySelect = jest.fn().mockReturnValue({
        in: jest.fn().mockReturnValue({
          not: jest.fn().mockResolvedValue({
            data: [
              {
                id: 'agency-1',
                name: 'Test Agency',
                slug: 'test-agency',
                claimed_by: 'owner-1',
              },
            ],
            error: null,
          }),
        }),
      });

      // Mock profiles
      const mockProfileSelect = jest.fn().mockReturnValue({
        in: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'owner-1',
              email: 'owner@test.com',
              full_name: 'Test Owner',
            },
          ],
          error: null,
        }),
      });

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'agency_compliance') {
          return {
            select: mockSelect,
          };
        } else if (table === 'agencies') {
          return {
            select: mockAgencySelect,
          };
        } else if (table === 'profiles') {
          return {
            select: mockProfileSelect,
          };
        }
      });

      const request = new NextRequest(
        'http://localhost:3000/api/cron/compliance-expiration',
        {
          headers: {
            authorization: 'Bearer test-cron-secret',
          },
        }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.summary.sent30DayReminders).toBe(0);
      expect(mockResendSend).not.toHaveBeenCalled();
    });
  });

  describe('7-Day Reminders', () => {
    it('should send 7-day reminder for items expiring in 7 days', async () => {
      const now = new Date();
      const expirationDate = new Date(now);
      expirationDate.setDate(now.getDate() + 7);

      const mockComplianceItem = {
        id: 'comp-1',
        agency_id: 'agency-1',
        compliance_type: 'workers_comp',
        expiration_date: expirationDate.toISOString().split('T')[0],
        last_30_day_reminder_sent: null,
        last_7_day_reminder_sent: null,
      };

      // Mock fetching compliance items
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          not: jest.fn().mockResolvedValue({
            data: [mockComplianceItem],
            error: null,
          }),
        }),
      });

      // Mock fetching agencies (uses .in().not() for batch query)
      const mockAgencySelect = jest.fn().mockReturnValue({
        in: jest.fn().mockReturnValue({
          not: jest.fn().mockResolvedValue({
            data: [
              {
                id: 'agency-1',
                name: 'Test Agency',
                slug: 'test-agency',
                claimed_by: 'owner-1',
              },
            ],
            error: null,
          }),
        }),
      });

      // Mock fetching profiles (uses .in() for batch query)
      const mockProfileSelect = jest.fn().mockReturnValue({
        in: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'owner-1',
              email: 'owner@test.com',
              full_name: 'Test Owner',
            },
          ],
          error: null,
        }),
      });

      // Mock update (uses .in() for batch updates)
      const mockUpdate = jest.fn().mockReturnValue({
        in: jest.fn().mockResolvedValue({
          data: {},
          error: null,
        }),
      });

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'agency_compliance') {
          return {
            select: mockSelect,
            update: mockUpdate,
          };
        } else if (table === 'agencies') {
          return {
            select: mockAgencySelect,
          };
        } else if (table === 'profiles') {
          return {
            select: mockProfileSelect,
          };
        }
      });

      const request = new NextRequest(
        'http://localhost:3000/api/cron/compliance-expiration',
        {
          headers: {
            authorization: 'Bearer test-cron-secret',
          },
        }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.summary.sent30DayReminders).toBe(0);
      expect(data.summary.sent7DayReminders).toBe(1);
      expect(data.summary.totalAgenciesNotified).toBe(1);

      // Verify email was sent
      expect(mockResendSend).toHaveBeenCalledTimes(1);
      expect(mockResendSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'owner@test.com',
          subject: expect.stringContaining('7 Days'),
        })
      );

      // Verify tracking was updated
      expect(mockUpdate).toHaveBeenCalledWith({
        last_7_day_reminder_sent: expect.any(String),
      });
    });
  });

  describe('Multiple Items', () => {
    it('should group multiple expiring items by agency and send one email', async () => {
      const now = new Date();
      const expirationDate = new Date(now);
      expirationDate.setDate(now.getDate() + 30);

      const mockItems = [
        {
          id: 'comp-1',
          agency_id: 'agency-1',
          compliance_type: 'osha_certified',
          expiration_date: expirationDate.toISOString().split('T')[0],
          last_30_day_reminder_sent: null,
          last_7_day_reminder_sent: null,
        },
        {
          id: 'comp-2',
          agency_id: 'agency-1',
          compliance_type: 'drug_testing',
          expiration_date: expirationDate.toISOString().split('T')[0],
          last_30_day_reminder_sent: null,
          last_7_day_reminder_sent: null,
        },
      ];

      // Mock fetching compliance items
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          not: jest.fn().mockResolvedValue({
            data: mockItems,
            error: null,
          }),
        }),
      });

      // Mock fetching agencies (uses .in().not() for batch query)
      const mockAgencySelect = jest.fn().mockReturnValue({
        in: jest.fn().mockReturnValue({
          not: jest.fn().mockResolvedValue({
            data: [
              {
                id: 'agency-1',
                name: 'Test Agency',
                slug: 'test-agency',
                claimed_by: 'owner-1',
              },
            ],
            error: null,
          }),
        }),
      });

      // Mock fetching profiles (uses .in() for batch query)
      const mockProfileSelect = jest.fn().mockReturnValue({
        in: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'owner-1',
              email: 'owner@test.com',
              full_name: 'Test Owner',
            },
          ],
          error: null,
        }),
      });

      // Mock update (uses .in() for batch updates)
      const mockUpdate = jest.fn().mockReturnValue({
        in: jest.fn().mockResolvedValue({
          data: {},
          error: null,
        }),
      });

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'agency_compliance') {
          return {
            select: mockSelect,
            update: mockUpdate,
          };
        } else if (table === 'agencies') {
          return {
            select: mockAgencySelect,
          };
        } else if (table === 'profiles') {
          return {
            select: mockProfileSelect,
          };
        }
      });

      const request = new NextRequest(
        'http://localhost:3000/api/cron/compliance-expiration',
        {
          headers: {
            authorization: 'Bearer test-cron-secret',
          },
        }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.summary.sent30DayReminders).toBe(2);
      expect(data.summary.totalAgenciesNotified).toBe(1);

      // Verify only one email was sent (grouped)
      expect(mockResendSend).toHaveBeenCalledTimes(1);

      // Verify items were updated in one batch call
      expect(mockUpdate).toHaveBeenCalledTimes(1);
    });
  });

  describe('Unclaimed Agencies', () => {
    it('should skip unclaimed agencies', async () => {
      const now = new Date();
      const expirationDate = new Date(now);
      expirationDate.setDate(now.getDate() + 30);

      const mockComplianceItem = {
        id: 'comp-1',
        agency_id: 'agency-1',
        compliance_type: 'osha_certified',
        expiration_date: expirationDate.toISOString().split('T')[0],
        last_30_day_reminder_sent: null,
        last_7_day_reminder_sent: null,
      };

      // Mock fetching compliance items
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          not: jest.fn().mockResolvedValue({
            data: [mockComplianceItem],
            error: null,
          }),
        }),
      });

      // Mock unclaimed agency (uses .in().not() - returns empty array since claimed_by is null)
      const mockAgencySelect = jest.fn().mockReturnValue({
        in: jest.fn().mockReturnValue({
          not: jest.fn().mockResolvedValue({
            data: [], // Empty because unclaimed agencies are filtered out
            error: null,
          }),
        }),
      });

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'agency_compliance') {
          return {
            select: mockSelect,
          };
        } else if (table === 'agencies') {
          return {
            select: mockAgencySelect,
          };
        }
      });

      const request = new NextRequest(
        'http://localhost:3000/api/cron/compliance-expiration',
        {
          headers: {
            authorization: 'Bearer test-cron-secret',
          },
        }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.summary.sent30DayReminders).toBe(0);
      expect(data.summary.totalAgenciesNotified).toBe(0);
      expect(mockResendSend).not.toHaveBeenCalled();
    });
  });

  describe('Invalid Email', () => {
    it('should skip owners with invalid email addresses', async () => {
      const now = new Date();
      const expirationDate = new Date(now);
      expirationDate.setDate(now.getDate() + 30);

      const mockComplianceItem = {
        id: 'comp-1',
        agency_id: 'agency-1',
        compliance_type: 'osha_certified',
        expiration_date: expirationDate.toISOString().split('T')[0],
        last_30_day_reminder_sent: null,
        last_7_day_reminder_sent: null,
      };

      // Mock fetching compliance items
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          not: jest.fn().mockResolvedValue({
            data: [mockComplianceItem],
            error: null,
          }),
        }),
      });

      // Mock agencies
      const mockAgencySelect = jest.fn().mockReturnValue({
        in: jest.fn().mockReturnValue({
          not: jest.fn().mockResolvedValue({
            data: [
              {
                id: 'agency-1',
                name: 'Test Agency',
                slug: 'test-agency',
                claimed_by: 'owner-1',
              },
            ],
            error: null,
          }),
        }),
      });

      // Mock profiles with invalid email
      const mockProfileSelect = jest.fn().mockReturnValue({
        in: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'owner-1',
              email: null, // Invalid email
              full_name: 'Test Owner',
            },
          ],
          error: null,
        }),
      });

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'agency_compliance') {
          return {
            select: mockSelect,
          };
        } else if (table === 'agencies') {
          return {
            select: mockAgencySelect,
          };
        } else if (table === 'profiles') {
          return {
            select: mockProfileSelect,
          };
        }
      });

      const request = new NextRequest(
        'http://localhost:3000/api/cron/compliance-expiration',
        {
          headers: {
            authorization: 'Bearer test-cron-secret',
          },
        }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.summary.sent30DayReminders).toBe(0);
      expect(mockResendSend).not.toHaveBeenCalled();
    });
  });

  describe('Email Send Failure', () => {
    it('should rollback tracking timestamp when email send fails', async () => {
      const now = new Date();
      const expirationDate = new Date(now);
      expirationDate.setDate(now.getDate() + 30);

      const mockComplianceItem = {
        id: 'comp-1',
        agency_id: 'agency-1',
        compliance_type: 'osha_certified',
        expiration_date: expirationDate.toISOString().split('T')[0],
        last_30_day_reminder_sent: null,
        last_7_day_reminder_sent: null,
      };

      // Mock fetching compliance items
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          not: jest.fn().mockResolvedValue({
            data: [mockComplianceItem],
            error: null,
          }),
        }),
      });

      // Mock agencies
      const mockAgencySelect = jest.fn().mockReturnValue({
        in: jest.fn().mockReturnValue({
          not: jest.fn().mockResolvedValue({
            data: [
              {
                id: 'agency-1',
                name: 'Test Agency',
                slug: 'test-agency',
                claimed_by: 'owner-1',
              },
            ],
            error: null,
          }),
        }),
      });

      // Mock profiles
      const mockProfileSelect = jest.fn().mockReturnValue({
        in: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'owner-1',
              email: 'owner@test.com',
              full_name: 'Test Owner',
            },
          ],
          error: null,
        }),
      });

      // Track update calls
      const mockUpdateIn = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      const mockUpdate = jest.fn().mockReturnValue({
        in: mockUpdateIn,
      });

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'agency_compliance') {
          return {
            select: mockSelect,
            update: mockUpdate,
          };
        } else if (table === 'agencies') {
          return {
            select: mockAgencySelect,
          };
        } else if (table === 'profiles') {
          return {
            select: mockProfileSelect,
          };
        }
      });

      // Make Resend fail
      mockResendSend.mockResolvedValue({
        data: null,
        error: { message: 'Email service unavailable' },
      });

      const request = new NextRequest(
        'http://localhost:3000/api/cron/compliance-expiration',
        {
          headers: {
            authorization: 'Bearer test-cron-secret',
          },
        }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.summary.sent30DayReminders).toBe(0);
      expect(data.summary.errors).toHaveLength(1);

      // Verify update was called twice (set timestamp, then rollback)
      expect(mockUpdate).toHaveBeenCalledTimes(2);
    });
  });
});
