import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RequestLaborPage from '../page';

// Mock react-hook-form
jest.mock('react-hook-form', () => ({
  useForm: () => ({
    register: jest.fn(),
    handleSubmit: (fn: any) => (e: any) => {
      e?.preventDefault();
      return fn({
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
      });
    },
    formState: { errors: {} },
    setValue: jest.fn(),
    watch: jest.fn(),
  }),
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
  it('should render the page title', () => {
    render(<RequestLaborPage />);

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent(/Request Labor/i);
  });

  it('should render form fields', () => {
    render(<RequestLaborPage />);

    expect(screen.getByLabelText(/Project Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Trade Specialty Needed/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Number of Workers Needed/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Job Site Location/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/State/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Preferred Start Date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Project Duration/i)).toBeInTheDocument();
  });

  it('should render contact fields', () => {
    render(<RequestLaborPage />);

    expect(screen.getByLabelText(/Contact Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Contact Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Contact Phone/i)).toBeInTheDocument();
  });

  it('should have submit button', () => {
    render(<RequestLaborPage />);

    const submitButton = screen.getByRole('button', { name: /Submit Request/i });
    expect(submitButton).toBeInTheDocument();
  });

  it('should handle form submission', async () => {
    render(<RequestLaborPage />);

    const submitButton = screen.getByRole('button', { name: /Submit Request/i });
    fireEvent.click(submitButton);

    // Should show success message after submission
    await waitFor(() => {
      expect(screen.getByText(/Request Submitted Successfully/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should have proper page structure', () => {
    const { container } = render(<RequestLaborPage />);

    const mainContainer = container.querySelector('.container, .max-w-7xl');
    expect(mainContainer).toBeInTheDocument();
  });

  it('should show benefits section', () => {
    render(<RequestLaborPage />);

    // Should show why use the service
    expect(screen.getByText(/Why Use Our Service/i)).toBeInTheDocument();
  });

  it('should show process steps', () => {
    render(<RequestLaborPage />);

    // Should explain the process
    expect(screen.getByText(/How It Works/i)).toBeInTheDocument();
  });
});