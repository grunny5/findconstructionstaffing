import { render, screen } from '@testing-library/react';
import { useAuth } from '@/lib/auth/auth-context';
import SettingsProfilePage from '../page';

jest.mock('@/lib/auth/auth-context', () => ({
  useAuth: jest.fn(),
}));

const mockedUseAuth = jest.mocked(useAuth);

describe('SettingsProfilePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show loading state while auth is loading', () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      profile: null,
      loading: true,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      refreshProfile: jest.fn(),
      isAdmin: false,
      isAgencyOwner: false,
    });

    render(<SettingsProfilePage />);

    // Page header is always rendered
    expect(screen.getByText('Profile')).toBeInTheDocument();
    // ProfileSection shows skeleton while loading
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should display user profile information', () => {
    mockedUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@example.com' } as any,
      profile: {
        id: '1',
        email: 'test@example.com',
        full_name: 'John Doe',
        role: 'user',
        created_at: '2024-01-15T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z',
        last_password_change: '2024-01-15T00:00:00Z',
      },
      loading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      refreshProfile: jest.fn(),
      isAdmin: false,
      isAgencyOwner: false,
    });

    render(<SettingsProfilePage />);

    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    const emailElements = screen.getAllByText('test@example.com');
    expect(emailElements.length).toBeGreaterThan(0);
    expect(screen.getByText('User')).toBeInTheDocument();
    expect(screen.getByText(/January (14|15), 2024/)).toBeInTheDocument();
  });

  it('should display "Not set" when full name is null', () => {
    mockedUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@example.com' } as any,
      profile: {
        id: '1',
        email: 'test@example.com',
        full_name: null,
        role: 'user',
        created_at: '2024-01-15T12:00:00Z',
        updated_at: '2024-01-15T12:00:00Z',
        last_password_change: '2024-01-15T12:00:00Z',
      },
      loading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      refreshProfile: jest.fn(),
      isAdmin: false,
      isAgencyOwner: false,
    });

    render(<SettingsProfilePage />);

    expect(screen.getByText('Not set')).toBeInTheDocument();
  });

  it('should display admin badge for admin users', () => {
    mockedUseAuth.mockReturnValue({
      user: { id: '1', email: 'admin@example.com' } as any,
      profile: {
        id: '1',
        email: 'admin@example.com',
        full_name: 'Admin User',
        role: 'admin',
        created_at: '2024-01-15T12:00:00Z',
        updated_at: '2024-01-15T12:00:00Z',
        last_password_change: '2024-01-15T12:00:00Z',
      },
      loading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      refreshProfile: jest.fn(),
      isAdmin: true,
      isAgencyOwner: false,
    });

    render(<SettingsProfilePage />);

    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('should display agency owner badge for agency owner users', () => {
    mockedUseAuth.mockReturnValue({
      user: { id: '1', email: 'owner@example.com' } as any,
      profile: {
        id: '1',
        email: 'owner@example.com',
        full_name: 'Jane Smith',
        role: 'agency_owner',
        created_at: '2024-01-15T12:00:00Z',
        updated_at: '2024-01-15T12:00:00Z',
        last_password_change: '2024-01-15T12:00:00Z',
      },
      loading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      refreshProfile: jest.fn(),
      isAdmin: false,
      isAgencyOwner: true,
    });

    render(<SettingsProfilePage />);

    expect(screen.getByText('Agency Owner')).toBeInTheDocument();
  });

  it('should display email section with verification note', () => {
    mockedUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@example.com' } as any,
      profile: {
        id: '1',
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'user',
        created_at: '2024-01-15T12:00:00Z',
        updated_at: '2024-01-15T12:00:00Z',
        last_password_change: '2024-01-15T12:00:00Z',
      },
      loading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      refreshProfile: jest.fn(),
      isAdmin: false,
      isAgencyOwner: false,
    });

    render(<SettingsProfilePage />);

    const emailAddressElements = screen.getAllByText('Email Address');
    expect(emailAddressElements.length).toBeGreaterThan(0);
    expect(
      screen.getByText(
        /When you change your email, we'll send verification links/i
      )
    ).toBeInTheDocument();
  });

  it('should display "Unknown" when created_at is null', () => {
    mockedUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@example.com' } as any,
      profile: {
        id: '1',
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'user',
        created_at: null as any,
        updated_at: '2024-01-15T12:00:00Z',
        last_password_change: '2024-01-15T12:00:00Z',
      },
      loading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      refreshProfile: jest.fn(),
      isAdmin: false,
      isAgencyOwner: false,
    });

    render(<SettingsProfilePage />);

    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });
});
