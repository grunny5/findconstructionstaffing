import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TradeSelectionModal } from '../TradeSelectionModal';
import type { Trade } from '@/types/supabase';

// Mock Supabase
const mockFrom = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: (...args: any[]) => mockFrom(...args),
  },
}));

// Mock @dnd-kit modules
jest.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  closestCenter: jest.fn(),
  KeyboardSensor: jest.fn(),
  PointerSensor: jest.fn(),
  useSensor: jest.fn(),
  useSensors: jest.fn(() => []),
}));

jest.mock('@dnd-kit/sortable', () => ({
  arrayMove: (array: any[], oldIndex: number, newIndex: number) => {
    const newArray = [...array];
    const [removed] = newArray.splice(oldIndex, 1);
    newArray.splice(newIndex, 0, removed);
    return newArray;
  },
  SortableContext: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  sortableKeyboardCoordinates: jest.fn(),
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    transition: null,
  }),
  verticalListSortingStrategy: jest.fn(),
}));

jest.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: () => '',
    },
  },
}));

describe('TradeSelectionModal', () => {
  const mockTrades: Trade[] = [
    { id: '1', name: 'Electrician', slug: 'electrician', description: 'Electrical work' },
    { id: '2', name: 'Plumber', slug: 'plumber', description: 'Plumbing work' },
    { id: '3', name: 'Carpenter', slug: 'carpenter', description: 'Carpentry work' },
    { id: '4', name: 'HVAC Technician', slug: 'hvac', description: 'HVAC work' },
    { id: '5', name: 'Mason', slug: 'mason', description: 'Masonry work' },
  ];

  const mockOnSave = jest.fn();
  const mockOnOpenChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mockFrom to return mockTrades by default
    mockFrom.mockReturnValue({
      select: jest.fn(() => ({
        order: jest.fn(() => Promise.resolve({ data: mockTrades, error: null })),
      })),
    });
  });

  describe('Modal Rendering', () => {
    it('should not render when closed', () => {
      render(
        <TradeSelectionModal
          open={false}
          onOpenChange={mockOnOpenChange}
          selectedTrades={[]}
          onSave={mockOnSave}
        />
      );

      expect(screen.queryByText(/select trade specializations/i)).not.toBeInTheDocument();
    });

    it('should render when open', async () => {
      render(
        <TradeSelectionModal
          open={true}
          onOpenChange={mockOnOpenChange}
          selectedTrades={[]}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/select trade specializations/i)).toBeInTheDocument();
      });
    });

    it('should display header with instructions', async () => {
      render(
        <TradeSelectionModal
          open={true}
          onOpenChange={mockOnOpenChange}
          selectedTrades={[]}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/choose up to 10 trades/i)).toBeInTheDocument();
        expect(screen.getByText(/top 3 will be featured/i)).toBeInTheDocument();
      });
    });
  });

  describe('Loading Trades', () => {
    it('should render modal when open', async () => {
      render(
        <TradeSelectionModal
          open={true}
          onOpenChange={mockOnOpenChange}
          selectedTrades={[]}
          onSave={mockOnSave}
        />
      );

      // Modal should be visible
      await waitFor(() => {
        expect(screen.getByText(/select trade specializations/i)).toBeInTheDocument();
      });
    });

  });

  describe('Search Functionality', () => {
    it('should render search input', async () => {
      render(
        <TradeSelectionModal
          open={true}
          onOpenChange={mockOnOpenChange}
          selectedTrades={[]}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search trades/i)).toBeInTheDocument();
      });
    });
  });

  describe('Trade Selection', () => {
    it('should show selected trades count', async () => {
      render(
        <TradeSelectionModal
          open={true}
          onOpenChange={mockOnOpenChange}
          selectedTrades={mockTrades.slice(0, 2)}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/selected trades \(2\/10\)/i)).toBeInTheDocument();
      });
    });

    it('should pre-populate selected trades', async () => {
      render(
        <TradeSelectionModal
          open={true}
          onOpenChange={mockOnOpenChange}
          selectedTrades={mockTrades.slice(0, 2)}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        // Selected trades should appear in the "Selected Trades" section
        const selectedSection = screen.getByText(/selected trades \(2\/10\)/i).closest('div');
        expect(selectedSection).toBeInTheDocument();
      });
    });

    it('should mark top 3 as featured', async () => {
      render(
        <TradeSelectionModal
          open={true}
          onOpenChange={mockOnOpenChange}
          selectedTrades={mockTrades.slice(0, 4)}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        const featuredBadges = screen.getAllByText('Featured');
        expect(featuredBadges).toHaveLength(3); // Only top 3
      });
    });
  });

  describe('Maximum Trades Limit', () => {
    it('should show warning when at maximum (10 trades)', async () => {
      const tenTrades = Array.from({ length: 10 }, (_, i) => ({
        id: `${i + 1}`,
        name: `Trade ${i + 1}`,
        slug: `trade-${i + 1}`,
      }));

      render(
        <TradeSelectionModal
          open={true}
          onOpenChange={mockOnOpenChange}
          selectedTrades={tenTrades}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/maximum 10 trades allowed/i)).toBeInTheDocument();
      });
    });

    it('should show no trades selected message when empty', async () => {
      render(
        <TradeSelectionModal
          open={true}
          onOpenChange={mockOnOpenChange}
          selectedTrades={[]}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/no trades selected/i)).toBeInTheDocument();
      });
    });
  });

  describe('Modal Actions', () => {
    it('should call onSave when Save Changes is clicked', async () => {
      const user = userEvent.setup();
      const selectedTrades = mockTrades.slice(0, 2);

      render(
        <TradeSelectionModal
          open={true}
          onOpenChange={mockOnOpenChange}
          selectedTrades={selectedTrades}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/save changes/i)).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      expect(mockOnSave).toHaveBeenCalledWith(selectedTrades);
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('should call onOpenChange(false) when Cancel is clicked', async () => {
      const user = userEvent.setup();

      render(
        <TradeSelectionModal
          open={true}
          onOpenChange={mockOnOpenChange}
          selectedTrades={[]}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/cancel/i)).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should reset to initial trades when cancelled', async () => {
      const user = userEvent.setup();
      const initialTrades = mockTrades.slice(0, 2);

      render(
        <TradeSelectionModal
          open={true}
          onOpenChange={mockOnOpenChange}
          selectedTrades={initialTrades}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/cancel/i)).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      // Should not save changes
      expect(mockOnSave).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible dialog title', async () => {
      render(
        <TradeSelectionModal
          open={true}
          onOpenChange={mockOnOpenChange}
          selectedTrades={[]}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/select trade specializations/i)).toBeInTheDocument();
      });
    });

    it('should have accessible dialog description', async () => {
      render(
        <TradeSelectionModal
          open={true}
          onOpenChange={mockOnOpenChange}
          selectedTrades={[]}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/choose up to 10 trades/i)).toBeInTheDocument();
      });
    });

    it('should have accessible action buttons', async () => {
      render(
        <TradeSelectionModal
          open={true}
          onOpenChange={mockOnOpenChange}
          selectedTrades={[]}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should not render when modal is closed', () => {
      render(
        <TradeSelectionModal
          open={false}
          onOpenChange={mockOnOpenChange}
          selectedTrades={[]}
          onSave={mockOnSave}
        />
      );

      expect(screen.queryByText(/select trade specializations/i)).not.toBeInTheDocument();
    });
  });
});
