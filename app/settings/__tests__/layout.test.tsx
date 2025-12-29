import { render, screen, waitFor } from '@testing-library/react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import SettingsLayout from '../layout';
import type { ReactNode } from 'react';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

jest.mock('@/lib/auth/auth-context', () => ({
  useAuth: jest.fn(),
}));

jest.mock('next/link', () => {
  return function Link({
    children,
    href,
  }: {
    children: ReactNode;
    href: string;
  }) {
    return <a href={href}>{children}</a>;
  };
});

const mockedUseRouter = jest.mocked(useRouter);
const mockedUsePathname = jest.mocked(usePathname);
const mockedUseAuth = jest.mocked(useAuth);

describe('SettingsLayout', () => {
  const mockPush = jest.fn();
  const mockReplace = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseRouter.mockReturnValue({
      push: mockPush,
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      replace: mockReplace,
      prefetch: jest.fn(),
    });
    mockedUsePathname.mockReturnValue('/settings');
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

    render(
      <SettingsLayout>
        <div>Settings Content</div>
      </SettingsLayout>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('ACCOUNT SETTINGS')).not.toBeInTheDocument();
  });

  it('should redirect to login when user is not authenticated', async () => {
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

    render(
      <SettingsLayout>
        <div>Settings Content</div>
      </SettingsLayout>
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/login?redirectTo=%2Fsettings');
    });
  });

  it('should render layout when user is authenticated', () => {
    mockedUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@example.com' } as any,
      profile: {
        id: '1',
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'user',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        last_password_change: '2024-01-01T00:00:00Z',
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

    render(
      <SettingsLayout>
        <div>Settings Content</div>
      </SettingsLayout>
    );

    expect(screen.getByText('ACCOUNT SETTINGS')).toBeInTheDocument();
    expect(screen.getAllByText('Settings Content').length).toBeGreaterThan(0);
  });

  it('should render header and description', () => {
    mockedUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@example.com' } as any,
      profile: {
        id: '1',
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'user',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        last_password_change: '2024-01-01T00:00:00Z',
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

    render(
      <SettingsLayout>
        <div>Settings Content</div>
      </SettingsLayout>
    );

    expect(screen.getByText('ACCOUNT SETTINGS')).toBeInTheDocument();
    expect(
      screen.getByText('Manage your account settings and preferences')
    ).toBeInTheDocument();
  });

  it('should include correct redirect URL when redirecting from different path', async () => {
    mockedUsePathname.mockReturnValue('/settings/password');
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

    render(
      <SettingsLayout>
        <div>Settings Content</div>
      </SettingsLayout>
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(
        '/login?redirectTo=%2Fsettings%2Fpassword'
      );
    });
  });
});
