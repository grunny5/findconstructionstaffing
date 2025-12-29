/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../button';

describe('Button Component', () => {
  describe('Basic Rendering', () => {
    it('should render button with text', () => {
      render(<Button>Click me</Button>);
      expect(
        screen.getByRole('button', { name: 'Click me' })
      ).toBeInTheDocument();
    });

    it('should render as child component when asChild is true', () => {
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      );
      expect(
        screen.getByRole('link', { name: 'Link Button' })
      ).toBeInTheDocument();
    });

    it('should forward ref to button element', () => {
      const ref = { current: null as HTMLButtonElement | null };
      render(<Button ref={ref}>Test</Button>);
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });
  });

  describe('Industrial Design Styling', () => {
    it('should apply industrial base styles', () => {
      render(<Button>Industrial Button</Button>);
      const button = screen.getByRole('button');

      // Industrial base styles
      expect(button).toHaveClass('font-body');
      expect(button).toHaveClass('text-sm');
      expect(button).toHaveClass('font-semibold');
      expect(button).toHaveClass('uppercase');
      expect(button).toHaveClass('tracking-wide');
      expect(button).toHaveClass('rounded-industrial-sharp');
      expect(button).toHaveClass('transition-all');
      expect(button).toHaveClass('duration-200');
    });

    it('should apply industrial primary (default) variant styling', () => {
      render(<Button variant="default">Primary Button</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('bg-industrial-orange');
      expect(button).toHaveClass('text-white');
      expect(button).toHaveClass('hover:bg-industrial-orange-500');
    });

    it('should apply industrial outline variant styling', () => {
      render(<Button variant="outline">Outline Button</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('border-2');
      expect(button).toHaveClass('border-industrial-graphite-400');
      expect(button).toHaveClass('bg-transparent');
      expect(button).toHaveClass('text-industrial-graphite-500');
      expect(button).toHaveClass('hover:border-industrial-graphite-600');
      expect(button).toHaveClass('hover:text-industrial-graphite-600');
    });

    it('should apply industrial secondary variant styling', () => {
      render(<Button variant="secondary">Secondary Button</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('bg-industrial-graphite-100');
      expect(button).toHaveClass('text-industrial-graphite-600');
      expect(button).toHaveClass('hover:bg-industrial-graphite-200');
    });

    it('should apply industrial ghost variant styling', () => {
      render(<Button variant="ghost">Ghost Button</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('hover:bg-industrial-graphite-100');
      expect(button).toHaveClass('hover:text-industrial-graphite-600');
    });

    it('should apply industrial link variant styling', () => {
      render(<Button variant="link">Link Button</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('text-industrial-orange');
      expect(button).toHaveClass('hover:underline');
      expect(button).toHaveClass('hover:text-industrial-orange-500');
    });

    it('should apply industrial focus ring styling', () => {
      render(<Button>Focus Test</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('focus-visible:ring-2');
      expect(button).toHaveClass('focus-visible:ring-industrial-orange');
    });
  });

  describe('Size Variants', () => {
    it('should apply default size styling', () => {
      render(<Button size="default">Default Size</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('h-10');
      expect(button).toHaveClass('px-8');
      expect(button).toHaveClass('py-4');
    });

    it('should apply small size styling', () => {
      render(<Button size="sm">Small Button</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('h-9');
      expect(button).toHaveClass('px-3');
      expect(button).toHaveClass('py-2');
      expect(button).toHaveClass('text-xs');
    });

    it('should apply large size styling', () => {
      render(<Button size="lg">Large Button</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('h-11');
      expect(button).toHaveClass('px-8');
      expect(button).toHaveClass('py-4');
    });

    it('should apply icon size styling', () => {
      render(<Button size="icon">Icon</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('h-10');
      expect(button).toHaveClass('w-10');
    });
  });

  describe('Disabled State', () => {
    it('should apply disabled styles when disabled', () => {
      render(<Button disabled>Disabled Button</Button>);
      const button = screen.getByRole('button');

      expect(button).toBeDisabled();
      expect(button).toHaveClass('disabled:pointer-events-none');
      expect(button).toHaveClass('disabled:opacity-50');
    });

    it('should not be clickable when disabled', async () => {
      const handleClick = jest.fn();
      render(
        <Button disabled onClick={handleClick}>
          Disabled
        </Button>
      );

      const button = screen.getByRole('button');
      await userEvent.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Destructive Variant', () => {
    it('should apply destructive variant styling', () => {
      render(<Button variant="destructive">Delete</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('bg-destructive');
      expect(button).toHaveClass('text-destructive-foreground');
    });
  });

  describe('Interactions', () => {
    it('should call onClick handler when clicked', async () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Click Me</Button>);

      await userEvent.click(screen.getByRole('button'));

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should be keyboard accessible', async () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Press Enter</Button>);

      const button = screen.getByRole('button');
      button.focus();
      await userEvent.keyboard('{Enter}');

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should respond to Space key', async () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Press Space</Button>);

      const button = screen.getByRole('button');
      button.focus();
      await userEvent.keyboard(' ');

      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Custom ClassName', () => {
    it('should merge custom className with default classes', () => {
      render(<Button className="custom-class">Custom</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('custom-class');
      expect(button).toHaveClass('font-body'); // Still has industrial base class
    });
  });

  describe('HTML Attributes', () => {
    it('should pass through type attribute', () => {
      render(<Button type="submit">Submit</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveAttribute('type', 'submit');
    });

    it('should pass through aria attributes', () => {
      render(<Button aria-label="Close dialog">X</Button>);
      const button = screen.getByRole('button', { name: 'Close dialog' });

      expect(button).toBeInTheDocument();
    });

    it('should pass through data attributes', () => {
      render(<Button data-testid="my-button">Test</Button>);

      expect(screen.getByTestId('my-button')).toBeInTheDocument();
    });
  });
});
