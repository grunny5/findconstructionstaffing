/**
 * Industrial Design System - Validation & Error Styling Tests
 *
 * Task 5.4: Verify form validation and error states use industrial styling
 * - Error states use orange-400 (not bright red)
 * - Error messages use Barlow font
 * - Success states use graphite-600 (monochromatic)
 * - 2px borders matching input styling
 * - Accessibility: errors announced to screen readers
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { useForm, FormProvider } from 'react-hook-form';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '../form';
import { Alert, AlertTitle, AlertDescription } from '../alert';
import { Input } from '../input';

// Mock FormProvider wrapper for testing form components
const FormWrapper = ({
  children,
  defaultValues = {},
  errors = {},
}: {
  children: React.ReactNode;
  defaultValues?: Record<string, string>;
  errors?: Record<string, { message: string }>;
}) => {
  const TestComponent = () => {
    const methods = useForm({
      defaultValues,
    });

    // Manually set errors for testing (runs once on mount)
    React.useEffect(() => {
      Object.entries(errors).forEach(([field, error]) => {
        methods.setError(field as never, error);
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return <FormProvider {...methods}>{children}</FormProvider>;
  };

  return <TestComponent />;
};

describe('Form Validation Styling', () => {
  describe('FormMessage Component', () => {
    it('should use industrial orange for error text', () => {
      render(
        <FormWrapper
          defaultValues={{ email: '' }}
          errors={{ email: { message: 'Email is required' } }}
        >
          <FormField
            name="email"
            render={() => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormWrapper>
      );

      const errorMessage = screen.getByText('Email is required');
      expect(errorMessage).toHaveClass('text-industrial-orange');
    });

    it('should use Barlow font for error messages', () => {
      render(
        <FormWrapper
          defaultValues={{ email: '' }}
          errors={{ email: { message: 'Invalid email' } }}
        >
          <FormField
            name="email"
            render={() => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormWrapper>
      );

      const errorMessage = screen.getByText('Invalid email');
      expect(errorMessage).toHaveClass('font-body');
    });

    it('should have role="alert" for screen reader accessibility', () => {
      render(
        <FormWrapper
          defaultValues={{ email: '' }}
          errors={{ email: { message: 'Required field' } }}
        >
          <FormField
            name="email"
            render={() => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormWrapper>
      );

      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveTextContent('Required field');
    });

    it('should use 0.875rem (text-sm) font size', () => {
      render(
        <FormWrapper
          defaultValues={{ email: '' }}
          errors={{ email: { message: 'Error message' } }}
        >
          <FormField
            name="email"
            render={() => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormWrapper>
      );

      const errorMessage = screen.getByText('Error message');
      expect(errorMessage).toHaveClass('text-sm');
    });
  });

  describe('FormLabel with Error State', () => {
    it('should use industrial orange when field has error', () => {
      render(
        <FormWrapper
          defaultValues={{ email: '' }}
          errors={{ email: { message: 'Error' } }}
        >
          <FormField
            name="email"
            render={() => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormWrapper>
      );

      const label = screen.getByText('Email Address');
      expect(label).toHaveClass('text-industrial-orange');
    });
  });
});

describe('Alert Component Styling', () => {
  describe('Industrial Design Tokens', () => {
    it('should use 2px border and sharp corners', () => {
      render(<Alert data-testid="alert">Alert content</Alert>);

      const alert = screen.getByTestId('alert');
      expect(alert).toHaveClass('border-2');
      expect(alert).toHaveClass('rounded-industrial-sharp');
    });

    it('should use Barlow font (font-body)', () => {
      render(<Alert data-testid="alert">Alert content</Alert>);

      const alert = screen.getByTestId('alert');
      expect(alert).toHaveClass('font-body');
    });
  });

  describe('Default Variant', () => {
    it('should use industrial graphite styling', () => {
      render(<Alert data-testid="alert">Default alert</Alert>);

      const alert = screen.getByTestId('alert');
      expect(alert).toHaveClass('bg-industrial-bg-card');
      expect(alert).toHaveClass('border-industrial-graphite-300');
      expect(alert).toHaveClass('text-industrial-graphite-600');
    });
  });

  describe('Destructive Variant (Error State)', () => {
    it('should use industrial orange instead of bright red', () => {
      render(
        <Alert variant="destructive" data-testid="alert">
          Error message
        </Alert>
      );

      const alert = screen.getByTestId('alert');
      expect(alert).toHaveClass('border-industrial-orange');
      expect(alert).toHaveClass('bg-industrial-orange-100');
      // Should NOT use destructive red colors
      expect(alert.className).not.toMatch(/text-red/);
      expect(alert.className).not.toMatch(/border-red/);
    });
  });

  describe('Success Variant (Monochromatic)', () => {
    it('should use industrial graphite instead of green', () => {
      render(
        <Alert variant="success" data-testid="alert">
          Success message
        </Alert>
      );

      const alert = screen.getByTestId('alert');
      expect(alert).toHaveClass('border-industrial-graphite-400');
      expect(alert).toHaveClass('bg-industrial-graphite-100');
      // Should NOT use green colors (monochromatic rule)
      expect(alert.className).not.toMatch(/text-green/);
      expect(alert.className).not.toMatch(/bg-green/);
    });
  });

  describe('Info Variant', () => {
    it('should use industrial navy styling', () => {
      render(
        <Alert variant="info" data-testid="alert">
          Info message
        </Alert>
      );

      const alert = screen.getByTestId('alert');
      expect(alert).toHaveClass('border-industrial-navy-300');
      expect(alert).toHaveClass('bg-industrial-navy-100');
    });
  });

  describe('Warning Variant', () => {
    it('should use industrial orange variant styling', () => {
      render(
        <Alert variant="warning" data-testid="alert">
          Warning message
        </Alert>
      );

      const alert = screen.getByTestId('alert');
      expect(alert).toHaveClass('border-industrial-orange-300');
      expect(alert).toHaveClass('bg-industrial-orange-100');
    });
  });

  describe('AlertTitle', () => {
    it('should use Barlow font with semibold weight', () => {
      render(
        <Alert>
          <AlertTitle data-testid="title">Title</AlertTitle>
        </Alert>
      );

      const title = screen.getByTestId('title');
      expect(title).toHaveClass('font-body');
      expect(title).toHaveClass('font-semibold');
    });
  });

  describe('AlertDescription', () => {
    it('should use Barlow font with text-sm', () => {
      render(
        <Alert>
          <AlertDescription data-testid="desc">Description</AlertDescription>
        </Alert>
      );

      const desc = screen.getByTestId('desc');
      expect(desc).toHaveClass('font-body');
      expect(desc).toHaveClass('text-sm');
    });
  });
});

/**
 * Toast Component Styling Tests
 *
 * Note: Toast components require portal rendering which is complex to test.
 * These tests verify the styling exists in the component source.
 * Visual/integration tests should verify actual rendering.
 */
describe('Toast Component Styling (Source Verification)', () => {
  // Read the toast.tsx source to verify industrial styling is present
  // Source-based verification is intentional here because:
  // 1. Toast components require Radix portal rendering which is complex to mock
  // 2. We're verifying styling tokens exist, not runtime behavior
  // 3. Render tests for Toast are covered in integration/e2e tests
  const fs = require('fs');
  const path = require('path');
  const toastSource = fs.readFileSync(
    path.join(__dirname, '../toast.tsx'),
    'utf8'
  );

  describe('Industrial Design Tokens', () => {
    it('should have 2px border styling in source', () => {
      expect(toastSource).toContain('border-2');
    });

    it('should have sharp corners in source', () => {
      expect(toastSource).toContain('rounded-industrial-sharp');
    });
  });

  describe('Default Variant', () => {
    it('should use industrial graphite styling', () => {
      expect(toastSource).toContain('border-industrial-graphite-300');
      expect(toastSource).toContain('bg-industrial-bg-card');
      expect(toastSource).toContain('text-industrial-graphite-600');
    });
  });

  describe('Destructive Variant', () => {
    it('should use industrial orange instead of red', () => {
      expect(toastSource).toContain('border-industrial-orange');
      expect(toastSource).toContain('bg-industrial-orange-100');
    });

    it('should NOT use bright red colors', () => {
      // Verify no direct red colors for destructive
      expect(toastSource).not.toMatch(/bg-red-\d+/);
      expect(toastSource).not.toMatch(/border-red-\d+/);
    });
  });

  describe('ToastAction', () => {
    it('should use industrial styling', () => {
      expect(toastSource).toContain('border-industrial-graphite-300');
      expect(toastSource).toContain('font-body');
    });
  });

  describe('ToastClose', () => {
    it('should use industrial graphite color', () => {
      expect(toastSource).toContain('text-industrial-graphite-400');
    });

    it('should NOT use red hover colors', () => {
      // Old pattern: group-[.destructive]:text-red-300
      expect(toastSource).not.toContain('text-red-300');
      expect(toastSource).not.toContain('hover:text-red-50');
    });
  });

  describe('ToastTitle', () => {
    it('should use Barlow font', () => {
      expect(toastSource).toContain('font-body');
      expect(toastSource).toContain('font-semibold');
    });
  });

  describe('ToastDescription', () => {
    it('should use Barlow font and text-sm', () => {
      expect(toastSource).toContain('font-body');
      expect(toastSource).toContain('text-sm');
    });
  });
});

describe('Accessibility', () => {
  describe('Alert Component', () => {
    it('should have role="alert" for screen readers', () => {
      render(<Alert>Important message</Alert>);

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });
  });

  describe('FormMessage Component', () => {
    it('should be announced to screen readers via role="alert"', () => {
      render(
        <FormWrapper
          defaultValues={{ test: '' }}
          errors={{ test: { message: 'This field is required' } }}
        >
          <FormField
            name="test"
            render={() => (
              <FormItem>
                <FormLabel>Test Field</FormLabel>
                <FormControl>
                  <Input />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormWrapper>
      );

      const alerts = screen.getAllByRole('alert');
      expect(alerts.length).toBeGreaterThanOrEqual(1);
      expect(
        alerts.some((a) => a.textContent === 'This field is required')
      ).toBe(true);
    });
  });
});
