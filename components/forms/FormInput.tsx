/**
 * Enhanced Form Input Component with Validation Icons
 * Feature: Phase 1 - UI/UX Production Readiness
 * Task: 1.4 - Form Validation UX
 *
 * Provides visual feedback for form validation:
 * - Green checkmark icon for valid fields
 * - Red X icon + inline error message for invalid fields
 * - Validates on blur (not real-time keystroke, not only on submit)
 * - ARIA attributes for accessibility
 */

import * as React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
  useFormField,
} from '@/components/ui/form';
import { cn } from '@/lib/utils';

export interface FormInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  showIcons?: boolean;
}

const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, showIcons = true, className, ...props }, ref) => {
    const { error, isDirty } = useFormField();
    const hasValue = props.value !== undefined && props.value !== '';
    const isValid = !error && isDirty && hasValue;
    const isInvalid = !!error && isDirty;

    return (
      <FormItem>
        {label && <FormLabel>{label}</FormLabel>}
        <div className="relative">
          <FormControl>
            <Input
              ref={ref}
              className={cn(
                isInvalid && 'border-industrial-orange focus-visible:ring-industrial-orange',
                isValid && 'border-green-500',
                className
              )}
              {...props}
            />
          </FormControl>

          {showIcons && isValid && (
            <CheckCircle2
              className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500"
              aria-label="Valid input"
            />
          )}

          {showIcons && isInvalid && (
            <AlertCircle
              className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-industrial-orange"
              aria-label="Invalid input"
            />
          )}
        </div>
        <FormMessage />
      </FormItem>
    );
  }
);
FormInput.displayName = 'FormInput';

export { FormInput };
