import { render, screen, fireEvent } from '@testing-library/react';
import { RegionBadges } from '../RegionBadges';
import { US_STATE_CODES } from '@/lib/utils';

interface Region {
  id: string;
  name: string;
  code: string;
}

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
      <RegionBadges regions={mockRegions} maxDisplay={3} showViewAll={false} />
    );
    expect(screen.queryByText('View All')).not.toBeInTheDocument();
  });

  it('should handle empty regions array', () => {
    const { container } = render(<RegionBadges regions={[]} />);
    expect(container.firstChild).toBeEmptyDOMElement();
  });
});
