/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegionSelectionModal } from '../RegionSelectionModal';
import type { Region } from '@/types/supabase';
import { supabase } from '@/lib/supabase';

const mockRegions: Region[] = [
  { id: '1', name: 'Alabama', state_code: 'AL', slug: 'alabama' },
  { id: '2', name: 'Alaska', state_code: 'AK', slug: 'alaska' },
  { id: '3', name: 'Arizona', state_code: 'AZ', slug: 'arizona' },
  { id: '4', name: 'California', state_code: 'CA', slug: 'california' },
  { id: '5', name: 'Texas', state_code: 'TX', slug: 'texas' },
];

describe('RegionSelectionModal', () => {
  const defaultProps = {
    open: true,
    onOpenChange: jest.fn(),
    selectedRegions: [],
    onSave: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock the from().select().order() chain to return mockRegions
    const mockOrder = jest
      .fn()
      .mockResolvedValue({ data: mockRegions, error: null });
    const mockSelect = jest.fn().mockReturnValue({ order: mockOrder });
    (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });
  });

  it('should render modal dialog', () => {
    render(<RegionSelectionModal {...defaultProps} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('should display regions after loading', async () => {
    render(<RegionSelectionModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Alabama')).toBeInTheDocument();
      expect(screen.getByText('California')).toBeInTheDocument();
    });
  });

  it('should show selected count', async () => {
    const selectedRegions = [mockRegions[0], mockRegions[1]];
    render(
      <RegionSelectionModal
        {...defaultProps}
        selectedRegions={selectedRegions}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/2 of 5 states selected/i)).toBeInTheDocument();
    });
  });

  it('should render All USA button', async () => {
    render(<RegionSelectionModal {...defaultProps} />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /All USA/i })
      ).toBeInTheDocument();
    });
  });

  it('should render Clear All button', async () => {
    render(<RegionSelectionModal {...defaultProps} />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /Clear All/i })
      ).toBeInTheDocument();
    });
  });

  it('should render regional quick-select buttons', async () => {
    render(<RegionSelectionModal {...defaultProps} />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /West Coast/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /East Coast/i })
      ).toBeInTheDocument();
    });
  });

  it('should render Save and Cancel buttons', async () => {
    render(<RegionSelectionModal {...defaultProps} />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /Save Regions/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Cancel/i })
      ).toBeInTheDocument();
    });
  });

  it('should disable Save button when no regions selected', async () => {
    render(<RegionSelectionModal {...defaultProps} />);

    await waitFor(() => {
      const saveButton = screen.getByRole('button', { name: /Save Regions/i });
      expect(saveButton).toBeDisabled();
    });
  });

  it('should toggle region selection on checkbox click', async () => {
    const user = userEvent.setup();
    render(<RegionSelectionModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Alabama')).toBeInTheDocument();
    });

    const alabamaCheckbox = screen.getByRole('checkbox', {
      name: /Select Alabama/i,
    });
    await user.click(alabamaCheckbox);

    expect(alabamaCheckbox).toBeChecked();
  });

  it('should call onSave when save button clicked with selections', async () => {
    const user = userEvent.setup();
    render(<RegionSelectionModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Alabama')).toBeInTheDocument();
    });

    // Select a region
    const alabamaCheckbox = screen.getByRole('checkbox', {
      name: /Select Alabama/i,
    });
    await user.click(alabamaCheckbox);

    // Click Save
    const saveButton = screen.getByRole('button', { name: /Save Regions/i });
    await user.click(saveButton);

    expect(defaultProps.onSave).toHaveBeenCalled();
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it('should call onOpenChange when cancel button clicked', async () => {
    const user = userEvent.setup();
    render(<RegionSelectionModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Alabama')).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    await user.click(cancelButton);

    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it('should display error message when fetch fails', async () => {
    const mockOrder = jest
      .fn()
      .mockResolvedValue({ data: null, error: { message: 'Database error' } });
    const mockSelect = jest.fn().mockReturnValue({ order: mockOrder });
    (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

    render(<RegionSelectionModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load regions/i)).toBeInTheDocument();
    });
  });

  it('should have accessible checkbox labels', async () => {
    render(<RegionSelectionModal {...defaultProps} />);

    await waitFor(() => {
      const alabamaCheckbox = screen.getByRole('checkbox', {
        name: /Select Alabama/i,
      });
      expect(alabamaCheckbox).toHaveAttribute('aria-label', 'Select Alabama');
    });
  });
});
