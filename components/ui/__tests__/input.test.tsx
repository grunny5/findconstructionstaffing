/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../input';

describe('Input Component', () => {
  describe('Basic Rendering', () => {
    it('should render input element', () => {
      render(<Input data-testid="test-input" />);
      expect(screen.getByTestId('test-input')).toBeInTheDocument();
    });

    it('should render with placeholder text', () => {
      render(<Input placeholder="Enter text..." />);
      expect(screen.getByPlaceholderText('Enter text...')).toBeInTheDocument();
    });

    it('should forward ref to input element', () => {
      const ref = { current: null as HTMLInputElement | null };
      render(<Input ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });

    it('should render with default value', () => {
      render(<Input defaultValue="test value" data-testid="test-input" />);
      expect(screen.getByTestId('test-input')).toHaveValue('test value');
    });
  });

  describe('Industrial Design Styling', () => {
    it('should apply industrial base styles', () => {
      render(<Input data-testid="test-input" />);
      const input = screen.getByTestId('test-input');

      // Typography
      expect(input).toHaveClass('font-body');
      expect(input).toHaveClass('text-base');
    });

    it('should apply industrial border styling', () => {
      render(<Input data-testid="test-input" />);
      const input = screen.getByTestId('test-input');

      expect(input).toHaveClass('border-2');
      expect(input).toHaveClass('border-industrial-graphite-300');
      expect(input).toHaveClass('rounded-industrial-sharp');
    });

    it('should apply industrial padding', () => {
      render(<Input data-testid="test-input" />);
      const input = screen.getByTestId('test-input');

      expect(input).toHaveClass('px-4');
      expect(input).toHaveClass('py-3');
    });

    it('should apply industrial background', () => {
      render(<Input data-testid="test-input" />);
      const input = screen.getByTestId('test-input');

      expect(input).toHaveClass('bg-industrial-bg-card');
    });

    it('should apply industrial placeholder styling', () => {
      render(<Input data-testid="test-input" placeholder="Test" />);
      const input = screen.getByTestId('test-input');

      expect(input).toHaveClass('placeholder:text-industrial-graphite-400');
    });

    it('should apply industrial focus styling', () => {
      render(<Input data-testid="test-input" />);
      const input = screen.getByTestId('test-input');

      expect(input).toHaveClass('focus:outline-none');
      expect(input).toHaveClass('focus:border-industrial-orange');
      expect(input).toHaveClass('focus:ring-0');
    });

    it('should apply transition for smooth focus effect', () => {
      render(<Input data-testid="test-input" />);
      const input = screen.getByTestId('test-input');

      expect(input).toHaveClass('transition-colors');
      expect(input).toHaveClass('duration-200');
    });
  });

  describe('Input Types', () => {
    it('should render text input by default', () => {
      render(<Input type="text" data-testid="test-input" />);
      const input = screen.getByTestId('test-input');

      expect(input).toHaveAttribute('type', 'text');
    });

    it('should render email input', () => {
      render(<Input type="email" data-testid="test-input" />);
      const input = screen.getByTestId('test-input');

      expect(input).toHaveAttribute('type', 'email');
    });

    it('should render password input', () => {
      render(<Input type="password" data-testid="test-input" />);
      const input = screen.getByTestId('test-input');

      expect(input).toHaveAttribute('type', 'password');
    });

    it('should render number input', () => {
      render(<Input type="number" data-testid="test-input" />);
      const input = screen.getByTestId('test-input');

      expect(input).toHaveAttribute('type', 'number');
    });

    it('should render search input', () => {
      render(<Input type="search" data-testid="test-input" />);
      const input = screen.getByTestId('test-input');

      expect(input).toHaveAttribute('type', 'search');
    });

    it('should render tel input', () => {
      render(<Input type="tel" data-testid="test-input" />);
      const input = screen.getByTestId('test-input');

      expect(input).toHaveAttribute('type', 'tel');
    });

    it('should render file input with industrial styling', () => {
      render(<Input type="file" data-testid="test-input" />);
      const input = screen.getByTestId('test-input');

      expect(input).toHaveClass('file:border-0');
      expect(input).toHaveClass('file:bg-transparent');
      expect(input).toHaveClass('file:font-semibold');
      expect(input).toHaveClass('file:text-industrial-graphite-600');
    });
  });

  describe('Disabled State', () => {
    it('should apply disabled styles when disabled', () => {
      render(<Input disabled data-testid="test-input" />);
      const input = screen.getByTestId('test-input');

      expect(input).toBeDisabled();
      expect(input).toHaveClass('disabled:cursor-not-allowed');
      expect(input).toHaveClass('disabled:opacity-50');
      expect(input).toHaveClass('disabled:bg-industrial-graphite-100');
    });

    it('should not accept input when disabled', async () => {
      render(<Input disabled data-testid="test-input" />);
      const input = screen.getByTestId('test-input');

      await userEvent.type(input, 'test');

      expect(input).toHaveValue('');
    });
  });

  describe('Interactions', () => {
    it('should handle text input', async () => {
      render(<Input data-testid="test-input" />);
      const input = screen.getByTestId('test-input');

      await userEvent.type(input, 'Hello World');

      expect(input).toHaveValue('Hello World');
    });

    it('should handle onChange event', async () => {
      const handleChange = jest.fn();
      render(<Input onChange={handleChange} data-testid="test-input" />);
      const input = screen.getByTestId('test-input');

      await userEvent.type(input, 'a');

      expect(handleChange).toHaveBeenCalled();
    });

    it('should handle onFocus event', async () => {
      const handleFocus = jest.fn();
      render(<Input onFocus={handleFocus} data-testid="test-input" />);
      const input = screen.getByTestId('test-input');

      await userEvent.click(input);

      expect(handleFocus).toHaveBeenCalled();
    });

    it('should handle onBlur event', async () => {
      const handleBlur = jest.fn();
      render(<Input onBlur={handleBlur} data-testid="test-input" />);
      const input = screen.getByTestId('test-input');

      await userEvent.click(input);
      await userEvent.tab();

      expect(handleBlur).toHaveBeenCalled();
    });
  });

  describe('Custom ClassName', () => {
    it('should merge custom className with default classes', () => {
      render(<Input className="custom-class" data-testid="test-input" />);
      const input = screen.getByTestId('test-input');

      expect(input).toHaveClass('custom-class');
      expect(input).toHaveClass('font-body'); // Still has industrial base class
    });
  });

  describe('HTML Attributes', () => {
    it('should pass through name attribute', () => {
      render(<Input name="email" data-testid="test-input" />);
      const input = screen.getByTestId('test-input');

      expect(input).toHaveAttribute('name', 'email');
    });

    it('should pass through required attribute', () => {
      render(<Input required data-testid="test-input" />);
      const input = screen.getByTestId('test-input');

      expect(input).toBeRequired();
    });

    it('should pass through aria-label attribute', () => {
      render(<Input aria-label="Email address" data-testid="test-input" />);
      const input = screen.getByTestId('test-input');

      expect(input).toHaveAttribute('aria-label', 'Email address');
    });

    it('should pass through maxLength attribute', () => {
      render(<Input maxLength={50} data-testid="test-input" />);
      const input = screen.getByTestId('test-input');

      expect(input).toHaveAttribute('maxLength', '50');
    });

    it('should pass through pattern attribute', () => {
      render(<Input pattern="[A-Za-z]+" data-testid="test-input" />);
      const input = screen.getByTestId('test-input');

      expect(input).toHaveAttribute('pattern', '[A-Za-z]+');
    });

    it('should pass through autoComplete attribute', () => {
      render(<Input autoComplete="email" data-testid="test-input" />);
      const input = screen.getByTestId('test-input');

      expect(input).toHaveAttribute('autoComplete', 'email');
    });

    it('should pass through readOnly attribute', () => {
      render(<Input readOnly data-testid="test-input" />);
      const input = screen.getByTestId('test-input');

      expect(input).toHaveAttribute('readOnly');
    });
  });

  describe('Accessibility', () => {
    it('should be focusable', async () => {
      render(<Input data-testid="test-input" />);
      const input = screen.getByTestId('test-input');

      await userEvent.tab();

      expect(input).toHaveFocus();
    });

    it('should work with associated label', () => {
      render(
        <>
          <label htmlFor="test-input">Email</label>
          <Input id="test-input" />
        </>
      );

      expect(screen.getByLabelText('Email')).toBeInTheDocument();
    });

    it('should support aria-describedby for error messages', () => {
      render(
        <>
          <Input aria-describedby="error-msg" data-testid="test-input" />
          <span id="error-msg">This field is required</span>
        </>
      );

      const input = screen.getByTestId('test-input');
      expect(input).toHaveAttribute('aria-describedby', 'error-msg');
    });

    it('should support aria-invalid for validation', () => {
      render(<Input aria-invalid="true" data-testid="test-input" />);
      const input = screen.getByTestId('test-input');

      expect(input).toHaveAttribute('aria-invalid', 'true');
    });
  });
});
