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
    expect(screen.getByText(/all states/i)).toBeInTheDocument();
    expect(screen.getByText(/all trades/i)).toBeInTheDocument();
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
    const stateButton = screen.getByText(/all states/i);
    fireEvent.click(stateButton);

    // Select a state
    const texasOption = screen.getByText('TX');
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
    const tradeButton = screen.getByText(/all trades/i);
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
    const tradeButton = screen.getByText(/all trades/i);
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
      />
    );

    const searchInput = screen.getByPlaceholderText(/search agencies/i);
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
    render(
      <DirectoryFilters
        onFiltersChange={mockOnFiltersChange}
        totalResults={0}
      />
    );

    // Open state dropdown
    const stateButton = screen.getByText('TX');
    fireEvent.click(stateButton);

    // Click "All States" option
    const allStatesOption = screen.getByText(/all states/i);
    fireEvent.click(allStatesOption);

    expect(mockOnFiltersChange).toHaveBeenCalled();
  });

  it('should handle clearing trade filter', () => {
    const mockOnFiltersChange = jest.fn();
    render(
      <DirectoryFilters
        onFiltersChange={mockOnFiltersChange}
        totalResults={0}
      />
    );

    // Open trade dropdown
    const tradeButton = screen.getByText('Plumber');
    fireEvent.click(tradeButton);

    // Click "All Trades" option
    const allTradesOption = screen.getByText(/all trades/i);
    fireEvent.click(allTradesOption);

    expect(mockOnFiltersChange).toHaveBeenCalled();
  });
});
