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
    render(
      <DirectoryFilters
        states={mockStates}
        trades={mockTrades}
        selectedState=""
        selectedTrade=""
      />
    );

    expect(screen.getByPlaceholderText(/search agencies/i)).toBeInTheDocument();
    expect(screen.getByText(/all states/i)).toBeInTheDocument();
    expect(screen.getByText(/all trades/i)).toBeInTheDocument();
  });

  it('should handle search input changes', async () => {
    render(
      <DirectoryFilters
        states={mockStates}
        trades={mockTrades}
        selectedState=""
        selectedTrade=""
      />
    );

    const searchInput = screen.getByPlaceholderText(/search agencies/i);
    fireEvent.change(searchInput, { target: { value: 'test agency' } });

    // Wait for debounce
    await waitFor(
      () => {
        expect(mockPush).toHaveBeenCalledWith('/?search=test+agency');
      },
      { timeout: 350 }
    );
  });

  it('should handle state filter selection', () => {
    render(
      <DirectoryFilters
        states={mockStates}
        trades={mockTrades}
        selectedState=""
        selectedTrade=""
      />
    );

    // Open state dropdown
    const stateButton = screen.getByText(/all states/i);
    fireEvent.click(stateButton);

    // Select a state
    const texasOption = screen.getByText('TX');
    fireEvent.click(texasOption);

    expect(mockPush).toHaveBeenCalledWith('/?state=TX');
  });

  it('should handle trade filter selection', () => {
    render(
      <DirectoryFilters
        states={mockStates}
        trades={mockTrades}
        selectedState=""
        selectedTrade=""
      />
    );

    // Open trade dropdown
    const tradeButton = screen.getByText(/all trades/i);
    fireEvent.click(tradeButton);

    // Select a trade
    const electricianOption = screen.getByText('Electrician');
    fireEvent.click(electricianOption);

    expect(mockPush).toHaveBeenCalledWith('/?trade=Electrician');
  });

  it('should preserve existing filters when adding new ones', () => {
    mockSearchParams.set('state', 'TX');
    
    render(
      <DirectoryFilters
        states={mockStates}
        trades={mockTrades}
        selectedState="TX"
        selectedTrade=""
      />
    );

    // Open trade dropdown
    const tradeButton = screen.getByText(/all trades/i);
    fireEvent.click(tradeButton);

    // Select a trade
    const plumberOption = screen.getByText('Plumber');
    fireEvent.click(plumberOption);

    expect(mockPush).toHaveBeenCalledWith('/?state=TX&trade=Plumber');
  });

  it('should clear search when empty', async () => {
    mockSearchParams.set('search', 'test');
    
    render(
      <DirectoryFilters
        states={mockStates}
        trades={mockTrades}
        selectedState=""
        selectedTrade=""
      />
    );

    const searchInput = screen.getByPlaceholderText(/search agencies/i);
    fireEvent.change(searchInput, { target: { value: '' } });

    // Wait for debounce
    await waitFor(
      () => {
        expect(mockPush).toHaveBeenCalledWith('/?');
      },
      { timeout: 350 }
    );
  });

  it('should show selected values', () => {
    render(
      <DirectoryFilters
        states={mockStates}
        trades={mockTrades}
        selectedState="CA"
        selectedTrade="Carpenter"
      />
    );

    expect(screen.getByText('CA')).toBeInTheDocument();
    expect(screen.getByText('Carpenter')).toBeInTheDocument();
  });

  it('should reset to page 1 when filters change', async () => {
    mockSearchParams.set('page', '3');
    
    render(
      <DirectoryFilters
        states={mockStates}
        trades={mockTrades}
        selectedState=""
        selectedTrade=""
      />
    );

    const searchInput = screen.getByPlaceholderText(/search agencies/i);
    fireEvent.change(searchInput, { target: { value: 'new search' } });

    // Wait for debounce
    await waitFor(
      () => {
        expect(mockPush).toHaveBeenCalledWith('/?search=new+search');
      },
      { timeout: 350 }
    );
  });

  it('should handle clearing state filter', () => {
    mockSearchParams.set('state', 'TX');
    mockSearchParams.set('trade', 'Electrician');
    
    render(
      <DirectoryFilters
        states={mockStates}
        trades={mockTrades}
        selectedState="TX"
        selectedTrade="Electrician"
      />
    );

    // Open state dropdown
    const stateButton = screen.getByText('TX');
    fireEvent.click(stateButton);

    // Click "All States" option
    const allStatesOption = screen.getByText(/all states/i);
    fireEvent.click(allStatesOption);

    expect(mockPush).toHaveBeenCalledWith('/?trade=Electrician');
  });

  it('should handle clearing trade filter', () => {
    mockSearchParams.set('state', 'CA');
    mockSearchParams.set('trade', 'Plumber');
    
    render(
      <DirectoryFilters
        states={mockStates}
        trades={mockTrades}
        selectedState="CA"
        selectedTrade="Plumber"
      />
    );

    // Open trade dropdown
    const tradeButton = screen.getByText('Plumber');
    fireEvent.click(tradeButton);

    // Click "All Trades" option
    const allTradesOption = screen.getByText(/all trades/i);
    fireEvent.click(allTradesOption);

    expect(mockPush).toHaveBeenCalledWith('/?state=CA');
  });
});