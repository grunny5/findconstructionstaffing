import { render, screen, fireEvent } from '@testing-library/react';
import { RegionBadges } from '../RegionBadges';
import { US_STATE_CODES } from '@/lib/utils';
import { Region } from '@/types/api';

const mockRegions: Region[] = [
  { id: '1', name: 'Texas', code: 'TX' },
  { id: '2', name: 'California', code: 'CA' },
  { id: '3', name: 'Florida', code: 'FL' },
  { id: '4', name: 'New York', code: 'NY' },
  { id: '5', name: 'Illinois', code: 'IL' },
  { id: '6', name: 'Ohio', code: 'OH' },
];

// Create 50 valid US states using actual state codes
const allStateCodesArray = Array.from(US_STATE_CODES);
const fiftyStates: Region[] = allStateCodesArray.map((code, i) => ({
  id: `${i + 1}`,
  name: `State ${code}`,
  code,
}));

describe('RegionBadges', () => {
  describe('Basic Rendering', () => {
    it('should render state code badges', () => {
      render(<RegionBadges regions={mockRegions.slice(0, 3)} />);
      expect(screen.getByText('TX')).toBeInTheDocument();
      expect(screen.getByText('CA')).toBeInTheDocument();
      expect(screen.getByText('FL')).toBeInTheDocument();
    });

    it('should show "+X more" when regions exceed maxDisplay', () => {
      render(<RegionBadges regions={mockRegions} maxDisplay={3} />);
      expect(screen.getByText('+3 more')).toBeInTheDocument();
    });

    it('should show "Nationwide" badge for 50 states', () => {
      render(<RegionBadges regions={fiftyStates} />);
      expect(screen.getByText('Nationwide')).toBeInTheDocument();
      // Individual state codes should not be shown when Nationwide badge is displayed
      expect(screen.queryByText('AL')).not.toBeInTheDocument();
      expect(screen.queryByText('TX')).not.toBeInTheDocument();
    });

    it('should expand to show all regions when "View All" clicked', () => {
      render(
        <RegionBadges regions={mockRegions} maxDisplay={3} showViewAll={true} />
      );

      expect(screen.queryByText('OH')).not.toBeInTheDocument();

      const viewAllButton = screen.getByText('View All');
      fireEvent.click(viewAllButton);

      expect(screen.getByText('OH')).toBeInTheDocument();
    });

    it('should link state badges to filtered search', () => {
      render(<RegionBadges regions={mockRegions.slice(0, 1)} />);
      const txBadge = screen.getByText('TX').closest('a');
      expect(txBadge).toHaveAttribute('href', '/?states[]=TX');
    });

    it('should not show "View All" button when showViewAll is false', () => {
      render(
        <RegionBadges
          regions={mockRegions}
          maxDisplay={3}
          showViewAll={false}
        />
      );
      expect(screen.queryByText('View All')).not.toBeInTheDocument();
    });

    it('should handle empty regions array', () => {
      const { container } = render(<RegionBadges regions={[]} />);
      expect(container.firstChild).toBeEmptyDOMElement();
    });
  });

  describe('Industrial Design Styling', () => {
    it('should render container with flex-wrap for responsive stacking', () => {
      render(<RegionBadges regions={mockRegions.slice(0, 3)} />);
      const container = screen.getByTestId('region-badges-container');
      expect(container).toHaveClass('flex');
      expect(container).toHaveClass('flex-wrap');
    });

    it('should have 8px gap spacing (gap-2)', () => {
      render(<RegionBadges regions={mockRegions.slice(0, 3)} />);
      const container = screen.getByTestId('region-badges-container');
      expect(container).toHaveClass('gap-2');
    });

    it('should apply cursor-pointer to badges for clickability', () => {
      render(<RegionBadges regions={mockRegions.slice(0, 1)} />);
      const badge = screen.getByTestId('region-badge-TX');
      expect(badge).toHaveClass('cursor-pointer');
    });

    it('should apply transition for hover effects', () => {
      render(<RegionBadges regions={mockRegions.slice(0, 1)} />);
      const badge = screen.getByTestId('region-badge-TX');
      expect(badge).toHaveClass('transition-colors');
    });

    it('should use graphite variant for Nationwide badge', () => {
      render(<RegionBadges regions={fiftyStates} />);
      const badge = screen.getByTestId('nationwide-badge');
      expect(badge).toHaveClass('bg-industrial-graphite-600');
    });

    it('should use industrial graphite color for "more" badge', () => {
      render(<RegionBadges regions={mockRegions} maxDisplay={3} />);
      const moreBadge = screen.getByTestId('more-regions-badge');
      expect(moreBadge).toHaveClass('text-industrial-graphite-400');
    });

    it('should use industrial orange for View All button', () => {
      render(
        <RegionBadges regions={mockRegions} maxDisplay={3} showViewAll={true} />
      );
      const button = screen.getByTestId('view-all-button');
      expect(button).toHaveClass('text-industrial-orange');
    });

    it('should use font-body for View All button', () => {
      render(
        <RegionBadges regions={mockRegions} maxDisplay={3} showViewAll={true} />
      );
      const button = screen.getByTestId('view-all-button');
      expect(button).toHaveClass('font-body');
    });
  });

  describe('Icon Support', () => {
    it('should not show icons by default', () => {
      render(<RegionBadges regions={mockRegions.slice(0, 1)} />);
      const badge = screen.getByTestId('region-badge-TX');
      expect(badge.querySelector('svg')).not.toBeInTheDocument();
    });

    it('should show MapPin icons when showIcon is true', () => {
      render(
        <RegionBadges regions={mockRegions.slice(0, 1)} showIcon={true} />
      );
      const badge = screen.getByTestId('region-badge-TX');
      expect(badge.querySelector('svg')).toBeInTheDocument();
    });

    it('should show icon on Nationwide badge when showIcon is true', () => {
      render(<RegionBadges regions={fiftyStates} showIcon={true} />);
      const badge = screen.getByTestId('nationwide-badge');
      expect(badge.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('Variant Support', () => {
    it('should support graphite variant', () => {
      render(
        <RegionBadges regions={mockRegions.slice(0, 1)} variant="graphite" />
      );
      const badge = screen.getByTestId('region-badge-TX');
      expect(badge).toHaveClass('bg-industrial-graphite-600');
    });

    it('should default to secondary variant', () => {
      render(<RegionBadges regions={mockRegions.slice(0, 1)} />);
      const badge = screen.getByTestId('region-badge-TX');
      expect(badge).toHaveClass('bg-industrial-graphite-100');
    });
  });
});
