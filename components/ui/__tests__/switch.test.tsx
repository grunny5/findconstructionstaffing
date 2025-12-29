/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Switch } from '../switch';

describe('Switch Component', () => {
  describe('Basic Rendering', () => {
    it('should render switch element', () => {
      render(<Switch aria-label="Toggle setting" />);
      expect(screen.getByRole('switch')).toBeInTheDocument();
    });

    it('should forward ref to switch element', () => {
      const ref = { current: null as HTMLButtonElement | null };
      render(<Switch ref={ref} aria-label="Toggle setting" />);
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });

    it('should apply custom className to root element', () => {
      render(<Switch className="custom-class" aria-label="Toggle setting" />);
      const switchEl = screen.getByRole('switch');
      expect(switchEl).toHaveClass('custom-class');
    });
  });

  describe('Checked and Unchecked States', () => {
    it('should render in unchecked state by default', () => {
      render(<Switch aria-label="Toggle setting" />);
      const switchEl = screen.getByRole('switch');
      expect(switchEl).toHaveAttribute('data-state', 'unchecked');
      expect(switchEl).toHaveAttribute('aria-checked', 'false');
    });

    it('should render in checked state when defaultChecked is true', () => {
      render(<Switch defaultChecked aria-label="Toggle setting" />);
      const switchEl = screen.getByRole('switch');
      expect(switchEl).toHaveAttribute('data-state', 'checked');
      expect(switchEl).toHaveAttribute('aria-checked', 'true');
    });

    it('should toggle state when clicked', async () => {
      const user = userEvent.setup();
      render(<Switch aria-label="Toggle setting" />);
      const switchEl = screen.getByRole('switch');

      expect(switchEl).toHaveAttribute('data-state', 'unchecked');

      await user.click(switchEl);
      expect(switchEl).toHaveAttribute('data-state', 'checked');

      await user.click(switchEl);
      expect(switchEl).toHaveAttribute('data-state', 'unchecked');
    });

    it('should work as controlled component', async () => {
      const onCheckedChange = jest.fn();
      const { rerender } = render(
        <Switch
          checked={false}
          onCheckedChange={onCheckedChange}
          aria-label="Toggle setting"
        />
      );

      const switchEl = screen.getByRole('switch');
      expect(switchEl).toHaveAttribute('data-state', 'unchecked');

      await userEvent.click(switchEl);
      expect(onCheckedChange).toHaveBeenCalledWith(true);

      rerender(
        <Switch
          checked={true}
          onCheckedChange={onCheckedChange}
          aria-label="Toggle setting"
        />
      );
      expect(switchEl).toHaveAttribute('data-state', 'checked');
    });

    it('should apply industrial-orange background when checked', () => {
      render(<Switch defaultChecked aria-label="Toggle setting" />);
      const switchEl = screen.getByRole('switch');
      expect(switchEl).toHaveClass('data-[state=checked]:bg-industrial-orange');
    });

    it('should apply input background when unchecked', () => {
      render(<Switch aria-label="Toggle setting" />);
      const switchEl = screen.getByRole('switch');
      expect(switchEl).toHaveClass('data-[state=unchecked]:bg-input');
    });
  });

  describe('Disabled State', () => {
    it('should apply disabled styles when disabled', () => {
      render(<Switch disabled aria-label="Toggle setting" />);
      const switchEl = screen.getByRole('switch');

      expect(switchEl).toBeDisabled();
      expect(switchEl).toHaveClass('disabled:cursor-not-allowed');
      expect(switchEl).toHaveClass('disabled:opacity-50');
    });

    it('should not toggle when disabled', async () => {
      const onCheckedChange = jest.fn();
      render(
        <Switch
          disabled
          onCheckedChange={onCheckedChange}
          aria-label="Toggle setting"
        />
      );

      const switchEl = screen.getByRole('switch');
      await userEvent.click(switchEl);

      expect(onCheckedChange).not.toHaveBeenCalled();
      expect(switchEl).toHaveAttribute('data-state', 'unchecked');
    });
  });

  describe('Focus Visible Ring', () => {
    it('should have focus-visible ring classes', () => {
      render(<Switch aria-label="Toggle setting" />);
      const switchEl = screen.getByRole('switch');

      expect(switchEl).toHaveClass('focus-visible:outline-none');
      expect(switchEl).toHaveClass('focus-visible:ring-2');
      expect(switchEl).toHaveClass('focus-visible:ring-industrial-orange-600');
      expect(switchEl).toHaveClass('focus-visible:ring-offset-2');
    });

    it('should be focusable via keyboard', async () => {
      const user = userEvent.setup();
      render(
        <>
          <button>Before</button>
          <Switch aria-label="Toggle setting" />
        </>
      );

      const beforeButton = screen.getByRole('button', { name: 'Before' });
      beforeButton.focus();

      await user.tab();

      const switchEl = screen.getByRole('switch');
      expect(switchEl).toHaveFocus();
    });

    it('should toggle with keyboard when focused', async () => {
      const user = userEvent.setup();
      render(<Switch aria-label="Toggle setting" />);

      const switchEl = screen.getByRole('switch');
      switchEl.focus();

      expect(switchEl).toHaveAttribute('data-state', 'unchecked');

      await user.keyboard(' ');
      expect(switchEl).toHaveAttribute('data-state', 'checked');

      await user.keyboard(' ');
      expect(switchEl).toHaveAttribute('data-state', 'unchecked');
    });
  });

  describe('Industrial Design Styling', () => {
    it('should have base industrial styling classes', () => {
      render(<Switch aria-label="Toggle setting" />);
      const switchEl = screen.getByRole('switch');

      expect(switchEl).toHaveClass('peer');
      expect(switchEl).toHaveClass('inline-flex');
      expect(switchEl).toHaveClass('h-6');
      expect(switchEl).toHaveClass('w-11');
      expect(switchEl).toHaveClass('shrink-0');
      expect(switchEl).toHaveClass('cursor-pointer');
      expect(switchEl).toHaveClass('items-center');
      expect(switchEl).toHaveClass('rounded-full');
      expect(switchEl).toHaveClass('border-2');
      expect(switchEl).toHaveClass('border-transparent');
      expect(switchEl).toHaveClass('transition-colors');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<Switch aria-label="Toggle notifications" />);
      const switchEl = screen.getByRole('switch');

      expect(switchEl).toHaveAttribute('role', 'switch');
      expect(switchEl).toHaveAttribute('aria-checked');
      expect(switchEl).toHaveAttribute('aria-label', 'Toggle notifications');
    });

    it('should support aria-labelledby', () => {
      render(
        <>
          <label id="switch-label">Enable feature</label>
          <Switch aria-labelledby="switch-label" />
        </>
      );

      const switchEl = screen.getByRole('switch');
      expect(switchEl).toHaveAttribute('aria-labelledby', 'switch-label');
    });

    it('should support aria-describedby', () => {
      render(
        <>
          <Switch aria-label="Toggle" aria-describedby="switch-description" />
          <span id="switch-description">Enables advanced mode</span>
        </>
      );

      const switchEl = screen.getByRole('switch');
      expect(switchEl).toHaveAttribute(
        'aria-describedby',
        'switch-description'
      );
    });
  });

  describe('HTML Attributes', () => {
    it('should pass through data attributes', () => {
      render(<Switch data-testid="my-switch" aria-label="Toggle" />);
      expect(screen.getByTestId('my-switch')).toBeInTheDocument();
    });

    it('should pass through id attribute', () => {
      render(<Switch id="my-switch" aria-label="Toggle" />);
      const switchEl = screen.getByRole('switch');
      expect(switchEl).toHaveAttribute('id', 'my-switch');
    });
  });
});
