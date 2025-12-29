/**
 * @jest-environment jsdom
 */

/**
 * Form Components Tests - Industrial Design System
 * Feature: 010-industrial-design-system
 * Task: 5.3 - Update All Shadcn Form Components
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Checkbox } from '../checkbox';
import { RadioGroup, RadioGroupItem } from '../radio-group';
import { Label } from '../label';
import { Textarea } from '../textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../select';

describe('Checkbox Component', () => {
  describe('Industrial Design Styling', () => {
    it('should apply industrial border styling', () => {
      render(<Checkbox data-testid="checkbox" />);
      const checkbox = screen.getByTestId('checkbox');

      expect(checkbox).toHaveClass('border-2');
      expect(checkbox).toHaveClass('border-industrial-graphite-300');
      expect(checkbox).toHaveClass('rounded-industrial-sharp');
    });

    it('should apply industrial background', () => {
      render(<Checkbox data-testid="checkbox" />);
      const checkbox = screen.getByTestId('checkbox');

      expect(checkbox).toHaveClass('bg-industrial-bg-card');
    });

    it('should have adequate touch target size', () => {
      render(<Checkbox data-testid="checkbox" />);
      const checkbox = screen.getByTestId('checkbox');

      expect(checkbox).toHaveClass('h-5');
      expect(checkbox).toHaveClass('w-5');
    });

    it('should apply industrial focus styling', () => {
      render(<Checkbox data-testid="checkbox" />);
      const checkbox = screen.getByTestId('checkbox');

      expect(checkbox).toHaveClass('focus-visible:outline-none');
      expect(checkbox).toHaveClass('focus-visible:border-industrial-orange');
    });

    it('should apply transition for smooth effects', () => {
      render(<Checkbox data-testid="checkbox" />);
      const checkbox = screen.getByTestId('checkbox');

      expect(checkbox).toHaveClass('transition-colors');
      expect(checkbox).toHaveClass('duration-200');
    });

    it('should apply checked state styling', () => {
      render(<Checkbox data-testid="checkbox" />);
      const checkbox = screen.getByTestId('checkbox');

      expect(checkbox).toHaveClass('data-[state=checked]:bg-industrial-orange');
      expect(checkbox).toHaveClass(
        'data-[state=checked]:border-industrial-orange'
      );
      expect(checkbox).toHaveClass('data-[state=checked]:text-white');
    });

    it('should apply disabled state styling', () => {
      render(<Checkbox data-testid="checkbox" disabled />);
      const checkbox = screen.getByTestId('checkbox');

      expect(checkbox).toHaveClass('disabled:cursor-not-allowed');
      expect(checkbox).toHaveClass('disabled:opacity-50');
      expect(checkbox).toHaveClass('disabled:bg-industrial-graphite-100');
    });
  });

  describe('Interactions', () => {
    it('should toggle on click', async () => {
      const user = userEvent.setup();
      render(<Checkbox data-testid="checkbox" />);
      const checkbox = screen.getByTestId('checkbox');

      await user.click(checkbox);
      expect(checkbox).toHaveAttribute('data-state', 'checked');

      await user.click(checkbox);
      expect(checkbox).toHaveAttribute('data-state', 'unchecked');
    });
  });
});

describe('RadioGroup Component', () => {
  describe('Industrial Design Styling', () => {
    it('should apply industrial border styling to radio items', () => {
      render(
        <RadioGroup>
          <RadioGroupItem value="option1" data-testid="radio" />
        </RadioGroup>
      );
      const radio = screen.getByTestId('radio');

      expect(radio).toHaveClass('border-2');
      expect(radio).toHaveClass('border-industrial-graphite-300');
      expect(radio).toHaveClass('rounded-full');
    });

    it('should apply industrial background', () => {
      render(
        <RadioGroup>
          <RadioGroupItem value="option1" data-testid="radio" />
        </RadioGroup>
      );
      const radio = screen.getByTestId('radio');

      expect(radio).toHaveClass('bg-industrial-bg-card');
    });

    it('should have adequate touch target size', () => {
      render(
        <RadioGroup>
          <RadioGroupItem value="option1" data-testid="radio" />
        </RadioGroup>
      );
      const radio = screen.getByTestId('radio');

      expect(radio).toHaveClass('h-5');
      expect(radio).toHaveClass('w-5');
    });

    it('should apply industrial focus styling', () => {
      render(
        <RadioGroup>
          <RadioGroupItem value="option1" data-testid="radio" />
        </RadioGroup>
      );
      const radio = screen.getByTestId('radio');

      expect(radio).toHaveClass('focus-visible:border-industrial-orange');
    });

    it('should apply checked state styling', () => {
      render(
        <RadioGroup>
          <RadioGroupItem value="option1" data-testid="radio" />
        </RadioGroup>
      );
      const radio = screen.getByTestId('radio');

      expect(radio).toHaveClass(
        'data-[state=checked]:border-industrial-orange'
      );
    });
  });
});

describe('Label Component', () => {
  describe('Industrial Design Styling', () => {
    it('should apply industrial font styling', () => {
      render(<Label data-testid="label">Test Label</Label>);
      const label = screen.getByTestId('label');

      expect(label).toHaveClass('font-body');
      expect(label).toHaveClass('font-medium');
    });

    it('should apply industrial color', () => {
      render(<Label data-testid="label">Test Label</Label>);
      const label = screen.getByTestId('label');

      expect(label).toHaveClass('text-industrial-graphite-600');
    });

    it('should apply industrial variant styling', () => {
      render(
        <Label variant="industrial" data-testid="label">
          Test Label
        </Label>
      );
      const label = screen.getByTestId('label');

      expect(label).toHaveClass('text-xs');
      expect(label).toHaveClass('uppercase');
      expect(label).toHaveClass('font-semibold');
      expect(label).toHaveClass('text-industrial-graphite-400');
      expect(label).toHaveClass('tracking-wide');
    });
  });

  describe('Basic Rendering', () => {
    it('should render label text', () => {
      render(<Label>Test Label</Label>);
      expect(screen.getByText('Test Label')).toBeInTheDocument();
    });

    it('should work with htmlFor attribute', () => {
      render(
        <>
          <Label htmlFor="test-input">Test Label</Label>
          <input id="test-input" />
        </>
      );
      expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
    });
  });
});

describe('Textarea Component', () => {
  describe('Industrial Design Styling', () => {
    it('should apply industrial typography', () => {
      render(<Textarea data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');

      expect(textarea).toHaveClass('font-body');
      expect(textarea).toHaveClass('text-base');
    });

    it('should apply industrial border styling', () => {
      render(<Textarea data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');

      expect(textarea).toHaveClass('border-2');
      expect(textarea).toHaveClass('border-industrial-graphite-300');
      expect(textarea).toHaveClass('rounded-industrial-sharp');
    });

    it('should apply industrial padding', () => {
      render(<Textarea data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');

      expect(textarea).toHaveClass('px-4');
      expect(textarea).toHaveClass('py-3');
    });

    it('should apply industrial background', () => {
      render(<Textarea data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');

      expect(textarea).toHaveClass('bg-industrial-bg-card');
    });

    it('should apply industrial placeholder styling', () => {
      render(<Textarea data-testid="textarea" placeholder="Test" />);
      const textarea = screen.getByTestId('textarea');

      expect(textarea).toHaveClass('placeholder:text-industrial-graphite-400');
    });

    it('should apply industrial focus styling', () => {
      render(<Textarea data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');

      expect(textarea).toHaveClass('focus:outline-none');
      expect(textarea).toHaveClass('focus:border-industrial-orange');
      expect(textarea).toHaveClass('focus:ring-0');
    });

    it('should be resizable vertically', () => {
      render(<Textarea data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');

      expect(textarea).toHaveClass('resize-y');
    });

    it('should have appropriate min-height', () => {
      render(<Textarea data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');

      expect(textarea).toHaveClass('min-h-[120px]');
    });
  });

  describe('Interactions', () => {
    it('should handle text input', async () => {
      const user = userEvent.setup();
      render(<Textarea data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');

      await user.type(textarea, 'Hello World');

      expect(textarea).toHaveValue('Hello World');
    });
  });
});

describe('Select Component', () => {
  describe('Industrial Design Styling', () => {
    it('should apply industrial border styling to trigger', () => {
      render(
        <Select>
          <SelectTrigger data-testid="select-trigger">
            <SelectValue placeholder="Select option" />
          </SelectTrigger>
        </Select>
      );
      const trigger = screen.getByTestId('select-trigger');

      expect(trigger).toHaveClass('border-2');
      expect(trigger).toHaveClass('border-industrial-graphite-300');
      expect(trigger).toHaveClass('rounded-industrial-sharp');
    });

    it('should apply industrial typography', () => {
      render(
        <Select>
          <SelectTrigger data-testid="select-trigger">
            <SelectValue placeholder="Select option" />
          </SelectTrigger>
        </Select>
      );
      const trigger = screen.getByTestId('select-trigger');

      expect(trigger).toHaveClass('font-body');
      expect(trigger).toHaveClass('text-base');
    });

    it('should apply industrial padding', () => {
      render(
        <Select>
          <SelectTrigger data-testid="select-trigger">
            <SelectValue placeholder="Select option" />
          </SelectTrigger>
        </Select>
      );
      const trigger = screen.getByTestId('select-trigger');

      expect(trigger).toHaveClass('px-4');
      expect(trigger).toHaveClass('py-3');
    });

    it('should apply industrial background', () => {
      render(
        <Select>
          <SelectTrigger data-testid="select-trigger">
            <SelectValue placeholder="Select option" />
          </SelectTrigger>
        </Select>
      );
      const trigger = screen.getByTestId('select-trigger');

      expect(trigger).toHaveClass('bg-industrial-bg-card');
    });

    it('should apply industrial focus styling', () => {
      render(
        <Select>
          <SelectTrigger data-testid="select-trigger">
            <SelectValue placeholder="Select option" />
          </SelectTrigger>
        </Select>
      );
      const trigger = screen.getByTestId('select-trigger');

      expect(trigger).toHaveClass('focus:outline-none');
      expect(trigger).toHaveClass('focus:border-industrial-orange');
      expect(trigger).toHaveClass('focus:ring-0');
    });

    it('should apply transition for smooth effects', () => {
      render(
        <Select>
          <SelectTrigger data-testid="select-trigger">
            <SelectValue placeholder="Select option" />
          </SelectTrigger>
        </Select>
      );
      const trigger = screen.getByTestId('select-trigger');

      expect(trigger).toHaveClass('transition-colors');
      expect(trigger).toHaveClass('duration-200');
    });
  });
});
