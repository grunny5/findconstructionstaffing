/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import {
  ProfileHeader,
  ProfileHeaderProps,
  ProfileStat,
} from '../ProfileHeader';

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

const defaultProps: ProfileHeaderProps = {
  firmName: 'Elite Construction Staffing',
};

const fullProps: ProfileHeaderProps = {
  firmName: 'Elite Construction Staffing',
  location: 'Dallas, TX',
  description: 'Premier construction staffing services',
  logoUrl: 'https://example.com/logo.png',
  category: 'welding',
  showAccentBand: true,
  stats: [
    { label: 'Established', value: 2010, icon: 'calendar' },
    { label: 'Employees', value: '50-100', icon: 'users' },
    { label: 'Projects', value: '150+', icon: 'briefcase' },
    { label: 'Rating', value: '4.5/5', icon: 'star' },
  ],
};

describe('ProfileHeader Component', () => {
  describe('Basic Rendering', () => {
    it('should render the profile header container', () => {
      render(<ProfileHeader {...defaultProps} />);
      expect(screen.getByTestId('profile-header')).toBeInTheDocument();
    });

    it('should render firm name', () => {
      render(<ProfileHeader {...defaultProps} />);
      expect(screen.getByTestId('firm-name')).toHaveTextContent(
        'Elite Construction Staffing'
      );
    });

    it('should render logo placeholder when no logoUrl provided', () => {
      render(<ProfileHeader {...defaultProps} />);
      expect(screen.getByTestId('logo-placeholder')).toBeInTheDocument();
    });

    it('should render logo image when logoUrl provided', () => {
      render(
        <ProfileHeader
          {...defaultProps}
          logoUrl="https://example.com/logo.png"
        />
      );
      expect(screen.getByTestId('logo-image')).toBeInTheDocument();
      expect(screen.getByTestId('logo-image')).toHaveAttribute(
        'src',
        'https://example.com/logo.png'
      );
    });
  });

  describe('Industrial Typography - Firm Name', () => {
    it('should use Bebas Neue display font', () => {
      render(<ProfileHeader {...defaultProps} />);
      const firmName = screen.getByTestId('firm-name');
      expect(firmName).toHaveClass('font-display');
    });

    it('should be uppercase', () => {
      render(<ProfileHeader {...defaultProps} />);
      const firmName = screen.getByTestId('firm-name');
      expect(firmName).toHaveClass('uppercase');
    });

    it('should have wide letter spacing', () => {
      render(<ProfileHeader {...defaultProps} />);
      const firmName = screen.getByTestId('firm-name');
      expect(firmName).toHaveClass('tracking-wide');
    });

    it('should use clamp(2rem, 5vw, 3rem) font size', () => {
      render(<ProfileHeader {...defaultProps} />);
      const firmName = screen.getByTestId('firm-name');
      expect(firmName).toHaveStyle({ fontSize: 'clamp(2rem, 5vw, 3rem)' });
    });

    it('should use industrial graphite-600 color', () => {
      render(<ProfileHeader {...defaultProps} />);
      const firmName = screen.getByTestId('firm-name');
      expect(firmName).toHaveClass('text-industrial-graphite-600');
    });
  });

  describe('Location/Metadata Typography', () => {
    it('should render location when provided', () => {
      render(<ProfileHeader {...defaultProps} location="Dallas, TX" />);
      expect(screen.getByTestId('location')).toBeInTheDocument();
      expect(screen.getByTestId('location')).toHaveTextContent('Dallas, TX');
    });

    it('should not render location when not provided', () => {
      render(<ProfileHeader {...defaultProps} />);
      expect(screen.queryByTestId('location')).not.toBeInTheDocument();
    });

    it('should use Barlow body font for location', () => {
      render(<ProfileHeader {...defaultProps} location="Dallas, TX" />);
      const locationText = screen.getByTestId('location').querySelector('span');
      expect(locationText).toHaveClass('font-body');
    });

    it('should use 0.875rem (text-sm) for location', () => {
      render(<ProfileHeader {...defaultProps} location="Dallas, TX" />);
      const locationText = screen.getByTestId('location').querySelector('span');
      expect(locationText).toHaveClass('text-sm');
    });

    it('should use graphite-400 color for location', () => {
      render(<ProfileHeader {...defaultProps} location="Dallas, TX" />);
      const locationText = screen.getByTestId('location').querySelector('span');
      expect(locationText).toHaveClass('text-industrial-graphite-400');
    });
  });

  describe('Description', () => {
    it('should render description when provided', () => {
      render(
        <ProfileHeader
          {...defaultProps}
          description="Premier staffing services"
        />
      );
      expect(screen.getByTestId('description')).toHaveTextContent(
        'Premier staffing services'
      );
    });

    it('should not render description when not provided', () => {
      render(<ProfileHeader {...defaultProps} />);
      expect(screen.queryByTestId('description')).not.toBeInTheDocument();
    });

    it('should use body font for description', () => {
      render(
        <ProfileHeader
          {...defaultProps}
          description="Premier staffing services"
        />
      );
      expect(screen.getByTestId('description')).toHaveClass('font-body');
    });

    it('should use graphite-500 color for description', () => {
      render(
        <ProfileHeader
          {...defaultProps}
          description="Premier staffing services"
        />
      );
      expect(screen.getByTestId('description')).toHaveClass(
        'text-industrial-graphite-500'
      );
    });
  });

  describe('Stats Row', () => {
    const stats: ProfileStat[] = [
      { label: 'Established', value: 2010, icon: 'calendar' },
      { label: 'Employees', value: '50-100', icon: 'users' },
    ];

    it('should render stats row when stats provided', () => {
      render(<ProfileHeader {...defaultProps} stats={stats} />);
      expect(screen.getByTestId('stats-row')).toBeInTheDocument();
    });

    it('should not render stats row when no stats provided', () => {
      render(<ProfileHeader {...defaultProps} />);
      expect(screen.queryByTestId('stats-row')).not.toBeInTheDocument();
    });

    it('should render all stats', () => {
      render(<ProfileHeader {...defaultProps} stats={stats} />);
      expect(screen.getByTestId('stat-0')).toBeInTheDocument();
      expect(screen.getByTestId('stat-1')).toBeInTheDocument();
    });

    it('should display stat labels in uppercase', () => {
      render(<ProfileHeader {...defaultProps} stats={stats} />);
      const stat = screen.getByTestId('stat-0');
      const label = stat.querySelector('span');
      expect(label).toHaveClass('uppercase');
    });

    it('should display stat labels with tracking-wide', () => {
      render(<ProfileHeader {...defaultProps} stats={stats} />);
      const stat = screen.getByTestId('stat-0');
      const label = stat.querySelector('span');
      expect(label).toHaveClass('tracking-wide');
    });

    it('should display stat values in display font', () => {
      render(<ProfileHeader {...defaultProps} stats={stats} />);
      const stat = screen.getByTestId('stat-0');
      const value = stat.querySelector('p');
      expect(value).toHaveClass('font-display');
    });

    it('should display stat values in large text', () => {
      render(<ProfileHeader {...defaultProps} stats={stats} />);
      const stat = screen.getByTestId('stat-0');
      const value = stat.querySelector('p');
      expect(value).toHaveClass('text-2xl');
      expect(value).toHaveClass('lg:text-3xl');
    });

    it('should have top border divider', () => {
      render(<ProfileHeader {...defaultProps} stats={stats} />);
      expect(screen.getByTestId('stats-row')).toHaveClass('border-t');
      expect(screen.getByTestId('stats-row')).toHaveClass(
        'border-industrial-graphite-200'
      );
    });
  });

  describe('Category Accent Band', () => {
    it('should not show accent band by default', () => {
      render(<ProfileHeader {...defaultProps} />);
      expect(screen.queryByTestId('accent-band')).not.toBeInTheDocument();
    });

    it('should show accent band when showAccentBand is true', () => {
      render(<ProfileHeader {...defaultProps} showAccentBand={true} />);
      expect(screen.getByTestId('accent-band')).toBeInTheDocument();
    });

    it('should have 6px height (h-1.5)', () => {
      render(<ProfileHeader {...defaultProps} showAccentBand={true} />);
      expect(screen.getByTestId('accent-band')).toHaveClass('h-1.5');
    });

    it('should use orange gradient for welding category', () => {
      render(
        <ProfileHeader
          {...defaultProps}
          showAccentBand={true}
          category="welding"
        />
      );
      const band = screen.getByTestId('accent-band');
      expect(band).toHaveClass('bg-gradient-to-r');
      expect(band).toHaveClass('from-industrial-orange-400');
      expect(band).toHaveClass('to-industrial-orange-500');
    });

    it('should use navy gradient for electrical category', () => {
      render(
        <ProfileHeader
          {...defaultProps}
          showAccentBand={true}
          category="electrical"
        />
      );
      const band = screen.getByTestId('accent-band');
      expect(band).toHaveClass('from-industrial-navy-400');
      expect(band).toHaveClass('to-industrial-navy-500');
    });

    it('should use graphite gradient for mechanical category', () => {
      render(
        <ProfileHeader
          {...defaultProps}
          showAccentBand={true}
          category="mechanical"
        />
      );
      const band = screen.getByTestId('accent-band');
      expect(band).toHaveClass('from-industrial-graphite-500');
      expect(band).toHaveClass('to-industrial-graphite-600');
    });

    it('should use graphite-300 for general category', () => {
      render(
        <ProfileHeader
          {...defaultProps}
          showAccentBand={true}
          category="general"
        />
      );
      const band = screen.getByTestId('accent-band');
      expect(band).toHaveClass('bg-industrial-graphite-300');
    });

    it('should be aria-hidden for accessibility', () => {
      render(<ProfileHeader {...defaultProps} showAccentBand={true} />);
      expect(screen.getByTestId('accent-band')).toHaveAttribute(
        'aria-hidden',
        'true'
      );
    });
  });

  describe('Logo Container', () => {
    it('should render logo container', () => {
      render(<ProfileHeader {...defaultProps} />);
      expect(screen.getByTestId('logo-container')).toBeInTheDocument();
    });

    it('should use industrial sharp border-radius for placeholder', () => {
      render(<ProfileHeader {...defaultProps} />);
      const placeholder = screen.getByTestId('logo-placeholder');
      expect(placeholder).toHaveClass('rounded-industrial-sharp');
    });

    it('should use industrial sharp border-radius for image', () => {
      render(
        <ProfileHeader
          {...defaultProps}
          logoUrl="https://example.com/logo.png"
        />
      );
      const image = screen.getByTestId('logo-image');
      expect(image).toHaveClass('rounded-industrial-sharp');
    });

    it('should have 2px border on placeholder', () => {
      render(<ProfileHeader {...defaultProps} />);
      const placeholder = screen.getByTestId('logo-placeholder');
      expect(placeholder).toHaveClass('border-2');
      expect(placeholder).toHaveClass('border-industrial-graphite-200');
    });

    it('should have correct alt text for logo image', () => {
      render(
        <ProfileHeader
          {...defaultProps}
          logoUrl="https://example.com/logo.png"
        />
      );
      const image = screen.getByTestId('logo-image');
      expect(image).toHaveAttribute('alt', 'Elite Construction Staffing logo');
    });
  });

  describe('Background and Container Styling', () => {
    it('should use white card background', () => {
      render(<ProfileHeader {...defaultProps} />);
      expect(screen.getByTestId('profile-header')).toHaveClass(
        'bg-industrial-bg-card'
      );
    });

    it('should have bottom border', () => {
      render(<ProfileHeader {...defaultProps} />);
      expect(screen.getByTestId('profile-header')).toHaveClass('border-b');
      expect(screen.getByTestId('profile-header')).toHaveClass(
        'border-industrial-graphite-200'
      );
    });
  });

  describe('Responsive Layout', () => {
    it('should have responsive flex direction', () => {
      render(<ProfileHeader {...fullProps} />);
      const container = screen
        .getByTestId('profile-header')
        .querySelector('.flex');
      expect(container).toHaveClass('flex-col');
      expect(container).toHaveClass('lg:flex-row');
    });

    it('should have responsive grid for stats', () => {
      render(<ProfileHeader {...fullProps} />);
      const statsRow = screen.getByTestId('stats-row');
      expect(statsRow).toHaveClass('grid-cols-2');
      expect(statsRow).toHaveClass('sm:grid-cols-3');
      expect(statsRow).toHaveClass('lg:grid-cols-4');
    });

    it('should have responsive padding', () => {
      render(<ProfileHeader {...defaultProps} />);
      const innerContainer = screen
        .getByTestId('profile-header')
        .querySelector('.max-w-7xl');
      expect(innerContainer).toHaveClass('py-8');
      expect(innerContainer).toHaveClass('lg:py-12');
    });

    it('should have responsive logo size', () => {
      render(<ProfileHeader {...defaultProps} />);
      const placeholder = screen.getByTestId('logo-placeholder');
      expect(placeholder).toHaveClass('w-24');
      expect(placeholder).toHaveClass('h-24');
      expect(placeholder).toHaveClass('lg:w-32');
      expect(placeholder).toHaveClass('lg:h-32');
    });
  });

  describe('Full Props Rendering', () => {
    it('should render all elements with full props', () => {
      render(<ProfileHeader {...fullProps} />);

      expect(screen.getByTestId('profile-header')).toBeInTheDocument();
      expect(screen.getByTestId('accent-band')).toBeInTheDocument();
      expect(screen.getByTestId('logo-image')).toBeInTheDocument();
      expect(screen.getByTestId('firm-name')).toBeInTheDocument();
      expect(screen.getByTestId('location')).toBeInTheDocument();
      expect(screen.getByTestId('description')).toBeInTheDocument();
      expect(screen.getByTestId('stats-row')).toBeInTheDocument();
      expect(screen.getByTestId('stat-0')).toBeInTheDocument();
      expect(screen.getByTestId('stat-1')).toBeInTheDocument();
      expect(screen.getByTestId('stat-2')).toBeInTheDocument();
      expect(screen.getByTestId('stat-3')).toBeInTheDocument();
    });
  });

  describe('Stats without Icons', () => {
    it('should render stat without icon when icon not provided', () => {
      const statsWithoutIcon: ProfileStat[] = [
        { label: 'Custom', value: 'Value' },
      ];
      render(<ProfileHeader {...defaultProps} stats={statsWithoutIcon} />);

      const stat = screen.getByTestId('stat-0');
      expect(stat).toHaveTextContent('Custom');
      expect(stat).toHaveTextContent('Value');
    });
  });
});
