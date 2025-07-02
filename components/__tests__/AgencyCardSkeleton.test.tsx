/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import AgencyCardSkeleton from '../AgencyCardSkeleton';

describe('AgencyCardSkeleton', () => {
  it('renders skeleton elements with correct structure', () => {
    const { container } = render(<AgencyCardSkeleton />);

    // Check for skeleton elements (Skeleton component uses animate-pulse class)
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders with proper layout structure', () => {
    render(<AgencyCardSkeleton />);

    // Check for card structure
    const card = screen.getByTestId('agency-card-skeleton');
    expect(card).toBeInTheDocument();

    // Check for flex layout
    const flexContainer = screen.getByTestId('skeleton-flex-container');
    expect(flexContainer).toBeInTheDocument();
  });

  it('renders logo skeleton', () => {
    render(<AgencyCardSkeleton />);

    // Check for logo skeleton
    const logoSkeleton = screen.getByTestId('skeleton-logo');
    expect(logoSkeleton).toBeInTheDocument();
    expect(logoSkeleton).toHaveClass('w-20');
    expect(logoSkeleton).toHaveClass('h-20');
    expect(logoSkeleton).toHaveClass('rounded-3xl');
  });

  it('renders correct number of stat skeletons', () => {
    render(<AgencyCardSkeleton />);

    // Should have 4 stat items in the grid
    const statGrid = screen.getByTestId('skeleton-stats-grid');
    expect(statGrid).toBeInTheDocument();
    expect(statGrid.children.length).toBe(4);
  });

  it('renders action button skeletons', () => {
    render(<AgencyCardSkeleton />);

    // Should have 2 button skeletons
    const button1 = screen.getByTestId('skeleton-button-1');
    const button2 = screen.getByTestId('skeleton-button-2');
    expect(button1).toBeInTheDocument();
    expect(button2).toBeInTheDocument();
    expect(button1).toHaveClass('h-10');
    expect(button1).toHaveClass('w-full');
    expect(button1).toHaveClass('lg:w-40');
    expect(button1).toHaveClass('rounded-xl');
    expect(button2).toHaveClass('h-10');
    expect(button2).toHaveClass('w-full');
    expect(button2).toHaveClass('lg:w-40');
    expect(button2).toHaveClass('rounded-xl');
  });

  it('has no layout shift potential', () => {
    const { container } = render(<AgencyCardSkeleton />);

    // Check that all skeletons have defined dimensions
    const allSkeletons = container.querySelectorAll(
      '[class*="h-"][class*="w-"]'
    );
    expect(allSkeletons.length).toBeGreaterThan(0);

    // Each skeleton should have both height and width classes
    allSkeletons.forEach((skeleton) => {
      const classes = skeleton.className;
      expect(classes).toMatch(/h-\d+|h-\[/);
      expect(classes).toMatch(/w-\d+|w-\[|w-full|w-\d+\/\d+/);
    });
  });
});
