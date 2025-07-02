import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ClaimListingPage from '../page';

// Mock react-hook-form
jest.mock('react-hook-form', () => ({
  useForm: () => ({
    register: jest.fn(),
    handleSubmit: (fn: any) => (e: any) => {
      e?.preventDefault();
      return fn({
        agencyName: 'Test Agency',
        contactEmail: 'test@example.com',
        contactName: 'John Doe',
        jobTitle: 'Owner',
        verificationDetails: 'I am the owner of this agency',
      });
    },
    formState: { errors: {} },
    setValue: jest.fn(),
  }),
}));

// Mock next/link components
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

describe('ClaimListingPage', () => {
  it('should render the page title', () => {
    render(<ClaimListingPage />);

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Claim Your Agency Listing');
  });

  it('should render page description', () => {
    render(<ClaimListingPage />);

    expect(screen.getByText(/Take control of your profile and start receiving qualified leads/i)).toBeInTheDocument();
  });

  it('should render search section', () => {
    render(<ClaimListingPage />);

    expect(screen.getByText('Find Your Agency')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Type your agency name...')).toBeInTheDocument();
  });

  it('should render claim form section', () => {
    render(<ClaimListingPage />);

    expect(screen.getByText('Claim Request')).toBeInTheDocument();
    expect(screen.getByLabelText(/Agency Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Your Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Job Title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Business Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Verification Details/i)).toBeInTheDocument();
  });

  it('should handle agency search', () => {
    render(<ClaimListingPage />);

    const searchInput = screen.getByPlaceholderText('Type your agency name...');
    fireEvent.change(searchInput, { target: { value: 'Industrial' } });

    // Should show search results
    expect(screen.getByText('Industrial Staffing Inc')).toBeInTheDocument();
  });

  it('should handle form submission', async () => {
    render(<ClaimListingPage />);

    // Search and select an agency
    const searchInput = screen.getByPlaceholderText('Type your agency name...');
    fireEvent.change(searchInput, { target: { value: 'Industrial' } });
    
    const agency = screen.getByText('Industrial Staffing Inc');
    fireEvent.click(agency);

    // Submit form
    const submitButton = screen.getByRole('button', { name: /Submit Claim Request/i });
    fireEvent.click(submitButton);

    // Should show success message after submission
    await waitFor(() => {
      expect(screen.getByText('Claim Request Submitted!')).toBeInTheDocument();
    });
  });

  it('should show free to claim alert', () => {
    render(<ClaimListingPage />);

    expect(screen.getByText('Free to claim:')).toBeInTheDocument();
    expect(screen.getByText(/All agency listings are free/i)).toBeInTheDocument();
  });

  it('should show verification notice', () => {
    render(<ClaimListingPage />);

    expect(screen.getByText(/We'll verify your claim within 2 business days/i)).toBeInTheDocument();
  });
});