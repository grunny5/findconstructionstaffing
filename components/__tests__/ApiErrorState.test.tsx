/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import ApiErrorState from '../ApiErrorState';

describe('ApiErrorState', () => {
  const mockRetry = jest.fn();

  beforeEach(() => {
    mockRetry.mockClear();
  });

  it('renders with default error message', () => {
    render(<ApiErrorState />);
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/We encountered an error while loading the data/)).toBeInTheDocument();
  });

  it('renders with custom error message', () => {
    const customMessage = 'Custom error message';
    render(<ApiErrorState message={customMessage} />);
    
    expect(screen.getByText(customMessage)).toBeInTheDocument();
  });

  it('renders with custom title', () => {
    const customTitle = 'Custom Error Title';
    render(<ApiErrorState title={customTitle} />);
    
    expect(screen.getByText(customTitle)).toBeInTheDocument();
  });

  it('renders network error state correctly', () => {
    render(<ApiErrorState isNetworkError={true} />);
    
    expect(screen.getByText('Connection Problem')).toBeInTheDocument();
    expect(screen.getByText(/Unable to connect to our servers/)).toBeInTheDocument();
  });

  it('renders error message from Error object', () => {
    const error = new Error('Test error message');
    render(<ApiErrorState error={error} />);
    
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('renders retry button when onRetry is provided', () => {
    render(<ApiErrorState onRetry={mockRetry} />);
    
    const retryButton = screen.getByRole('button', { name: /try again/i });
    expect(retryButton).toBeInTheDocument();
  });

  it('does not render retry button when onRetry is not provided', () => {
    render(<ApiErrorState />);
    
    const retryButton = screen.queryByRole('button', { name: /try again/i });
    expect(retryButton).not.toBeInTheDocument();
  });

  it('calls onRetry when retry button is clicked', () => {
    render(<ApiErrorState onRetry={mockRetry} />);
    
    const retryButton = screen.getByRole('button', { name: /try again/i });
    fireEvent.click(retryButton);
    
    expect(mockRetry).toHaveBeenCalledTimes(1);
  });

  it('renders children content', () => {
    const childContent = <div data-testid="child-content">Additional information</div>;
    render(<ApiErrorState>{childContent}</ApiErrorState>);
    
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });

  it('uses appropriate icons for different error types', () => {
    const { container, rerender } = render(<ApiErrorState />);
    
    // Default error should use AlertCircle icon (Lucide icons use svg elements)
    let icon = container.querySelector('.lucide-circle-alert');
    expect(icon).toBeInTheDocument();
    
    // Network error should use WifiOff icon
    rerender(<ApiErrorState isNetworkError={true} />);
    icon = container.querySelector('.lucide-wifi-off');
    expect(icon).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<ApiErrorState onRetry={mockRetry} />);
    
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    
    const retryButton = screen.getByRole('button', { name: /try again/i });
    // Shadcn Button component renders as a button element which has implicit type="button"
    expect(retryButton.tagName).toBe('BUTTON');
  });

  it('applies correct styling classes', () => {
    const { container } = render(<ApiErrorState />);
    
    const alert = container.querySelector('.bg-red-50.border-red-200');
    expect(alert).toBeInTheDocument();
    
    const title = container.querySelector('.text-red-900');
    expect(title).toBeInTheDocument();
    
    const description = container.querySelector('.text-red-700');
    expect(description).toBeInTheDocument();
  });
});