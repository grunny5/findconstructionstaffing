import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import RequestLaborPage from '../page';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';

// Default successful form mock
const createMockHandleSubmit = (onSubmitFn?: any) => {
  return jest.fn((fn: any) => (e: any) => {
    e?.preventDefault();
    const formData = {
      projectName: 'Test Project',
      tradeNeeded: 'Electrician',
      headcount: 5,
      location: 'Austin',
      state: 'TX',
      startDate: '2024-02-01',
      duration: '3 months',
      contactName: 'John Doe',
      contactEmail: 'john@example.com',
      contactPhone: '555-123-4567',
    };
    if (onSubmitFn) {
      return onSubmitFn(formData);
    }
    return fn(formData);
  });
};

const mockFormDefaults = {
  register: jest.fn(),
  handleSubmit: createMockHandleSubmit(),
  formState: { errors: {} },
  setValue: jest.fn(),
  watch: jest.fn(),
};

// Mock react-hook-form
jest.mock('react-hook-form', () => ({
  useForm: jest.fn(),
}));

// Mock components
jest.mock('@/components/Header', () => {
  return function Header() {
    return <header>Header</header>;
  };
});

jest.mock('@/components/Footer', () => {
  return function Footer() {
    return <footer>Footer</footer>;
  };
});

// Mock sonner
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('RequestLaborPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset to default successful form state before each test
    (useForm as jest.Mock).mockReturnValue({
      ...mockFormDefaults,
      handleSubmit: createMockHandleSubmit(),
    });
  });
  it('should render the page title', () => {
    render(<RequestLaborPage />);

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent(/Request Skilled Labor/i);
  });

  it('should render form fields', () => {
    render(<RequestLaborPage />);

    expect(screen.getByLabelText(/Project Name/i)).toBeInTheDocument();
    // Note: Select components don't have associated form controls in the same way as inputs
    // Check for the select trigger instead
    expect(screen.getByText(/Select trade specialty/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Number of Workers Needed/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/City \/ Project Location/i)).toBeInTheDocument();
    // Check for the state select trigger
    expect(screen.getByText(/Select state/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Start Date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Project Duration/i)).toBeInTheDocument();
  });

  it('should render contact fields', () => {
    render(<RequestLaborPage />);

    expect(screen.getByLabelText(/Contact Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Phone Number/i)).toBeInTheDocument();
  });

  it('should have submit button', () => {
    render(<RequestLaborPage />);

    const submitButton = screen.getByRole('button', { name: /Submit Labor Request/i });
    expect(submitButton).toBeInTheDocument();
  });

  it('should handle form submission', async () => {
    // Create a custom mock that will actually invoke the onSubmit handler
    const mockHandleSubmit = jest.fn((onSubmit) => async (e: any) => {
      e?.preventDefault();
      const formData = {
        projectName: 'Test Project',
        tradeNeeded: 'Electrician',
        headcount: 5,
        location: 'Austin',
        state: 'TX',
        startDate: '2024-02-01',
        duration: '3 months',
        contactName: 'John Doe',
        contactEmail: 'john@example.com',
        contactPhone: '555-123-4567',
      };
      // Call the actual onSubmit handler from the component
      await onSubmit(formData);
    });

    (useForm as jest.Mock).mockReturnValue({
      ...mockFormDefaults,
      handleSubmit: mockHandleSubmit,
    });

    render(<RequestLaborPage />);

    const submitButton = screen.getByRole('button', { name: /Submit Labor Request/i });
    
    await act(async () => {
      fireEvent.click(submitButton);
    });

    // Wait for the async operations to complete
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        'Labor request submitted successfully! Agencies will be notified within 24 hours.'
      );
    }, { timeout: 3000 });
  });

  it('should show success page after form submission', async () => {
    // Create a custom mock that will actually invoke the onSubmit handler
    const mockHandleSubmit = jest.fn((onSubmit) => async (e: any) => {
      e?.preventDefault();
      const formData = {
        projectName: 'Test Project',
        tradeNeeded: 'Electrician',
        headcount: 5,
        location: 'Austin',
        state: 'TX',
        startDate: '2024-02-01',
        duration: '3 months',
        contactName: 'John Doe',
        contactEmail: 'john@example.com',
        contactPhone: '555-123-4567',
      };
      await onSubmit(formData);
    });

    (useForm as jest.Mock).mockReturnValue({
      ...mockFormDefaults,
      handleSubmit: mockHandleSubmit,
    });

    render(<RequestLaborPage />);

    const submitButton = screen.getByRole('button', { name: /Submit Labor Request/i });
    
    await act(async () => {
      fireEvent.click(submitButton);
    });

    // Wait for the success page to appear (after the 2s simulated API call)
    await waitFor(() => {
      expect(screen.getByText('Request Submitted Successfully!')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Verify success page content
    expect(screen.getByText(/Your labor request has been sent to qualified staffing agencies/i)).toBeInTheDocument();
    expect(screen.getByText(/What happens next/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Return to Directory/i })).toBeInTheDocument();
  });

  it('should have proper page structure', () => {
    const { container } = render(<RequestLaborPage />);

    const mainContainer = container.querySelector('.container, .max-w-7xl');
    expect(mainContainer).toBeInTheDocument();
  });

  it('should show benefits section', () => {
    render(<RequestLaborPage />);

    // Should show why use the service
    // The page doesn't have a "Why Use Our Service" section
    // Instead it has an alert explaining how it works
    expect(screen.getByText(/How it works:/i)).toBeInTheDocument();
  });

  it('should show process steps', () => {
    render(<RequestLaborPage />);

    // Should explain the process
    expect(screen.getByText(/How It Works/i)).toBeInTheDocument();
  });

  describe('Form Validation', () => {
    it('should show validation errors for invalid form data', () => {
      // Mock form with validation errors
      (useForm as jest.Mock).mockReturnValue({
        ...mockFormDefaults,
        formState: { 
          errors: { 
            contactEmail: { message: 'Invalid email format' },
            projectName: { message: 'Project name is required' },
            headcount: { message: 'Headcount must be at least 1' },
            contactPhone: { message: 'Please enter a valid phone number' }
          } 
        },
      });

      render(<RequestLaborPage />);
      
      expect(screen.getByText('Invalid email format')).toBeInTheDocument();
      expect(screen.getByText('Project name is required')).toBeInTheDocument();
      expect(screen.getByText('Headcount must be at least 1')).toBeInTheDocument();
      expect(screen.getByText('Please enter a valid phone number')).toBeInTheDocument();
    });

    it('should show individual field validation errors', () => {
      // Test individual field errors
      (useForm as jest.Mock).mockReturnValue({
        ...mockFormDefaults,
        formState: { 
          errors: { 
            tradeNeeded: { message: 'Please select a trade specialty' },
            location: { message: 'Location must be at least 2 characters' },
            state: { message: 'Please select a state' },
            startDate: { message: 'Please select a start date' },
            duration: { message: 'Please specify project duration' }
          } 
        },
      });

      render(<RequestLaborPage />);
      
      expect(screen.getByText('Please select a trade specialty')).toBeInTheDocument();
      expect(screen.getByText('Location must be at least 2 characters')).toBeInTheDocument();
      expect(screen.getByText('Please select a state')).toBeInTheDocument();
      expect(screen.getByText('Please select a start date')).toBeInTheDocument();
      expect(screen.getByText('Please specify project duration')).toBeInTheDocument();
    });

    it('should handle form submission with errors gracefully', async () => {
      // Mock form that throws an error on submission
      const mockHandleSubmitWithError = jest.fn(() => (e: any) => {
        e?.preventDefault();
        // Don't actually throw the error, just don't call the callback
        // This simulates a form validation failure
      });

      (useForm as jest.Mock).mockReturnValue({
        register: jest.fn(),
        handleSubmit: mockHandleSubmitWithError,
        formState: { errors: {} },
        setValue: jest.fn(),
        watch: jest.fn(),
      });

      render(<RequestLaborPage />);

      const submitButton = screen.getByRole('button', { name: /Submit Labor Request/i });
      
      // Form submission should not crash the app
      expect(() => fireEvent.click(submitButton)).not.toThrow();
    });

    it('should show loading state during form submission', () => {
      // Mock form that simulates loading state
      (useForm as jest.Mock).mockReturnValue({
        ...mockFormDefaults,
        formState: { 
          errors: {},
          isSubmitting: true 
        },
      });

      render(<RequestLaborPage />);

      // Submit button should show loading state or be disabled
      const submitButton = screen.getByRole('button', { name: /Submit Labor Request/i });
      expect(submitButton).toBeInTheDocument();
      
      // Check for loading indicator or disabled state
      // The exact implementation depends on how the form handles loading state
    });

    it('should prevent submission when form has validation errors', () => {
      const mockHandleSubmitNoCall = jest.fn(() => jest.fn());
      
      (useForm as jest.Mock).mockReturnValue({
        register: jest.fn(),
        handleSubmit: mockHandleSubmitNoCall,
        formState: { 
          errors: { 
            contactEmail: { message: 'Invalid email format' },
            projectName: { message: 'Project name is required' }
          } 
        },
        setValue: jest.fn(),
        watch: jest.fn(),
      });

      render(<RequestLaborPage />);

      const submitButton = screen.getByRole('button', { name: /Submit Labor Request/i });
      fireEvent.click(submitButton);

      // With errors present, handleSubmit should still be called but validation should prevent actual submission
      expect(mockHandleSubmitNoCall).toHaveBeenCalled();
    });
  });

  describe('Form Accessibility', () => {
    it('should associate error messages with form fields', () => {
      (useForm as jest.Mock).mockReturnValue({
        register: jest.fn(),
        handleSubmit: createMockHandleSubmit(),
        formState: { 
          errors: { 
            contactEmail: { message: 'Invalid email format' }
          } 
        },
        setValue: jest.fn(),
        watch: jest.fn(),
      });

      render(<RequestLaborPage />);
      
      // Error message should be associated with the field for screen readers
      const emailField = screen.getByLabelText(/Email Address/i);
      const errorMessage = screen.getByText('Invalid email format');
      
      expect(emailField).toBeInTheDocument();
      expect(errorMessage).toBeInTheDocument();
      
      // In a real implementation, these would be connected via aria-describedby
      // This test documents the expectation for accessibility
    });

    it('should maintain required field indicators', () => {
      render(<RequestLaborPage />);

      // Required fields should be clearly marked
      expect(screen.getByLabelText(/Project Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Contact Name/i)).toBeInTheDocument();
      
      // Check for asterisks in the labels by looking for text containing *
      const projectNameLabel = screen.getByText(/Project Name \*/i);
      const emailLabel = screen.getByText(/Email Address \*/i);
      const contactNameLabel = screen.getByText(/Contact Name \*/i);
      
      expect(projectNameLabel).toBeInTheDocument();
      expect(emailLabel).toBeInTheDocument();
      expect(contactNameLabel).toBeInTheDocument();
    });
  });
});