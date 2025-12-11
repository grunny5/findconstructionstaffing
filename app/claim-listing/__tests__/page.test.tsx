import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ClaimListingPage from '../page';

// Mock react-hook-form with simpler approach
const mockRegister = jest.fn();
const mockHandleSubmit = jest.fn((fn) => (e: any) => {
  e?.preventDefault();
  fn({}); // Let individual tests provide data if needed
});
const mockSetValue = jest.fn();

jest.mock('react-hook-form', () => ({
  useForm: () => ({
    register: mockRegister,
    handleSubmit: mockHandleSubmit,
    formState: { errors: {} },
    setValue: mockSetValue,
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
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('should render the page title', () => {
    render(<ClaimListingPage />);

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Claim Your Agency Listing');
  });

  it('should render page description', () => {
    render(<ClaimListingPage />);

    expect(
      screen.getByText(
        /Take control of your profile and start receiving qualified leads/i
      )
    ).toBeInTheDocument();
  });

  it('should render search section', () => {
    render(<ClaimListingPage />);

    expect(screen.getByText('Find Your Agency')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Type your agency name...')
    ).toBeInTheDocument();
  });

  it('should render claim form section', () => {
    render(<ClaimListingPage />);

    expect(screen.getByText('Claim Request')).toBeInTheDocument();
    expect(screen.getByLabelText(/Agency Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Your Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Job Title/i)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Business Email Address/i)
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Verification Details/i)).toBeInTheDocument();
  });

  it('should handle agency search', () => {
    render(<ClaimListingPage />);

    const searchInput = screen.getByPlaceholderText('Type your agency name...');
    fireEvent.change(searchInput, { target: { value: 'Industrial' } });

    // Should show search results
    expect(
      screen.getByText('Industrial Staffing Solutions')
    ).toBeInTheDocument();
  });

  it('should handle agency selection', () => {
    render(<ClaimListingPage />);

    // Search for an agency
    const searchInput = screen.getByPlaceholderText('Type your agency name...');
    fireEvent.change(searchInput, { target: { value: 'Industrial' } });

    // Select an agency from search results
    const agency = screen.getByText('Industrial Staffing Solutions');
    fireEvent.click(agency);

    // Verify agency was selected - setValue should be called with agency name
    expect(mockSetValue).toHaveBeenCalledWith(
      'agencyName',
      expect.stringContaining('Industrial')
    );
  });

  it('should handle form submission', async () => {
    // Mock the form submission to trigger the onSubmit callback
    mockHandleSubmit.mockImplementation((onSubmit) => (e) => {
      e?.preventDefault();
      onSubmit({}); // This will trigger the actual onSubmit function
    });

    render(<ClaimListingPage />);

    // First, select an agency (required for submission)
    const searchInput = screen.getByPlaceholderText('Type your agency name...');
    fireEvent.change(searchInput, { target: { value: 'Industrial' } });

    // Wait for search results and select an agency
    await waitFor(() => {
      expect(
        screen.getByText('Industrial Staffing Solutions')
      ).toBeInTheDocument();
    });

    const agency = screen.getByText('Industrial Staffing Solutions');
    fireEvent.click(agency);

    // Wait for submit button to be enabled
    const submitButton = screen.getByRole('button', {
      name: /Submit Claim Request/i,
    });
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });

    // Now submit the form
    fireEvent.click(submitButton);

    // Verify handleSubmit was called
    expect(mockHandleSubmit).toHaveBeenCalled();

    // Should show success message after submission (after the 2s timeout)
    await waitFor(
      () => {
        expect(
          screen.getByText('Claim Request Submitted!')
        ).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('should show search results when typing', () => {
    render(<ClaimListingPage />);

    // Initially no search results shown
    expect(
      screen.queryByText('Industrial Staffing Solutions')
    ).not.toBeInTheDocument();

    // Start typing to trigger search
    const searchInput = screen.getByPlaceholderText('Type your agency name...');
    fireEvent.change(searchInput, { target: { value: 'Industrial' } });

    // Should show matching agency
    expect(
      screen.getByText('Industrial Staffing Solutions')
    ).toBeInTheDocument();
  });

  it('should show empty state when no search term', () => {
    render(<ClaimListingPage />);

    // Should show search prompt when no search term
    expect(
      screen.getByText(/Start typing to search for your agency/i)
    ).toBeInTheDocument();
  });

  it('should show free to claim alert', () => {
    render(<ClaimListingPage />);

    expect(screen.getByText('Free to claim:')).toBeInTheDocument();
    expect(
      screen.getByText(/All agency listings are free/i)
    ).toBeInTheDocument();
  });

  it('should show verification notice', () => {
    render(<ClaimListingPage />);

    expect(
      screen.getByText(/We'll verify your claim within 2 business days/i)
    ).toBeInTheDocument();
  });
});
