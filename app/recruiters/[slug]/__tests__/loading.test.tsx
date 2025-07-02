/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import ProfileLoading from '../loading';

// Mock components
jest.mock('@/components/Header', () => ({
  __esModule: true,
  default: () => <div data-testid="header">Header</div>,
}));

jest.mock('@/components/Footer', () => ({
  __esModule: true,
  default: () => <div data-testid="footer">Footer</div>,
}));

describe('Profile Page Loading State', () => {
  it('should render loading skeleton structure', () => {
    render(<ProfileLoading />);

    // Check main structure exists
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  it('should show skeleton for agency logo', () => {
    render(<ProfileLoading />);

    // Logo skeleton should be 32x32
    const logoSkeleton = screen.getByTestId('logo-skeleton');
    expect(logoSkeleton).toBeInTheDocument();
    expect(logoSkeleton).toHaveClass('w-32', 'h-32', 'rounded-lg');
  });

  it('should show skeleton for agency name and badges', () => {
    render(<ProfileLoading />);

    // Name skeleton
    const nameSkeleton = screen.getByTestId('name-skeleton');
    expect(nameSkeleton).toBeInTheDocument();
    expect(nameSkeleton).toHaveClass('h-9', 'w-80');

    // Badge skeletons
    const badgeSkeletons = screen.getAllByTestId('badge-skeleton');
    expect(badgeSkeletons).toHaveLength(3);
    badgeSkeletons.forEach((badge) => {
      expect(badge).toHaveClass('h-6', 'w-20');
    });
  });

  it('should show skeleton for quick stats', () => {
    render(<ProfileLoading />);

    // Should have 4 stat items
    const statsGrid = screen.getByTestId('stats-grid');
    expect(statsGrid).toBeInTheDocument();

    const statItems = screen.getAllByTestId('stat-item');
    expect(statItems).toHaveLength(4);
  });

  it('should show skeleton for tabs', () => {
    render(<ProfileLoading />);

    // Should show tab skeleton container
    const tabContainer = screen.getByTestId('tab-skeleton-container');
    expect(tabContainer).toBeInTheDocument();

    // Should have 3 tab skeletons (Overview, Trade Specialties, Service Areas)
    const tabSkeletons = screen.getAllByTestId('tab-skeleton');
    expect(tabSkeletons).toHaveLength(3);
  });

  it('should show skeleton for contact information', () => {
    render(<ProfileLoading />);

    // Contact card should have title skeleton
    const contactTitleSkeleton = screen.getByTestId('contact-title-skeleton');
    expect(contactTitleSkeleton).toBeInTheDocument();
    expect(contactTitleSkeleton).toHaveClass('h-6', 'w-40');

    // Should have contact item skeletons (verify by structure)
    const { container } = render(<ProfileLoading />);
    const contactItemContainers =
      container.querySelectorAll('.space-y-4 > div');
    expect(contactItemContainers.length).toBeGreaterThanOrEqual(3);
  });

  it('should show skeleton for CTA buttons', () => {
    render(<ProfileLoading />);

    // Should have button skeletons
    const buttonSkeletons = screen.getAllByTestId('cta-button-skeleton');
    expect(buttonSkeletons).toHaveLength(2);
    buttonSkeletons.forEach((button) => {
      expect(button).toHaveClass('h-12', 'w-[200px]');
    });
  });

  it('should show skeleton for back link card', () => {
    render(<ProfileLoading />);

    // Back link skeleton
    const backLinkSkeleton = screen.getByTestId('back-link-skeleton');
    expect(backLinkSkeleton).toBeInTheDocument();
    expect(backLinkSkeleton).toHaveClass('h-5', 'w-32');
  });

  it('should maintain layout structure while loading', () => {
    const { container } = render(<ProfileLoading />);

    // Check grid layout
    const mainGrid = container.querySelector(
      '.grid.grid-cols-1.lg\\:grid-cols-3'
    );
    expect(mainGrid).toBeInTheDocument();

    // Check left column span
    const leftColumn = container.querySelector('.lg\\:col-span-2');
    expect(leftColumn).toBeInTheDocument();
  });

  it('should not cause layout shift', () => {
    const { container } = render(<ProfileLoading />);

    // All skeleton elements should have defined dimensions
    const skeletons = container.querySelectorAll('[class*="h-"][class*="w-"]');
    expect(skeletons.length).toBeGreaterThan(10);

    // Each skeleton should have both height and width classes
    skeletons.forEach((skeleton) => {
      const classes = skeleton.className;
      expect(classes).toMatch(/h-\d+|h-\[\d+px\]/);
      expect(classes).toMatch(/w-\d+|w-\[\d+px\]|w-full|w-\d+\/\d+/);
    });
  });
});
