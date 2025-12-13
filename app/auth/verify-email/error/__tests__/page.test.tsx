import { render, screen } from '@testing-library/react';
import { useSearchParams } from 'next/navigation';
import VerifyEmailErrorPage from '../page';

jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
}));

const mockUseSearchParams = useSearchParams as jest.MockedFunction<
  typeof useSearchParams
>;

describe('VerifyEmailErrorPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render default error message when no message param', () => {
    mockUseSearchParams.mockReturnValue({
      get: jest.fn().mockReturnValue(null),
    } as any);

    render(<VerifyEmailErrorPage />);

    expect(screen.getByText('Verification Failed')).toBeInTheDocument();
    expect(screen.getByText('Verification failed')).toBeInTheDocument();
  });

  it('should display custom error message from query param', () => {
    mockUseSearchParams.mockReturnValue({
      get: jest.fn().mockReturnValue('Invalid verification link'),
    } as any);

    render(<VerifyEmailErrorPage />);

    expect(screen.getByText('Invalid verification link')).toBeInTheDocument();
  });

  it('should show expired link message and help text', () => {
    mockUseSearchParams.mockReturnValue({
      get: jest.fn().mockReturnValue('Verification link has expired'),
    } as any);

    render(<VerifyEmailErrorPage />);

    expect(
      screen.getByText('Verification link has expired')
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Verification links expire after 24 hours/)
    ).toBeInTheDocument();
  });

  it('should show resend button for expired links', () => {
    mockUseSearchParams.mockReturnValue({
      get: jest.fn().mockReturnValue('Verification link has expired'),
    } as any);

    render(<VerifyEmailErrorPage />);

    const resendButton = screen.getByRole('link', {
      name: /resend verification email/i,
    });
    expect(resendButton).toBeInTheDocument();
    expect(resendButton).toHaveAttribute('href', '/signup');
  });

  it('should show already verified message with sign in button', () => {
    mockUseSearchParams.mockReturnValue({
      get: jest.fn().mockReturnValue('Email already verified'),
    } as any);

    render(<VerifyEmailErrorPage />);

    expect(screen.getByText('Already Verified')).toBeInTheDocument();
    expect(
      screen.getByText(/Your email has already been verified/)
    ).toBeInTheDocument();

    const signInButton = screen.getByRole('link', { name: /sign in/i });
    expect(signInButton).toBeInTheDocument();
    expect(signInButton).toHaveAttribute('href', '/login');
  });

  it('should display return to home link', () => {
    mockUseSearchParams.mockReturnValue({
      get: jest.fn().mockReturnValue('Verification failed'),
    } as any);

    render(<VerifyEmailErrorPage />);

    const homeLink = screen.getByText('Return to Home');
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('should display contact support link', () => {
    mockUseSearchParams.mockReturnValue({
      get: jest.fn().mockReturnValue('Verification failed'),
    } as any);

    render(<VerifyEmailErrorPage />);

    const supportLink = screen.getByText('Contact support');
    expect(supportLink).toBeInTheDocument();
    expect(supportLink).toHaveAttribute(
      'href',
      'mailto:support@findconstructionstaffing.com'
    );
  });

  it('should show appropriate icon for already verified state', () => {
    mockUseSearchParams.mockReturnValue({
      get: jest.fn().mockReturnValue('Email already verified'),
    } as any);

    render(<VerifyEmailErrorPage />);

    const alertTriangleIcon = screen.getByTestId('alert-triangle-icon');
    expect(alertTriangleIcon).toBeInTheDocument();
  });

  it('should show appropriate icon for error state', () => {
    mockUseSearchParams.mockReturnValue({
      get: jest.fn().mockReturnValue('Invalid verification link'),
    } as any);

    render(<VerifyEmailErrorPage />);

    const xCircleIcon = screen.getByTestId('x-circle-icon');
    expect(xCircleIcon).toBeInTheDocument();
  });
});
