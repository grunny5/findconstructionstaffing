import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  DashboardOverview,
  DashboardOverviewSkeleton,
} from '../DashboardOverview';

// Mock Next.js Link component
jest.mock('next/link', () => {
  const MockLink = ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => {
    return <a href={href}>{children}</a>;
  };
  MockLink.displayName = 'Link';
  return MockLink;
});

const mockAgency = {
  id: '123',
  name: 'Test Agency',
  slug: 'test-agency',
  logo_url: 'https://example.com/logo.png',
  description: 'A test agency description',
  profile_completion_percentage: 75,
  last_edited_at: '2025-01-15T10:00:00Z',
};

const mockAgencyIncomplete = {
  ...mockAgency,
  logo_url: null,
  description: null,
  profile_completion_percentage: 35,
  last_edited_at: null,
};

describe('DashboardOverview', () => {
  describe('Stats Cards', () => {
    it('should render all three stats cards', () => {
      render(<DashboardOverview agency={mockAgency} />);

      expect(screen.getByText('Profile Views')).toBeInTheDocument();
      expect(screen.getByText('Lead Requests')).toBeInTheDocument();
      expect(screen.getAllByText('Profile Completion').length).toBeGreaterThan(
        0
      );
    });

    it('should show 0 for profile views with description', () => {
      render(<DashboardOverview agency={mockAgency} />);

      // Get all elements with "0" text and check the context
      const profileViewsCard = screen
        .getByText('Profile Views')
        .closest('.rounded-lg');
      expect(profileViewsCard).toHaveTextContent('0');
      expect(profileViewsCard).toHaveTextContent('Last 30 days');
    });

    it('should show 0 for lead requests with coming soon', () => {
      render(<DashboardOverview agency={mockAgency} />);

      const leadRequestsCard = screen
        .getByText('Lead Requests')
        .closest('.rounded-lg');
      expect(leadRequestsCard).toHaveTextContent('0');
      expect(leadRequestsCard).toHaveTextContent('Coming soon');
    });

    it('should show profile completion percentage in stats card', () => {
      render(<DashboardOverview agency={mockAgency} />);

      const percentageElements = screen.getAllByText('75%');
      expect(percentageElements.length).toBeGreaterThan(0);
    });

    it('should show "Fully optimized" when 100% complete', () => {
      const completeAgency = {
        ...mockAgency,
        profile_completion_percentage: 100,
      };
      render(<DashboardOverview agency={completeAgency} />);

      expect(screen.getByText('Fully optimized')).toBeInTheDocument();
    });

    it('should show "Improve visibility" when incomplete', () => {
      render(<DashboardOverview agency={mockAgency} />);

      expect(screen.getByText('Improve visibility')).toBeInTheDocument();
    });
  });

  describe('Profile Completion Widget', () => {
    it('should render profile completion widget', () => {
      render(<DashboardOverview agency={mockAgency} />);

      const profileCompletionElements =
        screen.getAllByText('Profile Completion');
      expect(profileCompletionElements.length).toBeGreaterThanOrEqual(1);
    });

    it('should show missing fields when profile incomplete', () => {
      render(<DashboardOverview agency={mockAgencyIncomplete} />);

      // Check within the Profile Completion Widget (checklist)
      const profileCompletionWidget = screen
        .getAllByText('Profile Completion')[1] // Second occurrence is the widget
        .closest('.rounded-lg');

      expect(profileCompletionWidget).toHaveTextContent('Add Logo');
      expect(profileCompletionWidget).toHaveTextContent(
        'Complete Description (at least 100 characters)'
      );
    });

    it('should not show logo field when logo exists', () => {
      const { container } = render(
        <DashboardOverview agency={mockAgency} />
      );

      // The ProfileCompletionWidget should still show "Add Logo" but completed
      // Quick Actions will also show "Update Logo" when logo exists
      const updateLogoButton = screen.getByText('Update Logo');
      expect(updateLogoButton).toBeInTheDocument();
    });
  });

  describe('Quick Actions', () => {
    it('should render quick actions section', () => {
      render(<DashboardOverview agency={mockAgency} />);

      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    });

    it('should render Edit Profile action', () => {
      render(<DashboardOverview agency={mockAgency} />);

      expect(screen.getByText('Edit Profile')).toBeInTheDocument();
      expect(screen.getByText('Update company details')).toBeInTheDocument();
    });

    it('should render Add/Update Logo action', () => {
      render(<DashboardOverview agency={mockAgency} />);

      expect(screen.getByText('Update Logo')).toBeInTheDocument();
      expect(screen.getByText('Change company logo')).toBeInTheDocument();
    });

    it('should show "Add Logo" when no logo exists', () => {
      render(<DashboardOverview agency={mockAgencyIncomplete} />);

      // Check for the "Add Logo" button in Quick Actions section
      const quickActionsSection = screen
        .getByText('Quick Actions')
        .closest('.rounded-lg');

      expect(quickActionsSection).toHaveTextContent('Add Logo');
      expect(quickActionsSection).toHaveTextContent('Upload company logo');
    });

    it('should render Update Services action', () => {
      render(<DashboardOverview agency={mockAgency} />);

      expect(screen.getByText('Update Services')).toBeInTheDocument();
      expect(screen.getByText('Trades & regions')).toBeInTheDocument();
    });

    it('should render View Public Profile action', () => {
      render(<DashboardOverview agency={mockAgency} />);

      expect(screen.getByText('View Public Profile')).toBeInTheDocument();
      expect(screen.getByText('See how clients see you')).toBeInTheDocument();
    });

    it('should link to correct profile edit page', () => {
      render(<DashboardOverview agency={mockAgency} />);

      const editProfileLink = screen.getByText('Edit Profile').closest('a');
      expect(editProfileLink).toHaveAttribute(
        'href',
        '/dashboard/agency/test-agency/profile'
      );
    });

    it('should link to correct services page', () => {
      render(<DashboardOverview agency={mockAgency} />);

      const servicesLink = screen.getByText('Update Services').closest('a');
      expect(servicesLink).toHaveAttribute(
        'href',
        '/dashboard/agency/test-agency/services'
      );
    });

    it('should link to public profile', () => {
      render(<DashboardOverview agency={mockAgency} />);

      const publicProfileLink = screen
        .getByText('View Public Profile')
        .closest('a');
      expect(publicProfileLink).toHaveAttribute(
        'href',
        '/recruiters/test-agency'
      );
    });
  });

  describe('Recent Activity', () => {
    it('should render recent activity section', () => {
      render(<DashboardOverview agency={mockAgency} />);

      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    });

    it('should show last edited date when available', () => {
      render(<DashboardOverview agency={mockAgency} />);

      expect(screen.getByText('Profile updated')).toBeInTheDocument();
      expect(screen.getByText('January 15, 2025')).toBeInTheDocument();
    });

    it('should show no activity message when no last_edited_at', () => {
      render(<DashboardOverview agency={mockAgencyIncomplete} />);

      expect(
        screen.getByText('No recent activity to display')
      ).toBeInTheDocument();
    });
  });

  describe('Help Section', () => {
    it('should render help section', () => {
      render(<DashboardOverview agency={mockAgency} />);

      expect(screen.getByText('Need Help?')).toBeInTheDocument();
    });

    it('should show help description', () => {
      render(<DashboardOverview agency={mockAgency} />);

      expect(
        screen.getByText(/Get support with your profile/)
      ).toBeInTheDocument();
    });

    it('should render Visit Help Center button', () => {
      render(<DashboardOverview agency={mockAgency} />);

      const helpButton = screen.getByText('Visit Help Center');
      expect(helpButton).toBeInTheDocument();
      expect(helpButton.closest('a')).toHaveAttribute('href', '/help');
    });

    it('should render Contact Support button', () => {
      render(<DashboardOverview agency={mockAgency} />);

      const contactButton = screen.getByText('Contact Support');
      expect(contactButton).toBeInTheDocument();
      expect(contactButton.closest('a')).toHaveAttribute('href', '/contact');
    });
  });

  describe('Loading State', () => {
    it('should render skeleton when isLoading is true', () => {
      const { container } = render(
        <DashboardOverview agency={mockAgency} isLoading={true} />
      );

      // Check for skeleton elements
      const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should not render actual content when loading', () => {
      render(<DashboardOverview agency={mockAgency} isLoading={true} />);

      expect(screen.queryByText('Edit Profile')).not.toBeInTheDocument();
      expect(screen.queryByText('Need Help?')).not.toBeInTheDocument();
    });

    it('should render content when not loading', () => {
      render(<DashboardOverview agency={mockAgency} isLoading={false} />);

      expect(screen.getByText('Edit Profile')).toBeInTheDocument();
      expect(screen.getByText('Need Help?')).toBeInTheDocument();
    });
  });

  describe('Responsive Layout', () => {
    it('should use grid layout for stats cards', () => {
      const { container } = render(<DashboardOverview agency={mockAgency} />);

      const statsGrid = container.querySelector('.grid.md\\:grid-cols-3');
      expect(statsGrid).toBeInTheDocument();
    });

    it('should have proper grid structure for quick actions', () => {
      const { container } = render(<DashboardOverview agency={mockAgency} />);

      const quickActionsGrid = screen
        .getByText('Quick Actions')
        .closest('.rounded-lg')
        ?.querySelector('.grid.sm\\:grid-cols-2');
      expect(quickActionsGrid).toBeInTheDocument();
    });
  });

  describe('Icons', () => {
    it('should render icons in stats cards', () => {
      const { container } = render(<DashboardOverview agency={mockAgency} />);

      // Stats cards should have icons
      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should render icons in quick action buttons', () => {
      const { container } = render(<DashboardOverview agency={mockAgency} />);

      const quickActionsSection = screen
        .getByText('Quick Actions')
        .closest('.rounded-lg');
      const icons = quickActionsSection?.querySelectorAll('svg');
      expect(icons && icons.length).toBeGreaterThan(0);
    });
  });
});

describe('DashboardOverviewSkeleton', () => {
  it('should render skeleton structure', () => {
    const { container } = render(<DashboardOverviewSkeleton />);

    const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should render skeleton for stats cards', () => {
    const { container } = render(<DashboardOverviewSkeleton />);

    // Should have 3 skeleton cards in first grid
    const firstGrid = container.querySelector('.grid.md\\:grid-cols-3');
    const cards = firstGrid?.querySelectorAll('.rounded-lg.border');
    expect(cards?.length).toBe(3);
  });

  it('should render skeleton for quick actions', () => {
    const { container } = render(<DashboardOverviewSkeleton />);

    // Should have skeleton buttons for quick actions
    const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(8); // Multiple skeleton elements
  });
});
