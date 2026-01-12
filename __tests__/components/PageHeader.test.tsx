/**
 * Tests for PageHeader Component
 *
 * Validates accessibility features, focus management, and WCAG compliance.
 */

import { render, screen } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

describe('PageHeader', () => {
  const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

  beforeEach(() => {
    mockUsePathname.mockReturnValue('/test-page');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the title', () => {
      render(<PageHeader title="Test Page" />);

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Test Page');
    });

    it('should render the subtitle when provided', () => {
      render(<PageHeader title="Test Page" subtitle="Test subtitle" />);

      expect(screen.getByText('Test subtitle')).toBeInTheDocument();
    });

    it('should not render subtitle when not provided', () => {
      render(<PageHeader title="Test Page" />);

      expect(screen.queryByText(/subtitle/i)).not.toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <PageHeader title="Test Page" className="custom-class" />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('custom-class');
    });
  });

  describe('Accessibility', () => {
    it('should have tabIndex={-1} for programmatic focus', () => {
      render(<PageHeader title="Test Page" />);

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveAttribute('tabIndex', '-1');
    });

    it('should have outline-none class for custom focus styling', () => {
      render(<PageHeader title="Test Page" />);

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveClass('outline-none');
      expect(heading).toHaveClass('focus:outline-none');
    });

    it('should focus the heading on mount', () => {
      render(<PageHeader title="Test Page" />);

      const heading = screen.getByRole('heading', { level: 1 });
      expect(document.activeElement).toBe(heading);
    });

    it('should focus the heading when pathname changes', () => {
      const { rerender } = render(<PageHeader title="Test Page" />);

      const heading = screen.getByRole('heading', { level: 1 });
      expect(document.activeElement).toBe(heading);

      // Simulate navigation by changing pathname
      mockUsePathname.mockReturnValue('/new-page');

      // Blur the heading
      heading.blur();
      expect(document.activeElement).not.toBe(heading);

      // Rerender to trigger useEffect
      rerender(<PageHeader title="Test Page" />);

      expect(document.activeElement).toBe(heading);
    });
  });

  describe('Styling', () => {
    it('should have industrial design system classes', () => {
      render(<PageHeader title="Test Page" />);

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveClass('font-display');
      expect(heading).toHaveClass('uppercase');
      expect(heading).toHaveClass('tracking-wide');
      expect(heading).toHaveClass('text-industrial-graphite-600');
    });

    it('should have responsive text sizing', () => {
      render(<PageHeader title="Test Page" />);

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveClass('text-4xl');
      expect(heading).toHaveClass('sm:text-5xl');
    });

    it('should style subtitle with industrial design', () => {
      render(<PageHeader title="Test Page" subtitle="Subtitle text" />);

      const subtitle = screen.getByText('Subtitle text');
      expect(subtitle).toHaveClass('font-body');
      expect(subtitle).toHaveClass('text-lg');
      expect(subtitle).toHaveClass('text-industrial-graphite-500');
    });
  });

  describe('WCAG 2.1 AA Compliance', () => {
    it('should use semantic heading element', () => {
      render(<PageHeader title="Test Page" />);

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading.tagName).toBe('H1');
    });

    it('should not be included in tab order (tabIndex=-1)', () => {
      render(<PageHeader title="Test Page" />);

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveAttribute('tabIndex', '-1');
    });

    it('should announce title to screen readers on navigation', () => {
      render(<PageHeader title="Resources Page" />);

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveAccessibleName('Resources Page');
    });
  });
});
