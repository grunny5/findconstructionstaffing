/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegionSelector } from '../RegionSelector';
import type { Region } from '@/types/supabase';

// Mock RegionSelectionModal to avoid Supabase setup in these tests
jest.mock('../RegionSelectionModal', () => ({
  RegionSelectionModal: ({
    open,
    onSave,
  }: {
    open: boolean;
    onSave: (regions: Region[]) => void;
  }) => {
    if (!open) return null;
    return (
      <div data-testid="region-selection-modal">
        <button
          onClick={() =>
            onSave([
              { id: '1', name: 'Texas', state_code: 'TX', slug: 'texas' },
            ])
          }
        >
          Mock Save
        </button>
      </div>
    );
  },
}));

const mockRegions: Region[] = [
  { id: '1', name: 'Alabama', state_code: 'AL', slug: 'alabama' },
  { id: '2', name: 'Alaska', state_code: 'AK', slug: 'alaska' },
  { id: '3', name: 'California', state_code: 'CA', slug: 'california' },
];

// Create array of 50 states for nationwide test
const all50States: Region[] = Array.from({ length: 50 }, (_, i) => ({
  id: `${i + 1}`,
  name: `State ${i + 1}`,
  state_code: `S${i}`,
  slug: `state-${i + 1}`,
}));

describe('RegionSelector', () => {
  const defaultProps = {
    selectedRegions: [],
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render header with region count', () => {
      render(
        <RegionSelector {...defaultProps} selectedRegions={mockRegions} />
      );

      expect(screen.getByText(/Service Regions/i)).toBeInTheDocument();
      expect(screen.getByText(/3 states/i)).toBeInTheDocument();
    });

    it('should show singular "state" when only one selected', () => {
      render(
        <RegionSelector {...defaultProps} selectedRegions={[mockRegions[0]]} />
      );

      expect(screen.getByText(/1 state\)/i)).toBeInTheDocument();
    });

    it('should render "Add Regions" button when no regions selected', () => {
      render(<RegionSelector {...defaultProps} />);

      expect(
        screen.getByRole('button', { name: /Add Regions/i })
      ).toBeInTheDocument();
    });

    it('should render "Edit Regions" button when regions are selected', () => {
      render(
        <RegionSelector {...defaultProps} selectedRegions={mockRegions} />
      );

      expect(
        screen.getByRole('button', { name: /Edit Regions/i })
      ).toBeInTheDocument();
    });

    it('should render description text', () => {
      render(<RegionSelector {...defaultProps} />);

      expect(
        screen.getByText(/Select the US states where your agency provides/i)
      ).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no regions selected', () => {
      render(<RegionSelector {...defaultProps} />);

      expect(
        screen.getByText(/No service regions selected/i)
      ).toBeInTheDocument();
    });

    it('should show helper text when no regions selected', () => {
      render(<RegionSelector {...defaultProps} />);

      expect(
        screen.getByText(/At least one service region is required/i)
      ).toBeInTheDocument();
    });
  });

  describe('Selected Regions Display', () => {
    it('should render all selected regions as badges', () => {
      render(
        <RegionSelector {...defaultProps} selectedRegions={mockRegions} />
      );

      expect(screen.getByText(/Alabama \(AL\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Alaska \(AK\)/i)).toBeInTheDocument();
      expect(screen.getByText(/California \(CA\)/i)).toBeInTheDocument();
    });

    it('should show remove button on each region badge', () => {
      render(
        <RegionSelector {...defaultProps} selectedRegions={mockRegions} />
      );

      const removeButtons = screen.getAllByRole('button', {
        name: /Remove/i,
      });
      expect(removeButtons).toHaveLength(3);
    });

    it('should display MapPin icon on each badge', () => {
      const { container } = render(
        <RegionSelector {...defaultProps} selectedRegions={[mockRegions[0]]} />
      );

      // Check for SVG icon (MapPin component renders an SVG)
      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe('Nationwide Display', () => {
    it('should show "Nationwide Coverage" badge when all 50 states selected', () => {
      render(
        <RegionSelector {...defaultProps} selectedRegions={all50States} />
      );

      expect(screen.getByText(/Nationwide Coverage/i)).toBeInTheDocument();
      expect(screen.getByText(/All 50 States/i)).toBeInTheDocument();
    });

    it('should not show individual state badges when nationwide', () => {
      render(
        <RegionSelector {...defaultProps} selectedRegions={all50States} />
      );

      // Should show nationwide badge, not individual state badges
      expect(screen.getByText(/Nationwide Coverage/i)).toBeInTheDocument();
      expect(screen.queryByText(/State 1/i)).not.toBeInTheDocument();
    });

    it('should not show "Nationwide" with less than 50 states', () => {
      const fortyNineStates = all50States.slice(0, 49);
      render(
        <RegionSelector {...defaultProps} selectedRegions={fortyNineStates} />
      );

      expect(
        screen.queryByText(/Nationwide Coverage/i)
      ).not.toBeInTheDocument();
    });
  });

  describe('Remove Region Functionality', () => {
    it('should call onChange with updated regions when remove clicked', async () => {
      const user = userEvent.setup();
      render(
        <RegionSelector {...defaultProps} selectedRegions={mockRegions} />
      );

      const removeButton = screen.getByRole('button', {
        name: /Remove Alabama/i,
      });
      await user.click(removeButton);

      expect(defaultProps.onChange).toHaveBeenCalledWith([
        mockRegions[1],
        mockRegions[2],
      ]);
    });

    it('should not show remove buttons when disabled', () => {
      render(
        <RegionSelector
          {...defaultProps}
          selectedRegions={mockRegions}
          disabled={true}
        />
      );

      const removeButtons = screen.queryAllByRole('button', {
        name: /Remove/i,
      });
      expect(removeButtons).toHaveLength(0);
    });

    it('should not allow removal when disabled prop is true', async () => {
      const user = userEvent.setup();
      render(
        <RegionSelector
          {...defaultProps}
          selectedRegions={mockRegions}
          disabled={true}
        />
      );

      // No remove buttons should be rendered when disabled
      const removeButtons = screen.queryAllByRole('button', {
        name: /Remove/i,
      });
      expect(removeButtons).toHaveLength(0);
    });
  });

  describe('Modal Integration', () => {
    it('should open modal when "Add Regions" button clicked', async () => {
      const user = userEvent.setup();
      render(<RegionSelector {...defaultProps} />);

      const addButton = screen.getByRole('button', { name: /Add Regions/i });
      await user.click(addButton);

      expect(screen.getByTestId('region-selection-modal')).toBeInTheDocument();
    });

    it('should call onChange when modal saves regions', async () => {
      const user = userEvent.setup();
      render(<RegionSelector {...defaultProps} />);

      // Open modal
      const addButton = screen.getByRole('button', { name: /Add Regions/i });
      await user.click(addButton);

      // Click mock save button
      const saveButton = screen.getByText('Mock Save');
      await user.click(saveButton);

      expect(defaultProps.onChange).toHaveBeenCalledWith([
        { id: '1', name: 'Texas', state_code: 'TX', slug: 'texas' },
      ]);
    });

    it('should disable "Add Regions" button when disabled prop is true', () => {
      render(<RegionSelector {...defaultProps} disabled={true} />);

      const addButton = screen.getByRole('button', { name: /Add Regions/i });
      expect(addButton).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible remove button labels', () => {
      render(
        <RegionSelector {...defaultProps} selectedRegions={mockRegions} />
      );

      expect(
        screen.getByRole('button', { name: /Remove Alabama/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Remove Alaska/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Remove California/i })
      ).toBeInTheDocument();
    });

    it('should have aria-hidden on decorative MapPin icons', () => {
      const { container } = render(
        <RegionSelector {...defaultProps} selectedRegions={[mockRegions[0]]} />
      );

      // MapPin icon should have aria-hidden="true"
      const icons = container.querySelectorAll('svg[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should have proper focus styles on remove buttons', () => {
      render(
        <RegionSelector {...defaultProps} selectedRegions={[mockRegions[0]]} />
      );

      const removeButton = screen.getByRole('button', {
        name: /Remove Alabama/i,
      });

      // Check that button has focus outline classes
      expect(removeButton).toHaveClass('focus:outline-none');
      expect(removeButton).toHaveClass('focus:ring-2');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty selectedRegions array', () => {
      render(<RegionSelector {...defaultProps} selectedRegions={[]} />);

      expect(
        screen.getByText(/No service regions selected/i)
      ).toBeInTheDocument();
    });

    it('should handle single region selection', () => {
      render(
        <RegionSelector {...defaultProps} selectedRegions={[mockRegions[0]]} />
      );

      expect(screen.getByText(/1 state\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Alabama \(AL\)/i)).toBeInTheDocument();
    });

    it('should handle exactly 50 regions (nationwide)', () => {
      render(
        <RegionSelector {...defaultProps} selectedRegions={all50States} />
      );

      expect(screen.getByText(/Service Regions/i)).toBeInTheDocument();
      expect(screen.getByText(/\(50 states\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Nationwide Coverage/i)).toBeInTheDocument();
    });
  });
});
