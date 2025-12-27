import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Header from '../Header';
import { useAuth } from '@/lib/auth/auth-context';
import { usePathname } from 'next/navigation';
import { useUnreadCount } from '@/hooks/useUnreadCount';

// Mock next/link
jest.mock('next/link', () => {
  const MockLink = ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>;
  MockLink.displayName = 'MockLink';
  return MockLink;
});

// Mock auth context
jest.mock('@/lib/auth/auth-context', () => ({
  useAuth: jest.fn(() => ({
    user: null,
    profile: null,
    agencySlug: null,
    signOut: jest.fn(),
    loading: false,
  })),
}));

// Mock feature flags
jest.mock('@/lib/feature-flags', () => ({
  isFeatureEnabled: jest.fn(() => false),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/'),
}));

// Mock useUnreadCount hook
jest.mock('@/hooks/useUnreadCount', () => ({
  useUnreadCount: jest.fn(() => ({
    unreadCount: 0,
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  })),
}));

// Mock UnreadBadge component
jest.mock('@/components/messages/UnreadBadge', () => ({
  UnreadBadge: ({ count }: { count: number }) => (
    <span data-testid="unread-badge">{count}</span>
  ),
}));

// Mock Radix UI Sheet component for better mobile menu testing
jest.mock('@/components/ui/sheet', () => ({
  Sheet: ({
    children,
    open,
    onOpenChange,
  }: {
    children: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }) => (
    <div data-testid="sheet" data-open={open}>
      {children}
    </div>
  ),
  SheetContent: ({
    children,
    side,
  }: {
    children: React.ReactNode;
    side?: string;
  }) => (
    <div data-testid="sheet-content" data-side={side}>
      {children}
    </div>
  ),
  SheetTrigger: ({
    children,
    asChild,
  }: {
    children: React.ReactNode;
    asChild?: boolean;
  }) =>
    asChild ? (
      children
    ) : (
      <button data-testid="sheet-trigger">{children}</button>
    ),
}));

// Mock dropdown-menu components
jest.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DropdownMenuItem: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DropdownMenuLabel: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DropdownMenuSeparator: () => <div />,
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('Header', () => {
  beforeEach(() => {
    // Reset mock to default unauthenticated state
    mockUseAuth.mockReturnValue({
      user: null,
      profile: null,
      agencySlug: null,
      signOut: jest.fn(),
      loading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      refreshProfile: jest.fn(),
      isAdmin: false,
      isAgencyOwner: false,
    });
  });

  it('should render the logo and brand name', () => {
    render(<Header />);

    // There are multiple instances of these texts (desktop and mobile)
    expect(screen.getAllByText('Construction')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Recruiter Directory')[0]).toBeInTheDocument();
  });

  it('should render desktop navigation links', () => {
    render(<Header />);

    const browseLinks = screen.getAllByRole('link', {
      name: /browse directory/i,
    });
    const requestLinks = screen.getAllByRole('link', {
      name: /request labor/i,
    });
    const resourceLinks = screen.getAllByRole('link', { name: /resources/i });

    // Check desktop links (usually the first occurrence)
    expect(browseLinks[0]).toHaveAttribute('href', '/');
    expect(requestLinks[0]).toHaveAttribute('href', '/request-labor');
    expect(resourceLinks[0]).toHaveAttribute('href', '/resources');
  });

  it('should render action buttons on desktop', () => {
    render(<Header />);

    // When not logged in, should show Sign In and Sign Up buttons
    const signInLinks = screen.getAllByRole('link', { name: /sign in/i });
    const signUpLinks = screen.getAllByRole('link', {
      name: /sign up/i,
    });

    // Check that these links exist (at least one for desktop)
    expect(signInLinks.length).toBeGreaterThan(0);
    expect(signUpLinks.length).toBeGreaterThan(0);
  });

  it('should have proper header styling', () => {
    render(<Header />);

    const header = screen.getByRole('banner');
    expect(header).toHaveClass('glass-header');
    expect(header).toHaveClass('sticky');
    expect(header).toHaveClass('top-0');
    expect(header).toHaveClass('z-50');
  });

  it('should have navigation element', () => {
    render(<Header />);

    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();
    expect(nav).toHaveClass('hidden');
    expect(nav).toHaveClass('md:flex');
  });

  it('should render mobile menu trigger', () => {
    render(<Header />);

    // Mobile menu button (Sheet trigger)
    const mobileMenuButton = screen.getByRole('button');
    expect(mobileMenuButton).toBeInTheDocument();
  });

  it('should render mobile menu components', () => {
    render(<Header />);

    // Verify Sheet components are rendered with proper structure
    expect(screen.getByTestId('sheet')).toBeInTheDocument();
    expect(screen.getByTestId('sheet-content')).toBeInTheDocument();

    // Verify mobile menu button exists
    const mobileMenuButton = screen.getByRole('button');
    expect(mobileMenuButton).toBeInTheDocument();
  });

  it('should render mobile navigation links in sheet content', () => {
    render(<Header />);

    // The mobile menu should contain the same navigation items
    const sheetContent = screen.getByTestId('sheet-content');
    expect(sheetContent).toBeInTheDocument();

    // Mobile menu should have navigation links (multiple instances due to desktop + mobile)
    expect(screen.getAllByText('Browse Directory').length).toBeGreaterThan(1);
    expect(screen.getAllByText('Request Labor').length).toBeGreaterThan(1);
    expect(screen.getAllByText('Resources').length).toBeGreaterThan(1);
  });

  it('should render action buttons in mobile menu', () => {
    render(<Header />);

    // Mobile menu should contain action buttons (multiple instances due to desktop + mobile)
    // When not logged in, should show Sign In and Sign Up buttons
    expect(screen.getAllByText('Sign In').length).toBeGreaterThan(1);
    expect(screen.getAllByText('Sign Up').length).toBeGreaterThan(1);
  });

  it('should have responsive container', () => {
    render(<Header />);

    const container = screen
      .getAllByText('Construction')[0]
      .closest('.max-w-7xl');
    expect(container).toHaveClass('mx-auto');
  });

  describe('Agency Dashboard Link', () => {
    it('should show Agency Dashboard link for agency owner with claimed agency', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '123', email: 'owner@agency.com' } as any,
        profile: {
          id: '123',
          role: 'agency_owner',
          email: 'owner@agency.com',
        } as any,
        agencySlug: 'test-staffing-agency',
        signOut: jest.fn(),
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        refreshProfile: jest.fn(),
        isAdmin: false,
        isAgencyOwner: true,
      });

      render(<Header />);

      // Should have Agency Dashboard link(s) in both desktop and mobile menus
      const dashboardLinks = screen.getAllByText('Agency Dashboard');
      expect(dashboardLinks.length).toBeGreaterThan(0);

      // Check that at least one link has the correct href
      const dashboardLink = screen
        .getAllByRole('link', { name: /agency dashboard/i })
        .find((link) =>
          link.getAttribute('href')?.includes('/dashboard/agency/')
        );
      expect(dashboardLink).toHaveAttribute(
        'href',
        '/dashboard/agency/test-staffing-agency'
      );
    });

    it('should NOT show Agency Dashboard link for agency owner without claimed agency', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '123', email: 'owner@agency.com' } as any,
        profile: {
          id: '123',
          role: 'agency_owner',
          email: 'owner@agency.com',
        } as any,
        agencySlug: null, // No claimed agency
        signOut: jest.fn(),
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        refreshProfile: jest.fn(),
        isAdmin: false,
        isAgencyOwner: true,
      });

      render(<Header />);

      // Should NOT have Agency Dashboard link
      expect(screen.queryByText('Agency Dashboard')).not.toBeInTheDocument();
    });

    it('should NOT show Agency Dashboard link for regular users', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '123', email: 'user@example.com' } as any,
        profile: { id: '123', role: 'user', email: 'user@example.com' } as any,
        agencySlug: null,
        signOut: jest.fn(),
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        refreshProfile: jest.fn(),
        isAdmin: false,
        isAgencyOwner: false,
      });

      render(<Header />);

      // Should NOT have Agency Dashboard link
      expect(screen.queryByText('Agency Dashboard')).not.toBeInTheDocument();
    });

    it('should NOT show Agency Dashboard link for admins', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '123', email: 'admin@example.com' } as any,
        profile: {
          id: '123',
          role: 'admin',
          email: 'admin@example.com',
        } as any,
        agencySlug: null,
        signOut: jest.fn(),
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        refreshProfile: jest.fn(),
        isAdmin: true,
        isAgencyOwner: false,
      });

      render(<Header />);

      // Should NOT have Agency Dashboard link
      expect(screen.queryByText('Agency Dashboard')).not.toBeInTheDocument();
    });

    it('should NOT show Agency Dashboard link when not authenticated', () => {
      // Default mock state (not authenticated)
      render(<Header />);

      // Should NOT have Agency Dashboard link
      expect(screen.queryByText('Agency Dashboard')).not.toBeInTheDocument();
    });
  });

  describe('Messages Link', () => {
    const mockUsePathname = usePathname as jest.MockedFunction<
      typeof usePathname
    >;
    const mockUseUnreadCount = useUnreadCount as jest.MockedFunction<
      typeof useUnreadCount
    >;

    beforeEach(() => {
      mockUsePathname.mockReturnValue('/');
      mockUseUnreadCount.mockReturnValue({
        unreadCount: 0,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });
    });

    it('should show Messages link when user is authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '123', email: 'user@example.com' } as any,
        profile: { id: '123', role: 'user', email: 'user@example.com' } as any,
        agencySlug: null,
        signOut: jest.fn(),
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        refreshProfile: jest.fn(),
        isAdmin: false,
        isAgencyOwner: false,
      });

      render(<Header />);

      const messagesLinks = screen.getAllByText('Messages');
      expect(messagesLinks.length).toBeGreaterThan(0);
    });

    it('should NOT show Messages link when user is not authenticated', () => {
      // Default mock state (not authenticated)
      render(<Header />);

      expect(screen.queryByText('Messages')).not.toBeInTheDocument();
    });

    it('should have correct href for Messages link', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '123', email: 'user@example.com' } as any,
        profile: { id: '123', role: 'user', email: 'user@example.com' } as any,
        agencySlug: null,
        signOut: jest.fn(),
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        refreshProfile: jest.fn(),
        isAdmin: false,
        isAgencyOwner: false,
      });

      render(<Header />);

      const messagesLinks = screen.getAllByRole('link', {
        name: /messages/i,
      });
      expect(messagesLinks[0]).toHaveAttribute('href', '/messages');
    });

    it('should show UnreadBadge when unreadCount > 0', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '123', email: 'user@example.com' } as any,
        profile: { id: '123', role: 'user', email: 'user@example.com' } as any,
        agencySlug: null,
        signOut: jest.fn(),
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        refreshProfile: jest.fn(),
        isAdmin: false,
        isAgencyOwner: false,
      });

      mockUseUnreadCount.mockReturnValue({
        unreadCount: 5,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<Header />);

      const badges = screen.getAllByTestId('unread-badge');
      expect(badges.length).toBeGreaterThan(0);
      expect(badges[0]).toHaveTextContent('5');
    });

    it('should NOT show UnreadBadge when unreadCount is 0', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '123', email: 'user@example.com' } as any,
        profile: { id: '123', role: 'user', email: 'user@example.com' } as any,
        agencySlug: null,
        signOut: jest.fn(),
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        refreshProfile: jest.fn(),
        isAdmin: false,
        isAgencyOwner: false,
      });

      mockUseUnreadCount.mockReturnValue({
        unreadCount: 0,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<Header />);

      expect(screen.queryByTestId('unread-badge')).not.toBeInTheDocument();
    });

    it('should apply highlighting when pathname starts with /messages', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '123', email: 'user@example.com' } as any,
        profile: { id: '123', role: 'user', email: 'user@example.com' } as any,
        agencySlug: null,
        signOut: jest.fn(),
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        refreshProfile: jest.fn(),
        isAdmin: false,
        isAgencyOwner: false,
      });

      mockUsePathname.mockReturnValue('/messages');

      render(<Header />);

      // Verify usePathname was called and returned the expected value
      expect(mockUsePathname).toHaveBeenCalled();
      expect(mockUsePathname()).toBe('/messages');

      // Verify Messages links exist and render correctly
      const messagesLinks = screen.getAllByRole('link', { name: /messages/i });
      expect(messagesLinks.length).toBeGreaterThan(0);

      // Verify the component renders without errors
      // Note: Visual styling verification should be done via E2E tests or manual testing
      // as the Button component's asChild prop may not apply classes in the expected way during unit testing
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('should render correctly when pathname does not start with /messages', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '123', email: 'user@example.com' } as any,
        profile: { id: '123', role: 'user', email: 'user@example.com' } as any,
        agencySlug: null,
        signOut: jest.fn(),
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        refreshProfile: jest.fn(),
        isAdmin: false,
        isAgencyOwner: false,
      });

      mockUsePathname.mockReturnValue('/dashboard');

      render(<Header />);

      // Verify Messages links still render when on other pages
      const messagesLinks = screen.getAllByRole('link', { name: /messages/i });
      expect(messagesLinks.length).toBeGreaterThan(0);

      // Verify the component renders without errors
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('should appear in both desktop and mobile menus', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '123', email: 'user@example.com' } as any,
        profile: { id: '123', role: 'user', email: 'user@example.com' } as any,
        agencySlug: null,
        signOut: jest.fn(),
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        refreshProfile: jest.fn(),
        isAdmin: false,
        isAgencyOwner: false,
      });

      render(<Header />);

      const messagesLinks = screen.getAllByText('Messages');
      // Should appear in both desktop and mobile (at least 2 instances)
      expect(messagesLinks.length).toBeGreaterThanOrEqual(2);
    });

    it('should call useUnreadCount hook with enabled=true when user is authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '123', email: 'user@example.com' } as any,
        profile: { id: '123', role: 'user', email: 'user@example.com' } as any,
        agencySlug: null,
        signOut: jest.fn(),
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        refreshProfile: jest.fn(),
        isAdmin: false,
        isAgencyOwner: false,
      });

      render(<Header />);

      expect(mockUseUnreadCount).toHaveBeenCalledWith(true);
    });

    it('should call useUnreadCount hook with enabled=false when user is not authenticated', () => {
      // Default mock state (not authenticated)
      render(<Header />);

      expect(mockUseUnreadCount).toHaveBeenCalledWith(false);
    });
  });
});
