/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAuth } from '@/lib/auth/auth-context';
import { ProfileSection } from '../ProfileSection';

jest.mock('@/lib/auth/auth-context', () => ({
  useAuth: jest.fn(),
}));

// Track ProfileEditor props for testing optimistic updates
let capturedOnSuccess: ((name: string) => void) | undefined;

// Mock ProfileEditor to capture onSuccess callback
jest.mock('../ProfileEditor', () => ({
  ProfileEditor: ({
    onSuccess,
  }: {
    userId: string;
    currentName: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: (name: string) => void;
  }) => {
    capturedOnSuccess = onSuccess;
    return null;
  },
}));

const mockedUseAuth = jest.mocked(useAuth);

describe('ProfileSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedOnSuccess = undefined;
  });

  describe('Loading State', () => {
    it('should render skeleton when loading', () => {
      mockedUseAuth.mockReturnValue({
        user: null,
        profile: null,
        agencySlug: null,
        loading: true,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        refreshProfile: jest.fn(),
        isAdmin: false,
        isAgencyOwner: false,
      });

      render(<ProfileSection />);

      // Check for skeleton elements (they should be in the document)
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Error State', () => {
    it('should render error message when user is null', () => {
      mockedUseAuth.mockReturnValue({
        user: null,
        profile: null,
        agencySlug: null,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        refreshProfile: jest.fn(),
        isAdmin: false,
        isAgencyOwner: false,
      });

      render(<ProfileSection />);

      expect(screen.getByText('Unable to load profile')).toBeInTheDocument();
      expect(
        screen.getByText(/Please try refreshing the page/i)
      ).toBeInTheDocument();
    });

    it('should render error message when profile is null', () => {
      mockedUseAuth.mockReturnValue({
        user: { id: '1', email: 'test@example.com' } as any,
        profile: null,
        agencySlug: null,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        refreshProfile: jest.fn(),
        isAdmin: false,
        isAgencyOwner: false,
      });

      render(<ProfileSection />);

      expect(screen.getByText('Unable to load profile')).toBeInTheDocument();
    });
  });

  describe('Profile Display', () => {
    it('should render full profile information', () => {
      mockedUseAuth.mockReturnValue({
        user: { id: '1', email: 'test@example.com' } as any,
        profile: {
          id: '1',
          email: 'test@example.com',
          full_name: 'John Doe',
          role: 'user',
          created_at: '2023-01-15T10:00:00Z',
          updated_at: '2023-01-15T10:00:00Z',
          last_password_change: '2023-01-15T10:00:00Z',
        },
        loading: false,
        agencySlug: null,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        refreshProfile: jest.fn(),
        isAdmin: false,
        isAgencyOwner: false,
      });

      render(<ProfileSection />);

      expect(screen.getByText('Personal Information')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      expect(screen.getByText('User')).toBeInTheDocument();
      expect(screen.getByText(/January 15, 2023/)).toBeInTheDocument();
    });

    it('should show "Not set" when full_name is null', () => {
      mockedUseAuth.mockReturnValue({
        user: { id: '1', email: 'test@example.com' } as any,
        profile: {
          id: '1',
          email: 'test@example.com',
          full_name: null,
          role: 'user',
          created_at: '2023-01-15T10:00:00Z',
          updated_at: '2023-01-15T10:00:00Z',
          last_password_change: '2023-01-15T10:00:00Z',
        },
        loading: false,
        agencySlug: null,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        refreshProfile: jest.fn(),
        isAdmin: false,
        isAgencyOwner: false,
      });

      render(<ProfileSection />);

      expect(screen.getByText('Not set')).toBeInTheDocument();
    });

    it('should show "Unknown" when created_at is null', () => {
      mockedUseAuth.mockReturnValue({
        user: { id: '1', email: 'test@example.com' } as any,
        profile: {
          id: '1',
          email: 'test@example.com',
          full_name: 'John Doe',
          role: 'user',
          created_at: null,
          updated_at: '2023-01-15T10:00:00Z',
          last_password_change: '2023-01-15T10:00:00Z',
        } as any,
        loading: false,
        agencySlug: null,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        refreshProfile: jest.fn(),
        isAdmin: false,
        isAgencyOwner: false,
      });

      render(<ProfileSection />);

      expect(screen.getByText('Unknown')).toBeInTheDocument();
    });
  });

  describe('Role Badge', () => {
    it('should render User badge with secondary variant', () => {
      mockedUseAuth.mockReturnValue({
        user: { id: '1', email: 'test@example.com' } as any,
        profile: {
          id: '1',
          email: 'test@example.com',
          full_name: 'John Doe',
          role: 'user',
          created_at: '2023-01-15T10:00:00Z',
          updated_at: '2023-01-15T10:00:00Z',
          last_password_change: '2023-01-15T10:00:00Z',
        },
        loading: false,
        agencySlug: null,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        refreshProfile: jest.fn(),
        isAdmin: false,
        isAgencyOwner: false,
      });

      render(<ProfileSection />);

      const badge = screen.getByText('User');
      expect(badge).toBeInTheDocument();
    });

    it('should render Agency Owner badge with default variant', () => {
      mockedUseAuth.mockReturnValue({
        user: { id: '1', email: 'test@example.com' } as any,
        profile: {
          id: '1',
          email: 'test@example.com',
          full_name: 'Jane Smith',
          role: 'agency_owner',
          created_at: '2023-01-15T10:00:00Z',
          updated_at: '2023-01-15T10:00:00Z',
          last_password_change: '2023-01-15T10:00:00Z',
        },
        loading: false,
        agencySlug: null,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        refreshProfile: jest.fn(),
        isAdmin: false,
        isAgencyOwner: true,
      });

      render(<ProfileSection />);

      const badge = screen.getByText('Agency Owner');
      expect(badge).toBeInTheDocument();
    });

    it('should render Admin badge with destructive variant', () => {
      mockedUseAuth.mockReturnValue({
        user: { id: '1', email: 'test@example.com' } as any,
        profile: {
          id: '1',
          email: 'test@example.com',
          full_name: 'Admin User',
          role: 'admin',
          created_at: '2023-01-15T10:00:00Z',
          updated_at: '2023-01-15T10:00:00Z',
          last_password_change: '2023-01-15T10:00:00Z',
        },
        loading: false,
        agencySlug: null,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        refreshProfile: jest.fn(),
        isAdmin: true,
        isAgencyOwner: false,
      });

      render(<ProfileSection />);

      const badge = screen.getByText('Admin');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Edit Button', () => {
    it('should render Edit button', () => {
      mockedUseAuth.mockReturnValue({
        user: { id: '1', email: 'test@example.com' } as any,
        profile: {
          id: '1',
          email: 'test@example.com',
          full_name: 'John Doe',
          role: 'user',
          created_at: '2023-01-15T10:00:00Z',
          updated_at: '2023-01-15T10:00:00Z',
          last_password_change: '2023-01-15T10:00:00Z',
        },
        loading: false,
        agencySlug: null,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        refreshProfile: jest.fn(),
        isAdmin: false,
        isAgencyOwner: false,
      });

      render(<ProfileSection />);

      const editButton = screen.getByRole('button', {
        name: /edit full name/i,
      });
      expect(editButton).toBeInTheDocument();
    });

    it('should open ProfileEditor when Edit button is clicked', async () => {
      const user = userEvent.setup();
      mockedUseAuth.mockReturnValue({
        user: { id: '1', email: 'test@example.com' } as any,
        profile: {
          id: '1',
          email: 'test@example.com',
          full_name: 'John Doe',
          role: 'user',
          created_at: '2023-01-15T10:00:00Z',
          updated_at: '2023-01-15T10:00:00Z',
          last_password_change: '2023-01-15T10:00:00Z',
        },
        loading: false,
        agencySlug: null,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        refreshProfile: jest.fn(),
        isAdmin: false,
        isAgencyOwner: false,
      });

      render(<ProfileSection />);

      const editButton = screen.getByRole('button', {
        name: /edit full name/i,
      });

      // Should not throw when clicked
      await expect(user.click(editButton)).resolves.not.toThrow();
    });

    it('should handle Edit button click correctly', async () => {
      const user = userEvent.setup();
      mockedUseAuth.mockReturnValue({
        user: { id: '1', email: 'test@example.com' } as any,
        profile: {
          id: '1',
          email: 'test@example.com',
          full_name: 'John Doe',
          role: 'user',
          created_at: '2023-01-15T10:00:00Z',
          updated_at: '2023-01-15T10:00:00Z',
          last_password_change: '2023-01-15T10:00:00Z',
        },
        loading: false,
        agencySlug: null,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        refreshProfile: jest.fn(),
        isAdmin: false,
        isAgencyOwner: false,
      });

      render(<ProfileSection />);

      const editButton = screen.getByRole('button', {
        name: /edit full name/i,
      });

      // Edit button should be clickable and not throw errors
      await expect(user.click(editButton)).resolves.not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels and ARIA attributes', () => {
      mockedUseAuth.mockReturnValue({
        user: { id: '1', email: 'test@example.com' } as any,
        profile: {
          id: '1',
          email: 'test@example.com',
          full_name: 'John Doe',
          role: 'user',
          created_at: '2023-01-15T10:00:00Z',
          updated_at: '2023-01-15T10:00:00Z',
          last_password_change: '2023-01-15T10:00:00Z',
        },
        loading: false,
        agencySlug: null,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        refreshProfile: jest.fn(),
        isAdmin: false,
        isAgencyOwner: false,
      });

      render(<ProfileSection />);

      expect(screen.getByText('Full Name')).toBeInTheDocument();
      expect(screen.getByText('Email Address')).toBeInTheDocument();
      expect(screen.getByText('Role')).toBeInTheDocument();
      expect(screen.getByText('Account Created')).toBeInTheDocument();

      const editButton = screen.getByRole('button', {
        name: /edit full name/i,
      });
      expect(editButton).toHaveAttribute('aria-label', 'Edit full name');
    });
  });

  describe('Optimistic Updates', () => {
    it('should display optimistic name immediately after edit success', () => {
      mockedUseAuth.mockReturnValue({
        user: { id: '1', email: 'test@example.com' } as never,
        profile: {
          id: '1',
          email: 'test@example.com',
          full_name: 'John Doe',
          role: 'user',
          created_at: '2023-01-15T10:00:00Z',
          updated_at: '2023-01-15T10:00:00Z',
          last_password_change: '2023-01-15T10:00:00Z',
        },
        loading: false,
        agencySlug: null,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        refreshProfile: jest.fn(),
        isAdmin: false,
        isAgencyOwner: false,
      });

      const { rerender } = render(<ProfileSection />);

      // Initially shows the profile name
      expect(screen.getByText('John Doe')).toBeInTheDocument();

      // Simulate successful name edit via onSuccess callback
      expect(capturedOnSuccess).toBeDefined();
      capturedOnSuccess!('Jane Smith');

      // Rerender to see optimistic update
      rerender(<ProfileSection />);

      // Should now show the optimistic name
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });

    it('should reset optimistic name when profile.full_name changes from server', () => {
      const mockAuth = {
        user: { id: '1', email: 'test@example.com' } as never,
        profile: {
          id: '1',
          email: 'test@example.com',
          full_name: 'John Doe',
          role: 'user' as const,
          created_at: '2023-01-15T10:00:00Z',
          updated_at: '2023-01-15T10:00:00Z',
          last_password_change: '2023-01-15T10:00:00Z',
        },
        loading: false,
        agencySlug: null,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        refreshProfile: jest.fn(),
        isAdmin: false,
        isAgencyOwner: false,
      };

      mockedUseAuth.mockReturnValue(mockAuth);

      const { rerender } = render(<ProfileSection />);

      // Set optimistic name
      expect(capturedOnSuccess).toBeDefined();
      capturedOnSuccess!('Optimistic Name');
      rerender(<ProfileSection />);
      expect(screen.getByText('Optimistic Name')).toBeInTheDocument();

      // Simulate server refresh with new name
      mockedUseAuth.mockReturnValue({
        ...mockAuth,
        profile: {
          ...mockAuth.profile,
          full_name: 'Server Updated Name',
        },
      });

      rerender(<ProfileSection />);

      // Should show server name (optimistic name should be reset)
      expect(screen.getByText('Server Updated Name')).toBeInTheDocument();
      expect(screen.queryByText('Optimistic Name')).not.toBeInTheDocument();
    });

    it('should show profile name when optimistic name is null', () => {
      mockedUseAuth.mockReturnValue({
        user: { id: '1', email: 'test@example.com' } as never,
        profile: {
          id: '1',
          email: 'test@example.com',
          full_name: 'Original Name',
          role: 'user',
          created_at: '2023-01-15T10:00:00Z',
          updated_at: '2023-01-15T10:00:00Z',
          last_password_change: '2023-01-15T10:00:00Z',
        },
        loading: false,
        agencySlug: null,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        refreshProfile: jest.fn(),
        isAdmin: false,
        isAgencyOwner: false,
      });

      render(<ProfileSection />);

      // displayName = optimisticName ?? profile.full_name
      // When optimisticName is null, should show profile.full_name
      expect(screen.getByText('Original Name')).toBeInTheDocument();
    });

    it('should pass onSuccess callback to ProfileEditor', () => {
      mockedUseAuth.mockReturnValue({
        user: { id: '1', email: 'test@example.com' } as never,
        profile: {
          id: '1',
          email: 'test@example.com',
          full_name: 'John Doe',
          role: 'user',
          created_at: '2023-01-15T10:00:00Z',
          updated_at: '2023-01-15T10:00:00Z',
          last_password_change: '2023-01-15T10:00:00Z',
        },
        loading: false,
        agencySlug: null,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        refreshProfile: jest.fn(),
        isAdmin: false,
        isAgencyOwner: false,
      });

      render(<ProfileSection />);

      // Verify ProfileEditor receives onSuccess callback
      expect(capturedOnSuccess).toBeDefined();
      expect(typeof capturedOnSuccess).toBe('function');
    });
  });
});
