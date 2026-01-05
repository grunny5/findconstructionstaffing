import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import LoginPage from '../page';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock auth context
jest.mock('@/lib/auth/auth-context', () => ({
  useAuth: jest.fn(),
}));

// Mock feature flags
jest.mock('@/lib/feature-flags', () => ({
  isFeatureEnabled: jest.fn(() => true),
}));

describe('LoginPage - Industrial Design System', () => {
  const mockPush = jest.fn();
  const mockSignIn = jest.fn();
  const mockGet = jest.fn<string | null, [string]>(() => null);
  const mockSearchParams = {
    get: mockGet,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockReturnValue(null);
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
    (useAuth as jest.Mock).mockReturnValue({ signIn: mockSignIn });
  });

  describe('Page Background and Layout', () => {
    it('should render with cream background', () => {
      const { container } = render(<LoginPage />);

      const background = container.querySelector('.bg-industrial-bg-primary');
      expect(background).toBeInTheDocument();
      expect(background).toHaveClass('min-h-screen');
    });

    it('should use AuthPageLayout with medium max-width', () => {
      const { container } = render(<LoginPage />);

      const contentContainer = container.querySelector('.max-w-md');
      expect(contentContainer).toBeInTheDocument();
    });
  });

  describe('Typography', () => {
    it('should use display font for main heading', () => {
      render(<LoginPage />);

      const heading = screen.getByRole('heading', {
        name: /sign in/i,
        level: 1,
      });
      expect(heading).toHaveClass('font-display');
      expect(heading).toHaveClass('uppercase');
      expect(heading).toHaveClass('tracking-wide');
      expect(heading).toHaveClass('text-industrial-graphite-600');
    });

    it('should use body font for description text', () => {
      render(<LoginPage />);

      const description = screen.getByText(/don't have an account/i);
      expect(description).toHaveClass('font-body');
      expect(description).toHaveClass('text-industrial-graphite-500');
    });

    it('should use display font for card title', () => {
      render(<LoginPage />);

      const cardTitle = screen.getByRole('heading', {
        name: /sign in to your account/i,
      });
      expect(cardTitle).toHaveClass('font-display');
      expect(cardTitle).toHaveClass('uppercase');
      expect(cardTitle).toHaveClass('text-industrial-graphite-600');
    });

    it('should use uppercase labels with industrial styling', () => {
      render(<LoginPage />);

      const emailLabel = screen.getByText(/email address/i);
      expect(emailLabel).toHaveClass('font-body');
      expect(emailLabel).toHaveClass('text-xs');
      expect(emailLabel).toHaveClass('uppercase');
      expect(emailLabel).toHaveClass('font-semibold');
      expect(emailLabel).toHaveClass('text-industrial-graphite-400');
      expect(emailLabel).toHaveClass('tracking-wide');
    });
  });

  describe('Card Styling', () => {
    it('should render card with industrial styling', () => {
      const { container } = render(<LoginPage />);

      const card = container.querySelector('[class*="bg-industrial-bg-card"]');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('rounded-industrial-sharp');
      expect(card).toHaveClass('border-2');
      expect(card).toHaveClass('border-industrial-graphite-200');
    });

    it('should have card header with bottom border', () => {
      const { container } = render(<LoginPage />);

      const cardHeader = container.querySelector('[class*="border-b"]');
      expect(cardHeader).toHaveClass('border-industrial-graphite-200');
    });
  });

  describe('Form Inputs', () => {
    it('should render email input with industrial styling', () => {
      render(<LoginPage />);

      const emailInput = screen.getByPlaceholderText(/your.email@example.com/i);
      expect(emailInput).toBeInTheDocument();
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('autocomplete', 'email');
    });

    it('should render password input with industrial styling', () => {
      render(<LoginPage />);

      const passwordInput = screen.getByPlaceholderText(/••••••••/);
      expect(passwordInput).toBeInTheDocument();
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(passwordInput).toHaveAttribute('autocomplete', 'current-password');
    });

    it('should mark required fields with orange asterisk', () => {
      const { container } = render(<LoginPage />);

      const asterisks = container.querySelectorAll('.text-industrial-orange');
      expect(asterisks.length).toBeGreaterThan(0);
    });
  });

  describe('Button Styling', () => {
    it('should render submit button with industrial styling', () => {
      render(<LoginPage />);

      const button = screen.getByRole('button', { name: /sign in/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('w-full');
      expect(button).not.toBeDisabled();
    });

    it('should show loading state when submitting', async () => {
      mockSignIn.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );
      const user = userEvent.setup();

      render(<LoginPage />);

      const emailInput = screen.getByPlaceholderText(/your.email@example.com/i);
      const passwordInput = screen.getByPlaceholderText(/••••••••/);
      const button = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(button);

      expect(screen.getByText(/signing in.../i)).toBeInTheDocument();
    });
  });

  describe('Links', () => {
    it('should render signup link with orange styling', () => {
      render(<LoginPage />);

      const signupLink = screen.getByRole('link', { name: /create one here/i });
      expect(signupLink).toHaveClass('text-industrial-orange');
      expect(signupLink).toHaveClass('hover:text-industrial-orange-500');
      expect(signupLink).toHaveAttribute('href', '/signup');
    });

    it('should render forgot password link with orange styling', () => {
      render(<LoginPage />);

      const forgotLink = screen.getByRole('link', {
        name: /forgot your password/i,
      });
      expect(forgotLink).toHaveClass('text-industrial-orange');
      expect(forgotLink).toHaveClass('hover:text-industrial-orange-500');
      expect(forgotLink).toHaveAttribute('href', '/forgot-password');
    });
  });

  describe('Error States', () => {
    it('should display validation errors in orange', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const button = screen.getByRole('button', { name: /sign in/i });
      await user.click(button);

      await waitFor(() => {
        const emailError = screen.getByText(/invalid email address/i);
        expect(emailError).toHaveClass('text-industrial-orange');
        expect(emailError).toHaveClass('font-body');
        expect(emailError).toHaveClass('text-sm');
      });
    });

    it('should display authentication errors in orange alert', async () => {
      mockSignIn.mockRejectedValue(new Error('Invalid credentials'));
      const user = userEvent.setup();

      render(<LoginPage />);

      const emailInput = screen.getByPlaceholderText(/your.email@example.com/i);
      const passwordInput = screen.getByPlaceholderText(/••••••••/);
      const button = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(button);

      await waitFor(() => {
        const errorMessage = screen.getByText(/invalid credentials/i);
        expect(errorMessage).toHaveClass('font-body');
        expect(errorMessage).toHaveClass('text-sm');
      });
    });

    it('should highlight inputs with errors', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const button = screen.getByRole('button', { name: /sign in/i });
      await user.click(button);

      await waitFor(() => {
        const emailInput = screen.getByPlaceholderText(
          /your.email@example.com/i
        );
        expect(emailInput).toHaveClass('border-industrial-orange');
      });
    });
  });

  describe('Form Submission', () => {
    it('should submit form with valid credentials', async () => {
      mockSignIn.mockResolvedValue(undefined);
      const user = userEvent.setup();

      render(<LoginPage />);

      const emailInput = screen.getByPlaceholderText(/your.email@example.com/i);
      const passwordInput = screen.getByPlaceholderText(/••••••••/);
      const button = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(button);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith(
          'test@example.com',
          'password123'
        );
        expect(mockPush).toHaveBeenCalledWith('/');
      });
    });

    it('should redirect to callback URL after successful login', async () => {
      mockSignIn.mockResolvedValue(undefined);
      mockGet.mockReturnValue('/dashboard');
      const user = userEvent.setup();

      render(<LoginPage />);

      const emailInput = screen.getByPlaceholderText(/your.email@example.com/i);
      const passwordInput = screen.getByPlaceholderText(/••••••••/);
      const button = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(button);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });
  });

  describe('Unverified Email Flow', () => {
    it('should show ResendVerificationForm for unverified email', async () => {
      const unverifiedError = new Error('Email not verified');
      (unverifiedError as any).isEmailNotVerified = true;
      mockSignIn.mockRejectedValue(unverifiedError);
      const user = userEvent.setup();

      render(<LoginPage />);

      const emailInput = screen.getByPlaceholderText(/your.email@example.com/i);
      const passwordInput = screen.getByPlaceholderText(/••••••••/);
      const button = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'unverified@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText(/email not verified/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<LoginPage />);

      const h1 = screen.getByRole('heading', { level: 1, name: /sign in/i });
      expect(h1).toBeInTheDocument();
    });

    it('should have associated labels for all inputs', () => {
      render(<LoginPage />);

      const emailInput = screen.getByPlaceholderText(/your.email@example.com/i);
      const passwordInput = screen.getByPlaceholderText(/••••••••/);

      expect(emailInput).toHaveAttribute('id', 'email');
      expect(passwordInput).toHaveAttribute('id', 'password');

      const emailLabel = screen.getByText(/email address/i);
      const passwordLabel = screen.getByText(/^password/i);

      expect(emailLabel).toHaveAttribute('for', 'email');
      expect(passwordLabel).toHaveAttribute('for', 'password');
    });

    it('should have autocomplete attributes for better UX', () => {
      render(<LoginPage />);

      const emailInput = screen.getByPlaceholderText(/your.email@example.com/i);
      const passwordInput = screen.getByPlaceholderText(/••••••••/);

      expect(emailInput).toHaveAttribute('autocomplete', 'email');
      expect(passwordInput).toHaveAttribute('autocomplete', 'current-password');
    });
  });

  describe('Loading State', () => {
    it('should show loading fallback with industrial styling', () => {
      const { container } = render(
        <div className="min-h-screen bg-industrial-bg-primary">
          <div className="text-center">
            <p className="font-body text-lg text-industrial-graphite-400">
              Loading...
            </p>
          </div>
        </div>
      );

      const loadingText = screen.getByText(/loading.../i);
      expect(loadingText).toHaveClass('font-body');
      expect(loadingText).toHaveClass('text-industrial-graphite-400');
    });
  });
});
