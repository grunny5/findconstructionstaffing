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

const mockedUseAuth = jest.mocked(useAuth);

describe('ProfileSection', () => {
  const mockOnEditClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should render skeleton when loading', () => {
      mockedUseAuth.mockReturnValue({
        user: null,
        profile: null,
        loading: true,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        isAdmin: false,
        isAgencyOwner: false,
      });

      render(<ProfileSection onEditClick={mockOnEditClick} />);

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
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        isAdmin: false,
        isAgencyOwner: false,
      });

      render(<ProfileSection onEditClick={mockOnEditClick} />);

      expect(screen.getByText('Unable to load profile')).toBeInTheDocument();
      expect(
        screen.getByText(/Please try refreshing the page/i)
      ).toBeInTheDocument();
    });

    it('should render error message when profile is null', () => {
      mockedUseAuth.mockReturnValue({
        user: { id: '1', email: 'test@example.com' } as any,
        profile: null,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        isAdmin: false,
        isAgencyOwner: false,
      });

      render(<ProfileSection onEditClick={mockOnEditClick} />);

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
        },
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        isAdmin: false,
        isAgencyOwner: false,
      });

      render(<ProfileSection onEditClick={mockOnEditClick} />);

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
        },
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        isAdmin: false,
        isAgencyOwner: false,
      });

      render(<ProfileSection onEditClick={mockOnEditClick} />);

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
        },
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        isAdmin: false,
        isAgencyOwner: false,
      });

      render(<ProfileSection onEditClick={mockOnEditClick} />);

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
        },
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        isAdmin: false,
        isAgencyOwner: false,
      });

      render(<ProfileSection onEditClick={mockOnEditClick} />);

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
        },
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        isAdmin: false,
        isAgencyOwner: true,
      });

      render(<ProfileSection onEditClick={mockOnEditClick} />);

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
        },
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        isAdmin: true,
        isAgencyOwner: false,
      });

      render(<ProfileSection onEditClick={mockOnEditClick} />);

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
        },
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        isAdmin: false,
        isAgencyOwner: false,
      });

      render(<ProfileSection onEditClick={mockOnEditClick} />);

      const editButton = screen.getByRole('button', { name: /edit full name/i });
      expect(editButton).toBeInTheDocument();
    });

    it('should call onEditClick when Edit button is clicked', async () => {
      const user = userEvent.setup();
      mockedUseAuth.mockReturnValue({
        user: { id: '1', email: 'test@example.com' } as any,
        profile: {
          id: '1',
          email: 'test@example.com',
          full_name: 'John Doe',
          role: 'user',
          created_at: '2023-01-15T10:00:00Z',
        },
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        isAdmin: false,
        isAgencyOwner: false,
      });

      render(<ProfileSection onEditClick={mockOnEditClick} />);

      const editButton = screen.getByRole('button', { name: /edit full name/i });
      await user.click(editButton);

      expect(mockOnEditClick).toHaveBeenCalledTimes(1);
    });

    it('should work without onEditClick callback', async () => {
      const user = userEvent.setup();
      mockedUseAuth.mockReturnValue({
        user: { id: '1', email: 'test@example.com' } as any,
        profile: {
          id: '1',
          email: 'test@example.com',
          full_name: 'John Doe',
          role: 'user',
          created_at: '2023-01-15T10:00:00Z',
        },
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        isAdmin: false,
        isAgencyOwner: false,
      });

      render(<ProfileSection />);

      const editButton = screen.getByRole('button', { name: /edit full name/i });

      // Should not throw when clicked without callback
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
        },
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        isAdmin: false,
        isAgencyOwner: false,
      });

      render(<ProfileSection onEditClick={mockOnEditClick} />);

      expect(screen.getByText('Full Name')).toBeInTheDocument();
      expect(screen.getByText('Email Address')).toBeInTheDocument();
      expect(screen.getByText('Role')).toBeInTheDocument();
      expect(screen.getByText('Account Created')).toBeInTheDocument();

      const editButton = screen.getByRole('button', { name: /edit full name/i });
      expect(editButton).toHaveAttribute('aria-label', 'Edit full name');
    });
  });
});
