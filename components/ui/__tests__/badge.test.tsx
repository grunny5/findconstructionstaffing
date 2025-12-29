/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import { Badge } from '../badge';

describe('Badge Component', () => {
  describe('Basic Rendering', () => {
    it('should render badge with text', () => {
      render(<Badge>Test Badge</Badge>);
      expect(screen.getByText('Test Badge')).toBeInTheDocument();
    });

    it('should render as div element', () => {
      render(<Badge data-testid="test-badge">Badge</Badge>);
      const badge = screen.getByTestId('test-badge');
      expect(badge.tagName).toBe('DIV');
    });
  });

  describe('Industrial Design Styling', () => {
    it('should apply industrial base styles', () => {
      render(<Badge data-testid="test-badge">Badge</Badge>);
      const badge = screen.getByTestId('test-badge');

      // Typography
      expect(badge).toHaveClass('font-body');
      expect(badge).toHaveClass('text-xs');
      expect(badge).toHaveClass('font-semibold');
      expect(badge).toHaveClass('uppercase');
      expect(badge).toHaveClass('tracking-wide');
    });

    it('should apply industrial sharp border-radius', () => {
      render(<Badge data-testid="test-badge">Badge</Badge>);
      const badge = screen.getByTestId('test-badge');

      expect(badge).toHaveClass('rounded-industrial-sharp');
    });

    it('should apply industrial padding', () => {
      render(<Badge data-testid="test-badge">Badge</Badge>);
      const badge = screen.getByTestId('test-badge');

      expect(badge).toHaveClass('px-2');
      expect(badge).toHaveClass('py-1');
    });

    it('should apply transition for hover effects', () => {
      render(<Badge data-testid="test-badge">Badge</Badge>);
      const badge = screen.getByTestId('test-badge');

      expect(badge).toHaveClass('transition-colors');
    });

    it('should apply industrial focus ring styling', () => {
      render(<Badge data-testid="test-badge">Badge</Badge>);
      const badge = screen.getByTestId('test-badge');

      expect(badge).toHaveClass('focus:ring-2');
      expect(badge).toHaveClass('focus:ring-industrial-orange');
    });
  });

  describe('Industrial Category Variants', () => {
    it('should apply default (graphite) variant styling', () => {
      render(
        <Badge variant="default" data-testid="test-badge">
          Default
        </Badge>
      );
      const badge = screen.getByTestId('test-badge');

      expect(badge).toHaveClass('bg-industrial-graphite-600');
      expect(badge).toHaveClass('text-white');
      expect(badge).toHaveClass('hover:bg-industrial-graphite-500');
    });

    it('should apply secondary variant styling', () => {
      render(
        <Badge variant="secondary" data-testid="test-badge">
          Secondary
        </Badge>
      );
      const badge = screen.getByTestId('test-badge');

      expect(badge).toHaveClass('bg-industrial-graphite-100');
      expect(badge).toHaveClass('text-industrial-graphite-600');
      expect(badge).toHaveClass('hover:bg-industrial-graphite-200');
    });

    it('should apply orange variant styling for welding category', () => {
      render(
        <Badge variant="orange" data-testid="test-badge">
          Welding
        </Badge>
      );
      const badge = screen.getByTestId('test-badge');

      expect(badge).toHaveClass('bg-industrial-orange');
      expect(badge).toHaveClass('text-white');
      expect(badge).toHaveClass('hover:bg-industrial-orange-500');
    });

    it('should apply navy variant styling for electrical category', () => {
      render(
        <Badge variant="navy" data-testid="test-badge">
          Electrical
        </Badge>
      );
      const badge = screen.getByTestId('test-badge');

      expect(badge).toHaveClass('bg-industrial-navy');
      expect(badge).toHaveClass('text-white');
      expect(badge).toHaveClass('hover:bg-industrial-navy-500');
    });

    it('should apply graphite variant styling for mechanical category', () => {
      render(
        <Badge variant="graphite" data-testid="test-badge">
          Mechanical
        </Badge>
      );
      const badge = screen.getByTestId('test-badge');

      expect(badge).toHaveClass('bg-industrial-graphite-600');
      expect(badge).toHaveClass('text-white');
      expect(badge).toHaveClass('hover:bg-industrial-graphite-500');
    });

    it('should apply outline variant styling', () => {
      render(
        <Badge variant="outline" data-testid="test-badge">
          Outline
        </Badge>
      );
      const badge = screen.getByTestId('test-badge');

      expect(badge).toHaveClass('border-2');
      expect(badge).toHaveClass('border-industrial-graphite-300');
      expect(badge).toHaveClass('bg-transparent');
      expect(badge).toHaveClass('text-industrial-graphite-500');
    });

    it('should apply destructive variant styling', () => {
      render(
        <Badge variant="destructive" data-testid="test-badge">
          Error
        </Badge>
      );
      const badge = screen.getByTestId('test-badge');

      expect(badge).toHaveClass('bg-destructive');
      expect(badge).toHaveClass('text-destructive-foreground');
    });
  });

  describe('Monochromatic Color Verification', () => {
    it('should use only orange color family for orange variant background/text', () => {
      render(
        <Badge variant="orange" data-testid="test-badge">
          Orange
        </Badge>
      );
      const badge = screen.getByTestId('test-badge');

      // Background and hover should use orange family
      expect(badge).toHaveClass('bg-industrial-orange');
      expect(badge).toHaveClass('hover:bg-industrial-orange-500');
      // Text should be white (not another category color)
      expect(badge).toHaveClass('text-white');
    });

    it('should use only navy color family for navy variant background/text', () => {
      render(
        <Badge variant="navy" data-testid="test-badge">
          Navy
        </Badge>
      );
      const badge = screen.getByTestId('test-badge');

      // Background and hover should use navy family
      expect(badge).toHaveClass('bg-industrial-navy');
      expect(badge).toHaveClass('hover:bg-industrial-navy-500');
      // Text should be white (not another category color)
      expect(badge).toHaveClass('text-white');
    });

    it('should use only graphite color family for graphite variant background/text', () => {
      render(
        <Badge variant="graphite" data-testid="test-badge">
          Graphite
        </Badge>
      );
      const badge = screen.getByTestId('test-badge');

      // Background and hover should use graphite family
      expect(badge).toHaveClass('bg-industrial-graphite-600');
      expect(badge).toHaveClass('hover:bg-industrial-graphite-500');
      // Text should be white (not another category color)
      expect(badge).toHaveClass('text-white');
    });
  });

  describe('Custom ClassName', () => {
    it('should merge custom className with default classes', () => {
      render(
        <Badge className="custom-class" data-testid="test-badge">
          Custom
        </Badge>
      );
      const badge = screen.getByTestId('test-badge');

      expect(badge).toHaveClass('custom-class');
      expect(badge).toHaveClass('font-body'); // Still has industrial base class
    });
  });

  describe('HTML Attributes', () => {
    it('should pass through data attributes', () => {
      render(
        <Badge data-testid="my-badge" data-category="welding">
          Badge
        </Badge>
      );

      const badge = screen.getByTestId('my-badge');
      expect(badge).toHaveAttribute('data-category', 'welding');
    });

    it('should pass through aria attributes', () => {
      render(
        <Badge aria-label="Category badge" data-testid="test-badge">
          Badge
        </Badge>
      );
      const badge = screen.getByTestId('test-badge');

      expect(badge).toHaveAttribute('aria-label', 'Category badge');
    });

    it('should pass through id attribute', () => {
      render(
        <Badge id="badge-1" data-testid="test-badge">
          Badge
        </Badge>
      );
      const badge = screen.getByTestId('test-badge');

      expect(badge).toHaveAttribute('id', 'badge-1');
    });

    it('should pass through onClick handler', () => {
      const handleClick = jest.fn();
      render(
        <Badge onClick={handleClick} data-testid="test-badge">
          Clickable
        </Badge>
      );

      const badge = screen.getByTestId('test-badge');
      badge.click();

      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Default Variant', () => {
    it('should use default variant when no variant specified', () => {
      render(<Badge data-testid="test-badge">No Variant</Badge>);
      const badge = screen.getByTestId('test-badge');

      // Default variant should be graphite (same as default)
      expect(badge).toHaveClass('bg-industrial-graphite-600');
      expect(badge).toHaveClass('text-white');
    });
  });
});
