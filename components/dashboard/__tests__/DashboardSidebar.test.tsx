import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DashboardSidebar } from '../DashboardSidebar';
import { usePathname } from 'next/navigation';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

// Mock the realtime hook
jest.mock('@/hooks/useNewRequestsRealtime', () => ({
  useNewRequestsRealtime: jest.fn(),
}));

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
  },
}));

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

describe('DashboardSidebar', () => {
  const defaultProps = {
    agencyId: 'agency-123',
    agencySlug: 'test-agency',
    agencyName: 'Test Agency',
  };

  beforeEach(() => {
    mockUsePathname.mockReturnValue('/dashboard/agency/test-agency');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Navigation Items', () => {
    it('should render all navigation items in desktop sidebar', () => {
      render(<DashboardSidebar {...defaultProps} />);

      // Check that navigation items are present (at least in desktop sidebar)
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.getByText('Services')).toBeInTheDocument();
      expect(screen.getByText('Analytics')).toBeInTheDocument();
    });

    it('should show "Coming Soon" badge for disabled items', () => {
      render(<DashboardSidebar {...defaultProps} />);

      const comingSoonBadge = screen.getByText('(Coming Soon)');
      expect(comingSoonBadge).toBeInTheDocument();
    });

    it('should render correct hrefs for navigation items', () => {
      render(<DashboardSidebar {...defaultProps} />);

      const overviewLinks = screen.getAllByRole('link', { name: /overview/i });
      expect(overviewLinks[0]).toHaveAttribute(
        'href',
        '/dashboard/agency/test-agency'
      );

      const profileLinks = screen.getAllByRole('link', { name: /profile/i });
      expect(profileLinks[0]).toHaveAttribute(
        'href',
        '/dashboard/agency/test-agency/profile'
      );

      const servicesLinks = screen.getAllByRole('link', { name: /services/i });
      expect(servicesLinks[0]).toHaveAttribute(
        'href',
        '/dashboard/agency/test-agency/services'
      );
    });

    it('should have # href for disabled items', () => {
      render(<DashboardSidebar {...defaultProps} />);

      const analyticsLinks = screen.getAllByRole('link', {
        name: /analytics/i,
      });
      expect(analyticsLinks[0]).toHaveAttribute('href', '#');
    });
  });

  describe('Active State', () => {
    it('should highlight Overview as active when on overview page', () => {
      mockUsePathname.mockReturnValue('/dashboard/agency/test-agency');
      render(<DashboardSidebar {...defaultProps} />);

      const overviewLinks = screen.getAllByRole('link', { name: /overview/i });
      expect(overviewLinks[0]).toHaveAttribute('aria-current', 'page');
      expect(overviewLinks[0]).toHaveClass('bg-industrial-orange');
    });

    it('should highlight Profile as active when on profile page', () => {
      mockUsePathname.mockReturnValue('/dashboard/agency/test-agency/profile');
      render(<DashboardSidebar {...defaultProps} />);

      const profileLinks = screen.getAllByRole('link', { name: /profile/i });
      expect(profileLinks[0]).toHaveAttribute('aria-current', 'page');
      expect(profileLinks[0]).toHaveClass('bg-industrial-orange');
    });

    it('should highlight Services as active when on services page', () => {
      mockUsePathname.mockReturnValue('/dashboard/agency/test-agency/services');
      render(<DashboardSidebar {...defaultProps} />);

      const servicesLinks = screen.getAllByRole('link', { name: /services/i });
      expect(servicesLinks[0]).toHaveAttribute('aria-current', 'page');
      expect(servicesLinks[0]).toHaveClass('bg-industrial-orange');
    });

    it('should not highlight Overview when on Profile page', () => {
      mockUsePathname.mockReturnValue('/dashboard/agency/test-agency/profile');
      render(<DashboardSidebar {...defaultProps} />);

      const overviewLinks = screen.getAllByRole('link', { name: /overview/i });
      expect(overviewLinks[0]).not.toHaveAttribute('aria-current', 'page');
      expect(overviewLinks[0]).not.toHaveClass('bg-industrial-orange');
    });

    it('should use exact match for Overview page', () => {
      mockUsePathname.mockReturnValue('/dashboard/agency/test-agency/profile');
      render(<DashboardSidebar {...defaultProps} />);

      const overviewLinks = screen.getAllByRole('link', { name: /overview/i });
      expect(overviewLinks[0]).not.toHaveAttribute('aria-current', 'page');
    });

    it('should use prefix match for other pages', () => {
      mockUsePathname.mockReturnValue(
        '/dashboard/agency/test-agency/services/edit'
      );
      render(<DashboardSidebar {...defaultProps} />);

      const servicesLinks = screen.getAllByRole('link', { name: /services/i });
      expect(servicesLinks[0]).toHaveAttribute('aria-current', 'page');
    });
  });

  describe('Mobile Menu', () => {
    it('should render mobile menu trigger button', () => {
      render(<DashboardSidebar {...defaultProps} />);

      const menuButton = screen.getByRole('button', {
        name: /open navigation menu/i,
      });
      expect(menuButton).toBeInTheDocument();
    });

    it('should have mobile menu trigger visible only on mobile', () => {
      render(<DashboardSidebar {...defaultProps} />);

      const menuButton = screen.getByRole('button', {
        name: /open navigation menu/i,
      });
      const mobileContainer = menuButton.closest('.lg\\:hidden');
      expect(mobileContainer).toHaveClass('lg:hidden');
    });

    it('should show agency name in mobile sheet', () => {
      render(<DashboardSidebar {...defaultProps} />);

      expect(screen.getByText('Test Agency')).toBeInTheDocument();
    });
  });

  describe('Desktop Sidebar', () => {
    it('should render desktop sidebar with agency name', () => {
      render(<DashboardSidebar {...defaultProps} />);

      const agencyNames = screen.getAllByText('Test Agency');
      expect(agencyNames.length).toBeGreaterThan(0);
    });

    it('should have desktop sidebar hidden on mobile', () => {
      const { container } = render(<DashboardSidebar {...defaultProps} />);

      const desktopSidebar = container.querySelector('aside');
      expect(desktopSidebar).toHaveClass('hidden');
      expect(desktopSidebar).toHaveClass('lg:flex');
    });

    it('should have fixed positioning on desktop', () => {
      const { container } = render(<DashboardSidebar {...defaultProps} />);

      const desktopSidebar = container.querySelector('aside');
      expect(desktopSidebar).toHaveClass('lg:fixed');
    });

    it('should have correct width', () => {
      const { container } = render(<DashboardSidebar {...defaultProps} />);

      const desktopSidebar = container.querySelector('aside');
      expect(desktopSidebar).toHaveClass('lg:w-64');
    });
  });

  describe('Disabled Items', () => {
    it('should mark disabled items with aria-disabled', () => {
      render(<DashboardSidebar {...defaultProps} />);

      const analyticsLinks = screen.getAllByRole('link', {
        name: /analytics/i,
      });
      expect(analyticsLinks[0]).toHaveAttribute('aria-disabled', 'true');
    });

    it('should prevent navigation for disabled items', () => {
      render(<DashboardSidebar {...defaultProps} />);

      const analyticsLinks = screen.getAllByRole('link', {
        name: /analytics/i,
      });

      // Click should be prevented (href is #)
      expect(analyticsLinks[0]).toHaveAttribute('href', '#');
    });

    it('should have cursor-not-allowed for disabled items', () => {
      render(<DashboardSidebar {...defaultProps} />);

      const analyticsLinks = screen.getAllByRole('link', {
        name: /analytics/i,
      });
      expect(analyticsLinks[0]).toHaveClass('cursor-not-allowed');
    });

    it('should have muted text color for disabled items', () => {
      render(<DashboardSidebar {...defaultProps} />);

      const analyticsLinks = screen.getAllByRole('link', {
        name: /analytics/i,
      });
      expect(analyticsLinks[0]).toHaveClass('text-industrial-graphite-400');
    });
  });

  describe('Accessibility', () => {
    it('should have navigation role', () => {
      render(<DashboardSidebar {...defaultProps} />);

      const navElements = screen.getAllByRole('navigation', {
        name: /dashboard navigation/i,
      });
      expect(navElements.length).toBeGreaterThan(0);
    });

    it('should have aria-label on sidebar', () => {
      const { container } = render(<DashboardSidebar {...defaultProps} />);

      const sidebar = container.querySelector('aside');
      expect(sidebar).toHaveAttribute('aria-label', 'Sidebar');
    });

    it('should have aria-label on mobile menu button', () => {
      render(<DashboardSidebar {...defaultProps} />);

      const menuButton = screen.getByRole('button', {
        name: /open navigation menu/i,
      });
      expect(menuButton).toHaveAttribute('aria-label', 'Open navigation menu');
    });

    it('should have aria-current="page" for active items', () => {
      mockUsePathname.mockReturnValue('/dashboard/agency/test-agency');
      render(<DashboardSidebar {...defaultProps} />);

      const overviewLinks = screen.getAllByRole('link', { name: /overview/i });
      expect(overviewLinks[0]).toHaveAttribute('aria-current', 'page');
    });

    it('should not have aria-current for inactive items', () => {
      mockUsePathname.mockReturnValue('/dashboard/agency/test-agency');
      render(<DashboardSidebar {...defaultProps} />);

      const profileLinks = screen.getAllByRole('link', { name: /profile/i });
      expect(profileLinks[0]).not.toHaveAttribute('aria-current');
    });

    it('should have aria-hidden on icons', () => {
      const { container } = render(<DashboardSidebar {...defaultProps} />);

      const icons = container.querySelectorAll('svg[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe('Icons', () => {
    it('should render icons for all navigation items in desktop sidebar', () => {
      const { container } = render(<DashboardSidebar {...defaultProps} />);

      // Desktop sidebar has 4 navigation items + 1 menu button icon
      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('Styling', () => {
    it('should apply active styles to active items', () => {
      mockUsePathname.mockReturnValue('/dashboard/agency/test-agency');
      render(<DashboardSidebar {...defaultProps} />);

      const overviewLinks = screen.getAllByRole('link', { name: /overview/i });
      expect(overviewLinks[0]).toHaveClass('bg-industrial-orange');
      expect(overviewLinks[0]).toHaveClass('text-white');
    });

    it('should apply hover styles to inactive enabled items', () => {
      mockUsePathname.mockReturnValue('/dashboard/agency/test-agency');
      render(<DashboardSidebar {...defaultProps} />);

      const profileLinks = screen.getAllByRole('link', { name: /profile/i });
      expect(profileLinks[0]).toHaveClass('hover:bg-industrial-graphite-100');
      expect(profileLinks[0]).toHaveClass('hover:text-industrial-graphite-600');
    });

    it('should not apply hover styles to disabled items', () => {
      render(<DashboardSidebar {...defaultProps} />);

      const analyticsLinks = screen.getAllByRole('link', {
        name: /analytics/i,
      });
      expect(analyticsLinks[0]).not.toHaveClass(
        'hover:bg-industrial-graphite-100'
      );
    });
  });

  describe('Click Handlers', () => {
    it('should preventDefault for disabled items when clicked', () => {
      render(<DashboardSidebar {...defaultProps} />);

      const analyticsLinks = screen.getAllByRole('link', {
        name: /analytics/i,
      });
      const clickEvent = new MouseEvent('click', { bubbles: true });
      const preventDefaultSpy = jest.spyOn(clickEvent, 'preventDefault');

      fireEvent(analyticsLinks[0], clickEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });
});
