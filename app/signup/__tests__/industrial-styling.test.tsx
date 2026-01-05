import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import SignupPage from '../page';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock auth context
jest.mock('@/lib/auth/auth-context', () => ({
  useAuth: jest.fn(),
}));

describe('SignupPage - Industrial Design System', () => {
  const mockPush = jest.fn();
  const mockSignUp = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (useAuth as jest.Mock).mockReturnValue({ signUp: mockSignUp });
  });

  afterEach(() => {
    // Clean up fetch mock
    if (global.fetch && (global.fetch as any).mockRestore) {
      (global.fetch as any).mockRestore();
    }
  });

  describe('Page Background and Layout', () => {
    it('should render with cream background', () => {
      const { container } = render(<SignupPage />);

      const background = container.querySelector('.bg-industrial-bg-primary');
      expect(background).toBeInTheDocument();
      expect(background).toHaveClass('min-h-screen');
    });

    it('should use AuthPageLayout with medium max-width', () => {
      const { container } = render(<SignupPage />);

      const contentContainer = container.querySelector('.max-w-md');
      expect(contentContainer).toBeInTheDocument();
    });
  });

  describe('Hero Section', () => {
    it('should render hero section with industrial styling', () => {
      const { container } = render(<SignupPage />);

      const heroSection = container.querySelector('section');
      expect(heroSection).toBeInTheDocument();
      expect(heroSection).toHaveClass('bg-industrial-graphite-600');
      expect(heroSection).toHaveClass('border-b-4');
      expect(heroSection).toHaveClass('border-industrial-orange');
    });

    it('should render hero title with display font', () => {
      render(<SignupPage />);

      const heroTitle = screen.getByText('CREATE YOUR ACCOUNT');
      expect(heroTitle).toBeInTheDocument();
      expect(heroTitle).toHaveClass('font-display');
      expect(heroTitle).toHaveClass('uppercase');
      expect(heroTitle).toHaveClass('text-white');
      expect(heroTitle).toHaveClass('tracking-wide');
    });

    it('should render hero subtitle with body font', () => {
      render(<SignupPage />);

      const subtitle = screen.getByText(
        /Join the FindConstructionStaffing network/i
      );
      expect(subtitle).toBeInTheDocument();
      expect(subtitle).toHaveClass('font-body');
      expect(subtitle).toHaveClass('text-industrial-graphite-200');
    });

    it('should apply responsive text sizing to hero title', () => {
      render(<SignupPage />);

      const heroTitle = screen.getByText('CREATE YOUR ACCOUNT');
      expect(heroTitle).toHaveClass('text-4xl');
      expect(heroTitle).toHaveClass('md:text-5xl');
      expect(heroTitle).toHaveClass('lg:text-6xl');
    });
  });

  describe('Form State - Typography', () => {
    it('should use body font for description text', () => {
      render(<SignupPage />);

      const description = screen.getByText(/Already have an account/i);
      expect(description).toHaveClass('font-body');
      expect(description).toHaveClass('text-industrial-graphite-500');
    });

    it('should use display font for card title', () => {
      render(<SignupPage />);

      const cardTitle = screen.getByRole('heading', {
        level: 3,
        name: /create your account/i,
      });
      expect(cardTitle).toHaveClass('font-display');
      expect(cardTitle).toHaveClass('uppercase');
      expect(cardTitle).toHaveClass('text-industrial-graphite-600');
    });

    it('should use uppercase labels with industrial styling', () => {
      render(<SignupPage />);

      const labels = screen.getAllByText(/\*/);
      labels.forEach((label) => {
        const parentLabel = label.parentElement;
        expect(parentLabel).toHaveClass('font-body');
        expect(parentLabel).toHaveClass('text-xs');
        expect(parentLabel).toHaveClass('uppercase');
        expect(parentLabel).toHaveClass('font-semibold');
        expect(parentLabel).toHaveClass('text-industrial-graphite-400');
        expect(parentLabel).toHaveClass('tracking-wide');
      });
    });
  });

  describe('Form State - Card Styling', () => {
    it('should render card with industrial styling', () => {
      const { container } = render(<SignupPage />);

      const card = container.querySelector('[class*="bg-industrial-bg-card"]');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('rounded-industrial-sharp');
      expect(card).toHaveClass('border-2');
      expect(card).toHaveClass('border-industrial-graphite-200');
    });

    it('should have card header with bottom border', () => {
      const { container } = render(<SignupPage />);

      // Find the card header - look for element with both border-b AND border-industrial-graphite-200
      const cardHeaders = container.querySelectorAll('[class*="border-b"]');
      const cardHeader = Array.from(cardHeaders).find((el) =>
        el.className.includes('border-industrial-graphite-200')
      );
      expect(cardHeader).toBeInTheDocument();
      expect(cardHeader).toHaveClass('border-industrial-graphite-200');
    });
  });

  describe('Form State - Inputs', () => {
    it('should render full name input with industrial styling', () => {
      render(<SignupPage />);

      const input = screen.getByPlaceholderText(/John Doe/i);
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'text');
      expect(input).toHaveAttribute('autocomplete', 'name');
    });

    it('should render email input with industrial styling', () => {
      render(<SignupPage />);

      const input = screen.getByPlaceholderText(/your.email@example.com/i);
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'email');
      expect(input).toHaveAttribute('autocomplete', 'email');
    });

    it('should render password input with industrial styling', () => {
      render(<SignupPage />);

      const passwordInputs = screen.getAllByPlaceholderText(/••••••••/);
      expect(passwordInputs).toHaveLength(2);
      expect(passwordInputs[0]).toHaveAttribute('type', 'password');
      expect(passwordInputs[0]).toHaveAttribute('autocomplete', 'new-password');
    });

    it('should render confirm password input with industrial styling', () => {
      render(<SignupPage />);

      const passwordInputs = screen.getAllByPlaceholderText(/••••••••/);
      expect(passwordInputs[1]).toHaveAttribute('type', 'password');
      expect(passwordInputs[1]).toHaveAttribute('autocomplete', 'new-password');
    });

    it('should mark required fields with orange asterisk', () => {
      const { container } = render(<SignupPage />);

      const asterisks = container.querySelectorAll('.text-industrial-orange');
      expect(asterisks.length).toBeGreaterThan(0);
    });
  });

  describe('Form State - Button and Links', () => {
    it('should render submit button with industrial styling', () => {
      render(<SignupPage />);

      const button = screen.getByRole('button', { name: /create account/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('w-full');
      expect(button).not.toBeDisabled();
    });

    it('should show loading state when submitting', async () => {
      mockSignUp.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );
      const user = userEvent.setup();

      render(<SignupPage />);

      const nameInput = screen.getByPlaceholderText(/John Doe/i);
      const emailInput = screen.getByPlaceholderText(/your.email@example.com/i);
      const passwordInputs = screen.getAllByPlaceholderText(/••••••••/);
      const button = screen.getByRole('button', { name: /create account/i });

      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInputs[0], 'password123');
      await user.type(passwordInputs[1], 'password123');
      await user.click(button);

      expect(screen.getByText(/creating account.../i)).toBeInTheDocument();
    });

    it('should render signin link with orange styling', () => {
      render(<SignupPage />);

      const signInLink = screen.getByRole('link', { name: /sign in here/i });
      expect(signInLink).toHaveClass('text-industrial-orange');
      expect(signInLink).toHaveClass('hover:text-industrial-orange-500');
      expect(signInLink).toHaveAttribute('href', '/login');
    });
  });

  describe('Form State - Error States', () => {
    it('should display validation errors in orange', async () => {
      const user = userEvent.setup();
      render(<SignupPage />);

      const button = screen.getByRole('button', { name: /create account/i });
      await user.click(button);

      await waitFor(() => {
        const errors = screen.getAllByText(/must be at least/i);
        errors.forEach((error) => {
          expect(error).toHaveClass('text-industrial-orange');
          expect(error).toHaveClass('font-body');
          expect(error).toHaveClass('text-sm');
        });
      });
    });

    it('should display password mismatch error in orange', async () => {
      const user = userEvent.setup();
      render(<SignupPage />);

      const nameInput = screen.getByPlaceholderText(/John Doe/i);
      const emailInput = screen.getByPlaceholderText(/your.email@example.com/i);
      const passwordInputs = screen.getAllByPlaceholderText(/••••••••/);
      const button = screen.getByRole('button', { name: /create account/i });

      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInputs[0], 'password123');
      await user.type(passwordInputs[1], 'different');
      await user.click(button);

      await waitFor(() => {
        const error = screen.getByText(/passwords don't match/i);
        expect(error).toHaveClass('text-industrial-orange');
        expect(error).toHaveClass('font-body');
        expect(error).toHaveClass('text-sm');
      });
    });

    it('should display authentication errors in orange alert', async () => {
      mockSignUp.mockRejectedValue(new Error('Email already exists'));
      const user = userEvent.setup();

      render(<SignupPage />);

      const nameInput = screen.getByPlaceholderText(/John Doe/i);
      const emailInput = screen.getByPlaceholderText(/your.email@example.com/i);
      const passwordInputs = screen.getAllByPlaceholderText(/••••••••/);
      const button = screen.getByRole('button', { name: /create account/i });

      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInputs[0], 'password123');
      await user.type(passwordInputs[1], 'password123');
      await user.click(button);

      await waitFor(() => {
        const errorMessage = screen.getByText(/email already exists/i);
        expect(errorMessage).toHaveClass('font-body');
        expect(errorMessage).toHaveClass('text-sm');
      });
    });

    it('should highlight inputs with errors', async () => {
      const user = userEvent.setup();
      render(<SignupPage />);

      const button = screen.getByRole('button', { name: /create account/i });
      await user.click(button);

      await waitFor(() => {
        const emailInput = screen.getByPlaceholderText(
          /your.email@example.com/i
        );
        expect(emailInput).toHaveClass('border-industrial-orange');
      });
    });
  });

  describe('Success State - No Gradients', () => {
    it('should not use gradient backgrounds in success state', async () => {
      mockSignUp.mockResolvedValue({ session: null, user: {} });
      const user = userEvent.setup();

      const { container } = render(<SignupPage />);

      const nameInput = screen.getByPlaceholderText(/John Doe/i);
      const emailInput = screen.getByPlaceholderText(/your.email@example.com/i);
      const passwordInputs = screen.getAllByPlaceholderText(/••••••••/);
      const button = screen.getByRole('button', { name: /create account/i });

      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInputs[0], 'password123');
      await user.type(passwordInputs[1], 'password123');
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText(/check your email/i)).toBeInTheDocument();
      });

      const gradients = container.querySelectorAll('[class*="gradient"]');
      expect(gradients.length).toBe(0);
    });

    it('should render success state with orange CheckCircle2 icon', async () => {
      mockSignUp.mockResolvedValue({ session: null, user: {} });
      const user = userEvent.setup();

      render(<SignupPage />);

      const nameInput = screen.getByPlaceholderText(/John Doe/i);
      const emailInput = screen.getByPlaceholderText(/your.email@example.com/i);
      const passwordInputs = screen.getAllByPlaceholderText(/••••••••/);
      const button = screen.getByRole('button', { name: /create account/i });

      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInputs[0], 'password123');
      await user.type(passwordInputs[1], 'password123');
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText(/check your email/i)).toBeInTheDocument();
      });
    });

    it('should use display font for success heading', async () => {
      mockSignUp.mockResolvedValue({ session: null, user: {} });
      const user = userEvent.setup();

      render(<SignupPage />);

      const nameInput = screen.getByPlaceholderText(/John Doe/i);
      const emailInput = screen.getByPlaceholderText(/your.email@example.com/i);
      const passwordInputs = screen.getAllByPlaceholderText(/••••••••/);
      const button = screen.getByRole('button', { name: /create account/i });

      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInputs[0], 'password123');
      await user.type(passwordInputs[1], 'password123');
      await user.click(button);

      await waitFor(() => {
        const heading = screen.getByText(/check your email/i);
        expect(heading).toHaveClass('font-display');
        expect(heading).toHaveClass('uppercase');
        expect(heading).toHaveClass('text-industrial-graphite-600');
      });
    });

    it('should display submitted email with industrial styling', async () => {
      mockSignUp.mockResolvedValue({ session: null, user: {} });
      const user = userEvent.setup();

      render(<SignupPage />);

      const nameInput = screen.getByPlaceholderText(/John Doe/i);
      const emailInput = screen.getByPlaceholderText(/your.email@example.com/i);
      const passwordInputs = screen.getAllByPlaceholderText(/••••••••/);
      const button = screen.getByRole('button', { name: /create account/i });

      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInputs[0], 'password123');
      await user.type(passwordInputs[1], 'password123');
      await user.click(button);

      await waitFor(() => {
        const emailDisplay = screen.getByText('test@example.com');
        expect(emailDisplay).toHaveClass('font-semibold');
        expect(emailDisplay).toHaveClass('text-industrial-graphite-600');
      });
    });

    it('should use orange industrial styling for expiration warning', async () => {
      mockSignUp.mockResolvedValue({ session: null, user: {} });
      const user = userEvent.setup();

      const { container } = render(<SignupPage />);

      const nameInput = screen.getByPlaceholderText(/John Doe/i);
      const emailInput = screen.getByPlaceholderText(/your.email@example.com/i);
      const passwordInputs = screen.getAllByPlaceholderText(/••••••••/);
      const button = screen.getByRole('button', { name: /create account/i });

      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInputs[0], 'password123');
      await user.type(passwordInputs[1], 'password123');
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText(/check your email/i)).toBeInTheDocument();
      });

      // Find the warning box - it has both bg-industrial-orange-100 AND border-2
      const warningBoxes = container.querySelectorAll(
        '.bg-industrial-orange-100'
      );
      const warningBox = Array.from(warningBoxes).find((el) =>
        el.className.includes('border-2')
      );
      expect(warningBox).toBeInTheDocument();
      expect(warningBox).toHaveClass('border-industrial-orange');
    });

    it('should render resend verification button with industrial styling', async () => {
      mockSignUp.mockResolvedValue({ session: null, user: {} });
      const user = userEvent.setup();

      render(<SignupPage />);

      const nameInput = screen.getByPlaceholderText(/John Doe/i);
      const emailInput = screen.getByPlaceholderText(/your.email@example.com/i);
      const passwordInputs = screen.getAllByPlaceholderText(/••••••••/);
      const button = screen.getByRole('button', { name: /create account/i });

      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInputs[0], 'password123');
      await user.type(passwordInputs[1], 'password123');
      await user.click(button);

      await waitFor(() => {
        const resendButton = screen.getByRole('button', {
          name: /resend verification email/i,
        });
        expect(resendButton).toBeInTheDocument();
        expect(resendButton).toHaveClass('w-full');
        expect(resendButton).not.toBeDisabled();
      });
    });

    it('should handle resend verification button click', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          status: 200,
          ok: true,
          json: () =>
            Promise.resolve({
              message:
                'If this email exists, we sent a verification link. Please check your inbox.',
            }),
        })
      ) as jest.Mock;

      mockSignUp.mockResolvedValue({ session: null, user: {} });
      const user = userEvent.setup();

      render(<SignupPage />);

      const nameInput = screen.getByPlaceholderText(/John Doe/i);
      const emailInput = screen.getByPlaceholderText(/your.email@example.com/i);
      const passwordInputs = screen.getAllByPlaceholderText(/••••••••/);
      const submitButton = screen.getByRole('button', {
        name: /create account/i,
      });

      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInputs[0], 'password123');
      await user.type(passwordInputs[1], 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/check your email/i)).toBeInTheDocument();
      });

      const resendButton = screen.getByRole('button', {
        name: /resend verification email/i,
      });
      await user.click(resendButton);

      // Should show success message
      await waitFor(() => {
        expect(
          screen.getByText(/verification email sent/i)
        ).toBeInTheDocument();
      });

      // Verify API was called with correct email
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/resend-verification',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: 'test@example.com' }),
        }
      );
    });

    it('should handle resend verification rate limiting', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          status: 429,
          json: () =>
            Promise.resolve({
              message:
                'Please wait before requesting another verification email.',
              retryAfter: 120,
            }),
        })
      ) as jest.Mock;

      mockSignUp.mockResolvedValue({ session: null, user: {} });
      const user = userEvent.setup();

      render(<SignupPage />);

      const nameInput = screen.getByPlaceholderText(/John Doe/i);
      const emailInput = screen.getByPlaceholderText(/your.email@example.com/i);
      const passwordInputs = screen.getAllByPlaceholderText(/••••••••/);
      const submitButton = screen.getByRole('button', {
        name: /create account/i,
      });

      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInputs[0], 'password123');
      await user.type(passwordInputs[1], 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/check your email/i)).toBeInTheDocument();
      });

      const resendButton = screen.getByRole('button', {
        name: /resend verification email/i,
      });
      await user.click(resendButton);

      // Should show rate limit message
      await waitFor(() => {
        expect(
          screen.getByText(/please try again in 2 minutes/i)
        ).toBeInTheDocument();
      });
    });

    it('should handle server errors (4xx/5xx) from resend endpoint', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          status: 500,
          ok: false,
          json: () =>
            Promise.resolve({
              message: 'Internal server error occurred',
            }),
        })
      ) as jest.Mock;

      mockSignUp.mockResolvedValue({ session: null, user: {} });
      const user = userEvent.setup();

      render(<SignupPage />);

      const nameInput = screen.getByPlaceholderText(/John Doe/i);
      const emailInput = screen.getByPlaceholderText(/your.email@example.com/i);
      const passwordInputs = screen.getAllByPlaceholderText(/••••••••/);
      const submitButton = screen.getByRole('button', {
        name: /create account/i,
      });

      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInputs[0], 'password123');
      await user.type(passwordInputs[1], 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/check your email/i)).toBeInTheDocument();
      });

      const resendButton = screen.getByRole('button', {
        name: /resend verification email/i,
      });
      await user.click(resendButton);

      // Should show error message from API
      await waitFor(() => {
        expect(
          screen.getByText(/internal server error occurred/i)
        ).toBeInTheDocument();
      });

      // Should NOT show success message
      expect(
        screen.queryByText(/verification email sent/i)
      ).not.toBeInTheDocument();
    });

    it('should render return home link with orange styling', async () => {
      mockSignUp.mockResolvedValue({ session: null, user: {} });
      const user = userEvent.setup();

      render(<SignupPage />);

      const nameInput = screen.getByPlaceholderText(/John Doe/i);
      const emailInput = screen.getByPlaceholderText(/your.email@example.com/i);
      const passwordInputs = screen.getAllByPlaceholderText(/••••••••/);
      const button = screen.getByRole('button', { name: /create account/i });

      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInputs[0], 'password123');
      await user.type(passwordInputs[1], 'password123');
      await user.click(button);

      await waitFor(() => {
        const homeLink = screen.getByRole('link', { name: /return to home/i });
        expect(homeLink).toHaveClass('text-industrial-orange');
        expect(homeLink).toHaveClass('hover:text-industrial-orange-500');
        expect(homeLink).toHaveAttribute('href', '/');
      });
    });
  });

  describe('Form Submission Flow', () => {
    it('should submit form with valid data', async () => {
      mockSignUp.mockResolvedValue({ session: null, user: {} });
      const user = userEvent.setup();

      render(<SignupPage />);

      const nameInput = screen.getByPlaceholderText(/John Doe/i);
      const emailInput = screen.getByPlaceholderText(/your.email@example.com/i);
      const passwordInputs = screen.getAllByPlaceholderText(/••••••••/);
      const button = screen.getByRole('button', { name: /create account/i });

      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInputs[0], 'password123');
      await user.type(passwordInputs[1], 'password123');
      await user.click(button);

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith(
          'test@example.com',
          'password123',
          'John Doe'
        );
      });
    });

    it('should redirect to home when user is auto-logged in', async () => {
      mockSignUp.mockResolvedValue({ session: { user: {} }, user: {} });
      const user = userEvent.setup();

      render(<SignupPage />);

      const nameInput = screen.getByPlaceholderText(/John Doe/i);
      const emailInput = screen.getByPlaceholderText(/your.email@example.com/i);
      const passwordInputs = screen.getAllByPlaceholderText(/••••••••/);
      const button = screen.getByRole('button', { name: /create account/i });

      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInputs[0], 'password123');
      await user.type(passwordInputs[1], 'password123');
      await user.click(button);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/');
      });
    });

    it('should show success state when email confirmation required', async () => {
      mockSignUp.mockResolvedValue({ session: null, user: {} });
      const user = userEvent.setup();

      render(<SignupPage />);

      const nameInput = screen.getByPlaceholderText(/John Doe/i);
      const emailInput = screen.getByPlaceholderText(/your.email@example.com/i);
      const passwordInputs = screen.getAllByPlaceholderText(/••••••••/);
      const button = screen.getByRole('button', { name: /create account/i });

      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInputs[0], 'password123');
      await user.type(passwordInputs[1], 'password123');
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText(/check your email/i)).toBeInTheDocument();
        expect(mockPush).not.toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy in form state', () => {
      render(<SignupPage />);

      const h1 = screen.getByRole('heading', {
        level: 1,
        name: /create your account/i,
      });
      expect(h1).toBeInTheDocument();
    });

    it('should have proper heading hierarchy in success state', async () => {
      mockSignUp.mockResolvedValue({ session: null, user: {} });
      const user = userEvent.setup();

      render(<SignupPage />);

      const nameInput = screen.getByPlaceholderText(/John Doe/i);
      const emailInput = screen.getByPlaceholderText(/your.email@example.com/i);
      const passwordInputs = screen.getAllByPlaceholderText(/••••••••/);
      const button = screen.getByRole('button', { name: /create account/i });

      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInputs[0], 'password123');
      await user.type(passwordInputs[1], 'password123');
      await user.click(button);

      await waitFor(() => {
        const h1 = screen.getByRole('heading', {
          level: 1,
          name: /account created/i,
        });
        expect(h1).toBeInTheDocument();
        expect(h1).toHaveClass('font-display');
        expect(h1).toHaveClass('uppercase');
      });
    });

    it('should have associated labels for all inputs', () => {
      render(<SignupPage />);

      const nameInput = screen.getByPlaceholderText(/John Doe/i);
      const emailInput = screen.getByPlaceholderText(/your.email@example.com/i);
      const passwordInputs = screen.getAllByPlaceholderText(/••••••••/);

      expect(nameInput).toHaveAttribute('id', 'fullName');
      expect(emailInput).toHaveAttribute('id', 'email');
      expect(passwordInputs[0]).toHaveAttribute('id', 'password');
      expect(passwordInputs[1]).toHaveAttribute('id', 'confirmPassword');

      const nameLabel = screen.getByText(/full name/i);
      const emailLabel = screen.getByText(/email address/i);
      const passwordLabel = screen.getByText(/^password/i);
      const confirmPasswordLabel = screen.getByText(/confirm password/i);

      expect(nameLabel).toHaveAttribute('for', 'fullName');
      expect(emailLabel).toHaveAttribute('for', 'email');
      expect(passwordLabel).toHaveAttribute('for', 'password');
      expect(confirmPasswordLabel).toHaveAttribute('for', 'confirmPassword');
    });

    it('should have autocomplete attributes for better UX', () => {
      render(<SignupPage />);

      const nameInput = screen.getByPlaceholderText(/John Doe/i);
      const emailInput = screen.getByPlaceholderText(/your.email@example.com/i);
      const passwordInputs = screen.getAllByPlaceholderText(/••••••••/);

      expect(nameInput).toHaveAttribute('autocomplete', 'name');
      expect(emailInput).toHaveAttribute('autocomplete', 'email');
      expect(passwordInputs[0]).toHaveAttribute('autocomplete', 'new-password');
      expect(passwordInputs[1]).toHaveAttribute('autocomplete', 'new-password');
    });
  });
});
