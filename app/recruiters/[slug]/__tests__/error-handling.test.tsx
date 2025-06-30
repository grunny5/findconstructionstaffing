/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import ProfileError from '../error';
import AgencyNotFound from '../not-found';
import { useRouter } from 'next/navigation';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}));

// Mock console.error to prevent test output noise
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe('Profile Page Error Handling', () => {
  describe('Error Boundary Component', () => {
    const mockReset = jest.fn();
    const mockError = new Error('Test error message');

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should render error state with message', () => {
      render(<ProfileError error={mockError} reset={mockReset} />);

      expect(screen.getByText('Something went wrong!')).toBeInTheDocument();
      expect(screen.getByText(/We encountered an error while loading this agency profile/)).toBeInTheDocument();
    });

    it('should show Try Again button that calls reset', () => {
      render(<ProfileError error={mockError} reset={mockReset} />);

      const tryAgainButton = screen.getByText('Try Again');
      fireEvent.click(tryAgainButton);

      expect(mockReset).toHaveBeenCalledTimes(1);
    });

    it('should show Back to Directory link', () => {
      render(<ProfileError error={mockError} reset={mockReset} />);

      const backLink = screen.getByText('Back to Directory');
      expect(backLink).toBeInTheDocument();
      expect(backLink.closest('a')).toHaveAttribute('href', '/');
    });

    it('should log error to console', () => {
      render(<ProfileError error={mockError} reset={mockReset} />);

      expect(console.error).toHaveBeenCalledWith('Profile page error:', mockError);
    });

    it('should show error details in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const errorWithDigest = {
        ...mockError,
        digest: 'error-123'
      };

      render(<ProfileError error={errorWithDigest} reset={mockReset} />);

      expect(screen.getByText(`Error: ${mockError.message}`)).toBeInTheDocument();
      expect(screen.getByText('Error ID: error-123')).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });

    it('should not show error details in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      render(<ProfileError error={mockError} reset={mockReset} />);

      expect(screen.queryByText(`Error: ${mockError.message}`)).not.toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Not Found Component', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      // Mock window.history.back
      Object.defineProperty(window, 'history', {
        configurable: true,
        value: { back: jest.fn() }
      });
    });

    it('should render not found message', () => {
      render(<AgencyNotFound />);

      expect(screen.getByText('Agency Not Found')).toBeInTheDocument();
      expect(screen.getByText(/We couldn't find the staffing agency/)).toBeInTheDocument();
    });

    it('should show Browse All Agencies link', () => {
      render(<AgencyNotFound />);

      const browseLink = screen.getByText('Browse All Agencies');
      expect(browseLink).toBeInTheDocument();
      expect(browseLink.closest('a')).toHaveAttribute('href', '/');
    });

    it('should show Go Back button that uses history.back', () => {
      render(<AgencyNotFound />);

      const goBackButton = screen.getByText('Go Back');
      fireEvent.click(goBackButton);

      expect(window.history.back).toHaveBeenCalledTimes(1);
    });

    it('should show helpful tip', () => {
      render(<AgencyNotFound />);

      expect(screen.getByText(/Try searching for the agency by name/)).toBeInTheDocument();
    });
  });

  describe('Global Not Found Component', () => {
    it('should render 404 page content', () => {
      const NotFound = require('@/app/not-found').default;
      render(<NotFound />);

      expect(screen.getByText('404')).toBeInTheDocument();
      expect(screen.getByText('Page Not Found')).toBeInTheDocument();
      expect(screen.getByText(/The page you're looking for doesn't exist/)).toBeInTheDocument();
    });

    it('should show navigation options', () => {
      const NotFound = require('@/app/not-found').default;
      render(<NotFound />);

      const homeLink = screen.getByText('Go to Homepage');
      expect(homeLink).toBeInTheDocument();
      expect(homeLink.closest('a')).toHaveAttribute('href', '/');

      const browseLink = screen.getByText('Browse Agencies');
      expect(browseLink).toBeInTheDocument();
      expect(browseLink.closest('a')).toHaveAttribute('href', '/#directory');
    });
  });
});