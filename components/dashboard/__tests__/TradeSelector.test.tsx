import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TradeSelector } from '../TradeSelector';
import type { Trade } from '@/types/supabase';

// Mock TradeSelectionModal
jest.mock('../TradeSelectionModal', () => ({
  TradeSelectionModal: ({
    open,
    onOpenChange,
    selectedTrades,
    onSave,
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedTrades: Trade[];
    onSave: (trades: Trade[]) => void;
  }) => {
    if (!open) return null;
    return (
      <div data-testid="trade-selection-modal">
        <div>Modal Content</div>
        <div>Selected: {selectedTrades.length}</div>
        <button onClick={() => onOpenChange(false)}>Close</button>
        <button
          onClick={() => {
            onSave(selectedTrades);
            onOpenChange(false);
          }}
        >
          Save
        </button>
      </div>
    );
  },
}));

describe('TradeSelector', () => {
  const mockTrades: Trade[] = [
    {
      id: '1',
      name: 'Electrician',
      slug: 'electrician',
      description: 'Electrical work',
    },
    {
      id: '2',
      name: 'Plumber',
      slug: 'plumber',
      description: 'Plumbing work',
    },
    {
      id: '3',
      name: 'Carpenter',
      slug: 'carpenter',
      description: 'Carpentry work',
    },
    {
      id: '4',
      name: 'HVAC Technician',
      slug: 'hvac-technician',
      description: 'HVAC work',
    },
  ];

  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render with no trades selected', () => {
      render(<TradeSelector selectedTrades={[]} onChange={mockOnChange} />);

      expect(screen.getByText(/trade specializations/i)).toBeInTheDocument();
      expect(screen.getByText(/\(0\/10\)/)).toBeInTheDocument();
      expect(
        screen.getByText(/no trades selected.*add trades.*to get started/i)
      ).toBeInTheDocument();
    });

    it('should render with selected trades', () => {
      render(
        <TradeSelector
          selectedTrades={mockTrades.slice(0, 2)}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText(/\(2\/10\)/)).toBeInTheDocument();
      expect(screen.getByText('Electrician')).toBeInTheDocument();
      expect(screen.getByText('Plumber')).toBeInTheDocument();
    });

    it('should render Add Trades button', () => {
      render(<TradeSelector selectedTrades={[]} onChange={mockOnChange} />);

      expect(
        screen.getByRole('button', { name: /add trades/i })
      ).toBeInTheDocument();
    });

    it('should show custom max trades count', () => {
      render(
        <TradeSelector
          selectedTrades={mockTrades.slice(0, 2)}
          onChange={mockOnChange}
          maxTrades={5}
        />
      );

      expect(screen.getByText(/\(2\/5\)/)).toBeInTheDocument();
    });
  });

  describe('Featured Trades', () => {
    it('should mark first 3 trades as featured', () => {
      render(
        <TradeSelector selectedTrades={mockTrades} onChange={mockOnChange} />
      );

      // Check for Featured labels (aria-label on star icon)
      const featuredStars = screen.getAllByLabelText('Featured');
      expect(featuredStars).toHaveLength(3);

      // Verify the featured trades are the first 3
      expect(screen.getByText('Electrician')).toBeInTheDocument();
      expect(screen.getByText('Plumber')).toBeInTheDocument();
      expect(screen.getByText('Carpenter')).toBeInTheDocument();
    });

    it('should show featured indicator only for top 3 trades', () => {
      render(
        <TradeSelector selectedTrades={mockTrades} onChange={mockOnChange} />
      );

      const featuredStars = screen.getAllByLabelText('Featured');
      expect(featuredStars).toHaveLength(3); // Exactly 3, not 4
    });
  });

  describe('Remove Functionality', () => {
    it('should remove trade when X button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <TradeSelector
          selectedTrades={mockTrades.slice(0, 2)}
          onChange={mockOnChange}
        />
      );

      const removeButtons = screen.getAllByRole('button', {
        name: /remove/i,
      });
      await user.click(removeButtons[0]); // Remove Electrician

      expect(mockOnChange).toHaveBeenCalledWith([mockTrades[1]]);
    });

    it('should not show remove buttons when disabled', () => {
      render(
        <TradeSelector
          selectedTrades={mockTrades.slice(0, 2)}
          onChange={mockOnChange}
          disabled={true}
        />
      );

      const removeButtons = screen.queryAllByRole('button', {
        name: /remove/i,
      });
      expect(removeButtons).toHaveLength(0);
    });

    it('should remove correct trade by ID', async () => {
      const user = userEvent.setup();
      render(
        <TradeSelector
          selectedTrades={mockTrades.slice(0, 3)}
          onChange={mockOnChange}
        />
      );

      // Remove Plumber (index 1)
      const removeButtons = screen.getAllByRole('button', {
        name: /remove/i,
      });
      await user.click(removeButtons[1]);

      expect(mockOnChange).toHaveBeenCalledWith([mockTrades[0], mockTrades[2]]);
    });
  });

  describe('Modal Integration', () => {
    it('should open modal when Add Trades button is clicked', async () => {
      const user = userEvent.setup();
      render(<TradeSelector selectedTrades={[]} onChange={mockOnChange} />);

      const addButton = screen.getByRole('button', { name: /add trades/i });
      await user.click(addButton);

      expect(screen.getByTestId('trade-selection-modal')).toBeInTheDocument();
    });

    it('should pass selected trades to modal', async () => {
      const user = userEvent.setup();
      render(
        <TradeSelector
          selectedTrades={mockTrades.slice(0, 2)}
          onChange={mockOnChange}
        />
      );

      const addButton = screen.getByRole('button', { name: /add trades/i });
      await user.click(addButton);

      expect(screen.getByText('Selected: 2')).toBeInTheDocument();
    });

    it('should close modal and update trades when Save is clicked', async () => {
      const user = userEvent.setup();
      render(
        <TradeSelector
          selectedTrades={mockTrades.slice(0, 2)}
          onChange={mockOnChange}
        />
      );

      const addButton = screen.getByRole('button', { name: /add trades/i });
      await user.click(addButton);

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(
          screen.queryByTestId('trade-selection-modal')
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Helper Messages', () => {
    it('should show max trades warning when at limit', () => {
      const tenTrades = Array.from({ length: 10 }, (_, i) => ({
        id: `${i + 1}`,
        name: `Trade ${i + 1}`,
        slug: `trade-${i + 1}`,
      }));

      render(
        <TradeSelector selectedTrades={tenTrades} onChange={mockOnChange} />
      );

      expect(
        screen.getByText(/maximum 10 trades reached/i)
      ).toBeInTheDocument();
    });

    it('should show suggestion to add more trades when under 3', () => {
      render(
        <TradeSelector
          selectedTrades={mockTrades.slice(0, 1)}
          onChange={mockOnChange}
        />
      );

      expect(
        screen.getByText(/add 2 more trade\(s\) to maximize featured trades/i)
      ).toBeInTheDocument();
    });

    it('should not show add more suggestion when 3 or more trades', () => {
      render(
        <TradeSelector
          selectedTrades={mockTrades.slice(0, 3)}
          onChange={mockOnChange}
        />
      );

      expect(
        screen.queryByText(/add.*more trade\(s\)/i)
      ).not.toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('should disable Add Trades button when disabled', () => {
      render(
        <TradeSelector
          selectedTrades={[]}
          onChange={mockOnChange}
          disabled={true}
        />
      );

      const addButton = screen.getByRole('button', { name: /add trades/i });
      expect(addButton).toBeDisabled();
    });

    it('should not call onChange when removing trade while disabled', async () => {
      const user = userEvent.setup();

      // When disabled, remove buttons should not be rendered
      render(
        <TradeSelector
          selectedTrades={mockTrades.slice(0, 2)}
          onChange={mockOnChange}
          disabled={true}
        />
      );

      const removeButtons = screen.queryAllByRole('button', {
        name: /remove/i,
      });
      expect(removeButtons).toHaveLength(0);
      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible remove buttons with aria-labels', () => {
      render(
        <TradeSelector
          selectedTrades={mockTrades.slice(0, 2)}
          onChange={mockOnChange}
        />
      );

      expect(
        screen.getByRole('button', { name: 'Remove Electrician' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Remove Plumber' })
      ).toBeInTheDocument();
    });

    it('should have accessible Add Trades button', () => {
      render(<TradeSelector selectedTrades={[]} onChange={mockOnChange} />);

      const addButton = screen.getByRole('button', { name: /add trades/i });
      expect(addButton).toBeInTheDocument();
    });

    it('should have accessible featured indicators', () => {
      render(
        <TradeSelector
          selectedTrades={mockTrades.slice(0, 3)}
          onChange={mockOnChange}
        />
      );

      const featuredStars = screen.getAllByLabelText('Featured');
      expect(featuredStars).toHaveLength(3);
    });
  });
});
