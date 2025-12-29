/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toggle } from '../toggle';

describe('Toggle Component', () => {
  describe('Basic Rendering', () => {
    it('should render toggle button', () => {
      render(<Toggle aria-label="Toggle bold">B</Toggle>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should forward ref to toggle element', () => {
      const ref = { current: null as HTMLButtonElement | null };
      render(
        <Toggle ref={ref} aria-label="Toggle">
          B
        </Toggle>
      );
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });

    it('should apply custom className to root element', () => {
      render(
        <Toggle className="custom-class" aria-label="Toggle">
          B
        </Toggle>
      );
      const toggle = screen.getByRole('button');
      expect(toggle).toHaveClass('custom-class');
    });
  });

  describe('On and Off States', () => {
    it('should render in off state by default', () => {
      render(<Toggle aria-label="Toggle bold">B</Toggle>);
      const toggle = screen.getByRole('button');
      expect(toggle).toHaveAttribute('data-state', 'off');
      expect(toggle).toHaveAttribute('aria-pressed', 'false');
    });

    it('should render in on state when defaultPressed is true', () => {
      render(
        <Toggle defaultPressed aria-label="Toggle bold">
          B
        </Toggle>
      );
      const toggle = screen.getByRole('button');
      expect(toggle).toHaveAttribute('data-state', 'on');
      expect(toggle).toHaveAttribute('aria-pressed', 'true');
    });

    it('should toggle state when clicked', async () => {
      const user = userEvent.setup();
      render(<Toggle aria-label="Toggle bold">B</Toggle>);
      const toggle = screen.getByRole('button');

      expect(toggle).toHaveAttribute('data-state', 'off');

      await user.click(toggle);
      expect(toggle).toHaveAttribute('data-state', 'on');

      await user.click(toggle);
      expect(toggle).toHaveAttribute('data-state', 'off');
    });

    it('should work as controlled component', async () => {
      const onPressedChange = jest.fn();
      const { rerender } = render(
        <Toggle
          pressed={false}
          onPressedChange={onPressedChange}
          aria-label="Toggle"
        >
          B
        </Toggle>
      );

      const toggle = screen.getByRole('button');
      expect(toggle).toHaveAttribute('data-state', 'off');

      await userEvent.click(toggle);
      expect(onPressedChange).toHaveBeenCalledWith(true);

      rerender(
        <Toggle
          pressed={true}
          onPressedChange={onPressedChange}
          aria-label="Toggle"
        >
          B
        </Toggle>
      );
      expect(toggle).toHaveAttribute('data-state', 'on');
    });

    it('should apply industrial-orange background when on', () => {
      render(
        <Toggle defaultPressed aria-label="Toggle bold">
          B
        </Toggle>
      );
      const toggle = screen.getByRole('button');
      expect(toggle).toHaveClass('data-[state=on]:bg-industrial-orange');
    });

    it('should apply white text when on', () => {
      render(
        <Toggle defaultPressed aria-label="Toggle bold">
          B
        </Toggle>
      );
      const toggle = screen.getByRole('button');
      expect(toggle).toHaveClass('data-[state=on]:text-white');
    });

    it('should have transparent background when off (default variant)', () => {
      render(<Toggle aria-label="Toggle bold">B</Toggle>);
      const toggle = screen.getByRole('button');
      expect(toggle).toHaveClass('bg-transparent');
    });
  });

  describe('Variant Styles', () => {
    it('should apply default variant styling', () => {
      render(
        <Toggle variant="default" aria-label="Toggle">
          B
        </Toggle>
      );
      const toggle = screen.getByRole('button');
      expect(toggle).toHaveClass('bg-transparent');
    });

    it('should apply outline variant styling', () => {
      render(
        <Toggle variant="outline" aria-label="Toggle">
          B
        </Toggle>
      );
      const toggle = screen.getByRole('button');
      expect(toggle).toHaveClass('border');
      expect(toggle).toHaveClass('border-input');
      expect(toggle).toHaveClass('bg-transparent');
      expect(toggle).toHaveClass('hover:bg-accent');
      expect(toggle).toHaveClass('hover:text-accent-foreground');
    });
  });

  describe('Size Variants', () => {
    it('should apply default size styling', () => {
      render(
        <Toggle size="default" aria-label="Toggle">
          B
        </Toggle>
      );
      const toggle = screen.getByRole('button');
      expect(toggle).toHaveClass('h-10');
      expect(toggle).toHaveClass('px-3');
    });

    it('should apply small size styling', () => {
      render(
        <Toggle size="sm" aria-label="Toggle">
          B
        </Toggle>
      );
      const toggle = screen.getByRole('button');
      expect(toggle).toHaveClass('h-9');
      expect(toggle).toHaveClass('px-2.5');
    });

    it('should apply large size styling', () => {
      render(
        <Toggle size="lg" aria-label="Toggle">
          B
        </Toggle>
      );
      const toggle = screen.getByRole('button');
      expect(toggle).toHaveClass('h-11');
      expect(toggle).toHaveClass('px-5');
    });
  });

  describe('Disabled State', () => {
    it('should apply disabled styles when disabled', () => {
      render(
        <Toggle disabled aria-label="Toggle">
          B
        </Toggle>
      );
      const toggle = screen.getByRole('button');

      expect(toggle).toBeDisabled();
      expect(toggle).toHaveClass('disabled:pointer-events-none');
      expect(toggle).toHaveClass('disabled:opacity-50');
    });

    it('should not toggle when disabled', async () => {
      const onPressedChange = jest.fn();
      render(
        <Toggle disabled onPressedChange={onPressedChange} aria-label="Toggle">
          B
        </Toggle>
      );

      const toggle = screen.getByRole('button');
      await userEvent.click(toggle);

      expect(onPressedChange).not.toHaveBeenCalled();
      expect(toggle).toHaveAttribute('data-state', 'off');
    });
  });

  describe('Focus Visible Ring', () => {
    it('should have focus-visible ring classes', () => {
      render(<Toggle aria-label="Toggle">B</Toggle>);
      const toggle = screen.getByRole('button');

      expect(toggle).toHaveClass('focus-visible:outline-none');
      expect(toggle).toHaveClass('focus-visible:ring-2');
      expect(toggle).toHaveClass('focus-visible:ring-industrial-orange-600');
      expect(toggle).toHaveClass('focus-visible:ring-offset-2');
    });

    it('should be focusable via keyboard', async () => {
      const user = userEvent.setup();
      render(
        <>
          <button>Before</button>
          <Toggle aria-label="Toggle">B</Toggle>
        </>
      );

      const beforeButton = screen.getByRole('button', { name: 'Before' });
      beforeButton.focus();

      await user.tab();

      const toggle = screen.getByRole('button', { name: 'Toggle' });
      expect(toggle).toHaveFocus();
    });

    it('should toggle with keyboard when focused', async () => {
      const user = userEvent.setup();
      render(<Toggle aria-label="Toggle">B</Toggle>);

      const toggle = screen.getByRole('button');
      toggle.focus();

      expect(toggle).toHaveAttribute('data-state', 'off');

      await user.keyboard(' ');
      expect(toggle).toHaveAttribute('data-state', 'on');

      await user.keyboard('{Enter}');
      expect(toggle).toHaveAttribute('data-state', 'off');
    });
  });

  describe('Industrial Design Styling', () => {
    it('should have base industrial styling classes', () => {
      render(<Toggle aria-label="Toggle">B</Toggle>);
      const toggle = screen.getByRole('button');

      expect(toggle).toHaveClass('inline-flex');
      expect(toggle).toHaveClass('items-center');
      expect(toggle).toHaveClass('justify-center');
      expect(toggle).toHaveClass('rounded-md');
      expect(toggle).toHaveClass('text-sm');
      expect(toggle).toHaveClass('font-medium');
      expect(toggle).toHaveClass('ring-offset-background');
      expect(toggle).toHaveClass('transition-colors');
    });

    it('should have hover styles', () => {
      render(<Toggle aria-label="Toggle">B</Toggle>);
      const toggle = screen.getByRole('button');

      expect(toggle).toHaveClass('hover:bg-muted');
      expect(toggle).toHaveClass('hover:text-muted-foreground');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<Toggle aria-label="Toggle bold formatting">B</Toggle>);
      const toggle = screen.getByRole('button');

      expect(toggle).toHaveAttribute('aria-pressed');
      expect(toggle).toHaveAttribute('aria-label', 'Toggle bold formatting');
    });

    it('should update aria-pressed when state changes', async () => {
      const user = userEvent.setup();
      render(<Toggle aria-label="Toggle">B</Toggle>);
      const toggle = screen.getByRole('button');

      expect(toggle).toHaveAttribute('aria-pressed', 'false');

      await user.click(toggle);
      expect(toggle).toHaveAttribute('aria-pressed', 'true');
    });

    it('should support aria-describedby', () => {
      render(
        <>
          <Toggle aria-label="Toggle" aria-describedby="toggle-description">
            B
          </Toggle>
          <span id="toggle-description">Toggle bold text</span>
        </>
      );

      const toggle = screen.getByRole('button');
      expect(toggle).toHaveAttribute('aria-describedby', 'toggle-description');
    });
  });

  describe('HTML Attributes', () => {
    it('should pass through data attributes', () => {
      render(
        <Toggle data-testid="my-toggle" aria-label="Toggle">
          B
        </Toggle>
      );
      expect(screen.getByTestId('my-toggle')).toBeInTheDocument();
    });

    it('should pass through id attribute', () => {
      render(
        <Toggle id="my-toggle" aria-label="Toggle">
          B
        </Toggle>
      );
      const toggle = screen.getByRole('button');
      expect(toggle).toHaveAttribute('id', 'my-toggle');
    });
  });

  describe('Children Rendering', () => {
    it('should render text children', () => {
      render(<Toggle aria-label="Bold">Bold</Toggle>);
      expect(screen.getByText('Bold')).toBeInTheDocument();
    });

    it('should render element children', () => {
      render(
        <Toggle aria-label="Bold">
          <span data-testid="icon">B</span>
        </Toggle>
      );
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });
  });
});
