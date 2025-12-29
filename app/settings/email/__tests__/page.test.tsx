/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { useAuth } from '@/lib/auth/auth-context';
import SettingsEmailPage from '../page';

jest.mock('@/lib/auth/auth-context', () => ({
  useAuth: jest.fn(),
}));

// Mock EmailChangeForm to avoid integration test complexity
jest.mock('@/components/settings/EmailChangeForm', () => ({
  EmailChangeForm: () => null,
}));

const mockedUseAuth = jest.mocked(useAuth);

describe('SettingsEmailPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render page header with industrial styling', () => {
    mockedUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@example.com' } as never,
      profile: {
        id: '1',
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'user',
        created_at: '2024-01-15T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z',
        last_password_change: '2024-01-15T00:00:00Z',
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

    render(<SettingsEmailPage />);

    expect(screen.getByText('Email Settings')).toBeInTheDocument();
    expect(
      screen.getByText('Manage your email address and preferences')
    ).toBeInTheDocument();
  });

  it('should render EmailSection component', () => {
    mockedUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@example.com' } as never,
      profile: {
        id: '1',
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'user',
        created_at: '2024-01-15T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z',
        last_password_change: '2024-01-15T00:00:00Z',
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

    render(<SettingsEmailPage />);

    // EmailSection renders email address section (CSS uppercase)
    expect(screen.getByText('Email Address')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('should show loading state when auth is loading', () => {
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

    render(<SettingsEmailPage />);

    // Page header is always rendered (CSS uppercase)
    expect(screen.getByText('Email Settings')).toBeInTheDocument();
    // EmailSection shows skeleton while loading
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should show error state when user is not authenticated', () => {
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

    render(<SettingsEmailPage />);

    expect(screen.getByText('Unable to load email')).toBeInTheDocument();
  });

  it('should render change email button', () => {
    mockedUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@example.com' } as never,
      profile: {
        id: '1',
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'user',
        created_at: '2024-01-15T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z',
        last_password_change: '2024-01-15T00:00:00Z',
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

    render(<SettingsEmailPage />);

    const changeButton = screen.getByRole('button', {
      name: /change email address/i,
    });
    expect(changeButton).toBeInTheDocument();
  });
});
