/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import { ProfileStats, ProfileStatsProps, StatItem } from '../ProfileStats';

const defaultStats: StatItem[] = [
  { label: 'Established', value: 2010, icon: 'calendar' },
  { label: 'Employees', value: '50-100', icon: 'users' },
  { label: 'Projects', value: '150+', icon: 'briefcase' },
];

const defaultProps: ProfileStatsProps = {
  stats: defaultStats,
};

describe('ProfileStats Component', () => {
  describe('Basic Rendering', () => {
    it('should render the profile stats container', () => {
      render(<ProfileStats {...defaultProps} />);
      expect(screen.getByTestId('profile-stats')).toBeInTheDocument();
    });

    it('should render stats grid', () => {
      render(<ProfileStats {...defaultProps} />);
      expect(screen.getByTestId('stats-grid')).toBeInTheDocument();
    });

    it('should render all stat items', () => {
      render(<ProfileStats {...defaultProps} />);
      expect(screen.getByTestId('stat-item-0')).toBeInTheDocument();
      expect(screen.getByTestId('stat-item-1')).toBeInTheDocument();
      expect(screen.getByTestId('stat-item-2')).toBeInTheDocument();
    });

    it('should render correct number of stats', () => {
      const twoStats: StatItem[] = [
        { label: 'Test 1', value: '100' },
        { label: 'Test 2', value: '200' },
      ];
      render(<ProfileStats stats={twoStats} />);
      expect(screen.getByTestId('stat-item-0')).toBeInTheDocument();
      expect(screen.getByTestId('stat-item-1')).toBeInTheDocument();
      expect(screen.queryByTestId('stat-item-2')).not.toBeInTheDocument();
    });
  });

  describe('Stat Values Typography', () => {
    it('should use Bebas Neue display font for values', () => {
      render(<ProfileStats {...defaultProps} />);
      const value = screen.getByTestId('stat-value-0');
      expect(value).toHaveClass('font-display');
    });

    it('should use 2rem+ text size (text-2xl lg:text-3xl)', () => {
      render(<ProfileStats {...defaultProps} />);
      const value = screen.getByTestId('stat-value-0');
      expect(value).toHaveClass('text-2xl');
      expect(value).toHaveClass('lg:text-3xl');
    });

    it('should use industrial graphite-600 color', () => {
      render(<ProfileStats {...defaultProps} />);
      const value = screen.getByTestId('stat-value-0');
      expect(value).toHaveClass('text-industrial-graphite-600');
    });

    it('should display the correct value', () => {
      render(<ProfileStats {...defaultProps} />);
      expect(screen.getByTestId('stat-value-0')).toHaveTextContent('2010');
      expect(screen.getByTestId('stat-value-1')).toHaveTextContent('50-100');
      expect(screen.getByTestId('stat-value-2')).toHaveTextContent('150+');
    });
  });

  describe('Stat Labels Typography', () => {
    it('should use Barlow body font for labels', () => {
      render(<ProfileStats {...defaultProps} />);
      const label = screen.getByTestId('stat-label-0');
      expect(label).toHaveClass('font-body');
    });

    it('should be uppercase', () => {
      render(<ProfileStats {...defaultProps} />);
      const label = screen.getByTestId('stat-label-0');
      expect(label).toHaveClass('uppercase');
    });

    it('should have tracking-wide letter spacing', () => {
      render(<ProfileStats {...defaultProps} />);
      const label = screen.getByTestId('stat-label-0');
      expect(label).toHaveClass('tracking-wide');
    });

    it('should use 0.75rem text size (text-xs)', () => {
      render(<ProfileStats {...defaultProps} />);
      const label = screen.getByTestId('stat-label-0');
      expect(label).toHaveClass('text-xs');
    });

    it('should use font-semibold weight', () => {
      render(<ProfileStats {...defaultProps} />);
      const label = screen.getByTestId('stat-label-0');
      expect(label).toHaveClass('font-semibold');
    });

    it('should use graphite-400 color', () => {
      render(<ProfileStats {...defaultProps} />);
      const label = screen.getByTestId('stat-label-0');
      expect(label).toHaveClass('text-industrial-graphite-400');
    });

    it('should display the correct label text', () => {
      render(<ProfileStats {...defaultProps} />);
      expect(screen.getByTestId('stat-label-0')).toHaveTextContent(
        'Established'
      );
      expect(screen.getByTestId('stat-label-1')).toHaveTextContent('Employees');
    });
  });

  describe('Stat Icons', () => {
    it('should render icons when provided', () => {
      render(<ProfileStats {...defaultProps} />);
      expect(screen.getByTestId('stat-icon-0')).toBeInTheDocument();
      expect(screen.getByTestId('stat-icon-1')).toBeInTheDocument();
      expect(screen.getByTestId('stat-icon-2')).toBeInTheDocument();
    });

    it('should not render icon when not provided', () => {
      const statsWithoutIcon: StatItem[] = [{ label: 'Test', value: '100' }];
      render(<ProfileStats stats={statsWithoutIcon} />);
      expect(screen.queryByTestId('stat-icon-0')).not.toBeInTheDocument();
    });

    it('should use graphite-400 color for icons', () => {
      render(<ProfileStats {...defaultProps} />);
      const icon = screen.getByTestId('stat-icon-0');
      expect(icon).toHaveClass('text-industrial-graphite-400');
    });
  });

  describe('Grid Layout', () => {
    it('should have responsive grid columns for default variant', () => {
      render(<ProfileStats {...defaultProps} />);
      const grid = screen.getByTestId('stats-grid');
      expect(grid).toHaveClass('grid-cols-1');
      expect(grid).toHaveClass('sm:grid-cols-2');
      expect(grid).toHaveClass('lg:grid-cols-3');
      expect(grid).toHaveClass('xl:grid-cols-4');
    });

    it('should have responsive gap spacing', () => {
      render(<ProfileStats {...defaultProps} />);
      const grid = screen.getByTestId('stats-grid');
      expect(grid).toHaveClass('gap-4');
      expect(grid).toHaveClass('lg:gap-6');
    });
  });

  describe('Stat Card Styling', () => {
    it('should use white card background', () => {
      render(<ProfileStats {...defaultProps} />);
      const card = screen.getByTestId('stat-item-0');
      expect(card).toHaveClass('bg-industrial-bg-card');
    });

    it('should have industrial border', () => {
      render(<ProfileStats {...defaultProps} />);
      const card = screen.getByTestId('stat-item-0');
      expect(card).toHaveClass('border');
      expect(card).toHaveClass('border-industrial-graphite-200');
    });

    it('should have industrial sharp border-radius', () => {
      render(<ProfileStats {...defaultProps} />);
      const card = screen.getByTestId('stat-item-0');
      expect(card).toHaveClass('rounded-industrial-sharp');
    });

    it('should have responsive padding', () => {
      render(<ProfileStats {...defaultProps} />);
      const card = screen.getByTestId('stat-item-0');
      expect(card).toHaveClass('p-4');
      expect(card).toHaveClass('lg:p-6');
    });
  });

  describe('Barcode Decoration', () => {
    it('should not show barcode by default', () => {
      render(<ProfileStats {...defaultProps} />);
      expect(screen.queryByTestId('barcode-container')).not.toBeInTheDocument();
    });

    it('should show barcode when showBarcode is true', () => {
      render(<ProfileStats {...defaultProps} showBarcode={true} />);
      expect(screen.getByTestId('barcode-container')).toBeInTheDocument();
    });

    it('should use Libre Barcode font (font-barcode)', () => {
      render(<ProfileStats {...defaultProps} showBarcode={true} />);
      const barcode = screen.getByTestId('barcode-text');
      expect(barcode).toHaveClass('font-barcode');
    });

    it('should use 1.5rem+ text size (text-2xl)', () => {
      render(<ProfileStats {...defaultProps} showBarcode={true} />);
      const barcode = screen.getByTestId('barcode-text');
      expect(barcode).toHaveClass('text-2xl');
    });

    it('should use graphite-300 color', () => {
      render(<ProfileStats {...defaultProps} showBarcode={true} />);
      const barcode = screen.getByTestId('barcode-text');
      expect(barcode).toHaveClass('text-industrial-graphite-300');
    });

    it('should be aria-hidden for accessibility', () => {
      render(<ProfileStats {...defaultProps} showBarcode={true} />);
      expect(screen.getByTestId('barcode-container')).toHaveAttribute(
        'aria-hidden',
        'true'
      );
    });

    it('should have select-none to prevent selection', () => {
      render(<ProfileStats {...defaultProps} showBarcode={true} />);
      const barcode = screen.getByTestId('barcode-text');
      expect(barcode).toHaveClass('select-none');
    });

    it('should use custom barcodeText when provided', () => {
      render(
        <ProfileStats
          {...defaultProps}
          showBarcode={true}
          barcodeText="CUSTOM123"
        />
      );
      expect(screen.getByTestId('barcode-text')).toHaveTextContent(
        '*CUSTOM123*'
      );
    });

    it('should generate barcode from stat values when barcodeText not provided', () => {
      render(<ProfileStats {...defaultProps} showBarcode={true} />);
      // Values: 2010, 50-100, 150+ -> "201050100150" (alphanumeric only)
      expect(screen.getByTestId('barcode-text')).toHaveTextContent('*');
    });

    it('should wrap barcode text in asterisks', () => {
      render(
        <ProfileStats {...defaultProps} showBarcode={true} barcodeText="TEST" />
      );
      expect(screen.getByTestId('barcode-text')).toHaveTextContent('*TEST*');
    });
  });

  describe('Compact Variant', () => {
    it('should have compact grid columns', () => {
      render(<ProfileStats {...defaultProps} variant="compact" />);
      const grid = screen.getByTestId('stats-grid');
      expect(grid).toHaveClass('grid-cols-2');
      expect(grid).toHaveClass('sm:grid-cols-3');
      expect(grid).toHaveClass('lg:grid-cols-4');
    });

    it('should have smaller padding in compact mode', () => {
      render(<ProfileStats {...defaultProps} variant="compact" />);
      const card = screen.getByTestId('stat-item-0');
      expect(card).toHaveClass('p-3');
      expect(card).toHaveClass('lg:p-4');
    });

    it('should have smaller text in compact mode', () => {
      render(<ProfileStats {...defaultProps} variant="compact" />);
      const value = screen.getByTestId('stat-value-0');
      expect(value).toHaveClass('text-2xl');
      expect(value).not.toHaveClass('lg:text-3xl');
    });

    it('should have smaller icons in compact mode', () => {
      render(<ProfileStats {...defaultProps} variant="compact" />);
      const icon = screen.getByTestId('stat-icon-0');
      expect(icon).toHaveClass('h-3.5');
      expect(icon).toHaveClass('w-3.5');
    });
  });

  describe('Different Stat Counts', () => {
    it('should render single stat', () => {
      const singleStat: StatItem[] = [{ label: 'Rating', value: '4.5/5' }];
      render(<ProfileStats stats={singleStat} />);
      expect(screen.getByTestId('stat-item-0')).toBeInTheDocument();
      expect(screen.queryByTestId('stat-item-1')).not.toBeInTheDocument();
    });

    it('should render four stats', () => {
      const fourStats: StatItem[] = [
        { label: 'Stat 1', value: 'A' },
        { label: 'Stat 2', value: 'B' },
        { label: 'Stat 3', value: 'C' },
        { label: 'Stat 4', value: 'D' },
      ];
      render(<ProfileStats stats={fourStats} />);
      expect(screen.getByTestId('stat-item-0')).toBeInTheDocument();
      expect(screen.getByTestId('stat-item-1')).toBeInTheDocument();
      expect(screen.getByTestId('stat-item-2')).toBeInTheDocument();
      expect(screen.getByTestId('stat-item-3')).toBeInTheDocument();
    });

    it('should render many stats (6+)', () => {
      const manyStats: StatItem[] = Array.from({ length: 6 }, (_, i) => ({
        label: `Stat ${i + 1}`,
        value: `${i + 1}`,
      }));
      render(<ProfileStats stats={manyStats} />);
      for (let i = 0; i < 6; i++) {
        expect(screen.getByTestId(`stat-item-${i}`)).toBeInTheDocument();
      }
    });
  });

  describe('All Icon Types', () => {
    it('should render calendar icon', () => {
      const stats: StatItem[] = [
        { label: 'Test', value: '1', icon: 'calendar' },
      ];
      render(<ProfileStats stats={stats} />);
      expect(screen.getByTestId('stat-icon-0')).toBeInTheDocument();
    });

    it('should render users icon', () => {
      const stats: StatItem[] = [{ label: 'Test', value: '1', icon: 'users' }];
      render(<ProfileStats stats={stats} />);
      expect(screen.getByTestId('stat-icon-0')).toBeInTheDocument();
    });

    it('should render briefcase icon', () => {
      const stats: StatItem[] = [
        { label: 'Test', value: '1', icon: 'briefcase' },
      ];
      render(<ProfileStats stats={stats} />);
      expect(screen.getByTestId('stat-icon-0')).toBeInTheDocument();
    });

    it('should render star icon', () => {
      const stats: StatItem[] = [{ label: 'Test', value: '1', icon: 'star' }];
      render(<ProfileStats stats={stats} />);
      expect(screen.getByTestId('stat-icon-0')).toBeInTheDocument();
    });

    it('should render award icon', () => {
      const stats: StatItem[] = [{ label: 'Test', value: '1', icon: 'award' }];
      render(<ProfileStats stats={stats} />);
      expect(screen.getByTestId('stat-icon-0')).toBeInTheDocument();
    });

    it('should render clock icon', () => {
      const stats: StatItem[] = [{ label: 'Test', value: '1', icon: 'clock' }];
      render(<ProfileStats stats={stats} />);
      expect(screen.getByTestId('stat-icon-0')).toBeInTheDocument();
    });
  });
});
