'use client';

/**
 * FormError Component - Accessibility Excellence
 *
 * Accessible form error message component with ARIA alerts.
 * Screen readers will immediately announce errors when they appear.
 *
 * Features:
 * - role="alert" for immediate announcement
 * - aria-live="assertive" to interrupt other announcements
 * - Industrial design system styling
 * - Conditionally renders only when error exists
 *
 * @example
 * ```tsx
 * // In form component
 * export function ContactForm() {
 *   const [errors, setErrors] = useState({});
 *
 *   return (
 *     <form>
 *       <Input
 *         name="email"
 *         type="email"
 *         aria-invalid={errors.email ? 'true' : 'false'}
 *         aria-describedby="email-error"
 *       />
 *       <FormError id="email-error" message={errors.email} />
 *     </form>
 *   );
 * }
 * ```
 */
interface FormErrorProps {
  /**
   * Error message to display.
   * If undefined or empty, component returns null.
   */
  message?: string;

  /**
   * Optional ID for aria-describedby association.
   * Links error message to form field for screen readers.
   */
  id?: string;

  /**
   * Optional additional CSS classes
   */
  className?: string;
}

export function FormError({ message, id, className }: FormErrorProps) {
  // Don't render anything if no error message
  if (!message) return null;

  return (
    <p
      id={id}
      role="alert"
      aria-live="assertive"
      className={`font-body text-sm text-red-600 dark:text-red-400 mt-1 ${className || ''}`}
    >
      {message}
    </p>
  );
}

/**
 * FormFieldError Component - Convenience wrapper for field-level errors
 *
 * Use this when you have form field validation errors.
 * Automatically generates ID based on field name.
 *
 * @example
 * ```tsx
 * <Input
 *   name="email"
 *   aria-describedby="email-error"
 * />
 * <FormFieldError fieldName="email" message={errors.email} />
 * ```
 */
interface FormFieldErrorProps {
  /**
   * Name of the form field this error relates to.
   * Used to generate consistent ID for aria-describedby.
   */
  fieldName: string;

  /**
   * Error message to display.
   */
  message?: string;

  /**
   * Optional additional CSS classes
   */
  className?: string;
}

export function FormFieldError({
  fieldName,
  message,
  className,
}: FormFieldErrorProps) {
  return (
    <FormError
      id={`${fieldName}-error`}
      message={message}
      className={className}
    />
  );
}

/**
 * FormErrorSummary Component - Summary of all form errors
 *
 * Display at top of form to announce all errors at once.
 * Useful for multi-field validation.
 *
 * @example
 * ```tsx
 * <FormErrorSummary
 *   errors={[
 *     'Email is required',
 *     'Phone number must be 10 digits'
 *   ]}
 * />
 * ```
 */
interface FormErrorSummaryProps {
  /**
   * Array of error messages
   */
  errors: string[];

  /**
   * Optional title for error summary
   */
  title?: string;
}

export function FormErrorSummary({
  errors,
  title = 'Please fix the following errors:',
}: FormErrorSummaryProps) {
  if (!errors || errors.length === 0) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="bg-red-50 dark:bg-red-950 border-2 border-red-600 dark:border-red-400 rounded-industrial-sharp p-4 mb-4"
    >
      <h3 className="font-display text-base uppercase tracking-wide text-red-600 dark:text-red-400 mb-2">
        {title}
      </h3>
      <ul className="list-disc list-inside space-y-1">
        {errors.map((error, index) => (
          <li
            key={index}
            className="font-body text-sm text-red-600 dark:text-red-400"
          >
            {error}
          </li>
        ))}
      </ul>
    </div>
  );
}
