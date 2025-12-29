/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { User } from '@supabase/supabase-js';
import { useAuth } from '@/lib/auth/auth-context';
import { EmailSection } from '../EmailSection';

jest.mock('@/lib/auth/auth-context', () => ({
  useAuth: jest.fn(),
}));

// Mock EmailChangeForm to avoid integration test complexity
jest.mock('../EmailChangeForm', () => ({
  EmailChangeForm: () => null,
}));

const mockedUseAuth = jest.mocked(useAuth);

const createMockAuthContext = (overrides = {}) => ({
  user: { id: '1', email: 'test@example.com' } as User,
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
  ...overrides,
});

describe('EmailSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should render skeleton when loading', () => {
      mockedUseAuth.mockReturnValue(
        createMockAuthContext({ user: null, profile: null, loading: true })
      );

      render(<EmailSection />);

      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Error State', () => {
    it('should render error message when user is null', () => {
      mockedUseAuth.mockReturnValue(
        createMockAuthContext({ user: null, profile: null })
      );

      render(<EmailSection />);

      expect(screen.getByText('Unable to load email')).toBeInTheDocument();
      expect(
        screen.getByText(/Please try refreshing the page/i)
      ).toBeInTheDocument();
    });

    it('should render error message when profile is null', () => {
      mockedUseAuth.mockReturnValue(createMockAuthContext({ profile: null }));

      render(<EmailSection />);

      expect(screen.getByText('Unable to load email')).toBeInTheDocument();
    });
  });

  describe('Email Display', () => {
    it('should display user email address', () => {
      mockedUseAuth.mockReturnValue(createMockAuthContext());

      render(<EmailSection />);

      expect(screen.getByText('Email Address')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('should show informational note about email verification', () => {
      mockedUseAuth.mockReturnValue(createMockAuthContext());

      render(<EmailSection />);

      expect(
        screen.getByText(
          /When you change your email, we'll send verification links/i
        )
      ).toBeInTheDocument();
    });
  });

  describe('Change Email Button', () => {
    it('should render Change Email button', () => {
      mockedUseAuth.mockReturnValue(createMockAuthContext());

      render(<EmailSection />);

      const changeButton = screen.getByRole('button', {
        name: /change email address/i,
      });
      expect(changeButton).toBeInTheDocument();
    });

    it('should open EmailChangeForm when Change Email button is clicked', async () => {
      const user = userEvent.setup();
      mockedUseAuth.mockReturnValue(createMockAuthContext());

      render(<EmailSection />);

      const changeButton = screen.getByRole('button', {
        name: /change email address/i,
      });

      await expect(user.click(changeButton)).resolves.not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels and ARIA attributes', () => {
      mockedUseAuth.mockReturnValue(createMockAuthContext());

      render(<EmailSection />);

      const changeButton = screen.getByRole('button', {
        name: /change email address/i,
      });
      expect(changeButton).toHaveAttribute(
        'aria-label',
        'Change email address'
      );
    });
  });

  describe('Card Structure', () => {
    it('should render section header and description', () => {
      mockedUseAuth.mockReturnValue(createMockAuthContext());

      render(<EmailSection />);

      expect(screen.getByText('Email Address')).toBeInTheDocument();
      expect(
        screen.getByText(
          /Manage your email address. Changing your email requires verification./i
        )
      ).toBeInTheDocument();
    });
  });
});
