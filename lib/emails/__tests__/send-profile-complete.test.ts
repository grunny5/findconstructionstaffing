/**
 * @jest-environment node
 */
import { sendProfileCompleteEmailIfNeeded } from '../send-profile-complete';
import { Resend } from 'resend';
import { SupabaseClient } from '@supabase/supabase-js';

// Mock Resend
jest.mock('resend');

// Mock environment variables
const originalEnv = process.env;

describe('sendProfileCompleteEmailIfNeeded', () => {
  let mockSupabase: jest.Mocked<SupabaseClient>;
  let mockResend: jest.Mocked<Resend>;
  let mockEmailSend: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup environment variables
    process.env = {
      ...originalEnv,
      RESEND_API_KEY: 'test-api-key',
      NEXT_PUBLIC_SITE_URL: 'https://test.example.com',
    };

    // Setup mock Resend instance
    mockEmailSend = jest.fn().mockResolvedValue({ id: 'test-email-id' });
    mockResend = {
      emails: {
        send: mockEmailSend,
      },
    } as unknown as jest.Mocked<Resend>;

    (Resend as jest.Mock).mockImplementation(() => mockResend);

    // Setup mock Supabase client
    mockSupabase = {
      from: jest.fn(),
    } as unknown as jest.Mocked<SupabaseClient>;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Success Cases', () => {
    it('should send email when profile reaches 100% and email not sent', async () => {
      // Mock agency data - 100% complete, email not sent
      const mockAgency = {
        id: 'agency-123',
        name: 'Test Agency',
        slug: 'test-agency',
        profile_completion_percentage: 100,
        completion_email_sent: false,
        claimed_by: 'user-123',
      };

      // Mock owner profile
      const mockOwner = {
        email: 'owner@test.com',
        full_name: 'John Doe',
      };

      // Setup mock chain for agency fetch
      const mockAgencySelect = jest.fn().mockReturnThis();
      const mockAgencyEq = jest.fn().mockReturnThis();
      const mockAgencySingle = jest
        .fn()
        .mockResolvedValue({ data: mockAgency, error: null });

      // Setup mock chain for owner profile fetch
      const mockOwnerSelect = jest.fn().mockReturnThis();
      const mockOwnerEq = jest.fn().mockReturnThis();
      const mockOwnerSingle = jest
        .fn()
        .mockResolvedValue({ data: mockOwner, error: null });

      // Setup mock chain for flag update
      const mockUpdateReturn = jest.fn().mockReturnThis();
      const mockUpdateEq = jest
        .fn()
        .mockResolvedValue({ data: null, error: null });

      (mockSupabase.from as jest.Mock)
        .mockReturnValueOnce({
          select: mockAgencySelect,
        })
        .mockReturnValueOnce({
          select: mockOwnerSelect,
        })
        .mockReturnValueOnce({
          update: mockUpdateReturn,
        });

      mockAgencySelect.mockReturnValue({
        eq: mockAgencyEq,
      });
      mockAgencyEq.mockReturnValue({
        single: mockAgencySingle,
      });

      mockOwnerSelect.mockReturnValue({
        eq: mockOwnerEq,
      });
      mockOwnerEq.mockReturnValue({
        single: mockOwnerSingle,
      });

      mockUpdateReturn.mockReturnValue({
        eq: mockUpdateEq,
      });

      const result = await sendProfileCompleteEmailIfNeeded(
        mockSupabase,
        'agency-123'
      );

      // Verify email was sent
      expect(result.sent).toBe(true);
      expect(mockEmailSend).toHaveBeenCalledTimes(1);
      expect(mockEmailSend).toHaveBeenCalledWith({
        from: 'FindConstructionStaffing <noreply@findconstructionstaffing.com>',
        to: 'owner@test.com',
        subject: '🎉 Your Profile is Complete - Test Agency',
        html: expect.stringContaining('Congratulations'),
        text: expect.stringContaining('Congratulations'),
      });

      // Verify flag was updated
      expect(mockUpdateReturn).toHaveBeenCalledWith({
        completion_email_sent: true,
      });
      expect(mockUpdateEq).toHaveBeenCalledWith('id', 'agency-123');
    });

    it('should handle owner without full_name', async () => {
      const mockAgency = {
        id: 'agency-123',
        name: 'Test Agency',
        slug: 'test-agency',
        profile_completion_percentage: 100,
        completion_email_sent: false,
        claimed_by: 'user-123',
      };

      const mockOwner = {
        email: 'owner@test.com',
        full_name: null,
      };

      const mockAgencySelect = jest.fn().mockReturnThis();
      const mockAgencyEq = jest.fn().mockReturnThis();
      const mockAgencySingle = jest
        .fn()
        .mockResolvedValue({ data: mockAgency, error: null });

      const mockOwnerSelect = jest.fn().mockReturnThis();
      const mockOwnerEq = jest.fn().mockReturnThis();
      const mockOwnerSingle = jest
        .fn()
        .mockResolvedValue({ data: mockOwner, error: null });

      const mockUpdateReturn = jest.fn().mockReturnThis();
      const mockUpdateEq = jest
        .fn()
        .mockResolvedValue({ data: null, error: null });

      (mockSupabase.from as jest.Mock)
        .mockReturnValueOnce({ select: mockAgencySelect })
        .mockReturnValueOnce({ select: mockOwnerSelect })
        .mockReturnValueOnce({ update: mockUpdateReturn });

      mockAgencySelect.mockReturnValue({ eq: mockAgencyEq });
      mockAgencyEq.mockReturnValue({ single: mockAgencySingle });
      mockOwnerSelect.mockReturnValue({ eq: mockOwnerEq });
      mockOwnerEq.mockReturnValue({ single: mockOwnerSingle });
      mockUpdateReturn.mockReturnValue({ eq: mockUpdateEq });

      const result = await sendProfileCompleteEmailIfNeeded(
        mockSupabase,
        'agency-123'
      );

      expect(result.sent).toBe(true);
      expect(mockEmailSend).toHaveBeenCalledTimes(1);
    });
  });

  describe('Duplicate Prevention', () => {
    it('should not send email if already sent', async () => {
      const mockAgency = {
        id: 'agency-123',
        name: 'Test Agency',
        slug: 'test-agency',
        profile_completion_percentage: 100,
        completion_email_sent: true, // Already sent
        claimed_by: 'user-123',
      };

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest
        .fn()
        .mockResolvedValue({ data: mockAgency, error: null });

      (mockSupabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ single: mockSingle });

      const result = await sendProfileCompleteEmailIfNeeded(
        mockSupabase,
        'agency-123'
      );

      expect(result.sent).toBe(false);
      expect(result.reason).toBe('email_already_sent');
      expect(mockEmailSend).not.toHaveBeenCalled();
    });
  });

  describe('Profile Not Complete Cases', () => {
    it('should not send email if profile is below 100%', async () => {
      const mockAgency = {
        id: 'agency-123',
        name: 'Test Agency',
        slug: 'test-agency',
        profile_completion_percentage: 85,
        completion_email_sent: false,
        claimed_by: 'user-123',
      };

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest
        .fn()
        .mockResolvedValue({ data: mockAgency, error: null });

      (mockSupabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ single: mockSingle });

      const result = await sendProfileCompleteEmailIfNeeded(
        mockSupabase,
        'agency-123'
      );

      expect(result.sent).toBe(false);
      expect(result.reason).toBe('profile_not_complete');
      expect(mockEmailSend).not.toHaveBeenCalled();
    });
  });

  describe('Error Cases', () => {
    it('should handle agency not found', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest
        .fn()
        .mockResolvedValue({ data: null, error: { message: 'Not found' } });

      (mockSupabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ single: mockSingle });

      const result = await sendProfileCompleteEmailIfNeeded(
        mockSupabase,
        'agency-123'
      );

      expect(result.sent).toBe(false);
      expect(result.reason).toBe('agency_not_found');
      expect(mockEmailSend).not.toHaveBeenCalled();
    });

    it('should handle unclaimed agency', async () => {
      const mockAgency = {
        id: 'agency-123',
        name: 'Test Agency',
        slug: 'test-agency',
        profile_completion_percentage: 100,
        completion_email_sent: false,
        claimed_by: null, // Not claimed
      };

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest
        .fn()
        .mockResolvedValue({ data: mockAgency, error: null });

      (mockSupabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ single: mockSingle });

      const result = await sendProfileCompleteEmailIfNeeded(
        mockSupabase,
        'agency-123'
      );

      expect(result.sent).toBe(false);
      expect(result.reason).toBe('agency_not_claimed');
      expect(mockEmailSend).not.toHaveBeenCalled();
    });

    it('should handle owner profile not found', async () => {
      const mockAgency = {
        id: 'agency-123',
        name: 'Test Agency',
        slug: 'test-agency',
        profile_completion_percentage: 100,
        completion_email_sent: false,
        claimed_by: 'user-123',
      };

      const mockAgencySelect = jest.fn().mockReturnThis();
      const mockAgencyEq = jest.fn().mockReturnThis();
      const mockAgencySingle = jest
        .fn()
        .mockResolvedValue({ data: mockAgency, error: null });

      const mockOwnerSelect = jest.fn().mockReturnThis();
      const mockOwnerEq = jest.fn().mockReturnThis();
      const mockOwnerSingle = jest
        .fn()
        .mockResolvedValue({ data: null, error: { message: 'Not found' } });

      (mockSupabase.from as jest.Mock)
        .mockReturnValueOnce({ select: mockAgencySelect })
        .mockReturnValueOnce({ select: mockOwnerSelect });

      mockAgencySelect.mockReturnValue({ eq: mockAgencyEq });
      mockAgencyEq.mockReturnValue({ single: mockAgencySingle });
      mockOwnerSelect.mockReturnValue({ eq: mockOwnerEq });
      mockOwnerEq.mockReturnValue({ single: mockOwnerSingle });

      const result = await sendProfileCompleteEmailIfNeeded(
        mockSupabase,
        'agency-123'
      );

      expect(result.sent).toBe(false);
      expect(result.reason).toBe('owner_profile_not_found');
      expect(mockEmailSend).not.toHaveBeenCalled();
    });

    it('should handle missing RESEND_API_KEY', async () => {
      delete process.env.RESEND_API_KEY;

      const mockAgency = {
        id: 'agency-123',
        name: 'Test Agency',
        slug: 'test-agency',
        profile_completion_percentage: 100,
        completion_email_sent: false,
        claimed_by: 'user-123',
      };

      const mockOwner = {
        email: 'owner@test.com',
        full_name: 'John Doe',
      };

      const mockAgencySelect = jest.fn().mockReturnThis();
      const mockAgencyEq = jest.fn().mockReturnThis();
      const mockAgencySingle = jest
        .fn()
        .mockResolvedValue({ data: mockAgency, error: null });

      const mockOwnerSelect = jest.fn().mockReturnThis();
      const mockOwnerEq = jest.fn().mockReturnThis();
      const mockOwnerSingle = jest
        .fn()
        .mockResolvedValue({ data: mockOwner, error: null });

      (mockSupabase.from as jest.Mock)
        .mockReturnValueOnce({ select: mockAgencySelect })
        .mockReturnValueOnce({ select: mockOwnerSelect });

      mockAgencySelect.mockReturnValue({ eq: mockAgencyEq });
      mockAgencyEq.mockReturnValue({ single: mockAgencySingle });
      mockOwnerSelect.mockReturnValue({ eq: mockOwnerEq });
      mockOwnerEq.mockReturnValue({ single: mockOwnerSingle });

      const result = await sendProfileCompleteEmailIfNeeded(
        mockSupabase,
        'agency-123'
      );

      expect(result.sent).toBe(false);
      expect(result.reason).toBe('resend_api_key_missing');
      expect(mockEmailSend).not.toHaveBeenCalled();
    });

    it('should handle Resend API error gracefully', async () => {
      const mockAgency = {
        id: 'agency-123',
        name: 'Test Agency',
        slug: 'test-agency',
        profile_completion_percentage: 100,
        completion_email_sent: false,
        claimed_by: 'user-123',
      };

      const mockOwner = {
        email: 'owner@test.com',
        full_name: 'John Doe',
      };

      const mockAgencySelect = jest.fn().mockReturnThis();
      const mockAgencyEq = jest.fn().mockReturnThis();
      const mockAgencySingle = jest
        .fn()
        .mockResolvedValue({ data: mockAgency, error: null });

      const mockOwnerSelect = jest.fn().mockReturnThis();
      const mockOwnerEq = jest.fn().mockReturnThis();
      const mockOwnerSingle = jest
        .fn()
        .mockResolvedValue({ data: mockOwner, error: null });

      (mockSupabase.from as jest.Mock)
        .mockReturnValueOnce({ select: mockAgencySelect })
        .mockReturnValueOnce({ select: mockOwnerSelect });

      mockAgencySelect.mockReturnValue({ eq: mockAgencyEq });
      mockAgencyEq.mockReturnValue({ single: mockAgencySingle });
      mockOwnerSelect.mockReturnValue({ eq: mockOwnerEq });
      mockOwnerEq.mockReturnValue({ single: mockOwnerSingle });

      // Mock Resend API error
      mockEmailSend.mockRejectedValue(new Error('Resend API error'));

      const result = await sendProfileCompleteEmailIfNeeded(
        mockSupabase,
        'agency-123'
      );

      expect(result.sent).toBe(false);
      expect(result.reason).toBe('unexpected_error');
      expect(result.error).toBeInstanceOf(Error);
    });

    it('should succeed even if flag update fails', async () => {
      const mockAgency = {
        id: 'agency-123',
        name: 'Test Agency',
        slug: 'test-agency',
        profile_completion_percentage: 100,
        completion_email_sent: false,
        claimed_by: 'user-123',
      };

      const mockOwner = {
        email: 'owner@test.com',
        full_name: 'John Doe',
      };

      const mockAgencySelect = jest.fn().mockReturnThis();
      const mockAgencyEq = jest.fn().mockReturnThis();
      const mockAgencySingle = jest
        .fn()
        .mockResolvedValue({ data: mockAgency, error: null });

      const mockOwnerSelect = jest.fn().mockReturnThis();
      const mockOwnerEq = jest.fn().mockReturnThis();
      const mockOwnerSingle = jest
        .fn()
        .mockResolvedValue({ data: mockOwner, error: null });

      const mockUpdateReturn = jest.fn().mockReturnThis();
      const mockUpdateEq = jest
        .fn()
        .mockResolvedValue({ data: null, error: { message: 'Update failed' } });

      (mockSupabase.from as jest.Mock)
        .mockReturnValueOnce({ select: mockAgencySelect })
        .mockReturnValueOnce({ select: mockOwnerSelect })
        .mockReturnValueOnce({ update: mockUpdateReturn });

      mockAgencySelect.mockReturnValue({ eq: mockAgencyEq });
      mockAgencyEq.mockReturnValue({ single: mockAgencySingle });
      mockOwnerSelect.mockReturnValue({ eq: mockOwnerEq });
      mockOwnerEq.mockReturnValue({ single: mockOwnerSingle });
      mockUpdateReturn.mockReturnValue({ eq: mockUpdateEq });

      const result = await sendProfileCompleteEmailIfNeeded(
        mockSupabase,
        'agency-123'
      );

      // Email was sent successfully despite flag update failure
      expect(result.sent).toBe(true);
      expect(result.reason).toBe('flag_update_failed');
      expect(mockEmailSend).toHaveBeenCalledTimes(1);
    });
  });
});
