import { render, screen, fireEvent } from '@testing-library/react';
import { RegionBadges } from '../RegionBadges';

const mockRegions = [
  { id: '1', name: 'Texas', code: 'TX' },
  { id: '2', name: 'California', code: 'CA' },
  { id: '3', name: 'Florida', code: 'FL' },
  { id: '4', name: 'New York', code: 'NY' },
  { id: '5', name: 'Illinois', code: 'IL' },
  { id: '6', name: 'Ohio', code: 'OH' },
];

const fiftyStates = Array.from({ length: 50 }, (_, i) => ({
  id: `${i}`,
  name: `State ${i}`,
  code: `S${i}`,
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
    expect(screen.queryByText('S0')).not.toBeInTheDocument();
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
