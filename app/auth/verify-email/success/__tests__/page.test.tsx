import { render, screen } from '@testing-library/react';
import { useSearchParams } from 'next/navigation';
import VerifyEmailSuccessPage from '../page';

jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
}));

const mockUseSearchParams = useSearchParams as jest.MockedFunction<
  typeof useSearchParams
>;

describe('VerifyEmailSuccessPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render invalid link message when no verified param', () => {
    mockUseSearchParams.mockReturnValue({
      get: jest.fn().mockReturnValue(null),
    } as any);

    render(<VerifyEmailSuccessPage />);

    expect(screen.getByText('Email Verification')).toBeInTheDocument();
    expect(
      screen.getByText(/Invalid verification link/)
    ).toBeInTheDocument();
  });

  it('should render success message when verification succeeds', () => {
    mockUseSearchParams.mockReturnValue({
      get: jest.fn().mockReturnValue('true'),
    } as any);

    render(<VerifyEmailSuccessPage />);

    expect(screen.getByText('Email Verified!')).toBeInTheDocument();
    expect(
      screen.getByText('Your email address has been successfully verified.')
    ).toBeInTheDocument();
  });

  it('should display sign in button on success', () => {
    mockUseSearchParams.mockReturnValue({
      get: jest.fn().mockReturnValue('true'),
    } as any);

    render(<VerifyEmailSuccessPage />);

    const signInButton = screen.getByRole('link', { name: /sign in/i });
    expect(signInButton).toBeInTheDocument();
    expect(signInButton).toHaveAttribute('href', '/login');
  });

  it('should display return to home link', () => {
    mockUseSearchParams.mockReturnValue({
      get: jest.fn().mockReturnValue('true'),
    } as any);

    render(<VerifyEmailSuccessPage />);

    const homeLink = screen.getByText('Return to Home');
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('should show helpful message about next steps', () => {
    mockUseSearchParams.mockReturnValue({
      get: jest.fn().mockReturnValue('true'),
    } as any);

    render(<VerifyEmailSuccessPage />);

    expect(
      screen.getByText(/You can now sign in to your FindConstructionStaffing/)
    ).toBeInTheDocument();
  });
});
