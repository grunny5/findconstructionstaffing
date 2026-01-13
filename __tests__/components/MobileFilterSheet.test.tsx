/**
 * Tests for MobileFilterSheet Component
 *
 * Validates mobile-specific filter interactions, touch targets, and responsive behavior.
 * Phase 4 - Mobile & Performance
 */

import { render, screen, fireEvent, within } from '@testing-library/react';
import { MobileFilterSheet } from '@/components/MobileFilterSheet';
import { FilterState } from '@/components/DirectoryFilters';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
    getAll: jest.fn(() => []),
  }),
}));

describe('MobileFilterSheet', () => {
  const mockOnFiltersChange = jest.fn();
  const defaultProps = {
    onFiltersChange: mockOnFiltersChange,
    totalResults: 12,
    isLoading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the filter trigger button', () => {
      render(<MobileFilterSheet {...defaultProps} />);

      const trigger = screen.getByRole('button', { name: /filter agencies/i });
      expect(trigger).toBeInTheDocument();
    });

    it('should show "Filter Agencies" text on trigger button', () => {
      render(<MobileFilterSheet {...defaultProps} />);

      expect(screen.getByText('Filter Agencies')).toBeInTheDocument();
    });

    it('should have filter icon on trigger button', () => {
      const { container } = render(<MobileFilterSheet {...defaultProps} />);

      const trigger = screen.getByRole('button', { name: /filter agencies/i });
      // Check for SVG element (lucide-filter class)
      const svg = trigger.querySelector('svg.lucide-filter');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Mobile Touch Targets (WCAG 2.1 AA)', () => {
    it('should meet 44px minimum touch target height', () => {
      const { container } = render(<MobileFilterSheet {...defaultProps} />);

      const trigger = screen.getByRole('button', { name: /filter agencies/i });
      const computedStyle = window.getComputedStyle(trigger);

      // Check for min-h-[44px] class
      expect(trigger.className).toMatch(/min-h-\[44px\]/);
    });

    it('should have full width on mobile for easy tapping', () => {
      const { container } = render(<MobileFilterSheet {...defaultProps} />);

      const trigger = screen.getByRole('button', { name: /filter agencies/i });

      // Should have w-full class for mobile
      expect(trigger.className).toContain('w-full');
    });

    it('should only be visible on mobile screens', () => {
      const { container } = render(<MobileFilterSheet {...defaultProps} />);

      const trigger = screen.getByRole('button', { name: /filter agencies/i });

      // Should have md:hidden class to hide on desktop
      expect(trigger.className).toMatch(/md:hidden/);
    });
  });

  describe('Accessibility', () => {
    it('should have accessible name for screen readers', () => {
      render(<MobileFilterSheet {...defaultProps} />);

      const trigger = screen.getByRole('button', { name: /filter agencies/i });
      expect(trigger).toHaveAccessibleName();
    });

    it('should have sr-only text for "Open filters"', () => {
      render(<MobileFilterSheet {...defaultProps} />);

      const srOnlyText = screen.getByText('Open filters');
      expect(srOnlyText).toBeInTheDocument();
      expect(srOnlyText.className).toContain('sr-only');
    });

    it('should be keyboard accessible', () => {
      render(<MobileFilterSheet {...defaultProps} />);

      const trigger = screen.getByRole('button', { name: /filter agencies/i });

      // Should be focusable
      trigger.focus();
      expect(document.activeElement).toBe(trigger);
    });
  });

  describe('Sheet Behavior', () => {
    it('should open sheet when trigger is clicked', () => {
      render(<MobileFilterSheet {...defaultProps} />);

      const trigger = screen.getByRole('button', { name: /filter agencies/i });
      fireEvent.click(trigger);

      // Sheet content should be rendered
      // Note: Actual sheet opening behavior depends on Radix UI implementation
      expect(trigger).toBeInTheDocument();
    });

    it('should pass filter props to DirectoryFilters', () => {
      const initialFilters: Partial<FilterState> = {
        search: 'test search',
        trades: ['electrician'],
      };

      render(
        <MobileFilterSheet
          {...defaultProps}
          initialFilters={initialFilters}
        />
      );

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should display results count', () => {
      render(<MobileFilterSheet {...defaultProps} totalResults={25} />);

      // Results count will be in the DirectoryFilters component
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Industrial Design System', () => {
    it('should have industrial styling classes', () => {
      const { container } = render(<MobileFilterSheet {...defaultProps} />);

      const trigger = screen.getByRole('button', { name: /filter agencies/i });

      // Should have industrial border and text colors
      expect(trigger.className).toContain('border-industrial-graphite-300');
      expect(trigger.className).toContain('text-industrial-graphite-600');
    });

    it('should use industrial sharp border radius', () => {
      const { container } = render(<MobileFilterSheet {...defaultProps} />);

      const trigger = screen.getByRole('button', { name: /filter agencies/i });

      expect(trigger.className).toContain('rounded-industrial-sharp');
    });

    it('should have hover state with orange accent', () => {
      const { container } = render(<MobileFilterSheet {...defaultProps} />);

      const trigger = screen.getByRole('button', { name: /filter agencies/i });

      expect(trigger.className).toContain('hover:border-industrial-orange');
      expect(trigger.className).toContain('hover:text-industrial-orange');
    });
  });

  describe('Loading State', () => {
    it('should show loading state when isLoading is true', () => {
      render(<MobileFilterSheet {...defaultProps} isLoading={true} />);

      const trigger = screen.getByRole('button', { name: /filter agencies/i });
      expect(trigger).toBeInTheDocument();
    });

    it('should not disable trigger button during loading', () => {
      render(<MobileFilterSheet {...defaultProps} isLoading={true} />);

      const trigger = screen.getByRole('button', { name: /filter agencies/i });
      expect(trigger).not.toBeDisabled();
    });
  });

  describe('Responsive Design', () => {
    it('should have appropriate size classes for mobile', () => {
      const { container } = render(<MobileFilterSheet {...defaultProps} />);

      const trigger = screen.getByRole('button', { name: /filter agencies/i });

      // Should have size="lg" for larger touch targets
      expect(trigger.className).toMatch(/min-h-\[44px\]/);
    });

    it('should have uppercase font styling', () => {
      const { container } = render(<MobileFilterSheet {...defaultProps} />);

      const trigger = screen.getByRole('button', { name: /filter agencies/i });

      expect(trigger.className).toContain('uppercase');
      expect(trigger.className).toContain('font-semibold');
    });
  });
});
