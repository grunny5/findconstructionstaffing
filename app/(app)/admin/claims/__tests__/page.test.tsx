/**
 * Tests for Admin Claims Page
 *
 * @jest-environment jsdom
 */

import { render } from '@testing-library/react';
import { redirect } from 'next/navigation';
import AdminClaimsPage from '../page';
import { createClient } from '@/lib/supabase/server';

// Mock dependencies
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

jest.mock('@/lib/supabase/server');

jest.mock('@/components/admin/ClaimsTable', () => ({
  ClaimsTable: () => <div data-testid="claims-table">Claims Table</div>,
}));

const mockedCreateClient = jest.mocked(createClient);
const mockedRedirect = jest.mocked(redirect);

describe('AdminClaimsPage', () => {
  let mockSupabaseClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabaseClient = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn(),
    };

    mockedCreateClient.mockResolvedValue(mockSupabaseClient);
    mockedRedirect.mockImplementation((url: string) => {
      throw new Error(`Redirecting to ${url}`);
    });
  });

  describe('Authentication', () => {
    it('should redirect to /login if user is not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(AdminClaimsPage()).rejects.toThrow('Redirecting to /login');
      expect(mockedRedirect).toHaveBeenCalledWith('/login');
    });

    it('should redirect to /login if auth check fails', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Auth failed'),
      });

      await expect(AdminClaimsPage()).rejects.toThrow('Redirecting to /login');
      expect(mockedRedirect).toHaveBeenCalledWith('/login');
    });
  });

  describe('Admin Role Verification', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'user@example.com',
          },
        },
        error: null,
      });
    });

    it('should redirect to / if user is not an admin', async () => {
      const mockProfileQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { role: 'user' },
          error: null,
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockProfileQuery);

      await expect(AdminClaimsPage()).rejects.toThrow('Redirecting to /');
      expect(mockedRedirect).toHaveBeenCalledWith('/');
    });

    it('should redirect to / if profile does not exist', async () => {
      const mockProfileQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockProfileQuery);

      await expect(AdminClaimsPage()).rejects.toThrow('Redirecting to /');
      expect(mockedRedirect).toHaveBeenCalledWith('/');
    });

    it('should redirect to / if profile query fails', async () => {
      const mockProfileQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Database error'),
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockProfileQuery);

      await expect(AdminClaimsPage()).rejects.toThrow('Redirecting to /');
      expect(mockedRedirect).toHaveBeenCalledWith('/');
    });
  });

  describe('Page Rendering', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: {
          user: {
            id: 'admin-123',
            email: 'admin@example.com',
          },
        },
        error: null,
      });

      const mockProfileQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { role: 'admin' },
          error: null,
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockProfileQuery);
    });

    it('should render the page with title and ClaimsTable for admin users', async () => {
      const result = await AdminClaimsPage();
      const { container } = render(result as React.ReactElement);

      // Check for page title
      const title = container.querySelector('h1');
      expect(title).toHaveTextContent('Claim Requests Management');

      // Check for ClaimsTable component
      const claimsTable = container.querySelector(
        '[data-testid="claims-table"]'
      );
      expect(claimsTable).toBeInTheDocument();
    });

    it('should render within a container with proper styling', async () => {
      const result = await AdminClaimsPage();
      const { container } = render(result as React.ReactElement);

      const mainContainer = container.querySelector('.container.mx-auto.p-6');
      expect(mainContainer).toBeInTheDocument();
    });

    it('should have proper heading hierarchy', async () => {
      const result = await AdminClaimsPage();
      const { container } = render(result as React.ReactElement);

      const h1 = container.querySelector('h1');
      expect(h1).toHaveClass('font-display');
      expect(h1).toHaveClass('text-2xl');
      expect(h1).toHaveClass('mb-6');
    });
  });
});
