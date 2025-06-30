/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import ProfileLoading from '../loading';

// Mock components
jest.mock('@/components/Header', () => ({
  __esModule: true,
  default: () => <div data-testid="header">Header</div>
}));

jest.mock('@/components/Footer', () => ({
  __esModule: true,
  default: () => <div data-testid="footer">Footer</div>
}));

describe('Profile Page Loading State', () => {
  it('should render loading skeleton structure', () => {
    render(<ProfileLoading />);

    // Check main structure exists
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  it('should show skeleton for agency logo', () => {
    const { container } = render(<ProfileLoading />);
    
    // Logo skeleton should be 32x32
    const logoSkeleton = container.querySelector('.w-32.h-32');
    expect(logoSkeleton).toBeInTheDocument();
    expect(logoSkeleton).toHaveClass('rounded-lg');
  });

  it('should show skeleton for agency name and badges', () => {
    const { container } = render(<ProfileLoading />);
    
    // Name skeleton
    const nameSkeleton = container.querySelector('.h-9.w-80');
    expect(nameSkeleton).toBeInTheDocument();
    
    // Badge skeletons
    const badgeSkeletons = container.querySelectorAll('.h-6.w-20');
    expect(badgeSkeletons.length).toBeGreaterThanOrEqual(3);
  });

  it('should show skeleton for quick stats', () => {
    const { container } = render(<ProfileLoading />);
    
    // Should have 4 stat items
    const statSkeletons = container.querySelectorAll('.grid-cols-2.lg\\:grid-cols-4 > div');
    expect(statSkeletons.length).toBe(4);
  });

  it('should show disabled tabs', () => {
    render(<ProfileLoading />);
    
    // Tabs should be present but disabled
    const overviewTab = screen.getByText('Overview');
    const tradesTab = screen.getByText('Trade Specialties');
    const regionsTab = screen.getByText('Service Areas');
    
    expect(overviewTab).toBeInTheDocument();
    expect(tradesTab).toBeInTheDocument();
    expect(regionsTab).toBeInTheDocument();
    
    // Tabs should be disabled
    expect(overviewTab).toHaveAttribute('disabled');
    expect(tradesTab).toHaveAttribute('disabled');
    expect(regionsTab).toHaveAttribute('disabled');
  });

  it('should show skeleton for contact information', () => {
    const { container } = render(<ProfileLoading />);
    
    // Contact card should have title skeleton
    const contactTitleSkeleton = container.querySelector('.h-6.w-40');
    expect(contactTitleSkeleton).toBeInTheDocument();
    
    // Should have contact item skeletons
    const contactItemContainers = container.querySelectorAll('.space-y-4 > div');
    expect(contactItemContainers.length).toBeGreaterThanOrEqual(3);
  });

  it('should show skeleton for CTA buttons', () => {
    const { container } = render(<ProfileLoading />);
    
    // Should have button skeletons
    const buttonSkeletons = container.querySelectorAll('.h-12.w-\\[200px\\]');
    expect(buttonSkeletons.length).toBe(2);
  });

  it('should show skeleton for back link card', () => {
    const { container } = render(<ProfileLoading />);
    
    // Back link skeleton
    const backLinkSkeleton = container.querySelector('.h-5.w-32');
    expect(backLinkSkeleton).toBeInTheDocument();
  });

  it('should maintain layout structure while loading', () => {
    const { container } = render(<ProfileLoading />);
    
    // Check grid layout
    const mainGrid = container.querySelector('.grid.grid-cols-1.lg\\:grid-cols-3');
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
    skeletons.forEach(skeleton => {
      const classes = skeleton.className;
      expect(classes).toMatch(/h-\d+|h-\[\d+px\]/);
      expect(classes).toMatch(/w-\d+|w-\[\d+px\]|w-full|w-\d+\/\d+/);
    });
  });
});