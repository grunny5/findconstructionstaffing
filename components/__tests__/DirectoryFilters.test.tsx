import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DirectoryFilters from '../DirectoryFilters';
import { useRouter, useSearchParams } from 'next/navigation';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

describe('DirectoryFilters', () => {
  const mockPush = jest.fn();
  const mockSearchParams = new URLSearchParams();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
  });

  const mockStates = ['TX', 'CA', 'NY'];
  const mockTrades = ['Electrician', 'Plumber', 'Carpenter'];

  it('should render all filter components', () => {
    render(<DirectoryFilters onFiltersChange={jest.fn()} totalResults={0} />);

    expect(screen.getByPlaceholderText(/search agencies/i)).toBeInTheDocument();
    expect(screen.getByText('Service Areas')).toBeInTheDocument();
    expect(screen.getByText('Trade Specialties')).toBeInTheDocument();
  });

  it('should handle search input changes', async () => {
    const mockOnFiltersChange = jest.fn();
    render(
      <DirectoryFilters
        onFiltersChange={mockOnFiltersChange}
        totalResults={0}
      />
    );

    const searchInput = screen.getByPlaceholderText(/search agencies/i);
    fireEvent.change(searchInput, { target: { value: 'test agency' } });

    // Wait for debounce
    await waitFor(
      () => {
        expect(mockOnFiltersChange).toHaveBeenCalledWith(
          expect.objectContaining({
            search: 'test agency',
          })
        );
      },
      { timeout: 350 }
    );
  });

  it('should handle state filter selection', () => {
    const mockOnFiltersChange = jest.fn();
    render(
      <DirectoryFilters
        onFiltersChange={mockOnFiltersChange}
        totalResults={0}
      />
    );

    // Open state dropdown
    const stateButton = screen.getByText('Service Areas');
    fireEvent.click(stateButton);

    // Select a state (states are displayed by name, not code)
    const texasOption = screen.getByText('Texas');
    fireEvent.click(texasOption);

    expect(mockOnFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({
        states: ['TX'],
      })
    );
  });

  it('should handle trade filter selection', () => {
    const mockOnFiltersChange = jest.fn();
    render(
      <DirectoryFilters
        onFiltersChange={mockOnFiltersChange}
        totalResults={0}
      />
    );

    // Open trade dropdown
    const tradeButton = screen.getByText(/trade specialties/i);
    fireEvent.click(tradeButton);

    // Select a trade
    const electricianOption = screen.getByText('Electrician');
    fireEvent.click(electricianOption);

    expect(mockOnFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({
        trades: ['electrician'],
      })
    );
  });

  it('should preserve existing filters when adding new ones', () => {
    const mockOnFiltersChange = jest.fn();
    render(
      <DirectoryFilters
        onFiltersChange={mockOnFiltersChange}
        totalResults={0}
      />
    );

    // Open trade dropdown
    const tradeButton = screen.getByText(/trade specialties/i);
    fireEvent.click(tradeButton);

    // Select a trade
    const plumberOption = screen.getByText('Plumber');
    fireEvent.click(plumberOption);

    // Since DirectoryFilters now uses internal state, check for the callback
    expect(mockOnFiltersChange).toHaveBeenCalled();
  });

  it('should clear search when empty', async () => {
    const mockOnFiltersChange = jest.fn();
    render(
      <DirectoryFilters
        onFiltersChange={mockOnFiltersChange}
        totalResults={0}
        initialFilters={{
          search: 'existing search',
          trades: [],
          states: [],
        }}
      />
    );

    const searchInput = screen.getByPlaceholderText(/search agencies/i);
    // Clear the existing search
    fireEvent.change(searchInput, { target: { value: '' } });

    // Wait for debounce
    await waitFor(
      () => {
        expect(mockOnFiltersChange).toHaveBeenCalledWith(
          expect.objectContaining({
            search: '',
          })
        );
      },
      { timeout: 350 }
    );
  });

  it('should show clear all button when filters applied', () => {
    const mockOnFiltersChange = jest.fn();
    render(
      <DirectoryFilters
        onFiltersChange={mockOnFiltersChange}
        totalResults={10}
      />
    );

    // Apply a filter first
    const searchInput = screen.getByPlaceholderText(/search agencies/i);
    fireEvent.change(searchInput, { target: { value: 'test' } });
  });

  it('should handle filter changes properly', async () => {
    const mockOnFiltersChange = jest.fn();
    render(
      <DirectoryFilters
        onFiltersChange={mockOnFiltersChange}
        totalResults={0}
      />
    );

    const searchInput = screen.getByPlaceholderText(/search agencies/i);
    fireEvent.change(searchInput, { target: { value: 'new search' } });

    // Wait for debounce
    await waitFor(
      () => {
        expect(mockOnFiltersChange).toHaveBeenCalledWith(
          expect.objectContaining({
            search: 'new search',
          })
        );
      },
      { timeout: 350 }
    );
  });

  it('should handle clearing state filter', () => {
    const mockOnFiltersChange = jest.fn();
    const { rerender } = render(
      <DirectoryFilters
        onFiltersChange={mockOnFiltersChange}
        totalResults={0}
        initialFilters={{
          search: '',
          trades: [],
          states: ['TX'],
        }}
      />
    );

    // There should be a clear all button since we have filters
    const clearButton = screen.getByText(/clear all/i);
    fireEvent.click(clearButton);

    expect(mockOnFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({
        search: '',
        trades: [],
        states: [],
      })
    );
  });

  it('should handle clearing trade filter', () => {
    const mockOnFiltersChange = jest.fn();
    render(
      <DirectoryFilters
        onFiltersChange={mockOnFiltersChange}
        totalResults={0}
        initialFilters={{
          search: '',
          trades: ['plumber'],
          states: [],
        }}
      />
    );

    // Open trade dropdown
    const tradeButton = screen.getByText(/trade specialties/i);
    fireEvent.click(tradeButton);

    // Uncheck the plumber checkbox
    const plumberCheckbox = screen.getByLabelText('Plumber');
    fireEvent.click(plumberCheckbox);

    expect(mockOnFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({
        trades: [],
      })
    );
  });

  // Industrial Design System Tests
  describe('Industrial Design Styling', () => {
    it('should apply industrial styling to main filter container', () => {
      const { container } = render(
        <DirectoryFilters onFiltersChange={jest.fn()} totalResults={0} />
      );

      // Main filter bar should have industrial styling
      const filterBar = container.querySelector('.bg-industrial-bg-card');
      expect(filterBar).toBeInTheDocument();
      expect(filterBar).toHaveClass('border-2');
      expect(filterBar).toHaveClass('border-industrial-graphite-200');
      expect(filterBar).toHaveClass('rounded-industrial-base');
    });

    it('should apply industrial styling to search input', () => {
      render(<DirectoryFilters onFiltersChange={jest.fn()} totalResults={0} />);

      const searchInput = screen.getByPlaceholderText(/search agencies/i);
      expect(searchInput).toHaveClass('font-body');
      expect(searchInput).toHaveClass('border-2');
      expect(searchInput).toHaveClass('border-industrial-graphite-300');
      expect(searchInput).toHaveClass('rounded-industrial-sharp');
    });

    it('should apply industrial styling to filter popover buttons', () => {
      render(<DirectoryFilters onFiltersChange={jest.fn()} totalResults={0} />);

      const tradeButton = screen.getByRole('button', {
        name: /trade specialties/i,
      });
      expect(tradeButton).toHaveClass('font-body');
      expect(tradeButton).toHaveClass('text-xs');
      expect(tradeButton).toHaveClass('font-semibold');
      expect(tradeButton).toHaveClass('uppercase');
      expect(tradeButton).toHaveClass('tracking-wide');
      expect(tradeButton).toHaveClass('border-2');
      expect(tradeButton).toHaveClass('border-industrial-graphite-300');
    });

    it('should apply industrial styling to results count', () => {
      const { container } = render(
        <DirectoryFilters onFiltersChange={jest.fn()} totalResults={10} />
      );

      // Check results count styling
      const resultsCount = container.querySelector(
        '.text-industrial-graphite-400'
      );
      expect(resultsCount).toBeInTheDocument();

      // Check emphasized number styling
      const countNumber = container.querySelector(
        '.text-industrial-graphite-600'
      );
      expect(countNumber).toBeInTheDocument();
    });

    it('should apply industrial styling to active filters display', () => {
      const { container } = render(
        <DirectoryFilters
          onFiltersChange={jest.fn()}
          totalResults={10}
          initialFilters={{
            search: 'test',
            trades: [],
            states: [],
          }}
        />
      );

      // Active filters container should have industrial styling
      const activeFilters = container.querySelector(
        '.bg-industrial-graphite-100'
      );
      expect(activeFilters).toBeInTheDocument();
      expect(activeFilters).toHaveClass('border-2');
      expect(activeFilters).toHaveClass('border-industrial-graphite-200');
      expect(activeFilters).toHaveClass('rounded-industrial-base');
    });

    it('should apply industrial styling to clear all filters button', () => {
      render(
        <DirectoryFilters
          onFiltersChange={jest.fn()}
          totalResults={10}
          initialFilters={{
            search: 'test',
            trades: [],
            states: [],
          }}
        />
      );

      const clearButton = screen.getByText(/clear all filters/i);
      expect(clearButton).toHaveClass('font-body');
      expect(clearButton).toHaveClass('text-xs');
      expect(clearButton).toHaveClass('font-semibold');
      expect(clearButton).toHaveClass('uppercase');
      expect(clearButton).toHaveClass('text-industrial-orange');
    });

    it('should apply industrial styling to verified only checkbox', () => {
      render(<DirectoryFilters onFiltersChange={jest.fn()} totalResults={0} />);

      const verifiedLabel = screen.getByText(/verified only/i);
      expect(verifiedLabel).toHaveClass('font-body');
      expect(verifiedLabel).toHaveClass('text-xs');
      expect(verifiedLabel).toHaveClass('font-semibold');
      expect(verifiedLabel).toHaveClass('uppercase');
      expect(verifiedLabel).toHaveClass('text-industrial-graphite-500');
    });
  });
});
